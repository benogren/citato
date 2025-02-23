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

serve(async (req) => {
  try {
    // Fetch all bookmarks with 'processing' status
    const { data: bookmarks, error: fetchError } = await supabaseClient
      .from('bookmarks')
      .select('*')
      .eq('status', 'processing')

    if (fetchError) {
      throw fetchError
    }

    if (!bookmarks || bookmarks.length === 0) {
      return new Response(JSON.stringify({ message: 'No bookmarks to process' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Process each bookmark
    for (const bookmark of bookmarks) {
      try {
        console.log('Processing bookmark:', bookmark.id)
        console.log('URL:', bookmark.url)
        const toSummarize = bookmark.url || ''

        const scrapeResponse = await app.scrapeUrl(bookmark.url, {
            formats: ['markdown', 'html', 'links'],
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
                content: toSummarize,
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

        // Create embeddings from OpenAI
        const contentEmbedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: markdown,
            encoding_format: "float",
        });
        
        const savedEmbedding = contentEmbedding.data[0].embedding;

        // Update bookmark with summary and status
        const { error: updateError } = await supabaseClient
          .from('bookmarks')
          .update({
            title: title,
            author: author,
            markdown: markdown,
            html: html,
            links: links,
            ai_summary: contentSummary,
            ai_fullysummary: fullSummary,
            embeddings: savedEmbedding,
            status: 'processed'
          })
          .eq('id', bookmark.id)

        if (updateError) {
          throw updateError
        }
      } catch (error) {
        console.error(`Error processing bookmark ${bookmark.id}:`, error)
        
        // Update status to 'error' if processing failed
        await supabaseClient
          .from('bookmarks')
          .update({
            status: 'error'
          })
          .eq('id', bookmark.id)
      }
    }

    return new Response(
      JSON.stringify({ message: `Processed ${bookmarks.length} bookmarks` }), {
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