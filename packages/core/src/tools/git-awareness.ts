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
import type { GitContext } from '../services/gitAwarenessService.js';

export interface GitAwarenessToolParams {
  action: 'get_context' | 'suggest_commit' | 'detect_conflicts';
}

class GitAwarenessToolInvocation extends BaseToolInvocation<
  GitAwarenessToolParams,
  ToolResult
> {
  constructor(
    private config: Config,
    params: GitAwarenessToolParams,
  ) {
    super(params);
  }

  getDescription(): string {
    switch (this.params.action) {
      case 'get_context':
        return 'Get current git context';
      case 'suggest_commit':
        return 'Suggest commit message';
      case 'detect_conflicts':
        return 'Detect git conflicts';
      default:
        return 'Unknown git awareness action';
    }
  }

  async execute(): Promise<ToolResult> {
    // TODO: Implement getGitAwarenessService() in Config
    const gitAwarenessService = null; // this.config.getGitAwarenessService();

    if (!gitAwarenessService) {
      return {
        llmContent:
          'GitAwarenessService not available. Git awareness may not be enabled.',
        returnDisplay: 'GitAwarenessService not available',
        error: {
          message: 'GitAwarenessService not available',
          type: 'GIT_AWARENESS_ERROR' as unknown,
        },
      };
    }

    switch (this.params.action) {
      case 'get_context': {
        const context: GitContext = await gitAwarenessService.getContext();
        const summary = [
          `Branch: ${context.branch}`,
          `Uncommitted changes: ${context.uncommittedChanges}`,
          `Modified: ${context.status.modified.length}`,
          `Added: ${context.status.added.length}`,
          `Deleted: ${context.status.deleted.length}`,
          `Conflicts: ${context.status.conflicted.length}`,
        ];

        if (context.lastCommit) {
          summary.push(
            `Last commit: ${context.lastCommit.hash.substring(0, 7)} - ${context.lastCommit.message}`,
          );
        }

        return {
          llmContent: `Git Context:\n${summary.join('\n')}`,
          returnDisplay: `${context.branch} - ${context.uncommittedChanges} changes`,
        };
      }

      case 'suggest_commit': {
        const message = await gitAwarenessService.suggestCommitMessage();
        return {
          llmContent: `Suggested commit message:\n${message}`,
          returnDisplay: 'Commit message suggested',
        };
      }

      case 'detect_conflicts': {
        const conflicts = await gitAwarenessService.detectConflicts();
        if (conflicts.length === 0) {
          return {
            llmContent: 'No conflicts detected',
            returnDisplay: 'No conflicts',
          };
        }

        const list = conflicts
          .map((file: string, i: number) => `${i + 1}. ${file}`)
          .join('\n');
        return {
          llmContent: `Conflicts detected in ${conflicts.length} files:\n${list}`,
          returnDisplay: `${conflicts.length} conflicts`,
        };
      }
      default: {
        const _exhaustive: never = this.params.action;
        return _exhaustive;
      }
    }
  }
}

export class GitAwarenessTool extends BaseDeclarativeTool<
  GitAwarenessToolParams,
  ToolResult
> {
  static readonly Name = ToolNames.GIT_AWARENESS;

  constructor(private config: Config) {
    super(
      GitAwarenessTool.Name,
      ToolDisplayNames.GIT_AWARENESS,
      'Automatic git context detection and smart commit messages\n- Get current git status and context (<100ms cached)\n- Suggest conventional commit messages based on changes\n- Detect merge conflicts automatically\n- Track uncommitted changes and branch information',
      Kind.Other,
      {
        properties: {
          action: {
            description: 'Action to perform',
            type: 'string',
            enum: ['get_context', 'suggest_commit', 'detect_conflicts'],
          },
        },
        required: ['action'],
        type: 'object',
      },
    );
  }

  protected createInvocation(
    params: GitAwarenessToolParams,
  ): GitAwarenessToolInvocation {
    return new GitAwarenessToolInvocation(this.config, params);
  }

  protected override validateToolParamValues(
    _params: GitAwarenessToolParams,
  ): string | null {
    return null;
  }
}
