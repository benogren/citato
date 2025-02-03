import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { cookies } from 'next/headers';
import { gmail_v1 } from 'googleapis';
import { GaxiosResponse } from 'gaxios';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const EXCLUDED_LABELS = new Set([
  'UNREAD',
  'IMPORTANT',
  'CATEGORY_UPDATES',
  'CATEGORY_PROMOTIONS',
  'CATEGORY_PERSONAL',
  'SPAM',
  'INBOX',
  'SENT',
  'DRAFT',
  'TRASH',
  'STARRED',
  'CATEGORY_FORUMS',
  'CATEGORY_SOCIAL'
]);

interface ExtendedGmailMessage extends gmail_v1.Schema$Message {
  labelNames?: string[];
}

function getDateRange() {
  const today = new Date();
  const endDate = today.getFullYear() + '/' + 
                 String(today.getMonth() + 1).padStart(2, '0') + '/' + 
                 String(today.getDate()).padStart(2, '0');

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
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: "Not authenticated" }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get OAuth tokens
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

    // Fetch labels first
    const labelsResponse = await gmail.users.labels.list({
      userId: 'me'
    }).catch(error => {
      throw new Error(`Failed to fetch labels: ${error.message}`);
    });
    
    // Create label map
    const labelMap = new Map<string, string>(
      labelsResponse.data.labels
        ?.filter((label): label is gmail_v1.Schema$Label => {
          return (
            !!label &&
            typeof label.id === 'string' &&
            typeof label.name === 'string' &&
            !EXCLUDED_LABELS.has(label.id) &&
            !label.id.startsWith('CATEGORY_')
          );
        })
        .map(label => [label.id!, label.name!]) || []
    );

    // Fetch messages with pagination
    let allMessages: gmail_v1.Schema$Message[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const response: GaxiosResponse<gmail_v1.Schema$ListMessagesResponse> = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 500,
        pageToken: pageToken,
        q: `after:${startDate} before:${endDate} (in:inbox OR in:sent OR in:spam OR in:all)`
      }).catch(error => {
        throw new Error(`Failed to fetch message list: ${error.message}`);
      });

      if (response.data.messages) {
        allMessages = allMessages.concat(response.data.messages);
      }

      pageToken = response.data.nextPageToken || undefined;
      
      if (allMessages.length >= 2000) {
        console.log('Reached 2000 message limit');
        break;
      }

      if (pageToken) {
        await delay(100);
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

    // Process messages in batches
    const processedMessages: ExtendedGmailMessage[] = [];
    const batchSize = 20;
    
    for (let i = 0; i < allMessages.length; i += batchSize) {
      const batch = allMessages.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (message) => {
          if (!message.id) {
            throw new Error('Message ID is missing');
          }
      
          return gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Date', 'Subject']
          });
        })
      ).catch(error => {
        throw new Error(`Failed to fetch message details: ${error.message}`);
      });

      // Add label names to each message
      batchResults.forEach((result: GaxiosResponse<ExtendedGmailMessage>) => {
        if (result.data.labelIds) {
          result.data.labelNames = result.data.labelIds
            .filter(id => !EXCLUDED_LABELS.has(id) && !id.startsWith('CATEGORY_'))
            .map(id => labelMap.get(id))
            .filter((name): name is string => Boolean(name));
        }
      });

      processedMessages.push(...batchResults.map(r => r.data));
      await delay(50);
    }

    // Return formatted response
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
    
    // Format error response
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred while fetching emails';
      
    return new NextResponse(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? {
          message: error.message,
          name: error.name
        } : String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}