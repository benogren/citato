import Link from 'next/link';
import Header from '../../../components/header';
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import TimeAgo from '@/components/time-ago';

export type paramsType = Promise<{ newsletterId: string }>;

async function fetchEmails(senderId: string) {
    console.log('Fetching newsletter:', senderId);
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


export default async function newsletterPage(props: { params: paramsType }) {
    const { newsletterId } = await props.params;
    const emailDoc = await fetchEmails(newsletterId);

    return (
        <>
            <Header />
            <div>
                <div className="flex flex-row">
                    <div className="flex flex-col w-1/4 m-4">
                        <h2 className="font-bold border-b-2 border-gray-200 text-gray-500 text-base">Recent:</h2>
                        {emailDoc && emailDoc.map((item) => (
      
                        <div className="m-4 pb-2" key={item.id}>
                            <h3 className="truncate text-left text-sm font-normal">
                                <Link href={`/read/${item.id}`}>{item.subject}</Link>
                            </h3>
                            <h4 className="truncate text-left text-xs font-normal pb-2 text-gray-500">
                                <TimeAgo date={item.created_at} />
                            </h4>
                            <p className="text-left text-xs font-normal">
                                <span className="whitespace-normal line-clamp-2">
                                    {item.plainText.replace(/\s+/g, ' ').trim()}
                                </span>
                            </p>
                        </div>
                        ))}
                    </div>
                    <div className="flex flex-col w-3/4">
                        <div className="mx-12">
                            <h1 className="text-gray-700 text-2xl text-left font-bold">Title</h1>
                            <h2 className="text-gray-500 text-sm font-normal">
                                sub title
                            </h2>
                            <div className="mt-10 shadow-md text-wrap whitespace-normal text-sm">
                                <div className="p-10">
                                    <p>
                                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur
                                    </p>
                                    <div className="pt-12 flex space-x-4">
                                        <Button className="bg-gray-600 text-white py-2 px-4 rounded-md">
                                            Summary
                                        </Button>
                                        <Button className="bg-gray-600 text-white py-2 px-4 rounded-md">
                                            Key Points
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}