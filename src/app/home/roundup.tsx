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

type Bookmark = {
  id: string
  url: string
  title: string | null
  author: string | null
  created_at: string
  ai_summary: string | null
}

type ContentItem = {
  id: string
  type: 'email' | 'bookmark'
  title: string
  author: string
  timestamp: string
  summary: string | null
  url?: string
  style: string
}

async function fetchTodaysBookmarks(pageUserId: string): Promise<Bookmark[]> {
  console.log('finding bookmakrs for user', pageUserId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15);
    
  if (error) throw error
  return data || []
}

async function fetchTodaysEmails(pageUserId: string): Promise<NewsletterEmail[]> {
    console.log('finding newsletters for user', pageUserId);
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('newsletter_emails')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(15);
    
    if (error) throw error
        return data || []
    }

export default async function Roundup({ pageUserId }: { pageUserId: string }) {
  //  const emails = await fetchTodaysEmails(pageUserId);

   const [emails, bookmarks] = await Promise.all([
    fetchTodaysEmails(pageUserId),
    fetchTodaysBookmarks(pageUserId)
  ]);

  const content: ContentItem[] = [
    ...emails.map(email => ({
      id: email.id,
      type: 'email' as const,
      title: email.subject || 'No Subject',
      author: email.from_name || email.from_email,
      timestamp: email.received_at,
      summary: email.ai_summary,
      style: "border rounded-lg p-4 shadow-sm border-t-4 border-t-sky-500"
    })),
    ...bookmarks.map(bookmark => ({
      id: bookmark.id,
      type: 'bookmark' as const,
      title: bookmark.title || bookmark.url,
      author: bookmark.url || "",
      timestamp: bookmark.created_at,
      summary: bookmark.ai_summary,
      url: bookmark.url,
      style: "border rounded-lg p-4 shadow-sm border-t-4 border-t-blue-400"
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

   return (
       <div className="space-y-4 p-4">
      {content.length === 0 ? (
        <p className="text-gray-500">No content found</p>
      ) : (
        content.map((item) => (
          <div key={item.id} className={item.style}>
            <div className="flex justify-between items-start">
              <div className="truncate overflow-ellipsis mr-12">
                <h3 className="font-medium">
                  <Link href={item.type === 'email' ? `/read/${item.id}` : `/readlink/${item.id}`}>
                  {item.title}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600">{item.author}</p>
              </div>
              <time className="text-sm text-gray-500">
                <TimeAgo date={new Date(item.timestamp).toISOString()} />
              </time>
            </div>
            {item.summary && (
              <p className="mt-2 text-sm text-gray-700">{item.summary}</p>
            )}
            {item.type === 'email' && (
              <div className="mt-6">
                <Link href={`/read/${item.id}`} className="text-gray-700 py-2 px-4 border rounded-md text-sm hover:bg-gray-100">
                  Read Newsletter
                </Link>
              </div>
            )}
            {item.type === 'bookmark' && (
              <div className="mt-6">
                <Link href={`/readlink/${item.id}`} className="text-gray-700 py-2 px-4 border rounded-md text-sm mb-6 hover:bg-gray-100">
                  Read Bookmark
                </Link>
              </div>
            )}
          </div>
        ))
      )}
    </div>
   );
}