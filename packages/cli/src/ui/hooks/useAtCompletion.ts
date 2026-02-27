/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useReducer, useRef } from 'react';
import type { Config, FileSearch } from '@qwen-code/qwen-code-core';
import { FileSearchFactory, escapePath } from '@qwen-code/qwen-code-core';
import type { Suggestion } from '../components/SuggestionsDisplay.js';
import { MAX_SUGGESTIONS_TO_SHOW } from '../components/SuggestionsDisplay.js';
import * as path from 'node:path';

export enum AtCompletionStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  READY = 'ready',
  SEARCHING = 'searching',
  ERROR = 'error',
}

interface AtCompletionState {
  status: AtCompletionStatus;
  suggestions: Suggestion[];
  isLoading: boolean;
  pattern: string | null;
}

type AtCompletionAction =
  | { type: 'INITIALIZE' }
  | { type: 'INITIALIZE_SUCCESS' }
  | { type: 'SEARCH'; payload: string }
  | { type: 'SEARCH_SUCCESS'; payload: Suggestion[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ERROR' }
  | { type: 'RESET' };

const initialState: AtCompletionState = {
  status: AtCompletionStatus.IDLE,
  suggestions: [],
  isLoading: false,
  pattern: null,
};

function atCompletionReducer(
  state: AtCompletionState,
  action: AtCompletionAction,
): AtCompletionState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        status: AtCompletionStatus.INITIALIZING,
        isLoading: true,
      };
    case 'INITIALIZE_SUCCESS':
      return { ...state, status: AtCompletionStatus.READY, isLoading: false };
    case 'SEARCH':
      // Keep old suggestions, don't set loading immediately
      return {
        ...state,
        status: AtCompletionStatus.SEARCHING,
        pattern: action.payload,
      };
    case 'SEARCH_SUCCESS':
      return {
        ...state,
        status: AtCompletionStatus.READY,
        suggestions: action.payload,
        isLoading: false,
      };
    case 'SET_LOADING':
      // Only show loading if we are still in a searching state
      if (state.status === AtCompletionStatus.SEARCHING) {
        return { ...state, isLoading: action.payload, suggestions: [] };
      }
      return state;
    case 'ERROR':
      return {
        ...state,
        status: AtCompletionStatus.ERROR,
        isLoading: false,
        suggestions: [],
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export interface UseAtCompletionProps {
  enabled: boolean;
  pattern: string;
  config: Config | undefined;
  cwd: string;
  setSuggestions: (suggestions: Suggestion[]) => void;
  setIsLoadingSuggestions: (isLoading: boolean) => void;
}

/**
 * Calculates a relevance score for a file path based on the search pattern.
 * Lower score = more relevant.
 */
function calculateRelevanceScore(filePath: string, pattern: string): number {
  let score = 0;
  const fileName = path.basename(filePath);
  const patternLower = pattern.toLowerCase();
  const fileNameLower = fileName.toLowerCase();
  const filePathLower = filePath.toLowerCase();

  // Exact match on filename gets highest priority
  if (fileNameLower === patternLower) {
    score -= 1000;
  }

  // Starts with pattern in filename is very relevant
  if (fileNameLower.startsWith(patternLower)) {
    score -= 500;
  }

  // Contains pattern in filename
  if (fileNameLower.includes(patternLower)) {
    score -= 200;
  }

  // Fuzzy match in filename
  if (filePathLower.includes(patternLower)) {
    score -= 100;
  }

  // Prefer files in root directory
  const depth = filePath.split(path.sep).length;
  score += depth * 10;

  // Prefer shorter paths (more likely to be what user wants)
  score += filePath.length * 0.5;

  // Bonus for common file extensions
  const ext = path.extname(filePath);
  if (
    ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yaml', '.yml'].includes(
      ext,
    )
  ) {
    score -= 50;
  }

  return score;
}

/**
 * Sorts suggestions by relevance score.
 */
function sortSuggestions(
  suggestions: Suggestion[],
  pattern: string,
): Suggestion[] {
  return suggestions.sort((a, b) => {
    const scoreA = calculateRelevanceScore(a.label, pattern);
    const scoreB = calculateRelevanceScore(b.label, pattern);
    return scoreA - scoreB;
  });
}

export function useAtCompletion(props: UseAtCompletionProps): void {
  const {
    enabled,
    pattern,
    config,
    cwd,
    setSuggestions,
    setIsLoadingSuggestions,
  } = props;
  const [state, dispatch] = useReducer(atCompletionReducer, initialState);
  const fileSearch = useRef<FileSearch | null>(null);
  const searchAbortController = useRef<AbortController | null>(null);
  const slowSearchTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSuggestions(state.suggestions);
  }, [state.suggestions, setSuggestions]);

  useEffect(() => {
    setIsLoadingSuggestions(state.isLoading);
  }, [state.isLoading, setIsLoadingSuggestions]);

  useEffect(() => {
    dispatch({ type: 'RESET' });
  }, [cwd, config]);

  // Reacts to user input (`pattern`) ONLY.
  useEffect(() => {
    if (!enabled) {
      // reset when first getting out of completion suggestions
      if (
        state.status === AtCompletionStatus.READY ||
        state.status === AtCompletionStatus.ERROR
      ) {
        dispatch({ type: 'RESET' });
      }
      return;
    }
    if (pattern === null) {
      dispatch({ type: 'RESET' });
      return;
    }

    if (state.status === AtCompletionStatus.IDLE) {
      dispatch({ type: 'INITIALIZE' });
    } else if (
      (state.status === AtCompletionStatus.READY ||
        state.status === AtCompletionStatus.SEARCHING) &&
      pattern !== state.pattern // Only search if the pattern has changed
    ) {
      dispatch({ type: 'SEARCH', payload: pattern });
    }
  }, [enabled, pattern, state.status, state.pattern]);

  // The "Worker" that performs async operations based on status.
  useEffect(() => {
    const initialize = async () => {
      try {
        const searcher = FileSearchFactory.create({
          projectRoot: cwd,
          ignoreDirs: [],
          useGitignore:
            config?.getFileFilteringOptions()?.respectGitIgnore ?? true,
          useQwenignore:
            config?.getFileFilteringOptions()?.respectQwenIgnore ?? true,
          cache: true,
          cacheTtl: 30, // 30 seconds
          enableRecursiveFileSearch:
            config?.getEnableRecursiveFileSearch() ?? true,
          // Use enableFuzzySearch with !== false to default to true when undefined.
          enableFuzzySearch:
            config?.getFileFilteringEnableFuzzySearch() !== false,
        });
        await searcher.initialize();
        fileSearch.current = searcher;
        dispatch({ type: 'INITIALIZE_SUCCESS' });
        if (state.pattern !== null) {
          dispatch({ type: 'SEARCH', payload: state.pattern });
        }
      } catch (_) {
        dispatch({ type: 'ERROR' });
      }
    };

    const search = async () => {
      if (!fileSearch.current || state.pattern === null) {
        return;
      }

      if (slowSearchTimer.current) {
        clearTimeout(slowSearchTimer.current);
      }

      const controller = new AbortController();
      searchAbortController.current = controller;

      slowSearchTimer.current = setTimeout(() => {
        dispatch({ type: 'SET_LOADING', payload: true });
      }, 200);

      try {
        const results = await fileSearch.current.search(state.pattern, {
          signal: controller.signal,
          maxResults: MAX_SUGGESTIONS_TO_SHOW * 3,
        });

        if (slowSearchTimer.current) {
          clearTimeout(slowSearchTimer.current);
        }

        if (controller.signal.aborted) {
          return;
        }

        // Enhanced suggestions with relevance scoring
        const suggestions = results
          .map((p) => {
            const relativePath = path.relative(cwd, path.join(cwd, p));
            return {
              label: relativePath,
              value: escapePath(relativePath),
              description: path.basename(p), // Show filename as description
            };
          })
          .slice(0, MAX_SUGGESTIONS_TO_SHOW);

        // Sort by relevance for better UX
        const sortedSuggestions = sortSuggestions(suggestions, state.pattern);

        dispatch({ type: 'SEARCH_SUCCESS', payload: sortedSuggestions });
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          dispatch({ type: 'ERROR' });
        }
      }
    };

    if (state.status === AtCompletionStatus.INITIALIZING) {
      initialize();
    } else if (state.status === AtCompletionStatus.SEARCHING) {
      search();
    }

    return () => {
      searchAbortController.current?.abort();
      if (slowSearchTimer.current) {
        clearTimeout(slowSearchTimer.current);
      }
    };
  }, [state.status, state.pattern, config, cwd]);
}
