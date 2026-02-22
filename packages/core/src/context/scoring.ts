/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import OpenAI from 'openai';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * File score result
 */
export interface FileScore {
  file: string;
  score: number;
  breakdown: {
    semantic: number;
    dependency: number;
    recency: number;
    frequency: number;
  };
}

/**
 * Semantic similarity scorer using OpenAI embeddings
 */
export class SemanticScorer {
  private openai: OpenAI;
  private cache: Map<string, number[]> = new Map();

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env['OPENAI_API_KEY'],
    });
  }

  /**
   * Get embedding for text
   */
  private async getEmbedding(text: string): Promise<number[]> {
    const cacheKey = text.substring(0, 100);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    const embedding = response.data[0].embedding;
    this.cache.set(cacheKey, embedding);
    return embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Score file based on semantic similarity to query
   */
  async score(query: string, files: string[]): Promise<Map<string, number>> {
    const scores = new Map<string, number>();

    try {
      const queryEmbedding = await this.getEmbedding(query);

      await Promise.all(
        files.map(async (file) => {
          try {
            const content = await fs.readFile(file, 'utf-8');
            // Use first 1000 chars for performance
            const snippet = content.substring(0, 1000);
            const fileEmbedding = await this.getEmbedding(snippet);
            const similarity = this.cosineSimilarity(
              queryEmbedding,
              fileEmbedding,
            );
            scores.set(file, similarity);
          } catch {
            scores.set(file, 0);
          }
        }),
      );
    } catch (_error) {
      // If embeddings fail, return zero scores
      files.forEach((file) => scores.set(file, 0));
    }

    return scores;
  }
}

/**
 * Dependency analyzer using basic import/require detection
 */
export class DependencyScorer {
  /**
   * Extract imports from file content
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];

    // ES6 imports: import ... from '...'
    const es6Imports = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
    for (const match of es6Imports) {
      imports.push(match[1]);
    }

    // CommonJS require: require('...')
    const cjsRequires = content.matchAll(
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    );
    for (const match of cjsRequires) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Score files based on dependency relationships
   */
  async score(files: string[]): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    const dependencyCounts = new Map<string, number>();

    // Build dependency graph
    await Promise.all(
      files.map(async (file) => {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const imports = this.extractImports(content);

          for (const imp of imports) {
            // Resolve relative imports to absolute paths
            if (imp.startsWith('.')) {
              const resolvedPath = path.resolve(path.dirname(file), imp);
              const count = dependencyCounts.get(resolvedPath) || 0;
              dependencyCounts.set(resolvedPath, count + 1);
            }
          }
        } catch {
          // Ignore errors
        }
      }),
    );

    // Normalize scores
    const maxCount = Math.max(...Array.from(dependencyCounts.values()), 1);
    for (const file of files) {
      const count = dependencyCounts.get(file) || 0;
      scores.set(file, count / maxCount);
    }

    return scores;
  }
}

/**
 * Recency scorer based on file modification time
 */
export class RecencyScorer {
  /**
   * Score files based on modification recency
   */
  async score(files: string[]): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    const timestamps: number[] = [];

    // Get modification times
    await Promise.all(
      files.map(async (file) => {
        try {
          const stats = await fs.stat(file);
          timestamps.push(stats.mtimeMs);
        } catch {
          timestamps.push(0);
        }
      }),
    );

    // Normalize scores (newer = higher score)
    const maxTime = Math.max(...timestamps, 1);
    const minTime = Math.min(...timestamps);
    const range = maxTime - minTime || 1;

    files.forEach((file, i) => {
      const score = (timestamps[i] - minTime) / range;
      scores.set(file, score);
    });

    return scores;
  }
}

/**
 * Frequency scorer based on file access patterns
 */
export class FrequencyScorer {
  private accessLog: Map<string, number> = new Map();

  /**
   * Record file access
   */
  recordAccess(file: string): void {
    const count = this.accessLog.get(file) || 0;
    this.accessLog.set(file, count + 1);
  }

  /**
   * Score files based on access frequency
   */
  async score(files: string[]): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    const maxCount = Math.max(
      ...files.map((f) => this.accessLog.get(f) || 0),
      1,
    );

    for (const file of files) {
      const count = this.accessLog.get(file) || 0;
      scores.set(file, count / maxCount);
    }

    return scores;
  }
}
