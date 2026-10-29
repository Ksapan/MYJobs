/**
 * Vector Semantic Similarity & Cosine Distance Utility
 * Provides deterministic vector embeddings and cosine similarity
 * without requiring external heavy Python microservices or paid vector DBs.
 */

// Common IT domain keywords for high-dimensional feature projection
const VECTOR_VOCABULARY = [
  'frontend', 'backend', 'fullstack', 'database', 'cloud', 'devops',
  'api', 'microservices', 'react', 'node', 'express', 'mongodb', 'sql',
  'redis', 'docker', 'kubernetes', 'aws', 'ci/cd', 'git', 'testing',
  'security', 'performance', 'scalability', 'architecture', 'mobile',
  'analytics', 'distributed', 'messaging', 'queue', 'kafka', 'graphql'
];

/**
 * Generate a deterministic normalized term-frequency feature vector for any text
 */
export function getSemanticEmbedding(text = '') {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);
  const tokenFreq = {};

  tokens.forEach((t) => {
    tokenFreq[t] = (tokenFreq[t] || 0) + 1;
  });

  // Project onto vector vocabulary space
  const vector = VECTOR_VOCABULARY.map((term) => {
    let weight = tokenFreq[term] || 0;
    // Partial substring match boost
    tokens.forEach((t) => {
      if (t !== term && (t.includes(term) || term.includes(t))) {
        weight += 0.5;
      }
    });
    return weight;
  });

  // Calculate Euclidean norm
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;

  // Unit normalize vector
  return vector.map((val) => val / magnitude);
}

/**
 * Calculate Cosine Similarity between two semantic vectors (-1 to 1)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, dotProduct);
}

/**
 * Deduplicate bullet points using fuzzy word-overlap and exact normalized strings
 */
export function deduplicateBullets(bullets = []) {
  const uniqueList = [];
  const seenNorm = new Set();

  bullets.forEach((bullet) => {
    if (!bullet || typeof bullet !== 'string') return;
    const trimmed = bullet.trim();
    if (trimmed.length < 15) return; // skip tiny fragments

    const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenNorm.has(normalized)) return;

    // Check high token overlap with already accepted bullets
    const tokens = new Set(trimmed.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const isDuplicate = uniqueList.some((existing) => {
      const existingTokens = new Set(existing.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
      let intersection = 0;
      tokens.forEach((t) => {
        if (existingTokens.has(t)) intersection++;
      });
      const overlapRatio = intersection / Math.min(tokens.size, existingTokens.size);
      return overlapRatio > 0.85; // 85% overlap is treated as duplicate
    });

    if (!isDuplicate) {
      seenNorm.add(normalized);
      uniqueList.push(trimmed);
    }
  });

  return uniqueList;
}

