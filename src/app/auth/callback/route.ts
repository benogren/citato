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