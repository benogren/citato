'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

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
  // Remove any extra angle brackets that might exist
  const cleanString = fromString.replace(/>>/g, '>').replace(/<</, '<');
  const regex = /^(?:"?([^"]*?)"?\s*)?(?:<([^>]+)>|([^\s]+@[^\s]+))$/;
  const match = cleanString.match(regex);

  if (match) {
    const name = match[1]?.trim().replace(/['"]/g, '') || '';
    const email = (match[2] || match[3])?.trim() || '';
    
    return { name, email };
  }

  // Fallback: try to find just an email address
  const emailMatch = cleanString.match(/([^\s]+@[^\s]+)/);
  return {
    name: '',
    email: emailMatch ? emailMatch[1].trim() : cleanString.trim()
  };
}

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
    <div className="text-center">
      <p className="text-lg font-semibold">Loading your emails...</p>
      <p className="text-sm text-gray-600 mt-2">Analyzing your emails from the last month</p>
      <p className="text-sm text-gray-600">This should take less than a minute</p>
    </div>
  </div>
);

export default function SubscriptionsPage() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchEmails() {
      try {
        const response = await fetch('/api/email');
        const data = (await response.json()) as GmailResponse;

        if (!response.ok) {
          throw new Error('Failed to fetch emails');
        }

        // Create a Map to store unique senders
        const sendersMap = new Map<string, Sender>();

        data.messages.messages.forEach((message: GmailMessage) => {
          const fromHeader = message.payload.headers.find(
            (h: EmailHeader) => h.name === 'From'
          )?.value;
        
          if (fromHeader) {
            const { email, name } = parseFromHeader(fromHeader);
            if (!sendersMap.has(email)) {
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
            }
          }
        });

        // Convert map to array and sort alphabetically by email
        const sendersArray = Array.from(sendersMap.values())
          .sort((a, b) => a.email.localeCompare(b.email));

        setSenders(sendersArray);
      } catch (error) {
        console.error('Error fetching emails:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

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

  return (
    <div className="container mx-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Find Subscriptions</h1>
            <p className="text-gray-600">
              Found {senders.length} unique senders
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