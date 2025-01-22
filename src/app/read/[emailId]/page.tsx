import Header from '../../../components/header';
import { createClient } from "@/utils/supabase/server";
import { Input } from '@/components/ui/input';
import summeryAction from './summeryAction'
import { SubmitButton } from '@/components/submit-button';
import { Marked, Renderer } from '@ts-stack/markdown';

export type paramsType = Promise<{ emailId: string }>;

Marked.setOptions ({
    renderer: new Renderer,
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false
  });

async function fetchEmail(emailId: string) {
    console.log('Fetching newsletter:', emailId);
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('emails')
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

    return (
        <>
            <Header />
            <div className="bg-gray-100">
                <div className="container mx-auto">
                    {emailDoc && await Promise.all(emailDoc.map(async (item) => {
                    return (
                    <div className="flex flex-row" key={item.id}>
                        <div className="flex flex-col">
                            <div className="bg-white shadow-lg rounded-md text-wrap whitespace-normal text-sm p-6 my-8">
                            <div className=""
                                dangerouslySetInnerHTML={{ __html: item.htmlContent }}
                            />
                            </div>
                        </div>
                        <div className="flex flex-col m-8 pl-8 w-1/4">
                            {item.ai_summary ? (
                                <div
                                className="whitespace-normal text-sm *:text-gray-600 *:pb-4 [&_li]:pb-2" 
                                dangerouslySetInnerHTML={{ __html: Marked.parse(item.ai_summary) }}
                                />
                                // <p>{item.ai_summary}</p>
                            ) : (
                                <form>
                                    {/* <p className='text-sm text-gray-600'><strong>Generate a Summary</strong></p> */}
                                    <Input className='hidden' value={item.htmlContent} name='emailText' readOnly />
                                    <Input className='hidden' value={item.id} name='emailId' readOnly />
                                    <SubmitButton pendingText="Generating..." formAction={summeryAction} className="bg-gray-600 text-white py-2 px-4 rounded-md">
                                        Generate Summary
                                    </SubmitButton>
                                </form>
                            )}
                        </div>
                    </div>
                    )
                    }))}
                </div>
            </div>
        </>
    );
}