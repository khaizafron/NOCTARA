import { MemoryRecord } from '@noctara/shared';

export interface MemoryScoringWeights {
  similarity: number;
  recency: number;
  importance: number;
  confidence: number;
  verification: number;
}

export const defaultMemoryWeights: MemoryScoringWeights = {
  similarity: 0.35,
  recency: 0.15,
  importance: 0.20,
  confidence: 0.15,
  verification: 0.15
};

export function computeMemoryScore(
  record: MemoryRecord,
  similarityScore: number,
  weights: MemoryScoringWeights = defaultMemoryWeights
): number {
  // Recency score (decays over 30 days)
  const ageMs = Date.now() - new Date(record.createdAt).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const recencyScore = Math.max(0, 1 - ageMs / thirtyDaysMs);

  // Verification score
  let verScore = 0.5;
  if (record.verificationStatus === 'VERIFIED') verScore = 1.0;
  else if (record.verificationStatus === 'INFERRED') verScore = 0.6;
  else if (record.verificationStatus === 'OUTDATED' || record.verificationStatus === 'CORRECTED') verScore = 0.1;

  const total =
    similarityScore * weights.similarity +
    recencyScore * weights.recency +
    record.importance * weights.importance +
    record.confidence * weights.confidence +
    verScore * weights.verification;

  return total;
}
