import Link from "next/link";
import AuthButton from '@/components/header-auth';
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Header() {

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      return redirect("/sign-in");
    }

    return (
        <header>
            <div className="container flex items-center justify-between mx-auto my-4">
                <Link href={"/"} className="font-bold text-xl text-gray-600 no-underline">citato.ai</Link>
                <nav className="flex gap-2">
                    <AuthButton ></AuthButton>
                </nav>
            </div>
        </header>
    );
}