import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export const getGmailClient = (accessToken: string, refreshToken?: string): OAuth2Client => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
};

export const listEmails = async (accessToken: string, refreshToken?: string) => {
  const auth: OAuth2Client = getGmailClient(accessToken, refreshToken);
  const gmail = google.gmail({ 
    version: 'v1', 
    auth 
  });

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 10,
  });

  return response.data;
};