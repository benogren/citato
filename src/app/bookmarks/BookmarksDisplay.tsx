'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import TimeAgo from "@/components/time-ago";
import Link from "next/link";

interface BookmarksDisplayProps {
  userId: string;
}

export default function BookmarksDisplay({ userId }: BookmarksDisplayProps) {
  const [bookmarks, setBookmarks] = useState<{ id: number; title: string; url: string, ai_summary: string, created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookmarks(data);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchBookmarks();
    }
  }, [userId]);

  // const handleDelete = async (id) => {
  //   try {
  //     const { error } = await supabase
  //       .from('bookmarks')
  //       .delete()
  //       .eq('id', id);

  //     if (error) throw error;
  //     setBookmarks(bookmarks.filter(bookmark => bookmark.id !== id));
  //   } catch (error) {
  //     console.error('Error deleting bookmark:', error);
  //   }
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading bookmarks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {bookmarks.map((bookmark) => (
        <div key={bookmark.id} className="border rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">
                <Link
                  href={`/readlink/${bookmark.id}`}>
                    {bookmark.title}
                  </Link>
              </h3>
              <p className="text-sm text-gray-600">{bookmark.url}</p>
            </div>
            <time className="text-sm text-gray-500">
              <TimeAgo date={new Date(bookmark.created_at).toISOString()} />
            </time>
          </div>
          <p className="mt-2 text-sm text-gray-700">
            {bookmark.ai_summary}
          </p>

          <div className="mt-6">
              <Link
                  href={`/readlink/${bookmark.id}`}
                  className="text-gray-700 py-2 px-4 border rounded-md text-sm mb-6 hover:bg-gray-100"
                  >
                      Read More
              </Link>
            </div>
        </div>
      ))}
      {bookmarks.length === 0 && (
        <div className="col-span-full text-center text-gray-500 py-8">
          No bookmarks saved yet.
        </div>
      )}
    </div>
  );
}