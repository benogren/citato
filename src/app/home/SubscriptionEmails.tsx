'use client';
import Link from "next/link";
import { useState, useEffect } from 'react';

interface Email {
  id: string;
  from_name?: string;
  from_email: string;
  created_at: string;
  subject: string;
  plainText: string;
  htmlBody: string;
}

interface SubscriptionEmailsProps {
  emails: Email[];
}

export default function SubscriptionEmails({ emails }: SubscriptionEmailsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((current) => 
        current === emails.length - 1 ? 0 : current + 1
      );
    }, 30000);

    return () => clearInterval(timer);
  }, [emails.length]);

  if (!emails?.length) {
    return (
      <div className="text-gray-500 text-lg bg-gray-200 rounded-md">
        <p className="p-4">No new subscription emails today.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[35rem] overflow-hidden rounded-lg">
      {emails.map((email, index) => (
        <div
          key={email.id}
          className={`absolute w-full h-full transition-transform duration-500 ease-in-out ${
            index === currentIndex ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="relative h-full">
            <img
              src="https://images.unsplash.com/photo-1650954316234-5d7160b24eed?q=80&w=1527&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              className="w-full h-full object-cover"
              alt={email.subject || "Newsletter"}
            />
            <div className="absolute inset-x-[15%] bottom-5 py-5 text-white">
              <h5 className="text-xl font-medium">{email.subject || "No subject"}</h5>
              <h6 className="text-xs pb-4">
                <Link href={`/newsletter/${email.from_name}`}>
                  {email.from_name || email.from_email}
                </Link>
              </h6>
              <p className="pb-6 text-sm line-clamp-3">{email.plainText || "No content available"}</p>
              <div className="pb-6 flex gap-2">
                <Link
                  href={`/read/${email.id}`}
                  className="text-white py-2 px-4 border rounded-md hover:bg-white hover:text-black transition-colors"
                >
                  Read More
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {emails.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>

      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/75"
        onClick={() => setCurrentIndex(prev => prev === 0 ? emails.length - 1 : prev - 1)}
      >
        ←
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/75"
        onClick={() => setCurrentIndex(prev => prev === emails.length - 1 ? 0 : prev + 1)}
      >
        →
      </button>
    </div>
  );
}