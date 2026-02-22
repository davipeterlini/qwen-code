/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { LRUCache } from 'lru-cache';
import type { FileScore } from './scoring.js';
import {
  SemanticScorer,
  DependencyScorer,
  RecencyScorer,
  FrequencyScorer,
} from './scoring.js';

/**
 * Options for context pruning
 */
export interface PruningOptions {
  targetTokenCount?: number;
  weights?: {
    semantic: number;
    dependency: number;
    recency: number;
    frequency: number;
  };
  cacheSize?: number;
}

/**
 * Default weights for scoring
 */
const DEFAULT_WEIGHTS = {
  semantic: 0.4,
  dependency: 0.3,
  recency: 0.2,
  frequency: 0.1,
};

/**
 * Smart Context Pruner - Intelligent file ranking system
 */
export class SmartContextPruner {
  private semanticScorer: SemanticScorer;
  private dependencyScorer: DependencyScorer;
  private recencyScorer: RecencyScorer;
  private frequencyScorer: FrequencyScorer;
  private cache: LRUCache<string, FileScore[]>;
  private weights: typeof DEFAULT_WEIGHTS;

  constructor(options: PruningOptions = {}) {
    this.semanticScorer = new SemanticScorer();
    this.dependencyScorer = new DependencyScorer();
    this.recencyScorer = new RecencyScorer();
    this.frequencyScorer = new FrequencyScorer();
    this.weights = options.weights || DEFAULT_WEIGHTS;

    this.cache = new LRUCache<string, FileScore[]>({
      max: options.cacheSize || 100,
      ttl: 1000 * 60 * 5, // 5 minutes
    });
  }

  /**
   * Record file access for frequency tracking
   */
  recordFileAccess(file: string): void {
    this.frequencyScorer.recordAccess(file);
  }

  /**
   * Score and rank files based on relevance to query
   */
  async rankFiles(query: string, files: string[]): Promise<FileScore[]> {
    // Check cache
    const cacheKey = `${query}:${files.length}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Run scorers in parallel
    const [semanticScores, dependencyScores, recencyScores, frequencyScores] =
      await Promise.all([
        this.semanticScorer.score(query, files),
        this.dependencyScorer.score(files),
        this.recencyScorer.score(files),
        this.frequencyScorer.score(files),
      ]);

    // Combine scores
    const fileScores: FileScore[] = files.map((file) => {
      const semantic = semanticScores.get(file) || 0;
      const dependency = dependencyScores.get(file) || 0;
      const recency = recencyScores.get(file) || 0;
      const frequency = frequencyScores.get(file) || 0;

      const score =
        semantic * this.weights.semantic +
        dependency * this.weights.dependency +
        recency * this.weights.recency +
        frequency * this.weights.frequency;

      return {
        file,
        score,
        breakdown: {
          semantic,
          dependency,
          recency,
          frequency,
        },
      };
    });

    // Sort by score (highest first)
    fileScores.sort((a, b) => b.score - a.score);

    // Cache results
    this.cache.set(cacheKey, fileScores);

    return fileScores;
  }

  /**
   * Prune files to target token count
   */
  async pruneToTarget(
    query: string,
    files: string[],
    targetTokenCount: number,
  ): Promise<string[]> {
    const ranked = await this.rankFiles(query, files);

    // Estimate tokens (rough: 1 token ≈ 4 characters)
    let currentTokens = 0;
    const selected: string[] = [];

    for (const { file } of ranked) {
      try {
        const content = await import('node:fs/promises').then((fs) =>
          fs.readFile(file, 'utf-8'),
        );
        const fileTokens = Math.ceil(content.length / 4);

        if (currentTokens + fileTokens <= targetTokenCount) {
          selected.push(file);
          currentTokens += fileTokens;
        } else {
          // Target reached
          break;
        }
      } catch {
        // Skip files that can't be read
        continue;
      }
    }

    return selected;
  }

  /**
   * Get ranking explanation for a file
   */
  async explainRanking(file: string, query: string): Promise<string> {
    const ranked = await this.rankFiles(query, [file]);
    if (ranked.length === 0) {
      return 'File not found in rankings';
    }

    const score = ranked[0];
    const explanation = [
      `Score: ${(score.score * 100).toFixed(1)}%`,
      `- Semantic relevance: ${(score.breakdown.semantic * 100).toFixed(1)}%`,
      `- Dependency importance: ${(score.breakdown.dependency * 100).toFixed(1)}%`,
      `- Recency: ${(score.breakdown.recency * 100).toFixed(1)}%`,
      `- Access frequency: ${(score.breakdown.frequency * 100).toFixed(1)}%`,
    ];

    return explanation.join('\n');
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}
