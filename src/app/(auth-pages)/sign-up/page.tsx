import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

async function signInWithGoogle() {
  'use server'
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      scopes: 'https://www.googleapis.com/auth/gmail.readonly',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  if (error) {
    return redirect('/sign-up?error=' + error.message);
  }

  return redirect(data.url);
}

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  // Check if user is signed in
  const supabase = await createClient();
  const { data: { user }, } = await supabase.auth.getUser();

  if (user) {
    redirect('/home');
  }

  return (
    <>
    <div className="max-w-80">
      <FormMessage message={searchParams} />
      <div className="bg-gray-50 rounded-lg shadow-md p-10">
        <form action={signInWithGoogle} className="mb-6">
          <Button
            type="submit"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </Button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
          </div>
        </div>

        <form className="flex-1 flex flex-col min-w-64">
          <h1 className="text-lg font-medium">Sign up</h1>
          <p className="text-sm text text-foreground">
            Already have an account?{" "}
            <Link className="text-primary font-medium underline" href="/sign-in">
              Sign in
            </Link>
          </p>
          <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
            <Label htmlFor="first_name">First Name</Label>
            <Input name="first_name" placeholder="Your First Name" required />
            <Label htmlFor="last_name">Last Name</Label>
            <Input name="last_name" placeholder="Your Last Name" required />
            <Label htmlFor="email">Email</Label>
            <Input name="email" placeholder="you@example.com" required />
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              minLength={6}
              required
            />
            <SubmitButton formAction={signUpAction} pendingText="Signing up..." className="bg-gray-600 text-white py-2 px-4 rounded-md">
              Sign up
            </SubmitButton>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          By signing up, you agree to our{" "}
          <Link href="/privacy" className="underline hover:text-gray-700">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>  
    </>
  );
}