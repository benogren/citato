import cosineSimilarity from 'compute-cosine-similarity';

export function groupSimilarTopics(data: { id: string; text: string; embedding: number[] }[], threshold = 0.8) {
  if (!data.length) {
      console.log('No data to process in groupSimilarTopics');
      return {};
  }

  console.log('Received data in groupSimilarTopics:', JSON.stringify(data, null, 2));

  const clusters: { [key: string]: { id: string; text: string; embedding: number[] }[] } = {};

  for (const item of data) {
      let matchedCluster = null;

      for (const clusterKey in clusters) {
          const clusterEmbedding = clusters[clusterKey][0].embedding;
          const similarityScore = cosineSimilarity(item.embedding, clusterEmbedding);

          if (similarityScore !== null && similarityScore > threshold) {
              matchedCluster = clusterKey;
              break;
          }
      }

      if (matchedCluster) {
          clusters[matchedCluster].push(item);
      } else {
          clusters[item.text] = [item];
      }
  }
  console.log('Grouped topics:', clusters);
  return clusters;
}