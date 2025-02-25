import Header from "@/components/header";
import FetchLink from "./fetchLink";
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';

export async function generateMetadata({ params }: { params: paramsType }): Promise<Metadata> {
    const { linkId } = await params;
    // console.log('emailId', emailId);
    const supabase = await createClient();
    const { data, error: fetchError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('id', linkId);

    if (fetchError) throw new Error(`Fetch error:`, fetchError);
    if (!data || data.length === 0) throw new Error(`No data found for ID: ${linkId}`);

    const newsletterData = data[0];
    // console.log('newsletterData', newsletterData);
    const subject = newsletterData?.title || 'Bookmark';
    const description = newsletterData?.ai_fullysummary || 'Personalized content recommendations based on your interests';

    return {
        title: `citato.ai | Read: ${subject}`,
        description: description,
    };
}

export type paramsType = Promise<{ linkId: string }>;

export default async function ReadLinkPage(props: { params: paramsType }) {
    const { linkId } = await props.params;

    return (
        <>
        <Header />
        <FetchLink linkId={linkId} />
        </>
    );
}