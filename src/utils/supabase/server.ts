// utils/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name) {
          // Make this an async function and return the value
          return cookieStore.get(name)?.value;
        },
        async set(name, value, options) {
          // Make this an async function
          cookieStore.set(name, value, options);
        },
        async remove(name, options) {
          // Make this an async function
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
}