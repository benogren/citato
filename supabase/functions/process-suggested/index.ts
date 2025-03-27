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

// Function to extract cover image from HTML content without using browser Image API
async function extractCoverImageFromHTML(htmlContent: string): Promise<string | null> {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  
  // Store candidate images with their scores
  const candidateImages: Array<{ url: string, score: number, width?: number, height?: number }> = [];

  // First pass: find all images and evaluate them
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    // Extract the full img tag and the src URL
    const fullImgTag = match[0];
    const imageUrl = match[1];
    
    // Skip base64 encoded images (they're usually small icons)
    if (imageUrl.startsWith('data:image')) {
      continue;
    }

    // Check for "logo" in the image URL
    if (/logo/i.test(imageUrl)) {
      console.log(`Skipping logo image by URL: ${imageUrl}`);
      continue;
    }

    // Check for unwanted patterns in other attributes (id, class, alt)
    const unwantedPatterns = ['logo', 'avatar', 'profile', 'icon', 'thumbnail', 'thumb'];
    if (unwantedPatterns.some(pattern => new RegExp(`(?:id|class|alt)=["'][^"']*${pattern}[^"']*["']`, 'i').test(fullImgTag))) {
      console.log(`Skipping unwanted image by attributes: ${imageUrl}`);
      continue;
    }

    // Filter out tracking images based on URL patterns
    const trackingKeywords = [
      'track', 'pixel', 'analytics', '1x1', 'spy', 'beacon', 'openrate',
      'emailtracking', 'campaign', 'stat', 'gif', 'logo', 'logos', 'icon', 'avatar',
      'profile', 'thumbnail', 'thumb', 'favicon'
    ];

    if (trackingKeywords.some(keyword => imageUrl.toLowerCase().includes(keyword))) {
      console.log(`Skipping tracking pixel or logo: ${imageUrl}`);
      continue;
    }

    // Extract width and height from the image tag if available
    const widthMatch = fullImgTag.match(/width=["']?(\d+)["']?/i);
    const heightMatch = fullImgTag.match(/height=["']?(\d+)["']?/i);
    
    // Start with a base score
    let score = 0;
    let width: number | undefined = widthMatch ? parseInt(widthMatch[1], 10) : undefined;
    let height: number | undefined = heightMatch ? parseInt(heightMatch[1], 10) : undefined;
    
    // Check if the image has dimensions in the tag
    if (width && height) {
      // Filter out small images (likely icons, avatars)
      if (width < 300 || height < 200) {
        console.log(`Skipping small image ${width}x${height}: ${imageUrl}`);
        continue;
      }
      
      // Calculate aspect ratio
      const aspectRatio = width / height;
      
      // Prefer landscape images (common for article headers)
      // Ideal aspect ratios are around 16:9, 4:3, 3:2
      if (aspectRatio >= 1.3 && aspectRatio <= 2.0) {
        score += 30;
      } else if (aspectRatio >= 1.0 && aspectRatio < 1.3) {
        score += 10; // Still okay but not ideal
      } else if (aspectRatio > 2.0) {
        score -= 10; // Too wide
      } else {
        score -= 20; // Portrait images are less likely to be article images
      }
      
      // Prefer larger images
      score += Math.min(30, Math.floor(width / 100));
    }

    // Check if the image is likely to be a cover image based on attributes
    const coverImageKeywords = ['hero', 'feature', 'cover', 'main', 'banner', 'header', 'lead', 'featured', 'article-image'];
    if (coverImageKeywords.some(keyword => fullImgTag.toLowerCase().includes(keyword))) {
      console.log(`Found likely cover image keyword: ${imageUrl}`);
      score += 50;
    }
    
    // Penalize images at the bottom of the page (likely ads or related content)
    const position = htmlContent.indexOf(fullImgTag);
    const positionRatio = position / htmlContent.length;
    
    if (positionRatio < 0.3) {
      score += 20; // Images near the top are likely to be article headers
    } else if (positionRatio > 0.8) {
      score -= 20; // Images near the bottom are likely to be related content or ads
    }
    
    // Add the candidate to our list
    candidateImages.push({ url: imageUrl, score, width, height });
  }
  
  console.log(`Found ${candidateImages.length} candidate images`);
  
  // Sort candidates by score descending
  candidateImages.sort((a, b) => b.score - a.score);
  
  // Just take the highest scoring image with dimensions, or the highest scoring overall if none have dimensions
  const bestCandidates = candidateImages.filter(img => img.width && img.height);
  if (bestCandidates.length > 0) {
    console.log(`Using best candidate with dimensions: ${bestCandidates[0].url}`);
    return bestCandidates[0].url;
  } else if (candidateImages.length > 0) {
    console.log(`Using best candidate without dimensions: ${candidateImages[0].url}`);
    return candidateImages[0].url;
  }

  // Look for open graph or Twitter card image meta tags as fallback
  console.log('No suitable images found, checking meta tags...');
  const metaTagRegex = /<meta[^>]+property=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
  
  // Reset the lastIndex property of the regex to start searching from the beginning
  metaTagRegex.lastIndex = 0;
  
  while ((match = metaTagRegex.exec(htmlContent)) !== null) {
    const metaImageUrl = match[1];
    console.log(`Found meta tag image: ${metaImageUrl}`);
    return metaImageUrl; // Just use the first meta image found
  }

  return null; // No valid image found
}

// Function to generate a cover image with OpenAI if none found
async function generateImageWithOpenAI(summary: string): Promise<string | null> {
  try {
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a professional-looking cover image representing: ${summary}`,
      n: 1,
      size: "1024x1024",
    });

    return response.data[0]?.url || null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}

// Function to store image in Supabase Storage
async function storeImageInSupabase(imageUrl: string, articleId: string): Promise<string | null> {
  try {
    console.log(`Fetching image for storage: ${imageUrl}`);
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      console.error(`Failed to fetch image at URL: ${imageUrl}`);
      return null;
    }
    
    // Get content type from response
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Determine file extension based on content type
    let fileExtension = 'jpg'; // Default
    if (contentType.includes('png')) fileExtension = 'png';
    if (contentType.includes('gif')) fileExtension = 'gif';
    if (contentType.includes('webp')) fileExtension = 'webp';
    
    const imageBlob = await response.blob();
    
    // Check image size - don't store if it's too small
    if (imageBlob.size < 10000) { // 10KB minimum
      console.log(`Image too small (${imageBlob.size} bytes), skipping storage: ${imageUrl}`);
      return null;
    }
    
    console.log(`Uploading image (${imageBlob.size} bytes, ${contentType})`);
    
    const filePath = `articles/${articleId}.${fileExtension}`;

    const { data, error } = await supabaseClient.storage
      .from('article-images')
      .upload(filePath, imageBlob, {
        contentType: contentType,
        upsert: true
      });

    if (error) {
      console.error("Error storing image in Supabase:", error);
      return null;
    }

    // Get the public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from('article-images')
      .getPublicUrl(filePath);

    console.log(`Successfully uploaded image to: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error storing image in Supabase:", error);
    return null;
  }
}

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
      .order('created_at', { ascending: false })
      .limit(10);

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

        // Extract or generate cover image
        console.log('Finding cover image for the article...');
        let imageUrl = await extractCoverImageFromHTML(html);
        
        // Check for image in Open Graph meta data if not found in HTML
        if (!imageUrl && scrapeResponse.metadata?.image) {
          console.log('Using image from Open Graph metadata');
          imageUrl = scrapeResponse.metadata.image;
        }
        
        // If no image found, generate one with OpenAI
        if (!imageUrl) {
          console.log('No cover image found, generating with OpenAI...');
          imageUrl = await generateImageWithOpenAI(contentSummary);
        }
        
        // Store the image in Supabase
        let coverImageUrl = null;
        if (imageUrl) {
          console.log('Storing image in Supabase...');
          coverImageUrl = await storeImageInSupabase(imageUrl, suggested.id);
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
            image_url: coverImageUrl, // Store the image URL
            status: savedEmbedding ? 'processed' : 'partial_process' // New status for when embeddings fail
          })
          .eq('id', suggested.id)

        if (updateError) {
          throw updateError
        }
        
        console.log(`Successfully processed article ${suggested.id}`);
        if (coverImageUrl) {
          console.log(`Cover image stored at: ${coverImageUrl}`);
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