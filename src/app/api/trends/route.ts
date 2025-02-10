import { NextResponse } from "next/server";
import { fetchEmbeddings } from '@/lib/supabase';
import { groupSimilarTopics } from '@/lib/trendAnalysis';

export async function GET(req: Request) {
    if (req.method !== 'GET') {
      return NextResponse.json(
        { error: "Method Not Allowed" },
        { status: 405 }
      );
    }
    try {
      const data = await fetchEmbeddings();
      const trends = groupSimilarTopics(data);
      
      const trendingTopics = Object.entries(trends)
      .map(([text, items]) => ({ topic: text, count: items.length }))
      .sort((a, b) => b.count - a.count);
      
      console.log('Final trending topics:', trendingTopics);

      return NextResponse.json({ trendingTopics }, { status: 200 });
    } catch (error) {
      console.error('Error in /api/trends:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  }