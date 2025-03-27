import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import OpenAI from "https://esm.sh/openai@4.20.1"
import { parse } from "https://esm.sh/node-html-parser";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type EmailDataItem = {
  id: string;
  htmlContent: string;
};

export async function cleanEmailContent(emailData: EmailDataItem[]) {
  return emailData.map((item) => {
      const root = parse(item.htmlContent);
      
      const paragraphs = root.querySelectorAll("h1, h2, h3, p, li")
          .map(el => el.text.trim())
          .filter(text => text.length > 0);
          
      const links = root.querySelectorAll("a")
          .map(el => el.getAttribute("href"))
          .filter(Boolean);

      return {
          id: item.id,
          sanitizedHTML: root.toString(),
          extractedContent: {
              paragraphs,
              links,
          },
      };
  });
}

// Improved image extraction with better filtering
async function extractImageFromHTML(htmlContent: string): Promise<string | null> {
  console.log("Starting enhanced image extraction from HTML content");
  
  // First, search for high-priority images with specific desired classes
  const priorityClassRegex = /<img[^>]+class=["']([^"']*(header-image-container|hse-image-wrapper|wide-image)[^"']*)["'][^>]+src=["']([^"']+)["'][^>]*>/gi;
  let priorityMatch;
  let priorityImageUrls = [];

  while ((priorityMatch = priorityClassRegex.exec(htmlContent)) !== null) {
    const imageUrl = priorityMatch[3];
    console.log(`Found priority class image: ${imageUrl}`);
    priorityImageUrls.push(imageUrl);
  }

  // If we found any priority class images, validate them first
  for (const imageUrl of priorityImageUrls) {
    const isValid = await validateImageUrl(imageUrl);
    if (isValid) {
      console.log(`Using priority class image: ${imageUrl}`);
      return imageUrl;
    }
  }

  // Standard image regex to match all img tags
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  let candidateImages = [];

  // Collect all image URLs that aren't immediately filtered
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    // Extract the full img tag and the src URL
    const fullImgTag = match[0];
    const imageUrl = match[1];

    // Skip immediately if matched against our blacklist
    if (shouldSkipImage(fullImgTag, imageUrl)) {
      continue;
    }

    // Add to candidates for further processing
    candidateImages.push(imageUrl);
  }

  console.log(`Found ${candidateImages.length} candidate images after initial filtering`);

  // If no candidates, return null
  if (candidateImages.length === 0) {
    console.log("No suitable image candidates found in HTML");
    return null;
  }

  // Check each candidate more thoroughly
  for (const imageUrl of candidateImages) {
    const isValid = await validateImageUrl(imageUrl);
    if (isValid) {
      console.log(`Selected valid image: ${imageUrl}`);
      return imageUrl;
    }
  }

  console.log("No valid images passed all filtering criteria");
  return null; // No valid image found
}

