// app/[emailId]/gmailHTML.tsx
'use client';
import React, { useEffect, useState } from 'react';
import RenderHTML from './RenderHTML';

interface DisplayEmailProps {
  messageid: string;
}

interface Part {
  mimeType: string;
  body?: {
    data?: string;
  };
}

export function DisplayEmail({ messageid }: DisplayEmailProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  
    const fetchEmail = async () => {
      try {
        const response = await fetch(`/api/email/messages/route.ts?messageId=${messageid}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!response.ok) {
          throw new Error('Failed to fetch email');
        }
  
        const data = await response.json();
        let emailContent = '';
        
        if (data.message?.payload) {
          const payload = data.message.payload;
  
          // Case 1: Direct body data
          if (payload.body?.data) {
            emailContent = payload.body.data;
          }
          // Case 2: Multipart message
          else if (payload.parts && payload.mimeType === 'multipart/alternative') {
            // Find HTML part first
            const htmlPart = payload.parts.find(
              (part: Part) => part.mimeType === 'text/html'
            );
            
            if (htmlPart?.body?.data) {
              emailContent = htmlPart.body.data;
            } else {
              // Fallback to text part if no HTML
              const textPart = payload.parts.find(
                (part: Part) => part.mimeType === 'text/plain'
              );
              if (textPart?.body?.data) {
                emailContent = textPart.body.data;
              }
            }
          }
        }
  
        if (!emailContent) {
          throw new Error('Email content not found in response');
        }
  
        // Decode the base64 content
        const decodedContent = decodeBase64(emailContent);
        setHtmlContent(decodedContent);
        
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch email');
      } finally {
        setLoading(false);
      }
    };
  
    if (messageid) {
      fetchEmail();
    }
  }, [messageid]);


  if (loading) {
    return (
        <div className='min-w-[600px]'>
        <div className="mx-auto w-full rounded-md p-4">
            <div className="flex animate-pulse space-x-4">
                <div className="flex-1 space-y-6 py-1">
                    <div className="h-16 rounded bg-gray-200"></div>
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
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  return (
    <RenderHTML htmlContent={htmlContent} />
  );
}