import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { cookies } from 'next/headers';
import { gmail_v1 } from 'googleapis';
//import { GaxiosResponse } from 'gaxios';

const CONCURRENT_BATCH_SIZE = 5; // Number of concurrent batch requests
const MESSAGES_PER_BATCH = 25;   // Messages to process in each batch
const MAX_TOTAL_MESSAGES = 500;  // Reduced from 1000 to prevent timeouts
const RATE_LIMIT_DELAY = 50;     // Increased delay between batches

interface ExtendedGmailMessage extends gmail_v1.Schema$Message {
  labelNames?: string[];
}

function getDateRange() {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0].replace(/-/g, '/');
  
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setMonth(startDate.getMonth() - 1);
  return { 
    startDate: startDate.toISOString().split('T')[0].replace(/-/g, '/'), 
    endDate 
  };
}

async function processMessageBatch(
  gmail: gmail_v1.Gmail,
  messages: gmail_v1.Schema$Message[],
  retryCount = 0
): Promise<ExtendedGmailMessage[]> {
  try {
    const batchResults = await Promise.all(
      messages.map(message =>
        gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Date', 'Subject']
        })
      )
    );
    return batchResults.map(r => r.data);
  } catch (error) {
    if (retryCount < 3) {  // Implement retry logic
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return processMessageBatch(gmail, messages, retryCount + 1);
    }
    throw error;
  }
}

export async function GET() {
  const supabase = await createClient();
  
  try {
    // Auth validation
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Not authenticated" }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Token validation
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

    // Initialize Gmail client
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

    // Initial message list fetch with optimization
    const initialResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: MAX_TOTAL_MESSAGES,
      q: `after:${startDate} before:${endDate} (in:inbox OR in:anywhere -in:sent -in:spam -in:trash)`
    });

    if (!initialResponse.data.messages) {
      return new NextResponse(
        JSON.stringify({
          messages: { messages: [], resultSizeEstimate: 0 }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process messages in concurrent batches
    const messages = initialResponse.data.messages.slice(0, MAX_TOTAL_MESSAGES);
    const processedMessages: ExtendedGmailMessage[] = [];
    
    for (let i = 0; i < messages.length; i += CONCURRENT_BATCH_SIZE * MESSAGES_PER_BATCH) {
      const batchPromises = [];
      
      for (let j = 0; j < CONCURRENT_BATCH_SIZE && i + j * MESSAGES_PER_BATCH < messages.length; j++) {
        const start = i + j * MESSAGES_PER_BATCH;
        const batch = messages.slice(start, start + MESSAGES_PER_BATCH);
        batchPromises.push(processMessageBatch(gmail, batch));
      }

      const batchResults = await Promise.all(batchPromises);
      processedMessages.push(...batchResults.flat());

      if (i + CONCURRENT_BATCH_SIZE * MESSAGES_PER_BATCH < messages.length) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }

    return new NextResponse(
      JSON.stringify({
        messages: {
          messages: processedMessages,
          resultSizeEstimate: messages.length
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