// Helper function to determine if an image should be skipped based on URL and attributes
function shouldSkipImage(fullImgTag: string, imageUrl: string): boolean {
  // Specific blacklisted URLs to exclude
  const blacklistedUrls = [
    'https://d3k81ch9hvuctc.cloudfront.net/company/Jchkiv/images/aca728d2-5e99-413a-8303-e90d8393a2dd.png',
    'https://stratechery.com/wp-content/themes/stratechery-theme/images/header_large.png',
    'https://media.beehiiv.com/cdn-cgi/image/fit=scale-down,format=auto,onerror=redirect,quality=80/uploads/asset/file/f22fb886-85dc-4afe-85ea-7f7fdfc9d30c/Fill__4___1_.png',
    'https://i7.cmail19.com/ei/t/6C/2D6/32D/231012/csimport/the-daily-upside-sunstrisk-white-36x36_6.png',
    'https://d18e5vrcqydw4b.cloudfront.net/2025/03/Ghost-2.png',
    // New blacklisted URLs
    'https://media.beehiiv.com/cdn-cgi/image/fit=scale-down,format=auto,onerror=redirect,quality=80/uploads/asset/file/e62f06f0-55c5-486f-9fe2-39c5a9ade56e/Word_mark_transparent_background.png',
    'https://embed.filekitcdn.com/e/9LPSo2qdpCMTdspcVpCxvx/9PyZ7aK281HbPVkDZrUGQq',
    'Word_mark_transparent_background.png', // Partial match for the above
    'transparent_background', // Common in logo filenames
    'wordmark', // Common in logo filenames
    'word_mark', // Common in logo filenames
    'brand_', // Common in logo filenames
    'branding_' // Common in logo filenames
  ];

  // Check for exact or partial matches in the blacklist
  if (blacklistedUrls.some(url => imageUrl.includes(url))) {
    console.log(`Skipping blacklisted URL: ${imageUrl}`);
    return true;
  }

  // Patterns to exclude in URLs
  const excludePatterns = [
    // File types
    /\.gif(\?|#|$)/i,
    
    // Keywords in URL
    /logo/i,
    /icon/i,
    /avatar/i,
    /profile/i,
    /badge/i,
    /app-?store/i,
    /play-?store/i,
    /social/i,
    /twitter/i,
    /facebook/i,
    /instagram/i,
    /linkedin/i,
    /youtube/i,
    /pinterest/i,
    /footer/i,
    /header/i,
    
    // Twitter/X profile avatars
    /pbs\.twimg\.com\/profile_images/i,
    
    // Common tracking domains
    /gravatar/i,
    /analytics/i,
    /tracking/i,
    /pixel/i,
    /beacon/i,
    
    // New patterns to exclude
    /sponsor/i,
    /advertisement/i,
    /sponsored/i,
    /promotion/i,
    /promo-/i,
    /ad-image/i,
    /advert/i,
    /marketing/i,
  ];

  if (excludePatterns.some(pattern => pattern.test(imageUrl))) {
    console.log(`Skipping excluded pattern URL: ${imageUrl}`);
    return true;
  }

  // Check for common sponsored content image domains
  const sponsoredImageDomains = [
    'tii.imgix.net/production/advertisements',
    'tii.imgix.net/sponsored',
    'imgix.net/production/advertisements',
    'imgix.net/sponsored',
    'ads.', 
    'adserver.',
    'advertising.',
    'imgix.net/ad',
    'promotions.',
    'sponsored.'
  ];
  
  if (sponsoredImageDomains.some(domain => imageUrl.includes(domain))) {
    console.log(`Skipping sponsored content domain: ${imageUrl}`);
    return true;
  }

  // Check attributes in the img tag
  const attributePatterns = [
    // Classes, IDs or alt text that suggest avatar, logo, icon, etc.
    /(class|id|alt)=["'][^"']*?(?:avatar|logo|icon|badge|social|footer|header|tracking|sponsor|ad|advertisement)[^"']*?["']/i,
    // Width and height being the same (square) in attributes
    /width=["'](\d+)["'][^>]*height=["']\1["']/i,
    // Sponsored content related classes/ids
    /(class|id)=["'][^"']*?(?:sponsor|ad|advert|promotion|promo)[^"']*?["']/i
  ];

  if (attributePatterns.some(pattern => pattern.test(fullImgTag))) {
    console.log(`Skipping due to problematic attributes: ${imageUrl}`);
    return true;
  }

  return false;
}

// Helper function to validate an image URL more thoroughly
async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    console.log(`Validating image: ${imageUrl}`);
    
    // Try to fetch the image headers to check dimensions and type
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`Image fetch failed with status: ${response.status}`);
      return false;
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.log(`Skipping non-image content type: ${contentType}`);
      return false;
    }
    
    // Skip GIFs explicitly
    if (contentType.includes('gif')) {
      console.log(`Skipping GIF image: ${imageUrl}`);
      return false;
    }
    
    // Try to get dimensions if available
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    
    // Skip tiny images (likely tracking pixels or icons)
    if (contentLength > 0 && contentLength < 10000) { // Less than 10KB
      console.log(`Skipping small file (${contentLength} bytes): ${imageUrl}`);
      return false;
    }
    
    // For more accurate dimension checking, we'd need to download and process the image
    // This is a simplified check that works in many cases
    const width = parseInt(response.headers.get('width') || '0', 10);
    const height = parseInt(response.headers.get('height') || '0', 10);
    
    if (width > 0 && height > 0) {
      // Skip tiny images
      if (width < 100 || height < 100) {
        console.log(`Skipping small image dimensions: ${width}x${height}`);
        return false;
      }
      
      // Skip square images (except very large ones which might be content)
      if (width === height && width < 400) {
        console.log(`Skipping square image: ${width}x${height}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error validating image URL ${imageUrl}:`, error);
    return false;
  }
}

// Improved image generation with better prompt engineering
async function generateImageWithOpenAI(summary: string): Promise<string | null> {
  try {
    console.log("No suitable image found, generating one with OpenAI");
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Create a concise descriptive prompt based on the summary
    const cleanSummary = summary.replace(/[^\w\s.,]/g, '').trim();
    const prompt = `Create a professional, abstract representation for a newsletter with this theme: ${cleanSummary.substring(0, 100)}. Make it visually appealing with clean design, appropriate for a professional context. Do not include any text or logos in the image.`;
    
    console.log("OpenAI image generation prompt:", prompt);
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const generatedImageUrl = response.data[0]?.url;
    console.log("OpenAI image generated:", generatedImageUrl ? "Success" : "Failed");
    return generatedImageUrl || null;
  } catch (error) {
    console.error("Error generating image with OpenAI:", error);
    return null;
  }
}

// Fixed image storage function that properly returns public URLs
async function storeImageInSupabase(imageUrl: string, userId: string, messageId: string): Promise<string | null> {
  try {
    console.log(`Storing image in Supabase: ${imageUrl}`);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    
    // Fetch the image with proper headers
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const imageBlob = await response.blob();
    const filePath = `emails/${userId}/${messageId}.jpg`;

    console.log(`Uploading image to path: ${filePath}, size: ${imageBlob.size} bytes`);
    
    // Upload the image with upsert to avoid conflicts
    const { data, error } = await supabase.storage
      .from('email_images')
      .upload(filePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return null;
    }
    
    // Get the public URL correctly after upload
    const { data: publicUrlData } = supabase.storage
      .from('email_images')
      .getPublicUrl(filePath);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error("Failed to get public URL for uploaded image");
      return null;
    }
    
    console.log("Supabase storage upload successful:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error storing image in Supabase:", error);
    return null;
  }
}

// Gmail API wrapper with token refresh
async function createGmailClient(userId: string, accessToken: string, refreshToken: string, supabase: any) {
  const baseUrl = 'https://gmail.googleapis.com/gmail/v1/users/me'
  let currentAccessToken = accessToken

  async function refreshAccessToken() {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') || '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const data = await response.json()
      currentAccessToken = data.access_token

      // Update the token in the database
      const { error } = await supabase
        .from('auth_tokens')
        .update({
          access_token: currentAccessToken,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating token:', error)
      }

      console.log("New Access Token:", currentAccessToken);

      return currentAccessToken

    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    }
  }

  async function makeRequest(url: string, options: RequestInit = {}) {
    const headers = {
      'Authorization': `Bearer ${currentAccessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(url, { ...options, headers })

    if (response.status === 401) {
      // Token expired, refresh and retry
      console.log('Token expired, refreshing...')
      currentAccessToken = await refreshAccessToken()
      
      // Retry the request with new token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${currentAccessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!retryResponse.ok) {
        throw new Error(`Gmail API error: ${retryResponse.statusText}`)
      }

      return retryResponse.json()
    }

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`)
    }

    return response.json()
  }

  return {
    async listMessages(query: string) {
      return makeRequest(
        `${baseUrl}/messages?q=${encodeURIComponent(query)}&maxResults=50`
      )
    },

    async getMessage(messageId: string) {
      return makeRequest(`${baseUrl}/messages/${messageId}?format=full`)
    }
  }
}

