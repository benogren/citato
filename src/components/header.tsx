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

    //Check if user exists in the database
    //await mongoose.connect(process.env.MONGODB_URI as string);
    //const findUser = await UserModel.findOne({ workosId: user?.id });

    // No User found in database, create a new user
    // if (!findUser) {
    //     const tempSlug = user?.firstName + '.' + user?.lastName;
    //     await setUser({ userDocs: { workosId: user?.id, emailSlug: tempSlug.toLowerCase() } });
    // }

    return (
        <header>
            <div className="container flex items-center justify-between mx-auto my-4">
                <Link href={"/"} className="font-bold text-xl text-gray-600">citato.ai</Link>
                <nav className="flex gap-2">
                    <AuthButton ></AuthButton>
                </nav>
            </div>
        </header>
    );
}