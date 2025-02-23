"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function linkSaveAction(formData: FormData): Promise<void> {
    const url = formData.get('bookmark') as string;
    const user_id = formData.get('user_id') as string;

    const supabase = await createClient();

    const {
        data: { user },
      } = await supabase.auth.getUser();

    console.log("Saving Bookmark for User:", user?.id);

    // Save to Supabase
    const linkData = {
        url: url,
        user_id: user_id,
    }
    try {
        const { data, error } = await supabase
            .from('bookmarks')
            .insert(linkData);
        
        console.log('Link saved to supabase', data);

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('Error saving email:', error);
        throw error;
    }



    redirect(`/bookmarks`);
}