serve(async (req: Request) => {
  console.log("Function started")
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check authorization
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Verify environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'OPENAI_API_KEY'
    ]

    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        throw new Error(`Missing required environment variable: ${envVar}`)
      }
    }

    console.log("Creating Supabase client...")
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log("Fetching subscriptions...")
    const { data: users, error: usersError } = await supabase
      .from('subscriptions')
      .select('user_id, from_email')

    if (usersError) {
      console.error('Error fetching subscriptions:', usersError)
      throw usersError
    }

    if (!users || users.length === 0) {
      console.log('No subscriptions found')
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`Found ${users.length} subscriptions`)

    // Group subscriptions by user
    const userSubscriptions = users.reduce((acc: Record<string, { user_id: string, from_email: string }[]>, curr: { user_id: string, from_email: string }) => {
      if (!acc[curr.user_id]) {
        acc[curr.user_id] = []
      }
      acc[curr.user_id].push(curr)
      return acc
    }, {})

    console.log(`Processing ${Object.keys(userSubscriptions).length} users`)

    // Process each user's emails
    for (const [userId, subscriptions] of Object.entries(userSubscriptions)) {
      try {
        console.log(`Getting auth tokens for user ${userId}`)
        const { data: authData, error: authError } = await supabase
          .from('auth_tokens')
          .select('access_token, refresh_token')
          .eq('user_id', userId)
          .single()

        if (authError) {
          console.error(`Error getting auth tokens for user ${userId}:`, authError)
          continue
        }

        if (!authData?.access_token || !authData?.refresh_token) {
          console.error(`Missing auth tokens for user ${userId}`)
          continue
        }

        // Create Gmail client for this user
        const gmail = await createGmailClient(
          userId,
          authData.access_token,
          authData.refresh_token,
          supabase
        )

        // Get last hour's date
        const today = new Date()
        const lastHour = new Date()
        // says last hour but checking every 30 mins! 
        lastHour.setMinutes(lastHour.getMinutes() - 30)
        // lastHour.setHours(lastHour.getHours() - 1)
        //const formattedDate = lastHour.toISOString()
        const formattedDate = Math.floor(lastHour.getTime() / 1000)

        console.log("Today:", today, "Last 30mins:", lastHour, "Formatted Date:", formattedDate)

        // Create OR condition for all subscribed emails
        const fromQueries = (subscriptions as { user_id: string, from_email: string }[])
          .map(sub => `from:${sub.from_email}`)
          .join(' OR ')
        const query = `${fromQueries} after:${formattedDate}`

        console.log(`Fetching emails for user ${userId} with query:`, query)
        const response = await gmail.listMessages(query)

        console.log("Gmail API response:", JSON.stringify(response, null, 2));

        if (!response.messages) {
          console.log(`No new messages found for user ${userId}`)
          continue
        }

        console.log(`Found ${response.messages.length} messages for user ${userId}`)

        // Process each message
        for (const message of response.messages) {
          const fullMessage = await gmail.getMessage(message.id)

          const headers = fullMessage.payload?.headers || []
          const from = headers.find((h: any) => h.name === 'From')?.value || ''
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
          //const date = headers.find((h: any) => h.name === 'Date')?.value
          const dateHeader = headers.find((h: any) => h.name === 'Date')?.value || "";

          let receivedAt: string | null = null;
          if (dateHeader) {
            receivedAt = new Date(dateHeader).toISOString(); // Convert to ISO 8601
          }

          // Parse from field
          const fromMatch = from.match(/^(.*?)\s*<([^>]+)>$/);
          let fromName = "";
          let fromEmail = "";

          if (fromMatch) {
            fromName = fromMatch[1]?.trim() || "";
            fromEmail = fromMatch[2]?.trim() || "";
          } else {
            // If no match, assume it's just an email without a name
            fromEmail = from.trim();
          }

          function findPartByMimeType(part: any, mimeType: string): any {
            if (part.mimeType === mimeType) {
              return part
            }
            if (part.parts) {
              for (const subPart of part.parts) {
                const found = findPartByMimeType(subPart, mimeType)
                if (found) return found
              }
            }
            return null
          }

          const htmlPart = findPartByMimeType(fullMessage.payload, 'text/html')
          const plainPart = findPartByMimeType(fullMessage.payload, 'text/plain')

          let htmlBody = ''
          let plainText = ''

          if (htmlPart?.body?.data) {
            htmlBody = atob(htmlPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
          }
          
          if (plainPart?.body?.data) {
            plainText = atob(plainPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
          }

          // Extract content for AI summary
          const scrapedData = await cleanEmailContent([
            { id: message.id, htmlContent: htmlBody }
          ]);
          const toSummarize = JSON.stringify(scrapedData[0].extractedContent.paragraphs);
          //const paragraphs = htmlBody.split('\n\n').filter(p => p.trim().length > 0)
          //const toSummarize = JSON.stringify(scrapedData)

          const openai = new OpenAI({
            apiKey: Deno.env.get('OPENAI_API_KEY'),
          })

          const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
              {
                role: "system",
                content: "You will be provided newsletter content. Generate a concise summary in 500 characters or less, maintaining the voice and tone of the original text. Ensure brevity while preserving key themes and insights.",
              },
              {
                role: "user",
                content: toSummarize,
              },
            ],
            max_tokens: 150, // Adjust if necessary, but 150 tokens should be close to 500 characters
          });

          const contentSummary = completion.choices[0].message.content

          // Make Embedding API request
          const contentEmbedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: toSummarize,
            encoding_format: "float",
          });

          const savedEmbedding = contentEmbedding.data[0].embedding;

          // Generate Key Takeaways
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
                content: toSummarize,
              },
            ],
            max_tokens: 200, // Adjust based on expected length of response
          });

        const fullSummary = completionKeyPoints.choices[0].message.content;

        //find links!
        // Check for domain patterns that are likely tracking or newsletter-specific
  function isTrackingOrNewsletterDomain(url) {
    const trackingDomains = [
      'links.morningbrew.com',
      'email.morningbrew.com',
      'click.e.', // Common email tracking pattern
      'links.e.',
      'track.',
      'click.',
      'email-tracking',
      'mailtrack',
      'mailchimp',
      'campaign-',
      'cta.',
      'r.mail.',
      'esp.mail',
      'click2.',
      'links.e.',
      'email.e.',
      'mail.e.'
    ];
    
    return trackingDomains.some(domain => url.includes(domain));
  }function extractLinksFromHTML(htmlContent) {
  // Regular expression to match <a> tags and extract href and text content
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"(?:\s+[^>]*?)?>([^<]*)<\/a>/gi;
  const links = [];
  let match;

  // Common newsletter links to filter out
  const commonUnwantedTexts = [
    // Navigation and management links
    'view online', 'view in browser', 'view as webpage', 
    'sign up', 'subscribe', 'unsubscribe', 'manage preferences',
    'privacy policy', 'terms of service', 'contact us', 'forward to a friend',
    'update preferences', 'email preferences', 'email settings', 'browser',
    'view this email in your browser', 'preferences', 'privacy', 'terms',
    'here', 'click here', 'read more', 'learn more', 'more info',
    'advertise', 'careers', 'shop', 'faq', 'help', 'support',
    
    // Event signup and promotional content
    'register', 'registration', 'sign me up', 'join now', 'join us', 'register now',
    'save my spot', 'reserve', 'reserve my spot', 'reserve your spot', 'secure your spot',
    'free trial', 'free download', 'free ebook', 'free guide', 'free workshop',
    'limited time', 'special offer', 'learn more', 'find out more', 
    'giveaway', 'sweepstakes', 'contest', 'drawing', 'raffle',
    'webinar', 'workshop', 'masterclass', 'training', 'seminar',
    'download now', 'get it now', 'get started', 'start now', 'try it free',
    'claim your', 'claim now', 'claim my', 'rsvp'
  ];

  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const url = match[1].trim();
    const title = match[2].trim();
    
          // Skip links with common unwanted text (case insensitive)
    const titleLower = title.toLowerCase();
    
    // Skip single-word generic link texts
    if (title.length < 5 && !title.includes(" ")) {
      continue;
    }
    
    // Skip all-caps navigation links (common in footers)
    if (title === title.toUpperCase() && title.length < 15) {
      continue;
    }
    
    if (commonUnwantedTexts.some(unwanted => titleLower.includes(unwanted.toLowerCase()))) {
      continue;
    }
    
    // Skip promotional titles with common phrases
    if (titleLower.includes("free") || 
        titleLower.includes("sign up") || 
        titleLower.includes("register") ||
        titleLower.includes("event") ||
        titleLower.includes("offer") ||
        titleLower.includes("save") ||
        titleLower.includes("discount") ||
        titleLower.includes("promotion") ||
        titleLower.includes("trial") ||
        titleLower.includes("limited time") ||
        titleLower.includes("webinar") ||
        titleLower.includes("workshop") ||
        titleLower.includes("giveaway") ||
        titleLower.includes("download") ||
        titleLower.includes("joining") ||
        titleLower.includes("join us") ||
        titleLower.includes("click here")) {
      continue;
    }
      
      // Filter out unwanted links by URL pattern
      if (url && 
        !url.startsWith("#") && 
        !url.startsWith("mailto:") && 
        !url.startsWith("javascript:") && 
        !url.includes("/contact") && 
        !url.includes("/about") &&
        !url.includes("/privacy") &&
        !url.includes("/terms") &&
        !url.endsWith(".dtd") &&
        !url.includes("/DTD/") &&
        !url.includes("w3.org/TR/") &&
        !url.includes("schema.org") &&
        !url.includes("unsubscribe") &&
        !url.includes("manage-preferences") &&
        !url.includes("view-in-browser") &&
        !url.includes("view-online") &&
        !url.includes("browser-view") &&
        !url.includes("preferences") && 
        !url.includes("register") &&
        !url.includes("signup") &&
        !url.includes("sign-up") &&
        !url.includes("giveaway") &&
        !url.includes("offer") &&
        !url.includes("register") &&
        !url.includes("event") &&
        !url.includes("free-") &&
        !url.includes("free_") &&
        !url.includes("download") &&
        !url.includes("webinar") &&
        !url.includes("training") &&
        !url.includes("workshop") &&
        !url.includes("coupon") &&
        !url.includes("discount") &&
        !url.includes("promo") &&
        !url.includes("deal") &&
        !url.includes("sale") &&
        !url.includes("trial") &&
        !url.includes("demo") &&
        !url.includes("rsvp") &&
        !url.includes("/faq") &&
        !url.includes("/help") &&
        !url.includes("/careers") &&
        !url.includes("/shop") &&
        !url.includes("/advertise") &&
        !url.includes("/support")) {
        
        // Additional checks for link quality
        if (title && title.length > 2) {
          // Skip links with too many query parameters (likely tracking links)
          const queryParamsCount = (url.match(/&/g) || []).length;
          if (queryParamsCount > 3) {
            continue;
          }
          
          links.push({
            title: title || null,
            url: url
          });
        }
      }
    }

    return JSON.stringify({ links });
  }

        // Use the function (no need for await since it's synchronous now)
        const processedContent = extractLinksFromHTML(htmlBody);

        const completionLinks = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: `You will be provided with a JSON object containing extracted links.  
              Your task is to format them properly and categorize them when possible.
              
              ### **Instructions:**
              - Ensure links are in **valid JSON format**.
              - If a title is missing, return **null** instead of guessing.
              - Categorize links into:
                - **Videos** (YouTube, Vimeo, etc.)
                - **News & Articles** (Bloomberg, NYT, WaPo, etc.)
                - **Author's Own Content** (self-referencing blog links)
                - **Other**
              - Return JSON output in this format:
              
              {
                "videos": [ { "title": "Example Video", "url": "https://youtube.com/example" } ],
                "news_articles": [ { "title": "Example Article", "url": "https://bloomberg.com/example" } ],
                "author_content": [ { "title": "Author's Blog Post", "url": "https://authorwebsite.com/post" } ],
                "other": [ { "title": "Miscellaneous Link", "url": "https://other.com/example" } ]
              }
              
              - If no links exist in a category, return an empty array **[]**.
              `,
            },
            {
              role: "user",
              content: processedContent,
            },
          ],
          response_format: { type: "json_object" }, // Ensure structured JSON output
        });

        const foundLinks = completionLinks.choices[0].message.content;

        // Parse the links JSON
        let parsedLinks;
