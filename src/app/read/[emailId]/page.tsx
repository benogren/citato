import Header from '../../../components/header';
import { createClient } from "@/utils/supabase/server";

export type paramsType = Promise<{ emailId: string }>;

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
                    <div className="flex flex-row">
                        <div className="flex flex-col">
                            {emailDoc && await Promise.all(emailDoc.map(async (item) => {
                                return (
                                <div className="bg-white shadow-lg rounded-md text-wrap whitespace-normal text-sm p-6 my-8" key={item.id}>
                                <div className=""
                                    dangerouslySetInnerHTML={{ __html: item.htmlContent }}
                                />
                                </div>
                                )
                            }))}
                        </div>
                        <div className="flex flex-col grow m-8">
                            to do...
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}