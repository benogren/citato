import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
// import { json } from "stream/consumers";
import { Avatar, Dropdown, DropdownDivider, DropdownHeader, DropdownItem } from "flowbite-react";


export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // console.log("User:", user);

  const avatar_url = user?.user_metadata?.avatar_url || "";
  const full_name = user?.user_metadata?.full_name || "";
  const email = user?.email || "";


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
    <div className="flex gap-4 items-center">
      <Link href="/bookmarks" className="text-md text-gray-500 font-normal">Bookmarks</Link>

      <Link href="/subscriptions" className="text-md text-gray-500 font-normal">Newsletters</Link>

      <Dropdown
      label={<Avatar alt="User settings" img={avatar_url} rounded size="sm" bordered color="purple" />}
      arrowIcon={false}
      inline
      >
      <DropdownHeader>
        <span className="block text-sm">{full_name}</span>
        <span className="block truncate text-sm font-medium">{email}</span>
      </DropdownHeader>
        <DropdownItem>
          <Link href="/settings">Settings</Link>
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem>
          <Link href="#" onClick={signOutAction}>Sign out</Link>
        </DropdownItem>
      </Dropdown>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/sign-up">Sign up</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/sign-in">Sign in</Link>
      </Button>
    </div>
  );
}