import TimeAgo from "@/components/time-ago";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";


type NewsletterEmail = {
 id: string
 user_id: string
 message_id: string
 from_email: string
 from_name: string | null
 subject: string | null
 received_at: string
 html_body: string | null
 plain_text: string | null
 created_at: string
 ai_summary: string | null
 ai_fullsummary: string | null
 ai_links: string | null
}

async function fetchTodaysEmails(pageUserId: string): Promise<NewsletterEmail[]> {
    console.log('fetchTodaysEmails for user', pageUserId);
    const supabase = await createClient();
    
    const today: Date = new Date();
    const startOfDay = new Date(today + "Z");
    const endOfDay = new Date(today + "Z");
    startOfDay.setHours(0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('startOfDay', startOfDay.toISOString());
    console.log('endOfDay', endOfDay.toISOString());
    
    const { data, error } = await supabase
        .from('newsletter_emails')
        .select('*')
        .gte("received_at", startOfDay.toISOString())
        .lt("received_at", endOfDay.toISOString())
        .order('received_at', { ascending: false })
    
    if (error) throw error
        return data || []
    }

export default async function Roundup({ pageUserId }: { pageUserId: string }) {
   const emails = await fetchTodaysEmails(pageUserId);

   return (
       <div className="space-y-4 p-4">
         {emails.length === 0 ? (
           <p className="text-gray-500">No emails received today</p>
         ) : (
           emails.map((email) => (
             <div key={email.id} className="border rounded-lg p-4 shadow-sm">
               <div className="flex justify-between items-start">
                 <div>
                   <h3 className="font-medium">{email.subject || 'No Subject'}</h3>
                   <p className="text-sm text-gray-600">
                     {email.from_name || email.from_email}
                   </p>
                 </div>
                 <time className="text-sm text-gray-500">
                    <TimeAgo date={new Date(email.received_at).toISOString()} />
                 </time>
               </div>
               {email.ai_summary && (
                 <p className="mt-2 text-sm text-gray-700">{email.ai_summary}</p>
               )}

               <div className="mt-6">
                <Link
                    href={`/read/${email.id}`}
                    className="text-gray-700 py-2 px-4 border rounded-md"
                    >
                        Read More
                </Link>
                </div>
             </div>
           ))
         )}
       </div>
   );
}