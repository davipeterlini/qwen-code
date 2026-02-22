/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'node:path';
import type { SimpleGit } from 'simple-git';
import { simpleGit } from 'simple-git';
import type { Storage } from '../config/storage.js';

/**
 * Git context information for awareness
 */
export interface GitContext {
  branch: string;
  status: {
    modified: string[];
    added: string[];
    deleted: string[];
    renamed: string[];
    conflicted: string[];
  };
  hasConflicts: boolean;
  uncommittedChanges: number;
  lastCommit?: {
    hash: string;
    message: string;
    author: string;
    date: Date;
  };
}

/**
 * Conventional commit types
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const COMMIT_TYPES = {
  feat: 'New feature',
  fix: 'Bug fix',
  docs: 'Documentation changes',
  style: 'Code style changes (formatting, no code change)',
  refactor: 'Code refactoring',
  perf: 'Performance improvement',
  test: 'Test changes',
  build: 'Build system changes',
  ci: 'CI/CD changes',
  chore: 'Other changes (no production code change)',
} as const;

/**
 * Service for automatic git context detection and smart commit message generation
 */
export class GitAwarenessService {
  private projectRoot: string;
  private contextCache: GitContext | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 100; // <100ms cached operations

  constructor(projectRoot: string, _storage: Storage) {
    this.projectRoot = path.resolve(projectRoot);
  }

  private get git(): SimpleGit {
    return simpleGit(this.projectRoot);
  }

