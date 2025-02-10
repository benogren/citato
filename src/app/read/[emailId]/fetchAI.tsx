'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import summeryAction from './summeryAction';
import TimeAgo from 'react-timeago';
import { Marked } from '@ts-stack/markdown';
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

interface FetchAIProps {
  emailId: string;
}

// Log the environment variables to verify they're loaded
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabase = createClient();

export default function FetchAI({ emailId }: FetchAIProps) {
    const [received_at, setReceivedAt] = useState<string>('');
    const [subject, setSubject] = useState<string>('');
    const [from_name, setFromName] = useState<string>('');
    const [ai_summary, setAISummary] = useState<string>('');
    const [ai_fullsummary, setAIFullSummary] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const decodeBase64 = (base64: string) => {
      // Convert URL-safe base64 to regular base64
      const normalizedBase64 = base64
      .replace(/-/g, '+')
      .replace(/_/g, '/');
      
      // Add padding if needed
      const padding = normalizedBase64.length % 4;
      const paddedBase64 = padding 
      ? normalizedBase64 + '='.repeat(4 - padding)
      : normalizedBase64;
  
      try {
      // Decode base64 to ASCII
      const ascii = atob(paddedBase64);
      
      // Convert ASCII to UTF-8
      return decodeURIComponent(
          Array.from(ascii)
          .map(char => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      } catch (error) {
      console.error('Base64 decode error:', error);
      return '';
      }
  };
  
  useEffect(() => {
    fetchNewsletterData();
  }, [emailId]);

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
      setAISummary(newsletterData.ai_summary || '');
      setReceivedAt(newsletterData.received_at || '');
      setSubject(newsletterData.subject || '');
      setFromName(newsletterData.from_name || '');
      const decodedContent = decodeBase64(newsletterData.html_base64 || '');

      if (!newsletterData.ai_fullsummary) {
        const genai_summary = await summeryAction(decodedContent, emailId);

        setAIFullSummary(genai_summary || '');

      } else {
        setAIFullSummary(newsletterData.ai_fullsummary || '');
      }

    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <>
    <div className="animate-pulse w-100%">
        <p className='text-xs text-gray-600 pb-6'><FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs text-gray-600" /> Generating key points...</p>
        <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 h-2 rounded bg-gray-200"></div>
            </div>
            <div className="h-6 rounded bg-gray-200"></div>
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 h-4 rounded bg-gray-200"></div>
            </div>
        </div>

        <div className="space-y-3 pt-8">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 h-4 rounded bg-gray-200"></div>
            </div>
            <div className="h-2 rounded bg-gray-200"></div>
            <div className="h-2 rounded bg-gray-200"></div>
            <div className="h-2 rounded bg-gray-200"></div>
            <div className="h-2 rounded bg-gray-200"></div>
        </div>
    </div>
    </>
  )
  if (error) return <div>Error: {error}</div>;

  return (
    <>
    <div className='pb-4'>
        <span className="text-xs text-gray-500"><TimeAgo date={new Date(received_at).toISOString()} /></span>
        <h2 className="text-xl font-bold leading-none pt-2">{subject}</h2>
        <h3 className="text-sm font-normal pb-2 text-gray-600">{from_name}</h3>
    </div>


    <div
        className="whitespace-normal text-sm text-gray-600 pb-4 [&_h3]:pb-2 [&_h3]:font-semibold [&_li]:pb-2 [&_li:last-child]:pb-4 [&_p]:pb-4 [&_a]:text-blue-500 [&_a:hover]:underline"
        dangerouslySetInnerHTML={{
            __html: Marked.parse(ai_summary),}}
    />

    <div
        className="whitespace-normal text-sm text-gray-600 pb-4 [&_h3]:pb-2 [&_h3]:font-semibold [&_li]:pb-2 [&_li:last-child]:pb-4 [&_p]:pb-4 [&_a]:text-blue-500 [&_a:hover]:underline"
        dangerouslySetInnerHTML={{
            __html: Marked.parse(ai_fullsummary),}}
    />
    </>
  );
}