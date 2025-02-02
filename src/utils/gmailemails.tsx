'use client';
import { useEffect, useState } from "react";

interface MessageHeader {
  name: string;
  value: string;
}

interface MessagePart {
  mimeType: string;
  headers: MessageHeader[];
  body: {
    data?: string;
    size?: number;
  };
  parts?: MessagePart[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload: {
    headers: MessageHeader[];
    mimeType: string;
    body: {
      data?: string;
      size?: number;
    };
    parts?: MessagePart[];
  };
}

interface ApiResponse {
  success: boolean;
  messages: {
    messages?: GmailMessage[];
    resultSizeEstimate?: number;
  };
}

function decodeBase64(data: string) {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

function getPlainTextContent(message: GmailMessage): string {
  let plainText = '';

  // Helper function to recursively search for plaintext content
  function findPlainTextRecursive(part: MessagePart) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      plainText += decodeBase64(part.body.data);
    }

    // Check nested parts
    if (part.parts) {
      part.parts.forEach(findPlainTextRecursive);
    }
  }

  // Check main body first
  if (message.payload.mimeType === 'text/plain' && message.payload.body?.data) {
    plainText = decodeBase64(message.payload.body.data);
  }

  // Check all parts
  if (message.payload.parts) {
    message.payload.parts.forEach(findPlainTextRecursive);
  }

  return plainText;
}

export default function GoogleEmails() {
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/email")
      .then((res) => {
        if (!res.ok) {
          return res.json().then(err => {
            throw new Error(err.error || 'Failed to fetch emails');
          });
        }
        return res.json();
      })
      .then((data: ApiResponse) => {
        console.log('Email data:', data);
        if (data.success && data.messages && Array.isArray(data.messages.messages)) {
          setEmails(data.messages.messages);
        } else {
          throw new Error('Invalid email data structure');
        }
      })
      .catch((err) => {
        console.error('Error fetching emails:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-2">Loading emails...</span>
    </div>
  );
  
  if (error) return (
    <div className="text-red-600 p-4 bg-red-50 rounded-md">
      Error: {error}
    </div>
  );
  
  if (emails.length === 0) return (
    <div className="text-gray-500 p-4">
      No emails found
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Emails</h1>
      <div className="space-y-4">
        {emails.map((email) => {
          const plainText = getPlainTextContent(email);
          const from = email.payload.headers.find(h => h.name === 'From')?.value || '';
          const subject = email.payload.headers.find(h => h.name === 'Subject')?.value || '';
          const date = email.payload.headers.find(h => h.name === 'Date')?.value || '';
          const emailID = email.id;

          return (
            <div 
              key={email.id} 
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="border-b pb-2 mb-3">
                <h2 className="text-lg font-semibold">{subject}</h2>
                <div className="text-sm text-gray-600">
                  <p>From: {from}</p>
                  <p>Date: {new Date(date).toLocaleString()}</p>
                  <p>Email ID: {emailID}</p>
                </div>
                {email.labelIds && (
                  <div className="flex gap-2 mt-2">
                    {email.labelIds.map((label) => (
                      <span 
                        key={label}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                {plainText ? (
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-normal leading-relaxed">
                    {plainText}
                  </pre>
                ) : (
                  <p className="text-gray-500 italic">No plaintext content available</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}