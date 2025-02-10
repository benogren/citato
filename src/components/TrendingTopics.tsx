'use client';
import { useEffect, useState } from 'react';

interface Trend {
  topic: string;
  count: number;
}

export default function TrendingTopics() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrends() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('../api/trends', {
            method: 'GET', // Explicitly specify GET
          });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const text = await response.text();
        console.log('***Raw response:', text);


        if (!text) {
          throw new Error('Empty response from server');
        }

        const data = JSON.parse(text);
        console.log('***Parsed response:', data);
        setTrends(Array.isArray(data.trends) ? data.trends : []);

      } catch (err) {
        console.error('Error fetching trends:', err);
        setError('Failed to load trending topics.');
      } finally {
        setLoading(false);
      }
    }

    fetchTrends();
  }, []);

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-2">Trending Topics</h2>

      {loading && <p>Loading trends...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && trends.length === 0 && <p>No trending topics found.</p>}

      <ul>
        {trends.map((trend, index) => (
          <li key={index} className="mb-1">
            <strong>{trend.topic}</strong> ({trend.count} mentions)
          </li>
        ))}
      </ul>
    </div>
  );
}