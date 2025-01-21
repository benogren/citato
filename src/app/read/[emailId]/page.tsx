import Header from '../../../components/header';
import { createClient } from "@/utils/supabase/server";
import ReadEmailClient from './ReadEmailClient';

export type paramsType = Promise<{ emailId: string }>;

export default async function ReadEmailPage(props: { params: paramsType }) {
    const { emailId } = await props.params;
    const supabase = await createClient();
    const { data: posts } = await supabase
        .from('emails')
        .select('*')
        .eq('id', emailId);

    if (!posts || posts.length === 0) {
        return <p>No posts found.</p>;
    }

    return (
        <>
            <Header />
            <ReadEmailClient posts={posts} />
        </>
    );
}