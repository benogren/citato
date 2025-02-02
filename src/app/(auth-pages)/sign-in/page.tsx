import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import GoogleSignIn from "@/components/GoogleSignIn";


export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

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
      <div className="bg-gray-50 rounded-lg shadow-md p-6">
        <div className="flex justify-center pb-4">
        <GoogleSignIn />
        </div>
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
          </div>
        </div>

        <form className="flex-1 flex flex-col min-w-64">
          <h1 className="text-lg font-medium">Sign in</h1>
          <p className="text-sm text-foreground">
            Don&apos;t have an account?{" "}
            <Link className="text-foreground font-medium underline" href="/sign-up">
            Sign up
            </Link>
          </p>
          <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
            <Label htmlFor="email">Email</Label>
            <Input name="email" placeholder="you@example.com" required />
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <Link
                className="text-xs text-foreground underline"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              required
            />
            <SubmitButton pendingText="Signing In..." formAction={signInAction} className="bg-gray-600 text-white py-2 px-4 rounded-md">
              Sign in
            </SubmitButton>
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          By signing in, you agree to our{" "}
          <Link href="/privacy" className="underline hover:text-gray-700">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}