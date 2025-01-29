import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth error:', error);
      return NextResponse.redirect(`${origin}/sign-in?error=${error.message}`);
    }

    if (!data.session) {
      console.error('No session established');
      return NextResponse.redirect(`${origin}/sign-in?error=Could not establish session`);
    }

    // Set the session cookie
    const response = NextResponse.redirect(
      redirectTo ? `${origin}${redirectTo}` : `${origin}/home`
    );

    // Set auth cookie
    await supabase.auth.setSession(data.session);

    return response;
  }

  // If no code or session establishment failed, redirect to sign-in
  return NextResponse.redirect(`${origin}/sign-in?error=No code provided`);
}