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

// Create an extended message interface
interface ExtendedGmailMessage extends gmail_v1.Schema$Message {
  labelNames?: string[];
}

// Update the processedMessages array type
//const processedMessages: ExtendedGmailMessage[] = [];


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
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('provider_token')?.value;
    const refreshToken = cookieStore.get('provider_refresh_token')?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ 
        error: "Missing OAuth tokens",
        details: { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken }
      }, { status: 401 });
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
    
    console.log('Fetching emails from', startDate, 'to', endDate);

    const labelsResponse = await gmail.users.labels.list({
      userId: 'me'
    });
    
    // Create label map with strict type checking
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

    // Get messages
    let allMessages: gmail_v1.Schema$Message[] = [];
let pageToken: string | undefined = undefined;

do {
  const response: GaxiosResponse<gmail_v1.Schema$ListMessagesResponse> = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 500,
    pageToken: pageToken,
    q: `after:${startDate} before:${endDate} (in:inbox OR in:sent OR in:spam OR in:all)`
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

    console.log(`Processing ${allMessages.length} messages`);

    // Process messages in batches
    const processedMessages = [];
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
      );

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

    return NextResponse.json({
      success: true,
      messages: {
        messages: processedMessages,
        resultSizeEstimate: allMessages.length
      }
    });

  } catch (error) {
    console.error('Gmail API error:', error);
    return NextResponse.json({ 
      error: "Failed to fetch emails",
      details: error instanceof Error ? {
        message: error.message,
        name: error.name
      } : String(error)
    }, { status: 500 });
  }
}