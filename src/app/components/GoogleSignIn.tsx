'use client';

import { createClient } from '@/utils/supabase/client';

export default function GoogleSignIn() {
  const supabase = createClient();

  const handleSignIn = async () => {
    try {
      // Sign out first to clear any existing sessions
      await supabase.auth.signOut();
      
      if (typeof window !== 'undefined') {
        localStorage.clear();
      }

      console.log('Starting Google OAuth flow...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: [
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify'
          ].join(' '),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent select_account',
            response_type: 'code',
            include_granted_scopes: 'true'
          },
        }
      });

      console.log('OAuth initiation response:', {
        hasData: !!data,
        hasUrl: !!data?.url,
        error: error?.message
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned');

      window.location.href = data.url;

    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      type="button"
      className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
    >
      <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
          fill="#EA4335"
        />
        <path
          d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
          fill="#4285F4"
        />
        <path
          d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.27028 9.7049L1.28027 6.60986C0.470274 8.22986 0 10.0599 0 11.9999C0 13.9399 0.470274 15.7699 1.28027 17.3899L5.26498 14.2949Z"
          fill="#FBBC05"
        />
        <path
          d="M12.0003 24C15.2353 24 17.9502 22.935 19.9452 21.095L16.0802 18.095C15.0052 18.855 13.6202 19.25 12.0003 19.25C8.87028 19.25 6.21525 17.14 5.26498 14.295L1.28027 17.39C3.25527 21.31 7.31028 24 12.0003 24Z"
          fill="#34A853"
        />
      </svg>
      Sign in with Google
    </button>
  );
}