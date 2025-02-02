import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { google } from "https://esm.sh/googleapis@118.0.0"
import { OAuth2Client } from "https://esm.sh/google-auth-library@8.8.0"
import OpenAI from "https://esm.sh/openai@4.24.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Types
interface Subscription {
  from_email: string
}

interface AuthTokens {
  access_token: string
  refresh_token: string
}

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

// Function to find parts by mimeType
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

async function processUserEmails(
  userId: string, 
  subscriptions: Subscription[], 
  accessToken: string, 
  refreshToken: string
) {
  const oauth2Client = new OAuth2Client({
    clientId: Deno.env.get('GOOGLE_CLIENT_ID'),
    clientSecret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
    redirectUri: `${Deno.env.get('NEXT_PUBLIC_SITE_URL')}/auth/callback`
  })

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  // Get last hour's date
  const lastHour = new Date()
  lastHour.setHours(lastHour.getHours() - 1)
  const formattedDate = lastHour.getFullYear() + '/' + 
                       String(lastHour.getMonth() + 1).padStart(2, '0') + '/' + 
                       String(lastHour.getDate()).padStart(2, '0') + ' ' +
                       String(lastHour.getHours()).padStart(2, '0') + ':' +
                       String(lastHour.getMinutes()).padStart(2, '0') + ':' +
                       String(lastHour.getSeconds()).padStart(2, '0')

  // Create OR condition for all subscribed emails
  const fromQueries = subscriptions.map(sub => `from:${sub.from_email}`).join(' OR ')
  const query = `${fromQueries} after:${formattedDate}`

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    })

    if (!response.data.messages) {
      return
    }

    // Process each message
    for (const message of response.data.messages) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      })
      
      const headers = fullMessage.data.payload?.headers
      const from = headers?.find(h => h.name === 'From')?.value || ''
      const subject = headers?.find(h => h.name === 'Subject')?.value || ''
      const date = headers?.find(h => h.name === 'Date')?.value

      // Parse from field
      const fromMatch = from.match(/^(?:"?([^"]*)"?\s*)?(?:<([^>]+)>|([^\s]+@[^\s]+))$/)
      const fromName = fromMatch?.[1]?.trim() || ''
      const fromEmail = (fromMatch?.[2] || fromMatch?.[3])?.trim() || ''

      // Get both HTML and plain text parts
      const htmlPart = findPartByMimeType(fullMessage.data.payload, 'text/html')
      const plainPart = findPartByMimeType(fullMessage.data.payload, 'text/plain')

      let htmlBody = ''
      let plainText = ''

      if (htmlPart?.body?.data) {
        htmlBody = atob(htmlPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      }
      
      if (plainPart?.body?.data) {
        plainText = atob(plainPart.body.data.replace(/-/g, '+').replace(/_/g, '/'))
      }

      // Extract content for AI summary
      const paragraphs = plainText.split('\n\n').filter(p => p.trim().length > 0)
      const toSummarize = JSON.stringify(paragraphs)

      // Use OpenAI to summarize
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You will be provided newsletter content, and your task is to summarize the content in a short paragraph",
          },
          {
            role: "user",
            content: toSummarize,
          },
        ],
      })
    
      const contentSummary = completion.choices[0].message.content

      // Insert into database
      const supabase = createClient(
        Deno.env.get('NEXT_PUBLIC_SUPABASE_URL') as string,
        Deno.env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY') as string
      )

      const { error } = await supabase
        .from('newsletter_emails')
        .upsert({
          user_id: userId,
          message_id: message.id,
          from_email: fromEmail,
          from_name: fromName,
          subject,
          received_at: date,
          html_body: htmlBody,
          plain_text: plainText,
          ai_summary: contentSummary
        }, {
          onConflict: 'user_id,message_id'
        })

      if (error) {
        console.error('Error inserting email:', error)
      }
    }
  } catch (error) {
    console.error('Error processing emails for user:', userId, error)
  }
}

// Main server handler
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users with active subscriptions
    const { data: users, error: usersError } = await supabase
      .from('subscriptions')
      .select('user_id, from_email')

    if (usersError) {
      throw usersError
    }

    // Group subscriptions by user
    const userSubscriptions = users.reduce((acc: Record<string, Subscription[]>, curr: any) => {
      if (!acc[curr.user_id]) {
        acc[curr.user_id] = []
      }
      acc[curr.user_id].push(curr)
      return acc
    }, {})

    // Process each user's emails
    for (const [userId, subscriptions] of Object.entries(userSubscriptions)) {
      // Get user's OAuth tokens
      const { data: authData, error: authError } = await supabase
        .from('auth_tokens')
        .select('access_token, refresh_token')
        .eq('user_id', userId)
        .single()

      if (authError || !authData) {
        console.error('Error getting auth tokens for user:', userId)
        continue
      }

      await processUserEmails(
        userId, 
        subscriptions, 
        authData.access_token, 
        authData.refresh_token
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in cron job:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})