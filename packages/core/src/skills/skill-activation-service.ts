/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SkillConfig, SkillTrigger } from './types.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('SKILL_ACTIVATION');

/**
 * Match result for skill activation
 */
export interface SkillMatchResult {
  /** The matched skill */
  skill: SkillConfig;

  /** Match score (0-1) */
  score: number;

  /** Which trigger matched */
  matchedTrigger: SkillTrigger;

  /** Whether this is an auto-activate match */
  autoActivate: boolean;
}

/**
 * Service for auto-activating skills based on context
 */
export class SkillActivationService {
  /**
   * Find skills that should be auto-activated based on user input
   */
  findMatchingSkills(
    skills: SkillConfig[],
    userInput: string,
    options?: {
      /** Minimum score threshold (default: 0.3) */
      threshold?: number;
      /** Maximum number of skills to return */
      maxResults?: number;
    },
  ): SkillMatchResult[] {
    const threshold = options?.threshold ?? 0.3;
    const maxResults = options?.maxResults ?? 5;

    const results: SkillMatchResult[] = [];

    for (const skill of skills) {
      if (!skill.triggers || skill.triggers.length === 0) {
        continue;
      }

      for (const trigger of skill.triggers) {
        const matchResult = this.matchTrigger(trigger, userInput);

        if (matchResult.score >= threshold) {
          results.push({
            skill,
            score: matchResult.score,
            matchedTrigger: trigger,
            autoActivate: trigger.autoActivate ?? false,
          });
          break; // Only count each skill once
        }
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Return top results
    return results.slice(0, maxResults);
  }

  /**
   * Match a trigger against user input
   */
  private matchTrigger(
    trigger: SkillTrigger,
    userInput: string,
  ): { score: number } {
    const userInputLower = userInput.toLowerCase();
    let maxScore = 0;

    // Check keywords
    if (trigger.keywords && trigger.keywords.length > 0) {
      const keywordScore = this.calculateKeywordScore(
        trigger.keywords,
        userInputLower,
      );
      maxScore = Math.max(maxScore, keywordScore);
    }

    // Check regex patterns
    if (trigger.patterns && trigger.patterns.length > 0) {
      const patternScore = this.calculatePatternScore(
        trigger.patterns,
        userInput,
      );
      maxScore = Math.max(maxScore, patternScore);
    }

    // Apply threshold if specified
    if (trigger.threshold !== undefined) {
      if (maxScore < trigger.threshold) {
        maxScore = 0;
      }
    }

    return { score: maxScore };
  }

  /**
   * Calculate score based on keyword matching
   */
  private calculateKeywordScore(keywords: string[], userInput: string): number {
    if (keywords.length === 0) return 0;

    let matchCount = 0;
    let totalWeight = 0;

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      const weight = this.getKeywordWeight(keyword);

      // Exact match gets highest score
      if (userInput === keywordLower) {
        matchCount += 2; // Boost for exact match
      } else if (userInput.includes(keywordLower)) {
        matchCount += 1;
      }

      // Check for word boundary matches
      const wordBoundaryRegex = new RegExp(
        `\\b${this.escapeRegex(keywordLower)}\\b`,
        'i',
      );
      if (wordBoundaryRegex.test(userInput)) {
        matchCount += 0.5;
      }

      totalWeight += weight;
    }

    // Normalize score to 0-1 range
    const baseScore = matchCount / (keywords.length * 2);
    const weightedScore = baseScore * Math.min(totalWeight, 1);

    return Math.min(weightedScore, 1);
  }

  /**
   * Calculate score based on regex pattern matching
   */
  private calculatePatternScore(patterns: string[], userInput: string): number {
    if (patterns.length === 0) return 0;

    let matchCount = 0;

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(userInput)) {
          matchCount += 1;
        }
      } catch (error) {
        debugLogger.warn(`Invalid regex pattern: ${pattern}`, error);
      }
    }

    return matchCount / patterns.length;
  }

  /**
   * Get weight for a keyword based on specificity
   */
  private getKeywordWeight(keyword: string): number {
    // Longer keywords are more specific
    if (keyword.length > 10) return 1.5;
    if (keyword.length > 5) return 1.2;
    return 1.0;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get auto-activation suggestion message
   */
  buildActivationMessage(matches: SkillMatchResult[]): string {
    if (matches.length === 0) return '';

    const autoActivateSkills = matches.filter((m) => m.autoActivate);
    const suggestedSkills = matches.filter((m) => !m.autoActivate);

    const parts: string[] = [];

    if (autoActivateSkills.length > 0) {
      const names = autoActivateSkills.map((m) => m.skill.name).join(', ');
      parts.push(`Auto-activating skills: ${names}`);
    }

    if (suggestedSkills.length > 0) {
      const names = suggestedSkills
        .map((m) => `${m.skill.name} (${Math.round(m.score * 100)}% match)`)
        .join(', ');
      parts.push(`Suggested skills: ${names}`);
    }

    return parts.join('\n');
  }

  /**
   * Build context to prepend when a skill is auto-activated
   */
  buildSkillContext(skill: SkillConfig): string {
    return `
<skill name="${skill.name}">
<description>${skill.description}</description>
<instructions>
${skill.body}
</instructions>
</skill>
`.trim();
  }
}
