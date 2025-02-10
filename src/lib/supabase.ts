import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchEmbeddings() {
  try {
    const { data: newsletters, error: newslettersError } = await supabase
      .from('newsletter_emails')
      .select('id, subject, embeddings');

    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select('id, title, embeddings');

    // console.log('Newsletters from Supabase:', newsletters);
    // console.log('Bookmarks from Supabase:', bookmarks);

    if (newslettersError) console.log('Newsletters fetch error:', newslettersError || 'No error');
    if (bookmarksError) console.log('Bookmarks fetch error:', bookmarksError || 'No error');

    const combinedData = [
      ...(newsletters?.map(n => ({ id: n.id, text: n.subject, embedding: n.embeddings })) || []),
      ...(bookmarks?.map(b => ({ id: b.id, text: b.title, embedding: b.embeddings })) || [])
  ].filter(item => item.embedding && Array.isArray(item.embedding));

    console.log('Filtered combined data:', combinedData);

    return combinedData;
  } catch (error) {
    console.error('Unexpected error in fetchEmbeddings:', error);
    return [];
  }
}