import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { google } from "https://esm.sh/googleapis@126.0.1"
import { OAuth2Client } from "https://esm.sh/google-auth-library@9.0.0"
import OpenAI from "https://esm.sh/openai@4.20.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  console.log("Function started")
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'NEXT_PUBLIC_SITE_URL',
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

    // Create OAuth2 client once
    const oauth2Client = new OAuth2Client(
      Deno.env.get('GOOGLE_CLIENT_ID'),
      Deno.env.get('GOOGLE_CLIENT_SECRET'),
      `${Deno.env.get('NEXT_PUBLIC_SITE_URL')}/auth/callback`
    )

    // Group subscriptions by user
    const userSubscriptions = users.reduce((acc: Record<string, any[]>, curr) => {
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

        // Set credentials for this user
        oauth2Client.setCredentials({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token
        })

        console.log(`Processing ${subscriptions.length} subscriptions for user ${userId}`)
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

        // Get last hour's date
        const lastHour = new Date()
        lastHour.setHours(lastHour.getHours() - 1)
        const formattedDate = lastHour.toISOString()

        // Create OR condition for all subscribed emails
        const fromQueries = subscriptions
          .map(sub => `from:${sub.from_email}`)
          .join(' OR ')
        const query = `${fromQueries} after:${formattedDate}`

        console.log(`Fetching emails for user ${userId} with query:`, query)
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 50
        })

        if (!response.data.messages) {
          console.log(`No new messages found for user ${userId}`)
          continue
        }

        console.log(`Found ${response.data.messages.length} messages for user ${userId}`)

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
          const { error: insertError } = await supabase
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

          if (insertError) {
            console.error('Error inserting email:', insertError)
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

// Helper function to find parts by mimeType
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