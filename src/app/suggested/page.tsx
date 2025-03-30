import TimeAgo from '@/components/time-ago';
import Header from '../../components/header';
import { createClient } from "@/utils/supabase/server";
import Image from 'next/image';

export const metadata = {
  title: 'citato.ai | Suggested',
};


export default async function SuggestedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto text-center mt-10">
        <h1 className="text-2xl font-bold">Please log in to continue</h1>
      </div>
    );
  }
    // Fetch suggested content    
    const { data: Suggested, error } = await supabase
        .from('suggested')
        .select('*')
        .eq('status', 'processed')
        .order('created_at', { ascending: false });
        // .order('title', { ascending: true });

    if (error) throw error

  return (
    <>
      <Header />
      <div className="container mx-auto">
        <h2 className="text-2xl font-normal pb-4">Suggested</h2>
        <hr />
        <div className="pb-10 pt-4">
            <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {Suggested && Suggested.length > 0 ? (
                    Suggested.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow" >
                        <span className="text-xs text-gray-500">
                            <TimeAgo date={new Date(item.created_at).toISOString()} />
                        </span>
                        <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="block mb-2"
                        >
                            <Image
                            src={item.image_url}
                            alt={item.title || 'Untitled'}
                            width={300}
                            height={200}
                            className="w-full h-32 object-cover rounded"
                            />
                            {/* <img 
                            src={item.image_url} 
                            alt={item.title || 'Untitled'} 
                            className="w-full h-32 object-cover rounded"
                            /> */}
                        </a>

                        <h3 className="font-semibold mb-2 line-clamp-2">
                        <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className=""
                        >
                            {item.title || 'Untitled'}
                        </a>
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-2">By {item.author}</p>
                        <p className="text-sm text-gray-700 line-clamp-3">{item.ai_summary}</p>

                        {/* <p className="pt-8 text-sm text-gray-700 line-clamp-8">{item.ai_fullsummary}</p> */}

                        <p className='pt-8 text-xs text-gray-700'>{item.id}</p>
                    </div>
                    ))
                ) : (
                    <div className="col-span-full text-center text-gray-500 py-8">
                    No suggested content found.
                    </div>
                )}
                </div>
            </div>
        </div>
      </div>
    </>
  );
}