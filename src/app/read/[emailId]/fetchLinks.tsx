'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
// import linkAction from './linkAction';
// import { Marked } from '@ts-stack/markdown';
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface NewsletterEmail {
  id: string;
  html_body: string | null;
  html_base64: string | null;
  ai_summary: string | null;
  ai_fullsummary: string | null;
  ai_links: string | null;
  received_at: string;
  subject: string;
  from_name: string;
}

interface LinkItem {
  title: string | null;
  url: string;
}

interface LinksData {
  videos: LinkItem[];
  news_articles: LinkItem[];
  author_content: LinkItem[];
  other: LinkItem[];
}

interface FetchAIProps {
  emailId: string;
}

// Log the environment variables to verify they're loaded
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabase = createClient();

export default function FetchLinks({ emailId }: FetchAIProps) {
    const [ai_links, setAILinks] = useState<string>('');
    const [parsedLinks, setParsedLinks] = useState<LinksData | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(true);

  // Parse links JSON string to object
  const parseLinks = (linksJson: string): LinksData | null => {
    if (!linksJson) return null;
    
    try {
      // First, let's check if the JSON string is complete
      if (linksJson.trim().endsWith(',') || 
          linksJson.trim().endsWith('"') || 
          !linksJson.trim().endsWith('}')) {
        console.warn('JSON string appears to be incomplete, attempting to fix...');
        
        // Try to fix common JSON truncation issues
        let fixedJson = linksJson.trim();
        
        // If it's cut off mid-object, try to close it
        if (!fixedJson.endsWith('}')) {
          // Find the last valid closing brace
          const lastObjectEnd = fixedJson.lastIndexOf('}');
          if (lastObjectEnd > 0) {
            fixedJson = fixedJson.substring(0, lastObjectEnd + 1);
            
            // Check if we need to close the outer object as well
            if ((fixedJson.match(/{/g) || []).length > (fixedJson.match(/}/g) || []).length) {
              fixedJson += '}';
            }
          }
        }
        
        return JSON.parse(fixedJson) as LinksData;
      }
      
      return JSON.parse(linksJson) as LinksData;
    } catch (error) {
      console.error('Error parsing links JSON:', error);
      
      // Return a valid empty structure instead of null
      return {
        videos: [],
        news_articles: [],
        author_content: [],
        other: []
      };
    }
  };
  
  useEffect(() => {
    fetchNewsletterData();
  }, [emailId]);

  useEffect(() => {
    if (ai_links) {
      // console.log('Raw AI links string:', ai_links);
      console.log('AI links string length:', ai_links.length);
      
      // If it's long, also log the end of the string
      if (ai_links.length > 100) {
        console.log('End of AI links string:', ai_links.substring(ai_links.length - 100));
      }
      
      const links = parseLinks(ai_links);
      setParsedLinks(links);
    }
  }, [ai_links]);

  const fetchNewsletterData = async () => {
    try {
      console.log('Fetching email ID:', emailId);

      const { data, error: fetchError } = await supabase
        .from('newsletter_emails')
        .select<'*', NewsletterEmail>('*')
        .eq('id', emailId);

      if (fetchError) throw new Error(`Fetch error:`, fetchError);
      if (!data || data.length === 0) throw new Error(`No data found for ID: ${emailId}`);

      const newsletterData = data[0];
      setAILinks(newsletterData.ai_links || '');

    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Check if there are any links at all
  const hasLinks = parsedLinks && Object.values(parsedLinks).some(category => category && category.length > 0);

  if (loading) return (
    <>
    <div className="animate-pulse w-100% mt-6">
        <p className='text-xs text-gray-600'><FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs text-gray-600" /> Looking for interesting links...</p>
        <div className="space-y-3 pt-8">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 h-4 rounded bg-gray-200"></div>
            </div>
            <div className="h-2 rounded bg-gray-200"></div>
            <div className="h-2 rounded bg-gray-200"></div>
            <div className="h-2 rounded bg-gray-200"></div>
            <div className="h-2 rounded bg-gray-200"></div>
            <div className="h-2 rounded bg-gray-200"></div>
            <div className="h-2 rounded bg-gray-200"></div>
        </div>
    </div>
    </>
  );
  
  if (error) return <div>Error: {error}</div>;
  
  if (!hasLinks) return null;

  return (
    <>
      <div className="whitespace-normal text-sm text-gray-600 pb-4 [&_a]:text-blue-500 [&_a:hover]:underline">
        <h3 className="text-lg font-semibold mb-2">Links to Read Later:</h3>
        
        {parsedLinks?.news_articles && parsedLinks.news_articles.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm text-gray-700 mb-1">News & Articles</h4>
            <ul className="space-y-1">
              {parsedLinks.news_articles.map((link, index) => (
                <li key={`news-${index}`}>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {link.title || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {parsedLinks?.videos && parsedLinks.videos.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm text-gray-700 mb-1">Videos</h4>
            <ul className="space-y-1">
              {parsedLinks.videos.map((link, index) => (
                <li key={`video-${index}`}>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {link.title || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {parsedLinks?.author_content && parsedLinks.author_content.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm text-gray-700 mb-1">From the Author</h4>
            <ul className="space-y-1">
              {parsedLinks.author_content.map((link, index) => (
                <li key={`author-${index}`}>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {link.title || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {parsedLinks?.other && parsedLinks.other.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm text-gray-700 mb-1">Other Resources</h4>
            <ul className="space-y-1">
              {parsedLinks.other.map((link, index) => (
                <li key={`other-${index}`}>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {link.title || link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}