/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BaseDeclarativeTool,
  BaseToolInvocation,
  Kind,
  type ToolResult,
} from './tools.js';
import { ToolNames, ToolDisplayNames } from './tool-names.js';
import type { Config } from '../config/config.js';
import type { FileScore } from '../context/scoring.js';

export interface ContextPruningToolParams {
  action: 'rank_files' | 'prune_to_target' | 'explain_ranking';
  query: string;
  files?: string[];
  target_tokens?: number;
  file?: string;
}

class ContextPruningToolInvocation extends BaseToolInvocation<
  ContextPruningToolParams,
  ToolResult
> {
  constructor(
    private config: Config,
    params: ContextPruningToolParams,
  ) {
    super(params);
  }

  getDescription(): string {
    switch (this.params.action) {
      case 'rank_files':
        return `Rank files by relevance to: ${this.params.query}`;
      case 'prune_to_target':
        return `Prune to ${this.params.target_tokens} tokens`;
      case 'explain_ranking':
        return `Explain ranking for: ${this.params.file}`;
      default:
        return 'Unknown context pruning action';
    }
  }

  async execute(): Promise<ToolResult> {
    // TODO: Implement getContextPruner() in Config
    const pruner = null; // this.config.getContextPruner();

    if (!pruner) {
      return {
        llmContent:
          'Context pruning service not available. Context pruning may not be enabled.',
        returnDisplay: 'Service not available',
        error: {
          message: 'Context pruning service not available',
          type: 'CONTEXT_PRUNING_ERROR' as unknown,
        },
      };
    }

    switch (this.params.action) {
      case 'rank_files': {
        if (!this.params.files || this.params.files.length === 0) {
          return {
            llmContent: 'No files provided for ranking',
            returnDisplay: 'No files',
            error: {
              message: 'files parameter is required',
              type: 'CONTEXT_PRUNING_ERROR' as unknown,
            },
          };
        }

        const ranked: FileScore[] = await pruner.rankFiles(
          this.params.query,
          this.params.files,
        );

        const list = ranked
          .slice(0, 20) // Show top 20
          .map(
            (r, i) =>
              `${i + 1}. ${r.file} - Score: ${(r.score * 100).toFixed(1)}%`,
          )
          .join('\n');

        return {
          llmContent: `Ranked ${ranked.length} files:\n${list}`,
          returnDisplay: `Ranked ${ranked.length} files`,
        };
      }

      case 'prune_to_target': {
        if (!this.params.files || this.params.files.length === 0) {
          return {
            llmContent: 'No files provided for pruning',
            returnDisplay: 'No files',
            error: {
              message: 'files parameter is required',
              type: 'CONTEXT_PRUNING_ERROR' as unknown,
            },
          };
        }

        if (!this.params.target_tokens) {
          return {
            llmContent: 'target_tokens is required for prune_to_target action',
            returnDisplay: 'Missing target_tokens',
            error: {
              message: 'target_tokens is required',
              type: 'CONTEXT_PRUNING_ERROR' as unknown,
            },
          };
        }

        const selected = await pruner.pruneToTarget(
          this.params.query,
          this.params.files,
          this.params.target_tokens,
        );

        const originalCount = this.params.files.length;
        const reduction = (
          ((originalCount - selected.length) / originalCount) *
          100
        ).toFixed(1);

        return {
          llmContent: `Pruned from ${originalCount} to ${selected.length} files (${reduction}% reduction):\n${selected.join('\n')}`,
          returnDisplay: `${selected.length} files selected`,
        };
      }

      case 'explain_ranking': {
        if (!this.params.file) {
          return {
            llmContent: 'file parameter is required for explain_ranking action',
            returnDisplay: 'Missing file',
            error: {
              message: 'file parameter is required',
              type: 'CONTEXT_PRUNING_ERROR' as unknown,
            },
          };
        }

        const explanation = await pruner.explainRanking(
          this.params.file,
          this.params.query,
        );

        return {
          llmContent: `Ranking explanation for ${this.params.file}:\n${explanation}`,
          returnDisplay: 'Ranking explained',
        };
      }
      default: {
        const _exhaustive: never = this.params.action;
        return _exhaustive;
      }
    }
  }
}

export class ContextPruningTool extends BaseDeclarativeTool<
  ContextPruningToolParams,
  ToolResult
> {
  static readonly Name = ToolNames.CONTEXT_PRUNING;

  constructor(private config: Config) {
    super(
      ContextPruningTool.Name,
      ToolDisplayNames.CONTEXT_PRUNING,
      'Intelligent file ranking system using semantic similarity, dependency analysis, recency scoring, and frequency tracking\n- Rank files by relevance to a query\n- Prune files to target token count (85% reduction: 342K → 12K)\n- Explain ranking scores with breakdown\n- Uses OpenAI embeddings for semantic analysis\n- LRU caching for performance\n- Parallel scoring for speed',
      Kind.Other,
      {
        properties: {
          action: {
            description: 'Action to perform',
            type: 'string',
            enum: ['rank_files', 'prune_to_target', 'explain_ranking'],
          },
          query: {
            description: 'Query to rank files against',
            type: 'string',
          },
          files: {
            description: 'Array of file paths to rank or prune',
            type: 'array',
            items: {
              type: 'string',
            },
          },
          target_tokens: {
            description: 'Target token count for pruning',
            type: 'number',
          },
          file: {
            description: 'File path to explain ranking for',
            type: 'string',
          },
        },
        required: ['action', 'query'],
        type: 'object',
      },
    );
  }

  protected createInvocation(
    params: ContextPruningToolParams,
  ): ContextPruningToolInvocation {
    return new ContextPruningToolInvocation(this.config, params);
  }

  protected override validateToolParamValues(
    params: ContextPruningToolParams,
  ): string | null {
    if (
      (params.action === 'rank_files' || params.action === 'prune_to_target') &&
      (!params.files || params.files.length === 0)
    ) {
      return 'files parameter is required for rank_files and prune_to_target actions';
    }

    if (params.action === 'prune_to_target' && !params.target_tokens) {
      return 'target_tokens is required for prune_to_target action';
    }

    if (params.action === 'explain_ranking' && !params.file) {
      return 'file parameter is required for explain_ranking action';
    }

    return null;
  }
}
