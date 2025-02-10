import Header from "@/components/header";
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/submit-button';
import linkSaveAction from './linkSaveAction';
import { createClient } from "@/utils/supabase/server";
import BookmarksDisplay from "./BookmarksDisplay";

export default async function BookMarkPage() {

    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    const user_id = data.session?.user.id || "";
    
    return(
        <>
        <Header />
        <div className="bg-gray-100">
            <div className="mx-auto sm:w-full md:w-1/2 lg:w-1/2">
                <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16">
                <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-400">
                    Save a bookmark
                </p>
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
                    className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                    Save
                </SubmitButton>
                </form>
                </div>
            </div>
        </div>
        <div className="flex flex-row">
            <div className="container mx-auto">
                <BookmarksDisplay userId={user_id} />
            </div>
        </div>
        </>
    );
}