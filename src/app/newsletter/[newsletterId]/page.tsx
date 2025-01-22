import Link from 'next/link';
import Header from '../../../components/header';
import { createClient } from "@/utils/supabase/server";
import TimeAgo from '@/components/time-ago';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

export type paramsType = Promise<{ newsletterId: string }>;

async function fetchEmails(senderId: string) {
    console.log('Fetching emails:', senderId);
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('sender_id', senderId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching data:', error);
        return null;
    }

    return data;
}

async function fetchNewletter(newsletterId: string) {
    console.log('Fetching newsletter:', newsletterId);
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('newsletter_senders')
        .select('*')
        .eq('id', newsletterId);

    if (error) {
        console.error('Error fetching data:', error);
        return null;
    }

    return data;
}

export default async function newsletterPage(props: { params: paramsType }) {
    const { newsletterId } = await props.params;
    const emailDoc = await fetchEmails(newsletterId);
    const newsletterDoc = await fetchNewletter(newsletterId);

    // Generate concatenated plain text
    // const concatenatedPlainText = emailDoc
    //     ? emailDoc.map(item => item.plainText.replace(/\s+/g, ' ').trim()).join(' ')
    //     : 'No content available.';

    //const AISummary: string = await GenerateSummary(concatenatedPlainText) as string;

    return (
        <>
        <Header />
        <div className="container mx-auto">
            {newsletterDoc && newsletterDoc.map((news) => (
            <>
            <h1 className='text-3xl font-bold py-16 flex items-center' key={news.id}>
                <Link href={`/`} className="text-gray-500 underline">Citato</Link> <FontAwesomeIcon icon={faChevronRight} className='h-4 px-2' /> {news.name}           
            </h1>
            </>
            ))}
        
            <h2 className='text-2xl font-normal pb-4'>
                Recent Posts:
            </h2>

            <hr />
            <div className='min-h-screen flow-root pt-4'>
                <div className="grid-cols-5 grid gap-6 mb-6">
                {emailDoc && await Promise.all(emailDoc.map(async (item) => {
                return (
                <Link href={`/read/${item.id}`} key={item.id}>
                <div className="relative grid h-[20rem] items-end justify-center overflow-hidden rounded-xl bg-white bg-clip-border text-center text-gray-700">
                    <div className="absolute inset-0 m-0 h-full w-full overflow-hidden bg-transparent bg-[url('https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-clip-border bg-center text-gray-700 shadow-none">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-black/80 via-black/50 to-bg-black-10"></div>
                    </div>
                    <div className="relative p-6 px-6 py-14 md:px-12">
                    <h2 className="block text-xl font-medium tracking-normal text-white antialiased">
                        <span className="line-clamp-4">{item.subject}</span>
                    </h2>
                    <p className="block text-xs antialiased font-normal leading-snug tracking-normal text-gray-400 pt-4">
                        <TimeAgo date={new Date(item.created_at).toLocaleString()} />
                    </p>
                    </div>
                </div>
                </Link>
                )
                }))}

                </div>
            </div>
        </div> 
        </>
    );
}