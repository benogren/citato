import { withAuth, signOut } from '@workos-inc/authkit-nextjs';
import Link from "next/link";
import Image from 'next/image';
import mongoose from 'mongoose';
import { UserModel } from '../models/users';
import { setUser } from '../actions/setUser';
import { redirect } from 'next/navigation';

export default async function Header() {
    const { user } = await withAuth();
    
    if (!user) {
        redirect(`/?signin`);
    }

    //Check if user exists in the database
    await mongoose.connect(process.env.MONGODB_URI as string);
    const findUser = await UserModel.findOne({ workosId: user?.id });

    // No User found in database, create a new user
    if (!findUser) {
        const tempSlug = user?.firstName + '.' + user?.lastName;
        await setUser({ userDocs: { workosId: user?.id, emailSlug: tempSlug.toLowerCase() } });
    }

    // Get the user's profile picture
    const userImg = user?.profilePictureUrl as string;
    return (
        <header>
            <div className="container flex items-center justify-between mx-auto my-4">
                <Link href={"/"} className="font-bold text-xl text-gray-600">citato.ai</Link>
                <nav className="flex gap-2">
                <form
                    action={async () => {
                        'use server';
                        await signOut();
                    }}
                    > 
                    <div className="flex items-center text-gray-600">
                        <Image
                            src={userImg}
                            alt={JSON.stringify(user?.firstName)}
                            width={32}
                            height={32}
                            className="rounded-full"></Image>
                        <span className="px-2">Hi, {user?.firstName}</span>
                        <Link href={"/settings"} className="py-2 px-2 text-blue-500">Settings</Link>
                        <button type="submit" className="py-2 px-2 text-blue-500">
                            Sign out
                        </button>
                    </div>
                    </form>
                </nav>
            </div>
        </header>
    );
}