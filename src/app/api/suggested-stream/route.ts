// app/api/suggested-stream/route.ts
import { getUserContentEmbeddings, getSuggestedContent } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Define interface for bookmark items
interface BookmarkItem {
  embeddings: number[] | string | Record<string, unknown>;
}

export const dynamic = 'force-dynamic'; // Disable caching

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    // Create the client inside the request context
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
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

    // Get newsletter subjects to avoid duplicating content
    const { data: newsletterSubjects } = await supabase
      .from('newsletter_emails')
      .select('subject')
      .eq('user_id', user.id);
    
    // Normalize newsletter subjects for comparison
    const existingSubjects = newsletterSubjects
      ?.map(newsletter => newsletter.subject?.toLowerCase().trim())
      .filter(Boolean) || [];

    const existingSubjectsSet = new Set(existingSubjects);

    // Helper function to check if a title is too similar to existing subjects
    const isTooSimilar = (title: string): boolean => {
      if (!title) return false;
      
      const normalizedTitle = title.toLowerCase().trim();
      
      // Check for exact matches first (fast check)
      if (existingSubjectsSet.has(normalizedTitle)) return true;
      
      // Check for high similarity
      for (const subject of existingSubjects) {
        // Simple similarity check based on common words
        const titleWords = new Set(normalizedTitle.split(/\s+/).filter(w => w.length > 3));
        const subjectWords: Set<string> = new Set(subject.split(/\s+/).filter((w: string) => w.length > 3));
        
        // Calculate Jaccard similarity
        const titleWordsArray = Array.from(titleWords);
        const commonWords = titleWordsArray.filter(word => subjectWords.has(word)).length;
        const unionSize = titleWords.size + subjectWords.size - commonWords;
        const similarity = unionSize > 0 ? commonWords / unionSize : 0;
        
        // Threshold can be adjusted based on desired strictness
        if (similarity > 0.5) return true;
      }
      
      return false;
    };

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
        .select('id, url, title, author, ai_summary, image_url')
        .eq('status', 'processed')
        .not('url', 'in', excludeUrls)
        .order('created_at', { ascending: false })
        .limit(20); // Get extra for filtering
        
      // Filter out suggestions with titles similar to existing newsletter subjects
      const filteredSuggestions = generalSuggestions
        ?.filter(item => !isTooSimilar(item.title))
        .slice(0, 10); // Limit to requested amount
        
      return NextResponse.json(filteredSuggestions || []);
    }

    // Get personalized suggestions - get extra to allow for filtering
    const suggestedContent = await getSuggestedContent(userEmbeddings, 20, excludeUrls);
    
    // Filter out suggestions with titles similar to existing newsletter subjects
    interface SuggestedContentItem {
      title: string;
      [key: string]: unknown; // Allow other properties
    }

    const filteredSuggestions = suggestedContent
      .filter((item: SuggestedContentItem) => !isTooSimilar(item.title))
      .slice(0, 10); // Limit to requested amount
    
    console.log("Stream API returning:", filteredSuggestions.length, "items after filtering duplicates");
    
    return NextResponse.json(filteredSuggestions || []);
  } catch (error) {
    console.error('Error in suggested stream route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}