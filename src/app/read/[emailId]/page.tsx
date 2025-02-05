import Header from '../../../components/header';
import { createClient } from "@/utils/supabase/server";
import { Marked, Renderer } from '@ts-stack/markdown';
import { DisplayEmail } from './gmailHTML';
import TimeAgo from '@/components/time-ago';
//import ButtonActions from './actionButtons';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/submit-button';
import summeryAction from './summeryAction';
//import TextToSpeech from '@/components/text-to-speech';


export type paramsType = Promise<{ emailId: string }>;

Marked.setOptions({
    renderer: new Renderer(),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
});

async function fetchEmail(emailId: string) {
    console.log('Fetching newsletter:', emailId);
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('newsletter_emails')
        .select('*')
        .eq('id', emailId);

    if (error) {
        console.error('Error fetching data:', error);
        return null;
    }

    return data;
}

export default async function ReadEmailPage(props: { params: paramsType }) {
    const { emailId } = await props.params;
    const emailDoc = await fetchEmail(emailId);
    
    if (!emailDoc) {
        return <div>No email found for this ID.</div>;
    }

    return (
        <>
            <Header />
            <div className="bg-gray-100">
                <div className="container mx-auto">
                    {emailDoc &&
                        await Promise.all(
                            emailDoc.map(async (item) => (
                                <div className="flex flex-row" key={item.id}>
                                    <div className="flex flex-col">
                                        <div className="bg-white shadow-lg rounded-md my-8 w-[670px]">
                                            <DisplayEmail messageid={item.message_id} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col m-8 pl-8 ">
                                        <div className='pb-4'>
                                            <span className="text-xs text-gray-500"><TimeAgo date={new Date(item.received_at).toISOString()} /></span>
                                            <h2 className="text-xl font-bold leading-none pt-2">
                                                {item.subject || 'No Subject'}
                                            </h2>
                                            <h3 className="text-sm font-normal pb-2 text-gray-600">
                                                {item.from_name || item.from_email}
                                            </h3>
                                        </div>
                                        
                                        {/* <TextToSpeech textValue={toSpeech || ""}/> */}

                                        {!item.ai_fullsummary ? (
                                            <>
                                            <div
                                                key={`${item.id}-summary`}
                                                className="whitespace-normal text-sm text-gray-600 pb-4 [&_h3]:pb-2 [&_h3]:font-semibold [&_li]:pb-2 [&_li:last-child]:pb-4 [&_p]:pb-4 [&_a]:text-blue-500 [&_a:hover]:underline"
                                                dangerouslySetInnerHTML={{
                                                    __html: Marked.parse(item.ai_summary),
                                                }}
                                            />
                                            <form>
                                            <Input
                                                className="hidden"
                                                value={item.html_body}
                                                name="emailText"
                                                readOnly
                                            />
                                            <Input
                                                className="hidden"
                                                value={item.id}
                                                name="emailId"
                                                readOnly
                                            />
                                            <SubmitButton
                                                pendingText="Generating..."
                                                formAction={summeryAction}
                                                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                                            >
                                                Generate Full Summary
                                            </SubmitButton>
                                            </form>
                                            </>
                                        ) : (
                                            <div
                                                key={`${item.id}-fullsummary`}
                                                className="whitespace-normal text-sm text-gray-600 pb-4 [&_h3]:pb-2 [&_h3]:font-semibold [&_li]:pb-2 [&_li:last-child]:pb-4 [&_p]:pb-4 [&_a]:text-blue-500 [&_a:hover]:underline"
                                                dangerouslySetInnerHTML={{
                                                    __html: Marked.parse(item.ai_fullsummary),
                                                }}
                                            />
                                        )}

                                        {item.ai_links && (
                                            <>
                                            <div
                                                key={`${item.id}-links`}
                                                className="whitespace-normal text-sm text-gray-600 pb-4 [&_h3]:pb-2 [&_h3]:font-semibold [&_li]:pb-2 [&_li:last-child]:pb-4 [&_p]:pb-4 [&_a]:text-blue-500 [&_a:hover]:underline"
                                                dangerouslySetInnerHTML={{
                                                    __html: Marked.parse(item.ai_links),
                                                }}
                                            />
                                            </>
                                        )}

                                        {/* <ButtonActions item={item} /> */}

                                    </div>
                                </div>
                            ))
                        )}
                </div>
            </div>
        </>
    );
}