// app/api/suggested-stream/route.ts
import { getUserContentEmbeddings, getSuggestedContent } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Define interface for bookmark items
interface BookmarkItem {
  embeddings: number[] | string | Record<string, unknown>;
}

export const dynamic = 'force-dynamic'; // Disable caching

// Remove the unused 'request' parameter
export async function GET() {
  try {
    // Create the client inside the request context
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get already viewed/saved content URLs to exclude
    const { data: bookmarkedUrls } = await supabase
      .from('bookmarks')
      .select('url')
      .eq('user_id', user.id);
      
    const excludeUrls = bookmarkedUrls?.map(bookmark => bookmark.url).filter(Boolean) || [];

    // Get user's content embeddings
    const { bookmarks, newsletters } = await getUserContentEmbeddings(user.id, 20);
    
    console.log(`Found ${bookmarks.length} bookmarks and ${newsletters.length} newsletters`);
    
    // Extract embeddings
    const extractEmbeddings = (items: BookmarkItem[]) => {
      return items.map(item => item.embeddings);
    };
    
    // Combine embeddings from both sources
    const userEmbeddings = [
      ...extractEmbeddings(bookmarks),
      ...extractEmbeddings(newsletters)
    ].filter(Boolean);
    
    if (userEmbeddings.length === 0) {
      console.log('No embeddings after filtering, using general recommendations');
      const { data: generalSuggestions } = await supabase
        .from('suggested')
        .select('id, url, title, author, ai_summary')
        .eq('status', 'processed')
        .not('url', 'in', excludeUrls)
        .order('created_at', { ascending: false })
        .limit(10);
        
      return NextResponse.json(generalSuggestions || []);
    }

    // Get personalized suggestions
    const suggestedContent = await getSuggestedContent(userEmbeddings, 10, excludeUrls);
    console.log("Stream API returning:", suggestedContent.length, "items");
    
    return NextResponse.json(suggestedContent || []);
  } catch (error) {
    console.error('Error in suggested stream route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}