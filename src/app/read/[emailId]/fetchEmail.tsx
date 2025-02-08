'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import RenderHTML from '../../../components/RenderHTML';
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

interface FetchEmailProps {
  emailId: string;
}

// Log the environment variables to verify they're loaded
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabase = createClient();

export default function FetchEmail({ emailId }: FetchEmailProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchNewsletterData();
  }, [emailId]);

  const fetchNewsletterData = async () => {
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


    try {
      console.log('Fetching email ID:', emailId);

      const { data, error: fetchError } = await supabase
        .from('newsletter_emails')
        .select<'*', NewsletterEmail>('*')
        .eq('id', emailId);

      if (fetchError) throw new Error(`Fetch error:`, fetchError);
      if (!data || data.length === 0) throw new Error(`No data found for ID: ${emailId}`);

      const newsletterData = data[0];
      try {
        const decodedContent = decodeBase64(newsletterData.html_base64 || '');
        setHtmlContent(decodedContent);
      } catch (err) {
        console.error('Error decoding base64:', err);
        setHtmlContent("didnt work");
      }

    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (

    <div className="flex animate-pulse space-x-4 m-4">
        <div className="flex-1 space-y-6 py-1">
            <div className="h-16 rounded bg-gray-200 text-center items-center justify-center flex">
                <span className='text-center text-xs text-gray-600'>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs text-gray-600" /> Loading Newsletter Content 
                </span>
            </div>
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 h-2 rounded bg-gray-200"></div>
                    <div className="col-span-1 h-2 rounded bg-gray-200"></div>
                </div>
                <div className="h-2 rounded bg-gray-200"></div>
            </div>
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 h-2 rounded bg-gray-200"></div>
                    <div className="col-span-2 h-2 rounded bg-gray-200"></div>
                </div>
                <div className="h-2 rounded bg-gray-200"></div>
            </div>
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 h-12 rounded bg-gray-200"></div>
                    <div className='col-span-2 space-y-3'>
                        <div className="h-2 rounded bg-gray-200"></div>
                        <div className="h-2 rounded bg-gray-200"></div>
                        <div className="h-2 rounded bg-gray-200"></div>
                    </div>
                </div>
            </div>
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 h-2 rounded bg-gray-200"></div>
                    <div className="col-span-1 h-2 rounded bg-gray-200"></div>
                </div>
                <div className="h-2 rounded bg-gray-200"></div>
            </div>
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 h-2 rounded bg-gray-200"></div>
                    <div className="col-span-2 h-2 rounded bg-gray-200"></div>
                </div>
                <div className="h-2 rounded bg-gray-200"></div>
            </div>
        </div>
    </div>
);
  if (error) return <div>Error: {error}</div>;

  return (
    <>
    <RenderHTML htmlContent={htmlContent} />
    </>
  );
}