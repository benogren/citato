"use client";

import { useEffect, useState } from 'react';

interface SuggestedItem {
  id: string;
  url: string;
  title: string;
  author: string | null;
  ai_summary: string | null;
  similarity?: number;
}

export default function SuggestedContent() {
  const [suggestions, setSuggestions] = useState<SuggestedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the direct API endpoint
        console.log("Fetching from direct API");
        const response = await fetch('/api/suggested-stream');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        // Parse the JSON response
        const data = await response.json();
        console.log("Received data:", data);
        
        if (Array.isArray(data)) {
          setSuggestions(data);
        } else {
          console.error("Response is not an array:", data);
          setError('Invalid response format');
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setError(`Failed to load suggestions: ${err}`);
        setLoading(false);
      }
    };
    
    fetchSuggestions();
  }, []);
  
  if (loading) {
    return <div className="py-4">Finding recommendations for you...</div>;
  }
  
  if (error) {
    return (
      <div className="py-4">
        <p className="text-red-500 mb-2">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (suggestions.length === 0) {
    return (
        <></>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((item) => (
          <div 
            key={item.id} 
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold mb-2 line-clamp-2">
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className=""
              >
                {item.title || 'Untitled'}
              </a>
            </h3>
            {item.author && (
              <p className="text-sm text-gray-600 mb-2">By {item.author}</p>
            )}
            {item.ai_summary && (
              <p className="text-sm text-gray-700 line-clamp-3">{item.ai_summary}</p>
            )}
            {item.similarity && (
              <div className="mt-2 text-xs text-gray-500">
                {Math.round(item.similarity * 100)}% match
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}