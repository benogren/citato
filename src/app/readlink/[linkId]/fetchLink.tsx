'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
// import RenderHTML from '../../../components/RenderHTML';
import { faSpinner, faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import TimeAgo from 'react-timeago';
import LinkList from './LinkList';
import Link from 'next/link';

interface LinkData {
  id: string;
  url: string | null;
  title: string | null;
  author: string | null;
  html: string | null;
  markdown: string | null;
  links: string[] | null;
  ai_summary: string;
  created_at: string;
}

interface FetchLinkProps {
    linkId: string;
}

// Log the environment variables to verify they're loaded
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabase = createClient();

export default function FetchLink({ linkId }: FetchLinkProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [created_at, setCreatedAt] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [links, setLinks] = useState<string[]>([]);
  const [ai_summary, setAISummary] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchLinkData();
  }, [linkId]);

  const fetchLinkData = async () => {

    try {
      console.log('***Fetching Link ID:', linkId);

      const { data, error: fetchError } = await supabase
        .from('bookmarks')
        .select<'*', LinkData>('*')
        .eq('id', linkId);

      if (fetchError) throw new Error(`Fetch error:`, fetchError);
      if (!data || data.length === 0) throw new Error(`No data found for ID: ${linkId}`);

      const linkContentData = data[0];
      setHtmlContent(linkContentData.html || '');
      setCreatedAt(linkContentData.created_at || '');
      setTitle(linkContentData.title || '');
      setAuthor(linkContentData.author || '');
      setUrl(linkContentData.url || '');
      setAISummary(linkContentData.ai_summary || '');
      setLinks(linkContentData.links || []);


    } catch (err) {
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="bg-gray-100">
        <div className="container mx-auto">
            <div className="flex flex-row">
                <div className="flex flex-col">
                    
                    <div className="bg-white shadow-lg rounded-md my-8 w-[674px] p-2">
                        <div className="flex animate-pulse space-x-4 m-4">
                            <div className="flex-1 space-y-6 py-1">
                                <div className="h-16 rounded bg-gray-200 text-center items-center justify-center flex">
                                    <span className='text-center text-xs text-gray-600'>
                                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs text-gray-600" /> Loading Bookmark Content 
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
                    </div>
                </div>
                <div className="flex flex-col m-8 pl-8 animate-pulse w-1/4">
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
            </div>
        </div>
    </div>
);
  if (error) return <div>Error: {error}</div>;

  return (
    <>
    <div className="bg-gray-100">
        <div className="container mx-auto">
            <div className="flex flex-row">
                <div className="flex flex-col">
                    <div className="bg-white shadow-lg rounded-md my-8 w-[674px] p-2 whitespace-normal [&_img]:w-[670px]">
                        {/* <RenderHTML htmlContent={htmlContent} /> */}
                        <div
                            className="whitespace-normal text-gray-600 p-6 [&_h3]:pb-2 [&_h3]:font-semibold [&_li]:pb-2 [&_li:last-child]:pb-4 [&_p]:pb-4 [&_a]:text-blue-500 [&_a:hover]:underline [&_table]:w-full [&_table]:mb-4 [&_thead]:uppercase [&_thead]:bg-gray-50 [&_pre]:p-4 [&_tr]:border-b [&_tr]:border-gray-200 [&_thead]:text-sm [&_th]:px-6 [&_th]:py-4 [&_td]:px-6 [&_td]:py-4 [&_th]:font-medium [&_th]:text-gray-900 [&_th]:whitespace-nowrap [&_pre]:whitespace-pre-line [&_pre]:bg-gray-100 [&_pre]:text-xs [&_pre]:mb-4 [&_pre]:rounded-md"
                            dangerouslySetInnerHTML={{__html: htmlContent}}
                        />
                    </div>
                </div>
                <div className="flex flex-col m-8 pl-8">
                    <div className='pb-4'>
                        <span className="text-xs text-gray-500"><TimeAgo date={new Date(created_at).toISOString()} /></span>
                        <h2 className="text-xl font-bold leading-none pt-2">{title}</h2>
                        <h3 className="text-sm font-normal pb-2 text-gray-600">{author}</h3>
                        <p className='text-sm text-gray-600 pb-4 [&_h3]:pb-2 [&_h3]:font-semibold [&_li]:pb-2 [&_li:last-child]:pb-4 [&_p]:pb-4 [&_a]:text-blue-500 [&_a:hover]:underline'>
                            {ai_summary}
                        </p>
                        <p className='items-center text-sm mt-4'>
                            <Link href={url} target='_blank' className="text-gray-700 py-2 px-4 border rounded-md items-center">View Original <FontAwesomeIcon icon={faUpRightFromSquare} className="text-xs text-gray-400" /></Link>
                        </p>
                        <p className='text-sm text-gray-600 pb-4 [&_h3]:pb-2 [&_h3]:font-semibold [&_li]:pb-2 [&_li:last-child]:pb-4 [&_p]:pb-4 [&_a]:text-blue-500 [&_a:hover]:underline'>
                            <LinkList links={links} />
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
  );
}