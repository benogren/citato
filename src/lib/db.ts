// lib/db.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

// Define types for better TypeScript support
interface ContentItem {
  id: string;
  url: string;
  title: string;
  author: string | null;
  ai_summary: string | null;
  similarity?: number;
}

// Type for embeddings input - allows for different formats
type EmbeddingInput = string | number[] | null | undefined | Record<string, unknown>;

// Default vector dimension - must match your OpenAI embeddings dimension
const DEFAULT_EMBEDDING_DIMENSION = 1536; // OpenAI's default dimension

// Get user's content embeddings
export async function getUserContentEmbeddings(userId: string, limit: number = 10) {
  // Create client inside the function to ensure it's in request context
  const supabase = await createClient();
  
  console.log(`Finding bookmarks for user ${userId}`);
  // Get recent bookmark embeddings
  const { data: bookmarkEmbeddings, error: bookmarkError } = await supabase
    .from('bookmarks')
    .select('embeddings')
    .eq('user_id', userId)
    .eq('status', 'processed')
    .not('embeddings', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (bookmarkError) {
    console.error('Error fetching bookmark embeddings:', bookmarkError);
    return { bookmarks: [], newsletters: [] };
  }

  console.log(`Finding newsletters for user ${userId}`);
  // Get recent newsletter embeddings
  const { data: newsletterEmbeddings, error: newsletterError } = await supabase
    .from('newsletter_emails')
    .select('embeddings')
    .eq('user_id', userId)
    .not('embeddings', 'is', null)
    .order('received_at', { ascending: false })
    .limit(limit);

  if (newsletterError) {
    console.error('Error fetching newsletter embeddings:', newsletterError);
    return { bookmarks: bookmarkEmbeddings || [], newsletters: [] };
  }

  // Debug log the structure of the first item from each source (if available)
  if (bookmarkEmbeddings && bookmarkEmbeddings.length > 0) {
    console.log('Sample bookmark embeddings structure:', 
      typeof bookmarkEmbeddings[0].embeddings, 
      Array.isArray(bookmarkEmbeddings[0].embeddings) ? 'is array' : 'not array',
      bookmarkEmbeddings[0].embeddings ? `length: ${bookmarkEmbeddings[0].embeddings.length}` : 'null/undefined'
    );
  } else {
    console.log('No bookmark embeddings found');
  }

  if (newsletterEmbeddings && newsletterEmbeddings.length > 0) {
    console.log('Sample newsletter embeddings structure:', 
      typeof newsletterEmbeddings[0].embeddings, 
      Array.isArray(newsletterEmbeddings[0].embeddings) ? 'is array' : 'not array',
      newsletterEmbeddings[0].embeddings ? `length: ${newsletterEmbeddings[0].embeddings.length}` : 'null/undefined'
    );
  } else {
    console.log('No newsletter embeddings found');
  }

  return { 
    bookmarks: bookmarkEmbeddings || [], 
    newsletters: newsletterEmbeddings || [] 
  };
}

// Get suggested content based on similarity to user's content embeddings
export async function getSuggestedContent(
  userEmbeddings: EmbeddingInput[], 
  limit: number = 10, 
  excludeUrls: string[] = []
) {
  // Create client inside the function to ensure it's in request context
  const supabase = await createClient();
  
  console.log(`getSuggestedContent received ${userEmbeddings ? userEmbeddings.length : 0} embeddings`);
  
  if (!userEmbeddings || userEmbeddings.length === 0) {
    console.log('No user embeddings provided, falling back to general recommendations');
    return getGeneralRecommendations(supabase, limit, excludeUrls);
  }

  try {
    // More flexible validation - check what format the embeddings are in
    console.log('Processing embeddings...');
    for (let i = 0; i < Math.min(userEmbeddings.length, 3); i++) {
      const embed = userEmbeddings[i];
      console.log(`Embedding ${i}:`, 
        embed ? `type: ${typeof embed}` : 'null/undefined', 
        embed && typeof embed === 'object' ? `keys: ${Object.keys(embed).join(', ')}` : '', 
        Array.isArray(embed) ? `array length: ${embed.length}` : 'not array'
      );
    }

    // Parse embeddings from various formats
    const parsedEmbeddings = userEmbeddings.map(embedding => {
      // If it's a string (stringified JSON), try to parse it
      if (typeof embedding === 'string') {
        try {
          return JSON.parse(embedding);
        } catch {
          // Omit the variable name entirely to avoid the unused variable warning
          return null;
        }
      }
      
      // If it's already an array, use it directly
      if (Array.isArray(embedding)) {
        return embedding;
      }
      
      // If it has an 'embedding' property (common format)
      if (embedding && typeof embedding === 'object' && 'embedding' in (embedding as Record<string, unknown>)) {
        const embedObj = embedding as Record<string, unknown>;
        if (Array.isArray(embedObj.embedding)) {
          return embedObj.embedding;
        }
      }
      
      // If it's an object, look for array properties
      if (embedding && typeof embedding === 'object') {
        const embedObj = embedding as Record<string, unknown>;
        for (const key in embedObj) {
          if (Array.isArray(embedObj[key]) && (embedObj[key] as unknown[]).length > 0) {
            return embedObj[key] as number[];
          }
        }
      }
      
      return null;
    });
    
    console.log(`Parsed ${parsedEmbeddings.filter(Boolean).length} out of ${parsedEmbeddings.length} embeddings`);
    
    // Filter out any null or non-array embeddings
    const validEmbeddings = parsedEmbeddings.filter(
      (embedding): embedding is number[] => 
        embedding !== null && 
        Array.isArray(embedding) && 
        embedding.length > 0
    );
    
    console.log(`Found ${validEmbeddings.length} valid embeddings out of ${parsedEmbeddings.length}`);
    
    if (validEmbeddings.length === 0) {
      console.log('No valid embeddings found, falling back to general recommendations');
      return getGeneralRecommendations(supabase, limit, excludeUrls);
    }
    
    // Create a centroid of user embeddings to represent their interests
    const centroidEmbedding = calculateCentroid(validEmbeddings);
    console.log(`Calculated centroid with ${centroidEmbedding.length} dimensions`);
    
    // Query suggested content using vector similarity with the centroid
    const { data: suggestedContent, error } = await supabase.rpc(
      'match_suggested_content',
      {
        query_embedding: centroidEmbedding,
        match_threshold: 0.7, // Adjust threshold as needed
        match_count: limit + excludeUrls.length, // Get extra to account for excluded URLs
        exclude_urls: excludeUrls
      }
    );

    if (error) {
      console.error('Error fetching suggested content:', error);
      return getGeneralRecommendations(supabase, limit, excludeUrls);
    }

    console.log(`Found ${suggestedContent?.length || 0} matching content items`);
    
    // Filter out any excluded URLs that might have slipped through
    const filteredContent = suggestedContent.filter(
      (item: ContentItem) => !excludeUrls.includes(item.url)
    ).slice(0, limit);

    return filteredContent;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return getGeneralRecommendations(supabase, limit, excludeUrls);
  }
}

// Helper function to get general recommendations (fallback)
async function getGeneralRecommendations(
  supabase: SupabaseClient,
  limit: number,
  excludeUrls: string[] = []
): Promise<ContentItem[]> {
  console.log('Using general recommendations fallback');
  const { data: generalSuggestions } = await supabase
    .from('suggested')
    .select('id, url, title, author, ai_summary')
    .eq('status', 'processed')
    .not('url', 'in', excludeUrls)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  console.log(`Found ${generalSuggestions?.length || 0} general recommendations`);
  return generalSuggestions || [];
}

// Helper function to calculate centroid of multiple embeddings
function calculateCentroid(embeddings: number[][]): number[] {
  if (!embeddings || !embeddings.length) return createDefaultEmbedding();
  
  // Find the most common dimension
  const dimensions = embeddings.map(e => e.length);
  const mostCommonDimension = findMostCommonDimension(dimensions);
  console.log(`Using most common dimension: ${mostCommonDimension}`);
  
  const centroid = new Array(mostCommonDimension).fill(0);
  let validEmbeddingsCount = 0;
  
  for (const embedding of embeddings) {
    // Skip embeddings with wrong dimensions
    if (!embedding || embedding.length !== mostCommonDimension) {
      continue;
    }
    
    let hasValidValues = false;
    for (let i = 0; i < mostCommonDimension; i++) {
      // Only add valid numbers to the centroid
      if (embedding[i] !== null && !isNaN(embedding[i]) && isFinite(embedding[i])) {
        centroid[i] += embedding[i];
        hasValidValues = true;
      }
    }
    
    if (hasValidValues) {
      validEmbeddingsCount++;
    }
  }
  
  console.log(`Used ${validEmbeddingsCount} embeddings to calculate centroid`);
  
  // If no valid embeddings were found, create a default embedding
  if (validEmbeddingsCount === 0) {
    console.log('No valid values found, using default embedding');
    return createDefaultEmbedding();
  }
  
  // Average each dimension and ensure no NaN or null values
  for (let i = 0; i < mostCommonDimension; i++) {
    centroid[i] = centroid[i] / validEmbeddingsCount;
    
    // Ensure each value is a valid number
    if (isNaN(centroid[i]) || !isFinite(centroid[i]) || centroid[i] === null) {
      centroid[i] = 0.0001; // Small default value
    }
  }
  
  return centroid;
}

// Find the most common dimension in the embeddings
function findMostCommonDimension(dimensions: number[]): number {
  if (!dimensions.length) return DEFAULT_EMBEDDING_DIMENSION;
  
  const counts: Record<number, number> = {};
  let maxCount = 0;
  let mostCommon = dimensions[0];
  
  for (const dim of dimensions) {
    counts[dim] = (counts[dim] || 0) + 1;
    if (counts[dim] > maxCount) {
      maxCount = counts[dim];
      mostCommon = dim;
    }
  }
  
  return mostCommon;
}

// Create a default embedding with small values
function createDefaultEmbedding(): number[] {
  console.log(`Creating default embedding with ${DEFAULT_EMBEDDING_DIMENSION} dimensions`);
  // Create an embedding with DEFAULT_EMBEDDING_DIMENSION dimensions
  // with small random values between 0.0001 and 0.001
  return Array(DEFAULT_EMBEDDING_DIMENSION).fill(0).map(() => 
    0.0001 + (Math.random() * 0.0009)
  );
}