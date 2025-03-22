// supabase/functions/suggested-content/index.ts
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Default vector dimension - must match your OpenAI embeddings dimension
const DEFAULT_EMBEDDING_DIMENSION = 1536; // OpenAI's default dimension

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    console.log('Request received to suggested-content function');
    
    // Parse the request body
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      console.log('No request body or invalid JSON');
    }
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    // Extract user ID from JWT without validating the entire session
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        // Simple JWT parsing (base64 decode the payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
        console.log('Extracted user ID from token:', userId);
      } catch (e) {
        console.error('Error extracting user ID from token:', e);
      }
    }
    
    // Create admin client with service role key
    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      { auth: { persistSession: false } }
    );
    
    // If we couldn't get a user ID, return general recommendations
    if (!userId) {
      console.log('No valid user ID found, returning general recommendations');
      return getGeneralRecommendations(adminClient);
    }
    
    console.log('User ID found:', userId);
    
    // Get URLs to exclude
    let excludeUrls = [];
    if (body.exclude_urls && Array.isArray(body.exclude_urls)) {
      excludeUrls = body.exclude_urls;
    } else {
      // Fetch bookmarked URLs if not provided in request
      const { data: bookmarkedUrls } = await adminClient
        .from('bookmarks')
        .select('url')
        .eq('user_id', userId);
      
      excludeUrls = (bookmarkedUrls || []).map(bookmark => bookmark.url).filter(Boolean);
    }
    
    console.log(`Found ${excludeUrls.length} URLs to exclude`);
    
    // Get user's content embeddings
    const userEmbeddings = await getUserContentEmbeddings(adminClient, userId);
    console.log(`Got ${userEmbeddings.length} user embeddings`);
    
    if (userEmbeddings.length === 0) {
      console.log('No embeddings found, returning general recommendations');
      return getGeneralRecommendations(adminClient, excludeUrls);
    }
    
    // Create a centroid of user embeddings - exactly like in your API
    const centroidEmbedding = calculateCentroid(userEmbeddings);
    console.log(`Calculated centroid with ${centroidEmbedding.length} dimensions`);
    
    try {
      // Query suggested content using the same RPC function your API uses
      const { data: suggestedContent, error } = await adminClient.rpc(
        'match_suggested_content',
        {
          query_embedding: centroidEmbedding,
          match_threshold: 0.7,
          match_count: 40, // Get extra to account for excluded URLs
          exclude_urls: excludeUrls
        }
      );
      
      if (error) {
        console.error('Error fetching suggested content:', error);
        return getGeneralRecommendations(adminClient, excludeUrls);
      }
      
      console.log(`Found ${suggestedContent?.length || 0} matching content items`);
      
      // Filter out any excluded URLs that might have slipped through
      const filteredContent = (suggestedContent || []).filter(
        (item) => !excludeUrls.includes(item.url)
      ).slice(0, 20);
      
      console.log(`Returning ${filteredContent.length} filtered content items`);
      
      return new Response(
        JSON.stringify(filteredContent),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return getGeneralRecommendations(adminClient, excludeUrls);
    }
  } catch (error) {
    console.error('Error in suggested-content function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: String(error) }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to get general recommendations (fallback)
async function getGeneralRecommendations(client, excludeUrls = []) {
  console.log('Using general recommendations fallback');
  const { data: generalSuggestions } = await client
    .from('suggested')
    .select('id, url, title, author, ai_summary, created_at')
    .eq('status', 'processed')
    .not('url', 'in', excludeUrls.length > 0 ? excludeUrls : [''])
    .order('created_at', { ascending: false })
    .limit(10);
    
  console.log(`Found ${generalSuggestions?.length || 0} general recommendations`);
  
  return new Response(
    JSON.stringify(generalSuggestions || []),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// Get user's content embeddings
async function getUserContentEmbeddings(client, userId) {
  console.log(`Finding bookmarks for user ${userId}`);
  // Get recent bookmark embeddings
  const { data: bookmarkEmbeddings, error: bookmarkError } = await client
    .from('bookmarks')
    .select('embeddings')
    .eq('user_id', userId)
    .eq('status', 'processed')
    .not('embeddings', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (bookmarkError) {
    console.error('Error fetching bookmark embeddings:', bookmarkError);
    return [];
  }

  console.log(`Finding newsletters for user ${userId}`);
  // Get recent newsletter embeddings
  const { data: newsletterEmbeddings, error: newsletterError } = await client
    .from('newsletter_emails')
    .select('embeddings')
    .eq('user_id', userId)
    .not('embeddings', 'is', null)
    .order('received_at', { ascending: false })
    .limit(20);

  if (newsletterError) {
    console.error('Error fetching newsletter embeddings:', newsletterError);
    return bookmarkEmbeddings || [];
  }
  
  // Debug log the structure of the first item from each source (if available)
  if (bookmarkEmbeddings && bookmarkEmbeddings.length > 0) {
    console.log('Sample bookmark embeddings structure:', 
      typeof bookmarkEmbeddings[0].embeddings, 
      Array.isArray(bookmarkEmbeddings[0].embeddings) ? 'is array' : 'not array',
      bookmarkEmbeddings[0].embeddings ? `length: ${Array.isArray(bookmarkEmbeddings[0].embeddings) ? bookmarkEmbeddings[0].embeddings.length : 'N/A'}` : 'null/undefined'
    );
  } else {
    console.log('No bookmark embeddings found');
  }

  if (newsletterEmbeddings && newsletterEmbeddings.length > 0) {
    console.log('Sample newsletter embeddings structure:', 
      typeof newsletterEmbeddings[0].embeddings, 
      Array.isArray(newsletterEmbeddings[0].embeddings) ? 'is array' : 'not array',
      newsletterEmbeddings[0].embeddings ? `length: ${Array.isArray(newsletterEmbeddings[0].embeddings) ? newsletterEmbeddings[0].embeddings.length : 'N/A'}` : 'null/undefined'
    );
  } else {
    console.log('No newsletter embeddings found');
  }
  
  // Combine all embeddings
  const allEmbeddings = [
    ...(bookmarkEmbeddings || []),
    ...(newsletterEmbeddings || [])
  ].map(item => item.embeddings);
  
  // Parse embeddings from various formats
  const parsedEmbeddings = allEmbeddings.map(embedding => {
    // If it's a string (stringified JSON), try to parse it
    if (typeof embedding === 'string') {
      try {
        return JSON.parse(embedding);
      } catch {
        return null;
      }
    }
    
    // If it's already an array, use it directly
    if (Array.isArray(embedding)) {
      return embedding;
    }
    
    // If it has an 'embedding' property (common format)
    if (embedding && typeof embedding === 'object' && 'embedding' in embedding) {
      if (Array.isArray(embedding.embedding)) {
        return embedding.embedding;
      }
    }
    
    // If it's an object, look for array properties
    if (embedding && typeof embedding === 'object') {
      for (const key in embedding) {
        if (Array.isArray(embedding[key]) && embedding[key].length > 0) {
          return embedding[key];
        }
      }
    }
    
    return null;
  });
  
  console.log(`Parsed ${parsedEmbeddings.filter(Boolean).length} out of ${parsedEmbeddings.length} embeddings`);
  
  // Filter out any null or non-array embeddings
  const validEmbeddings = parsedEmbeddings.filter(
    (embedding) => 
      embedding !== null && 
      Array.isArray(embedding) && 
      embedding.length > 0
  );
  
  console.log(`Found ${validEmbeddings.length} valid embeddings out of ${parsedEmbeddings.length}`);
  
  return validEmbeddings;
}

// Helper function to calculate centroid of multiple embeddings
function calculateCentroid(embeddings) {
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
function findMostCommonDimension(dimensions) {
  if (!dimensions.length) return DEFAULT_EMBEDDING_DIMENSION;
  
  const counts = {};
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
function createDefaultEmbedding() {
  console.log(`Creating default embedding with ${DEFAULT_EMBEDDING_DIMENSION} dimensions`);
  // Create an embedding with DEFAULT_EMBEDDING_DIMENSION dimensions
  // with small random values between 0.0001 and 0.001
  return Array(DEFAULT_EMBEDDING_DIMENSION).fill(0).map(() => 
    0.0001 + (Math.random() * 0.0009)
  );
}