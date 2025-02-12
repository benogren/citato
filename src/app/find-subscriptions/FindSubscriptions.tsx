'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

interface Sender {
  email: string;
  name: string;
  checked: boolean;
  labels: string[];
}

interface EmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePayload {
  headers: EmailHeader[];
  labelNames?: string[];
}

interface GmailMessage {
  payload: GmailMessagePayload;
  labelNames?: string[];
}

interface GmailResponse {
  messages: {
    messages: GmailMessage[];
  };
}

function parseFromHeader(fromString: string): { email: string; name: string } {
  const cleanString = fromString.replace(/>>/g, '>').replace(/<</, '<');
  const regex = /^(?:"?([^"]*?)"?\s*)?(?:<([^>]+)>|([^\s]+@[^\s]+))$/;
  const match = cleanString.match(regex);

  if (match) {
    const name = match[1]?.trim().replace(/['"]/g, '') || '';
    const email = (match[2] || match[3])?.trim() || '';
    
    return { name, email };
  }

  const emailMatch = cleanString.match(/([^\s]+@[^\s]+)/);
  return {
    name: '',
    email: emailMatch ? emailMatch[1].trim() : cleanString.trim()
  };
}

const LoadingState = () => (
  <>
    <div className="container mx-auto">
      <div className='items-center flex pb-4'>
        <Link href={`/subscriptions`} className="text-gray-700 py-2 px-2 border rounded-md text-sm hover:bg-gray-100 mr-4">
          <FontAwesomeIcon icon={faChevronLeft} className="text-indigo-400 size-4 mx-auto" />
        </Link>
        <h2 className="text-2xl text-gray-600">New Subscriptions from Gmail</h2>
      </div>
      <hr />
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
        <div className="text-center">
          <p className="text-lg font-semibold">Loading your emails...</p>
          <p className="text-sm text-gray-600 mt-2">Analyzing your emails from the last month</p>
          <p className="text-sm text-gray-600">This should take less than a minute</p>
        </div>
      </div>
    </div>
  </>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <>
    <div className="container mx-auto">
      <div className='items-center flex pb-4'>
        <Link href={`/subscriptions`} className="text-gray-700 py-2 px-2 border rounded-md text-sm hover:bg-gray-100 mr-4">
          <FontAwesomeIcon icon={faChevronLeft} className="text-indigo-400 size-4 mx-auto" />
        </Link>
        <h2 className="text-2xl text-gray-600">New Subscriptions from Gmail</h2>
      </div>
      <hr />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md max-w-md">
          {message}
        </div>
        <Button onClick={onRetry}>Try Again</Button>
      </div>
    </div>
  </>
);

export default function SubscriptionsPage() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const fetchExistingSubscriptions = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('from_email')
        .eq('user_id', user.id);

      if (error) throw error;

      return new Set(subscriptions.map(sub => sub.from_email.toLowerCase()));
    } catch (error) {
      console.error('Error fetching existing subscriptions:', error);
      throw error;
    }
  };

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);

      const existingSubs = await fetchExistingSubscriptions();

      const response = await fetch('/api/email');
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch emails';
        try {
          const errorData = await response.text();
          errorMessage = errorData || 'Failed to fetch emails';
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json() as GmailResponse;
      const sendersMap = new Map<string, Sender>();

      if (!data.messages?.messages) {
        throw new Error('Invalid response format from email API');
      }

      data.messages.messages.forEach((message: GmailMessage) => {
        const fromHeader = message.payload.headers.find(
          (h: EmailHeader) => h.name.toLowerCase() === 'from'
        )?.value;
      
        if (fromHeader) {
          const { email, name } = parseFromHeader(fromHeader);
          const normalizedEmail = email.toLowerCase();
          
          if (!existingSubs.has(normalizedEmail)) {
            if (!sendersMap.has(email)) {
              // Create new sender entry
              sendersMap.set(email, {
                email,
                name,
                checked: false,
                labels: message.labelNames || []
              });
            } else {
              // Merge labels for existing sender
              const existingSender = sendersMap.get(email)!;
              const newLabels = message.labelNames || [];
              existingSender.labels = Array.from(new Set([...existingSender.labels, ...newLabels]));
              sendersMap.set(email, existingSender);
            }
          }
        }
      });

      const sendersArray = Array.from(sendersMap.values())
        .sort((a, b) => a.email.localeCompare(b.email));

      setSenders(sendersArray);
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleToggleAll = (checked: boolean) => {
    setSenders(prev => prev.map(sender => ({
      ...sender,
      checked
    })));
  };

  const handleToggleSender = (email: string, checked: boolean) => {
    setSenders(prev => prev.map(sender => 
      sender.email === email ? { ...sender, checked } : sender
    ));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const selectedSenders = senders.filter(sender => sender.checked);
      
      if (selectedSenders.length === 0) {
        throw new Error('Please select at least one sender');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert(
          selectedSenders.map(sender => ({
            user_id: user.id,
            from_email: sender.email,
            from_name: sender.name
          }))
        );

      if (insertError) throw insertError;

      setSuccess(true);
      setSenders(prev => prev.map(sender => ({ ...sender, checked: false })));
    } catch (error) {
      console.error('Error saving subscriptions:', error);
      setError(error instanceof Error ? error.message : 'Failed to save subscriptions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  
  if (error && !senders.length) {
    return <ErrorState message={error} onRetry={fetchEmails} />;
  }

  return (
    <div className="container mx-auto">
      <div className='items-center flex pb-4'>
        <Link href={`/subscriptions`} className="text-gray-700 py-2 px-2 border rounded-md text-sm hover:bg-gray-100 mr-4">
          <FontAwesomeIcon icon={faChevronLeft} className="text-indigo-400 size-4 mx-auto" />
        </Link>
        <h2 className="text-2xl text-gray-600">New Subscriptions from Gmail</h2>
      </div>
      <hr />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-600">
              Found {senders.length} new senders
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="selectAll"
                checked={senders.length > 0 && senders.every(s => s.checked)}
                onCheckedChange={(checked) => handleToggleAll(checked as boolean)}
              />
              <label htmlFor="selectAll" className="text-sm">
                Select All
              </label>
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={saving || !senders.some(s => s.checked)}
            >
              {saving ? 'Saving...' : 'Save Selected'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-md">
            Successfully saved subscriptions!
          </div>
        )}

        <div className="space-y-2">
          {senders.map((sender) => (
            <div 
              key={sender.email}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-md border"
            >
              <Checkbox
                id={sender.email}
                checked={sender.checked}
                onCheckedChange={(checked) => 
                  handleToggleSender(sender.email, checked as boolean)
                }
              />
              <div className="flex-1">
                <div className="flex flex-col">
                  {sender.name ? (
                    <>
                      <label 
                        htmlFor={sender.email}
                        className="font-medium cursor-pointer"
                      >
                        {sender.name}
                      </label>
                      <div className="text-sm text-gray-500">
                        {`<${sender.email}>`}
                      </div>
                    </>
                  ) : (
                    <label 
                      htmlFor={sender.email}
                      className="font-medium cursor-pointer"
                    >
                      {sender.email}
                    </label>
                  )}
                  {sender.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 items-center pt-2">
                      <span className='text-xs text-gray-500'>Gmail Labels:</span>
                      {sender.labels.map((label) => (
                        <span 
                          key={label} 
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                        > 
                          {label.replace('CATEGORY_', '').toLowerCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}