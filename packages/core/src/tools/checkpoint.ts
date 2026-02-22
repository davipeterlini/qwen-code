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
import type { Checkpoint } from '../services/gitService.js';

export interface CheckpointToolParams {
  action: 'create' | 'list' | 'restore' | 'undo' | 'redo';
  checkpoint_id?: string;
  message?: string;
}

class CheckpointToolInvocation extends BaseToolInvocation<
  CheckpointToolParams,
  ToolResult
> {
  constructor(
    private config: Config,
    params: CheckpointToolParams,
  ) {
    super(params);
  }

  getDescription(): string {
    switch (this.params.action) {
      case 'create':
        return `Create checkpoint: ${this.params.message || 'auto'}`;
      case 'list':
        return 'List all checkpoints';
      case 'restore':
        return `Restore checkpoint: ${this.params.checkpoint_id}`;
      case 'undo':
        return 'Undo to previous checkpoint';
      case 'redo':
        return 'Redo to next checkpoint';
      default:
        return 'Unknown checkpoint action';
    }
  }

  async execute(): Promise<ToolResult> {
    const gitServicePromise = this.config.getGitService();
    const gitService = await gitServicePromise;

    if (!gitService) {
      return {
        llmContent:
          'GitService not available. Checkpointing may not be enabled.',
        returnDisplay: 'GitService not available',
        error: {
          message: 'GitService not available',
          type: 'CHECKPOINT_ERROR' as unknown,
        },
      };
    }

    switch (this.params.action) {
      case 'create': {
        const hash = await gitService.createOptimizedCheckpoint(
          this.params.message,
        );
        return {
          llmContent: `Created checkpoint: ${hash.substring(0, 7)}`,
          returnDisplay: `Checkpoint created: ${hash.substring(0, 7)}`,
        };
      }

      case 'list': {
        const checkpoints: Checkpoint[] = await gitService.listCheckpoints();
        const list = checkpoints
          .map(
            (cp, i) =>
              `${i + 1}. ${cp.hash.substring(0, 7)} - ${cp.message} (${cp.timestamp.toISOString()})`,
          )
          .join('\n');
        return {
          llmContent: `Checkpoints:\n${list}`,
          returnDisplay: `${checkpoints.length} checkpoints`,
        };
      }

      case 'restore': {
        if (!this.params.checkpoint_id) {
          return {
            llmContent: 'checkpoint_id is required for restore action',
            returnDisplay: 'Missing checkpoint_id',
            error: {
              message: 'checkpoint_id is required',
              type: 'CHECKPOINT_ERROR' as unknown,
            },
          };
        }
        await gitService.restoreProjectFromSnapshot(this.params.checkpoint_id);
        return {
          llmContent: `Restored checkpoint: ${this.params.checkpoint_id}`,
          returnDisplay: 'Checkpoint restored',
        };
      }

      case 'undo': {
        const previousHash = await gitService.getPreviousCheckpoint();
        if (!previousHash) {
          return {
            llmContent: 'No previous checkpoint to undo to',
            returnDisplay: 'Cannot undo',
            error: {
              message: 'No previous checkpoint',
              type: 'CHECKPOINT_ERROR' as unknown,
            },
          };
        }
        await gitService.restoreProjectFromSnapshot(previousHash);
        return {
          llmContent: `Undone to checkpoint: ${previousHash.substring(0, 7)}`,
          returnDisplay: 'Undone',
        };
      }

      case 'redo': {
        const currentHash = await gitService.getCurrentCommitHash();
        const nextHash = await gitService.getNextCheckpoint(currentHash);
        if (!nextHash) {
          return {
            llmContent: 'No next checkpoint to redo to',
            returnDisplay: 'Cannot redo',
            error: {
              message: 'No next checkpoint',
              type: 'CHECKPOINT_ERROR' as unknown,
            },
          };
        }
        await gitService.restoreProjectFromSnapshot(nextHash);
        return {
          llmContent: `Redone to checkpoint: ${nextHash.substring(0, 7)}`,
          returnDisplay: 'Redone',
        };
      }
      default: {
        const _exhaustive: never = this.params.action;
        return _exhaustive;
      }
    }
  }
}

export class CheckpointTool extends BaseDeclarativeTool<
  CheckpointToolParams,
  ToolResult
> {
  static readonly Name = ToolNames.CHECKPOINT;

  constructor(private config: Config) {
    super(
      CheckpointTool.Name,
      ToolDisplayNames.CHECKPOINT,
      'Manage file checkpoints for undo/redo operations\n- Create checkpoints with automatic naming\n- List all available checkpoints\n- Restore specific checkpoint by ID\n- Undo to previous state (<50ms)\n- Redo to next state (<50ms)',
      Kind.Other,
      {
        properties: {
          action: {
            description: 'Action to perform',
            type: 'string',
            enum: ['create', 'list', 'restore', 'undo', 'redo'],
          },
          checkpoint_id: {
            description: 'Checkpoint ID (hash) for restore action',
            type: 'string',
          },
          message: {
            description: 'Optional message for create action',
            type: 'string',
          },
        },
        required: ['action'],
        type: 'object',
      },
    );
  }

  protected createInvocation(
    params: CheckpointToolParams,
  ): CheckpointToolInvocation {
    return new CheckpointToolInvocation(this.config, params);
  }

  protected override validateToolParamValues(
    params: CheckpointToolParams,
  ): string | null {
    if (params.action === 'restore' && !params.checkpoint_id) {
      return 'checkpoint_id is required for restore action';
    }
    return null;
  }
}
