import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    
    try {
      console.log('Exchanging code for session...');
      
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth exchange error:', error);
        return NextResponse.redirect(`${origin}/sign-in?error=${error.message}`);
      }

      if (!session) {
        console.error('No session established');
        return NextResponse.redirect(`${origin}/sign-in?error=Could not establish session`);
      }

      // Save tokens to auth_tokens table
      if (session.provider_token && session.provider_refresh_token) {
        console.log('Saving tokens to database...');
        const { error: tokenError } = await supabase
          .from('auth_tokens')
          .upsert({
            user_id: session.user.id,
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (tokenError) {
          console.error('Error saving tokens to database:', tokenError);
          // Log the attempted data for debugging
          console.log('Attempted to save:', {
            user_id: session.user.id,
            hasAccessToken: !!session.provider_token,
            hasRefreshToken: !!session.provider_refresh_token
          });
        } else {
          console.log('Successfully saved tokens to database');
        }
      } else {
        console.error('Missing required tokens:', {
          hasAccessToken: !!session.provider_token,
          hasRefreshToken: !!session.provider_refresh_token
        });
      }

      // Create response with redirect
      const response = NextResponse.redirect(
        redirectTo ? `${origin}${redirectTo}` : `${origin}/home`
      );

      // Store provider tokens in cookies
      const cookieStore = await cookies();
      
      if (session.provider_token) {
        cookieStore.set('provider_token', session.provider_token, {
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 // 24 hours
        });
      }
      
      if (session.provider_refresh_token) {
        cookieStore.set('provider_refresh_token', session.provider_refresh_token, {
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        });
      }

      // Set the session
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });

      return response;
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent('Authentication failed')}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=No code provided`);
}