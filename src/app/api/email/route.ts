import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { cookies } from 'next/headers';
import { gmail_v1 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ExtendedGmailMessage extends gmail_v1.Schema$Message {
  labelNames?: string[];
}

function getDateRange() {
  const today = new Date();
  const endDate = today.getFullYear() + '/' + 
                 String(today.getMonth() + 1).padStart(2, '0') + '/' + 
                 String(today.getDate()).padStart(2, '0');

  // Restore to full month
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - 1);
  const startDateString = startDate.getFullYear() + '/' + 
                         String(startDate.getMonth() + 1).padStart(2, '0') + '/' + 
                         '01';

  return { startDate: startDateString, endDate };
}

export async function GET() {
  const supabase = await createClient();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Not authenticated" }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('provider_token')?.value;
    const refreshToken = cookieStore.get('provider_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Gmail authentication required. Please reconnect your Gmail account." 
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const oauth2Client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    });

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const { startDate, endDate } = getDateRange();

    // Fetch all messages with pagination
    let allMessages: gmail_v1.Schema$Message[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const response: GaxiosResponse<gmail_v1.Schema$ListMessagesResponse> = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 500,
        pageToken: pageToken,
        q: `after:${startDate} before:${endDate} (in:inbox OR in:anywhere -in:sent -in:spam -in:trash)`
      });

      if (response.data.messages) {
        allMessages = allMessages.concat(response.data.messages);
      }

      pageToken = response.data.nextPageToken || undefined;
      
      // Limit to 1000 messages total to prevent timeouts
      if (allMessages.length >= 1000) {
        console.log('Reached 1000 message limit');
        break;
      }

      if (pageToken) {
        await delay(20); // Short delay between pagination requests
      }
    } while (pageToken);

    if (allMessages.length === 0) {
      return new NextResponse(
        JSON.stringify({
          messages: { messages: [], resultSizeEstimate: 0 }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process messages in optimized batches
    const processedMessages: ExtendedGmailMessage[] = [];
    const batchSize = 15; // Balanced batch size

    for (let i = 0; i < allMessages.length; i += batchSize) {
      const batch = allMessages.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(message => 
          gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'Date', 'Subject']
          })
        )
      );

      processedMessages.push(...batchResults.map(r => r.data));
      
      // Add small delay between batches to prevent rate limiting
      if (i + batchSize < allMessages.length) {
        await delay(20);
      }
    }

    return new NextResponse(
      JSON.stringify({
        messages: {
          messages: processedMessages,
          resultSizeEstimate: allMessages.length
        }
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Gmail API error:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred while fetching emails';
      
    return new NextResponse(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message
        } : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}