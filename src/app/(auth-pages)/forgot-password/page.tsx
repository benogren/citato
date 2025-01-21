import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <>
    <div className="max-w-80">
      <FormMessage message={searchParams} />
      <div className="bg-gray-50 rounded-lg shadow-md p-10">
        <form className="flex-1 flex flex-col min-w-64">
        <h1 className="text-lg font-medium">Reset Password</h1>
          <p className="text-sm text-secondary-foreground">
            Already have an account?{" "}
            <Link className="text-primary underline" href="/sign-in">
              Sign in
            </Link>
          </p>
          <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
            <Label htmlFor="email">Email</Label>
            <Input name="email" placeholder="you@example.com" required />
            <SubmitButton formAction={forgotPasswordAction} className="bg-gray-600 text-white py-2 px-4 rounded-md">
              Reset Password
            </SubmitButton>
        </div>
        </form>
      </div>
    </div>
    </>
  );
}