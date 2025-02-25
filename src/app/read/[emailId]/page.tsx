import Header from '../../../components/header';
import FetchEmail from './fetchEmail';
import FetchAI from './fetchAI';
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
// import FetchLinks from './fetchLinks';

export async function generateMetadata({ params }: { params: paramsType }): Promise<Metadata> {
    const { emailId } = await params;
    // console.log('emailId', emailId);
    const supabase = await createClient();
    const { data, error: fetchError } = await supabase
        .from('newsletter_emails')
        .select('*')
        .eq('id', emailId);

    if (fetchError) throw new Error(`Fetch error:`, fetchError);
    if (!data || data.length === 0) throw new Error(`No data found for ID: ${emailId}`);

    const newsletterData = data[0];
    // console.log('newsletterData', newsletterData);
    const subject = newsletterData?.subject || 'Newsletter';
    const description = newsletterData?.ai_summary || 'Personalized content recommendations based on your interests';

    return {
        title: `citato.ai | Read: ${subject}`,
        description: description,
    };
}

export type paramsType = Promise<{ emailId: string }>;

export default async function ReadEmailPage(props: { params: paramsType }) {
    const { emailId } = await props.params;

    return (
        <>
        <Header />
        <div className="bg-gray-100">
            <div className="container mx-auto">
                <div className="flex flex-row">
                    <div className="flex flex-col">
                        <div className="bg-white shadow-lg rounded-md my-8 w-[674px] p-2">
                            <FetchEmail emailId={emailId} />
                        </div>
                    </div>
                    <div className="flex flex-col m-8 pl-8">
                    <FetchAI emailId={emailId} />

                    {/* <FetchLinks emailId={emailId} /> */}

                    <p className='text-xs text-gray-400 pt-4'>
                        Summary and links are generated using AI, and may have mistakes.<br/>Please double-check responses.
                    </p>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}