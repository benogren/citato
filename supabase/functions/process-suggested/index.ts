import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from "https://esm.sh/openai@4.20.1"
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js'

// Initialize Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
})
// Scraping the URL with Firecrawl
const crawlKey = Deno.env.get('FC_YOUR_API_KEY') as string
const app = new FirecrawlApp({apiKey: crawlKey});

// Function to split text into chunks of approximately maxTokens
function chunkText(text: string, maxTokens = 7500): string[] {
  // A very rough approximation - about 4 chars per token for English text
  // Using a bit less than 8192 to leave room for overhead
  const avgCharsPerToken = 4;
  const maxChars = maxTokens * avgCharsPerToken;
  
  // Simple chunking by paragraphs
  const paragraphs = text.split('\n');
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the limit, start a new chunk
    if ((currentChunk.length + paragraph.length) > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + paragraph;
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Function to generate embeddings for chunked text
async function generateChunkedEmbeddings(text: string): Promise<number[]> {
  // Split the text into chunks
  const chunks = chunkText(text);
  
  console.log(`Text split into ${chunks.length} chunks for embedding`);
  
  // If there's only one chunk, just get the embedding directly
  if (chunks.length === 1) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunks[0],
      encoding_format: "float",
    });
    return response.data[0].embedding;
  }
  
  // For multiple chunks, get embedding for each chunk
  const embeddingPromises = chunks.map(chunk => 
    openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk,
      encoding_format: "float",
    })
  );
  
  // Wait for all embeddings to complete
  const embeddings = await Promise.all(embeddingPromises);
  
  // Average the embeddings (simple approach)
  // First, determine the dimension of the embeddings
  const dimension = embeddings[0].data[0].embedding.length;
  
  // Initialize an array of zeros with the same dimension
  const averagedEmbedding = new Array(dimension).fill(0);
  
  // Sum up all embeddings
  for (const embeddingResponse of embeddings) {
    const embedding = embeddingResponse.data[0].embedding;
    for (let i = 0; i < dimension; i++) {
      averagedEmbedding[i] += embedding[i];
    }
  }
  
  // Divide by the number of chunks to get the average
  for (let i = 0; i < dimension; i++) {
    averagedEmbedding[i] /= chunks.length;
  }
  
  // Normalize the vector (important for embeddings)
  const magnitude = Math.sqrt(
    averagedEmbedding.reduce((sum, val) => sum + val * val, 0)
  );
  
  for (let i = 0; i < dimension; i++) {
    averagedEmbedding[i] /= magnitude;
  }
  
  return averagedEmbedding;
}

serve(async (req) => {
  try {
    // Fetch all suggested with 'processing' status
    const { data: suggestions, error: fetchError } = await supabaseClient
      .from('suggested')
      .select('*')
      .eq('status', 'processing')
      .eq('type', 'news_article')

    if (fetchError) {
      throw fetchError
    }

    if (!suggestions || suggestions.length === 0) {
      return new Response(JSON.stringify({ message: 'No suggestions to process' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Process each suggested
    for (const suggested of suggestions) {
      try {
        console.log('Processing suggested:', suggested.id)
        console.log('URL:', suggested.url)
        const toSummarize = suggested.url || ''

        const scrapeResponse = await app.scrapeUrl(suggested.url, {
            formats: ['markdown', 'html'],
        });
        
        if (!scrapeResponse.success) {
            throw new Error(`Failed to scrape: ${scrapeResponse.error}`)
        }
        
        const markdown = scrapeResponse.markdown;
        const html = scrapeResponse.html;
        const links = scrapeResponse.links;
        const title = scrapeResponse.metadata?.title || null;
        const author = scrapeResponse.metadata?.author || null;

        // Generate summary using OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                {
                role: "system",
                content: "You will be provided a link url. Generate a concise summary in 500 characters or less, maintaining the voice and tone of the original text. Ensure brevity while preserving key themes and insights.",
                },
                {
                role: "user",
                content: html,
                },
            ],
            max_tokens: 150, // Adjust if necessary, but 150 tokens should be close to 500 characters
            temperature: 0.7,
        });
        
        const contentSummary = completion.choices[0].message.content

        // Generate Key Insights using OpenAI
        const completionKeyPoints = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { 
                role: "system", 
                content: `You will be provided newsletter content. Identify and list key takeaways as follows:
          
                ### Key Takeaways
                - Summarize major insights, interesting facts, or noteworthy points.
                - Keep each point clear, concise, and to the point.
                - Maintain the tone and style of the original content.
                
                Provide at least 3-5 key points, but more if necessary.`
              },
              {
                role: "user",
                content: html,
              },
            ],
            max_tokens: 200, // Adjust based on expected length of response
            temperature: 0.7,
          });

        const fullSummary = completionKeyPoints.choices[0].message.content;

        // Create embeddings from OpenAI using chunking approach
        console.log('Generating embeddings for markdown content...');
        let savedEmbedding;
        try {
          // Use chunking approach for embeddings to handle token limit
          savedEmbedding = await generateChunkedEmbeddings(markdown);
          console.log('Embeddings generated successfully');
        } catch (embeddingError) {
          console.error('Error generating embeddings:', embeddingError);
          // You might want to log this but continue with the process
          savedEmbedding = null;
        }

        // Update suggested with summary and status
        const { error: updateError } = await supabaseClient
          .from('suggested')
          .update({
            title: title,
            author: author,
            markdown: markdown,
            html: html,
            // links: links,
            ai_summary: contentSummary,
            ai_fullsummary: fullSummary,
            embeddings: savedEmbedding,
            status: savedEmbedding ? 'processed' : 'partial_process' // New status for when embeddings fail
          })
          .eq('id', suggested.id)

        if (updateError) {
          throw updateError
        }
      } catch (error) {
        console.error(`Error processing suggested ${suggested.id}:`, error)
        
        // Update status to 'error' if processing failed
        await supabaseClient
          .from('suggested')
          .update({
            status: 'error'
          })
          .eq('id', suggested.id)
      }
    }

    return new Response(
      JSON.stringify({ message: `Processed ${suggestions.length} suggested` }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})