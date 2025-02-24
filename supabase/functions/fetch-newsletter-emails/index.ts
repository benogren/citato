import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import OpenAI from "https://esm.sh/openai@4.20.1"
import { cleanEmailContent } from "./cleanemails.ts"


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
        lastHour.setHours(lastHour.getHours() - 1)
        //const formattedDate = lastHour.toISOString()
        const formattedDate = Math.floor(lastHour.getTime() / 1000)

        console.log("Today:", today, "Last Hour:", lastHour, "Formatted Date:", formattedDate)

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
        function extractLinksFromHTML(htmlContent) {
          // Regular expression to match <a> tags and extract href and text content
          const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"(?:\s+[^>]*?)?>([^<]*)<\/a>/gi;
          const links = [];
          let match;
        
          while ((match = linkRegex.exec(htmlContent)) !== null) {
            const url = match[1].trim();
            const title = match[2].trim();
            
            // Filter out unwanted links
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
              !url.includes("manage-preferences")) {
              links.push({
                title: title || null,
                url: url
              });
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

          // Insert into database
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
            }, {
              onConflict: 'user_id,message_id'
            })

          if (insertError) {
            console.error('Error inserting email:', insertError)
          } else {
            console.log(`Successfully processed email ${message.id} for user ${userId}`)
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