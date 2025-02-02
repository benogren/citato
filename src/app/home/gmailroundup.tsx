import { createClient } from "@/utils/supabase/server";
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { cookies } from 'next/headers';

interface MessagePartHeader {
  name: string | null | undefined;
  value: string | null | undefined;
}

interface MessagePart {
  mimeType?: string | null;
  body?: {
    data?: string | null;
    size?: number | null;
  } | null;
  parts?: MessagePart[] | null;
  filename?: string | null;
  headers?: MessagePartHeader[] | null;
  partId?: string | null;
}

interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  created_at: string | undefined;
  htmlBody: string;
  plainText: string;
}

// Function to recursively find parts by mimeType
function findPartByMimeType(part: MessagePart | undefined | null, mimeType: string): MessagePart | null {
  if (!part) {
    return null;
  }

  if (part.mimeType && part.mimeType === mimeType) {
    return part;
  }

  if (part.parts && Array.isArray(part.parts)) {
    for (const subPart of part.parts) {
      const found = findPartByMimeType(subPart, mimeType);
      if (found) return found;
    }
  }

  return null;
}

export async function getTodaysSubscribedEmails(userId: string): Promise<EmailMessage[]> {
  const supabase = await createClient();
  
  // Get user's subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('from_email')
    .eq('user_id', userId);
    
  if (!subscriptions?.length) return [];

  // Get OAuth tokens
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('provider_token')?.value;
  const refreshToken = cookieStore.get('provider_refresh_token')?.value;

  if (!accessToken || !refreshToken) {
    throw new Error('Missing OAuth tokens');
  }

  // Setup Gmail client
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

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const formattedDate = today.getFullYear() + '/' + 
                       String(today.getMonth() + 1).padStart(2, '0') + '/' + 
                       String(today.getDate()).padStart(2, '0');

  // Create OR condition for all subscribed emails
  const fromQueries = subscriptions.map(sub => `from:${sub.from_email}`).join(' OR ');
  const query = `${fromQueries} after:${formattedDate}`;

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    });

    if (!response.data.messages) {
      return [];
    }

    // Get full message details
    const messages = await Promise.all(
      response.data.messages.map(async (message) => {
        if (!message.id) {
          console.warn('Message found with no ID, skipping...');
          return null;
        }

        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });
        
        const headers = fullMessage.data.payload?.headers;
        const from = headers?.find(h => h.name === 'From')?.value || '';
        const subject = headers?.find(h => h.name === 'Subject')?.value || '';
        const date = headers?.find(h => h.name === 'Date')?.value;
    
        // Get both HTML and plain text parts
        const payload = fullMessage.data.payload as MessagePart | undefined;
        const htmlPart = findPartByMimeType(payload, 'text/html');
        const plainPart = findPartByMimeType(payload, 'text/plain');
    
        let htmlBody = '';
        let plainText = '';
    
        if (htmlPart?.body?.data) {
          htmlBody = Buffer.from(htmlPart.body.data, 'base64').toString('utf8');
        }
        
        if (plainPart?.body?.data) {
          plainText = Buffer.from(plainPart.body.data, 'base64').toString('utf8');
        }
    
        return {
          id: fullMessage.data.id || message.id,
          from,
          subject,
          created_at: date,
          htmlBody,
          plainText
        };
      })
    );

    // Filter out any null messages and return
    return messages.filter((message): message is EmailMessage => message !== null);

  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    return [];
  }
}