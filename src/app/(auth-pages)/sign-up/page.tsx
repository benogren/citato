import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

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

  return (
    <>
    <div className="h-screen flex items-centerflex justify-center items-center m-auto">
      <div className="bg-gray-50 rounded-lg shadow-md p-10 max-w-80">
        <FormMessage message={searchParams} />
        <p className="text-center mb-6">
        <Link href={"/"} className="font-bold text-xl text-gray-600 text-center">citato.ai</Link>
        </p>
        <hr/>
        <form className="flex-1 flex flex-col min-w-64 mt-6">
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
      </div>
    </div>
      
    </>
  );
}