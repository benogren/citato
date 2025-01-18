import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { DropdownMenu, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem } from "./ui/dropdown-menu";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div>
            <Badge
              variant={"default"}
              className="font-normal pointer-events-none"
            >
              Please update .env.local file with anon key and url
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={"default"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }
  return user ? (
    <div className="flex">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant={"default"} className="text-gray-500">{user.email}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white grow" align="start">
          <DropdownMenuGroup className="flex flex-col">
            <DropdownMenuItem className="text-gray-500 font-normal pt-4 ml-2">
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <form action={signOutAction}>
                <Button type="submit" variant={"outline"} className="text-left w-full p-0 m-0 ml-1 border-none text-gray-500 font-normal">
                  Sign out
                </Button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}