import {
  MemoryRecord,
  MemoryRetrievalQuery,
  MemoryType,
  MemoryLayer,
  VerificationStatus
} from '@noctara/shared';
import { computeMemoryScore } from './scoring.js';

export class MemoryEngine {
  private records: Map<string, MemoryRecord> = new Map();

  constructor() {
    this.seedBaselineIdentity();
  }

  private seedBaselineIdentity(): void {
    const rootIdentity: MemoryRecord = {
      id: 'mem_root_identity_001',
      scope: 'root',
      layer: 'identity',
      type: 'FACT',
      content: 'Owner is Khai (Root). Sole owner and human operator of NOCTARA with absolute system authority.',
      sourceType: 'owner_statement',
      confidence: 1.0,
      importance: 1.0,
      verificationStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const noxIdentity: MemoryRecord = {
      id: 'mem_nox_identity_001',
      scope: 'nox',
      layer: 'identity',
      type: 'FACT',
      content: 'NOX is the primary autonomous execution entity. Direct, skeptical, technical operator, and system builder.',
      sourceType: 'owner_statement',
      confidence: 1.0,
      importance: 0.95,
      verificationStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const ariaIdentity: MemoryRecord = {
      id: 'mem_aria_identity_001',
      scope: 'aria',
      layer: 'identity',
      type: 'FACT',
      content: 'ARIA is the companion intelligence, reflective strategist, context keeper, and research counterpart.',
      sourceType: 'owner_statement',
      confidence: 1.0,
      importance: 0.95,
      verificationStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.records.set(rootIdentity.id, rootIdentity);
    this.records.set(noxIdentity.id, noxIdentity);
    this.records.set(ariaIdentity.id, ariaIdentity);
  }

  public async createMemory(params: {
    scope: MemoryRecord['scope'];
    layer: MemoryLayer;
    type: MemoryType;
    content: string;
    sourceType: MemoryRecord['sourceType'];
    sourceRef?: string;
    confidence?: number;
    importance?: number;
    verificationStatus?: VerificationStatus;
  }): Promise<MemoryRecord> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record: MemoryRecord = {
      id,
      scope: params.scope,
      layer: params.layer,
      type: params.type,
      content: params.content,
      sourceType: params.sourceType,
      sourceRef: params.sourceRef,
      confidence: params.confidence ?? (params.type === 'FACT' ? 0.9 : 0.7),
      importance: params.importance ?? 0.8,
      verificationStatus: params.verificationStatus ?? (params.type === 'FACT' ? 'VERIFIED' : 'INFERRED'),
      createdAt: now,
      updatedAt: now
    };

    this.records.set(id, record);
    return record;
  }

  public async correctMemory(
    oldMemoryId: string,
    correctedContent: string,
    reason?: string
  ): Promise<MemoryRecord> {
    const old = this.records.get(oldMemoryId);
    if (!old) {
      throw new Error(`Memory with ID '${oldMemoryId}' does not exist.`);
    }

    const now = new Date().toISOString();
    old.verificationStatus = 'CORRECTED';
    old.updatedAt = now;

    const newRecord: MemoryRecord = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      scope: old.scope,
      layer: old.layer,
      type: old.type,
      content: correctedContent,
      sourceType: 'owner_statement',
      sourceRef: reason ? `Correction reason: ${reason}` : old.id,
      confidence: 1.0,
      importance: old.importance,
      verificationStatus: 'VERIFIED',
      createdAt: now,
      updatedAt: now,
      supersedesId: old.id
    };

    this.records.set(newRecord.id, newRecord);
    return newRecord;
  }

  public async retrieve(query: MemoryRetrievalQuery): Promise<MemoryRecord[]> {
    const queryTokens = query.query.toLowerCase().split(/\s+/).filter(Boolean);
    const results: { record: MemoryRecord; score: number }[] = [];

    for (const record of this.records.values()) {
      if (record.verificationStatus === 'CORRECTED' || record.verificationStatus === 'OUTDATED') {
        continue;
      }

      if (query.scope && !query.scope.includes(record.scope)) continue;
      if (query.layers && !query.layers.includes(record.layer)) continue;
      if (query.types && !query.types.includes(record.type)) continue;

      const contentLower = record.content.toLowerCase();
      let matches = 0;
      for (const token of queryTokens) {
        if (contentLower.includes(token)) matches++;
      }
      const simScore = queryTokens.length > 0 ? matches / queryTokens.length : 0.5;

      const totalScore = computeMemoryScore(record, simScore);
      if (totalScore > (query.minConfidence ?? 0.3)) {
        results.push({ record, score: totalScore });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, query.limit ?? 5).map((r) => r.record);
  }

  public getAllMemories(): MemoryRecord[] {
    return Array.from(this.records.values());
  }
}

export const globalMemoryEngine = new MemoryEngine();