try {
  // Parse the JSON string into an object
  parsedLinks = JSON.parse(foundLinks);
  console.log('Successfully parsed links:', parsedLinks);

  // Initialize suggestedItems array
  const suggestedItems = [];
  
  // Add news_articles if available
  if (parsedLinks && parsedLinks.news_articles && parsedLinks.news_articles.length > 0) {
    console.log(`Found ${parsedLinks.news_articles.length} news articles to add to suggested table`);
    
    const newsItems = parsedLinks.news_articles.map((article: { title: string; url: string }) => ({
      title: article.title,
      url: article.url,
      type: 'news_article',
      created_at: new Date().toISOString()
    }));
    
    suggestedItems.push(...newsItems);
  }
  
  // Add videos if available
  if (parsedLinks && parsedLinks.videos && parsedLinks.videos.length > 0) {
    console.log(`Found ${parsedLinks.videos.length} videos to add to suggested table`);
    
    const videoItems = parsedLinks.videos.map((video: { title: string; url: string }) => ({
      title: video.title,
      url: video.url,
      type: 'video',
      created_at: new Date().toISOString()
    }));
    
    suggestedItems.push(...videoItems);
  }
  
  // Add author content if available
  if (parsedLinks && parsedLinks.author_content && parsedLinks.author_content.length > 0) {
    console.log(`Found ${parsedLinks.author_content.length} author content items to add to suggested table`);
    
    const authorItems = parsedLinks.author_content.map((content: { title: string; url: string }) => ({
      title: content.title,
      url: content.url,
      type: 'author_content',
      created_at: new Date().toISOString()
    }));
    
    suggestedItems.push(...authorItems);
  }
  
  // Add other links if available
  if (parsedLinks && parsedLinks.other && parsedLinks.other.length > 0) {
    console.log(`Found ${parsedLinks.other.length} other links to add to suggested table`);
    
    const otherItems = parsedLinks.other.map((item: { title: string; url: string }) => ({
      title: item.title,
      url: item.url,
      type: 'other',
      created_at: new Date().toISOString()
    }));
    
    suggestedItems.push(...otherItems);
  }
    
    // Insert into the suggested table
    if (suggestedItems.length > 0) {
      console.log(`Preparing to insert ${suggestedItems.length} total items into suggested table`);
      
      // Option 1: First check if URLs already exist, then only insert new ones
      const urls = suggestedItems.map(item => item.url);
      const { data: existingUrls, error: checkError } = await supabase
        .from('suggested')
        .select('url')
        .in('url', urls);
      
      if (checkError) {
        console.error('Error checking existing URLs:', checkError);
      } else {
        // Filter out items that already exist
        const existingUrlSet = new Set(existingUrls?.map(item => item.url) || []);
        const newItems = suggestedItems.filter(item => !existingUrlSet.has(item.url));
        
        if (newItems.length > 0) {
          console.log(`Found ${newItems.length} new items to insert`);
          const { data: insertedData, error: insertError } = await supabase
            .from('suggested')
            .insert(newItems)
            .select();
          
          if (insertError) {
            console.error('Error inserting into suggested table:', insertError);
          } else {
            console.log(`Successfully added ${insertedData?.length || 0} items to suggested table`);
          }
        } else {
          console.log('All URLs already exist in the table, nothing to insert');
        }
      }
    } else {
      console.log('No items found to add to suggested table');
    }
} catch (error) {
  console.error('Error parsing links JSON:', error);
}
          // Try extracting an image with enhanced filtering
          console.log("Attempting to extract an image from HTML content...");
          let imageUrl = await extractImageFromHTML(htmlBody);
          console.log("Image extraction result:", imageUrl ? "Found suitable image" : "No suitable image found");

          // If no image found, generate one with OpenAI
          if (!imageUrl) {
            console.log("No suitable image found in HTML, attempting to generate with OpenAI...");
            imageUrl = await generateImageWithOpenAI(contentSummary);
            console.log("OpenAI image generation result:", imageUrl ? "Successfully generated image" : "Failed to generate image");
          }

          // Store the image in Supabase with improved error handling
          let storedImageUrl = null;
          if (imageUrl) {
            storedImageUrl = await storeImageInSupabase(imageUrl, userId, message.id);
            console.log("Image storage result:", storedImageUrl ? "Successfully stored image" : "Failed to store image");
          } else {
            console.log("No image URL available to store");
          }

          // Insert into database with image URL (if available)
          const { error: insertError } = await supabase
            .from('newsletter_emails')
            .upsert({
              user_id: userId,
              message_id: message.id,
              from_email: fromEmail,
              from_name: fromName,
              subject,
              received_at: receivedAt,
              html_body: htmlBody,
              html_base64: htmlPart?.body?.data,
              plain_text: plainText,
              ai_summary: contentSummary,
              ai_fullsummary: fullSummary,
              ai_links: foundLinks,
              embeddings: savedEmbedding,
              image_url: storedImageUrl,
            }, {
              onConflict: 'user_id,message_id'
            })

          if (insertError) {
            console.error('Error inserting email:', insertError)
          } else {
            console.log(`Successfully processed email ${message.id} for user ${userId}, image_url: ${storedImageUrl || 'null'}`)
          }
        }
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})