import Header from "@/components/header";
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/submit-button';
import linkSaveAction from './linkSaveAction';
import { createClient } from "@/utils/supabase/server";
import BookmarksDisplay from "./BookmarksDisplay";

export const metadata = {
    title: 'citato.ai | Your Bookmarks',
};

export default async function BookMarkPage() {

    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    const user_id = data.session?.user.id || "";
    
    return(
        <>
        <Header />
        <div className="bg-gradient-to-bl from-violet-600 to-indigo-800">
            <div className="mx-auto sm:w-full md:w-1/2 lg:w-1/2">
                <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16">
                <h2 className="text-2xl text-gray-200 pb-6">
                    Save a bookmark
                </h2>
                <form className="flex gap-2 items-center">
                <Input
                    name="user_id"
                    value={user_id}
                    className="hidden"
                    readOnly
                />
                <Input
                    className="bg-white text-gray-900 py-2 px-4 rounded-md w-full"
                    placeholder="Enter a url here..."
                    name="bookmark"
                />
                <SubmitButton
                    pendingText="Saving..."
                    formAction={linkSaveAction}
                    className="border text-white py-2 px-4 rounded-md hover:bg-gray-100 hover:text-indigo-500 transition-colors"
                >
                    Save
                </SubmitButton>
                </form>
                </div>
            </div>
        </div>
        <div className="flex flex-row">
            <div className="container mx-auto">
                <h2 className="text-2xl text-gray-600 pb-4 mt-8">Your Bookmarks</h2>
                <hr />
                <BookmarksDisplay userId={user_id} />
            </div>
        </div>
        </>
    );
}