  /**
   * Get current git context with caching for <100ms performance
   */
  async getContext(): Promise<GitContext> {
    const now = Date.now();
    if (this.contextCache && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.contextCache;
    }

    try {
      const [branch, status, log] = await Promise.all([
        this.git.revparse(['--abbrev-ref', 'HEAD']),
        this.git.status(),
        this.git.log({ maxCount: 1 }),
      ]);

      const context: GitContext = {
        branch: branch.trim(),
        status: {
          modified: status.modified,
          added: status.created,
          deleted: status.deleted,
          renamed: status.renamed.map((r) => r.to),
          conflicted: status.conflicted,
        },
        hasConflicts: status.conflicted.length > 0,
        uncommittedChanges:
          status.modified.length +
          status.created.length +
          status.deleted.length +
          status.renamed.length,
        lastCommit: log.latest
          ? {
              hash: log.latest.hash,
              message: log.latest.message,
              author: log.latest.author_name,
              date: new Date(log.latest.date),
            }
          : undefined,
      };

      this.contextCache = context;
      this.cacheTimestamp = now;
      return context;
    } catch (error) {
      throw new Error(
        `Failed to get git context: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Detect conflicts in the repository
   */
  async detectConflicts(): Promise<string[]> {
    const context = await this.getContext();
    return context.status.conflicted;
  }

  /**
   * Analyze file changes to determine commit type
   */
  private analyzeCommitType(files: string[]): keyof typeof COMMIT_TYPES | null {
    // Check for test files
    if (files.some((f) => /test|spec/.test(f))) {
      return 'test';
    }

    // Check for documentation
    if (
      files.some(
        (f) => /\.md$|docs?\/|README/.test(f) && !/package\.json/.test(f),
      )
    ) {
      return 'docs';
    }

    // Check for CI/CD files
    if (
      files.some(
        (f) =>
          /\.github\/|\.gitlab-ci|jenkins|circleci|travis/.test(f) ||
          /\.yml$|\.yaml$/.test(f),
      )
    ) {
      return 'ci';
    }

    // Check for build files
    if (
      files.some((f) =>
        /package\.json|tsconfig|webpack|vite|rollup|esbuild/.test(f),
      )
    ) {
      return 'build';
    }

    // Check for style-only changes (css, styling)
    if (
      files.every((f) => /\.css$|\.scss$|\.less$|\.styl/.test(f)) &&
      files.length > 0
    ) {
      return 'style';
    }

    // Default to null, requiring file content analysis
    return null;
  }

  /**
   * Analyze file content to determine if it's a feature or fix
   */
  private async analyzeFileContent(
    file: string,
  ): Promise<'feat' | 'fix' | 'refactor' | null> {
    try {
      const diff = await this.git.diff(['HEAD', '--', file]);

      // Check for new functionality keywords
      if (
        /\+.*\b(new|create|add|implement|introduce)\b/i.test(diff) ||
        /\+\s*(?:export\s+)?(?:function|class|interface|type|const)\s+\w+/i.test(
          diff,
        )
      ) {
        return 'feat';
      }

      // Check for bug fix keywords
      if (/\+.*\b(fix|bug|issue|error|patch|resolve)\b/i.test(diff)) {
        return 'fix';
      }

      // Check for refactoring
      if (
        /\+.*\b(refactor|restructure|reorganize|improve|optimize)\b/i.test(diff)
      ) {
        return 'refactor';
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Generate smart commit message using conventional commits format
   */
  async suggestCommitMessage(): Promise<string> {
    try {
      const context = await this.getContext();
      const changedFiles = [
        ...context.status.modified,
        ...context.status.added,
        ...context.status.deleted,
        ...context.status.renamed,
      ];

      if (changedFiles.length === 0) {
        return 'chore: update files';
      }

      // Analyze file patterns first
      let commitType = this.analyzeCommitType(changedFiles);

      // If no clear type from files, analyze content
      if (!commitType && changedFiles.length > 0) {
        // Analyze first few files for content
        const contentAnalysis = await Promise.all(
          changedFiles.slice(0, 3).map((file) => this.analyzeFileContent(file)),
        );

        // Use most common type
        const types = contentAnalysis.filter(Boolean) as string[];
        if (types.length > 0) {
          commitType = types[0] as keyof typeof COMMIT_TYPES;
        }
      }

      // Default to chore if still no type
      if (!commitType) {
        commitType = 'chore';
      }

      // Generate scope and description
      const scope = this.inferScope(changedFiles);
      const description = this.generateDescription(
        commitType,
        changedFiles,
        context,
      );

      // Format: type(scope): description
      if (scope) {
        return `${commitType}(${scope}): ${description}`;
      }
      return `${commitType}: ${description}`;
    } catch (error) {
      throw new Error(
        `Failed to suggest commit message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Infer scope from changed files
   */
  private inferScope(files: string[]): string | null {
    if (files.length === 0) return null;

    // Try to find common directory
    const dirs = files.map((f) => {
      const dir = path.dirname(f);
      // Get first meaningful directory
      const parts = dir.split(path.sep).filter((p) => p && p !== '.');
      return parts[0] || null;
    });

    // Find most common directory
    const dirCounts = dirs.reduce(
      (acc, dir) => {
        if (dir) {
          acc[dir] = (acc[dir] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const entries = Object.entries(dirCounts);
    if (entries.length === 0) return null;

    // If majority of files in same dir, use it as scope
    const [commonDir, count] = entries.sort((a, b) => b[1] - a[1])[0];
    if (count >= files.length / 2) {
      return commonDir;
    }

    return null;
  }

  /**
   * Generate commit description
   */
  private generateDescription(
    type: keyof typeof COMMIT_TYPES,
    files: string[],
    context: GitContext,
  ): string {
    if (files.length === 1) {
      const filename = path.basename(files[0]);
      const action = context.status.deleted.includes(files[0])
        ? 'remove'
        : context.status.added.includes(files[0])
          ? 'add'
          : 'update';
      return `${action} ${filename}`;
    }

    if (files.length <= 3) {
      const names = files.map((f) => path.basename(f)).join(', ');
      return `update ${names}`;
    }

    // Multiple files - use generic description
    const fileTypes = [...new Set(files.map((f) => path.extname(f)))];
    if (fileTypes.length === 1 && fileTypes[0]) {
      return `update ${files.length} ${fileTypes[0]} files`;
    }

    return `update ${files.length} files`;
  }

  /**
   * Invalidate context cache (call after git operations)
   */
  invalidateCache(): void {
    this.contextCache = null;
    this.cacheTimestamp = 0;
  }
}
