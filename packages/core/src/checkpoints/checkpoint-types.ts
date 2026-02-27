/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Checkpoint data structure
 */
export interface Checkpoint {
  /** Unique checkpoint ID */
  id: string;

  /** Timestamp when checkpoint was created */
  timestamp: number;

  /** Human-readable label */
  label?: string;

  /** Session ID this checkpoint belongs to */
  sessionId: string;

  /** Message ID in conversation */
  messageId: number;

  /** File system changes captured */
  fileChanges: FileChange[];

  /** Git state (if available) */
  gitState?: GitState;

  /** Conversation summary at this point */
  conversationSummary?: string;

  /** Metadata */
  metadata: CheckpointMetadata;
}

/**
 * File change record
 */
export interface FileChange {
  /** Absolute file path */
  path: string;

  /** Type of change */
  changeType: 'created' | 'modified' | 'deleted';

  /** Original content (for modified/deleted) */
  originalContent?: string;

  /** New content (for created/modified) */
  newContent?: string;

  /** File size in bytes */
  size: number;

  /** File hash for quick comparison */
  hash: string;
}

/**
 * Git state at checkpoint
 */
export interface GitState {
  /** Current branch */
  branch: string;

  /** Current commit hash */
  commitHash: string;

  /** Whether working directory was clean */
  isClean: boolean;

  /** Stash name if changes were stashed */
  stashName?: string;
}

/**
 * Checkpoint metadata
 */
export interface CheckpointMetadata {
  /** User who created the checkpoint */
  createdBy?: string;

  /** Whether this is an auto-checkpoint */
  isAuto: boolean;

  /** Trigger that caused the checkpoint */
  trigger?: 'manual' | 'pre-tool' | 'pre-conversation';

  /** Tool name if triggered by tool use */
  toolName?: string;

  /** Additional notes */
  notes?: string;
}

/**
 * Options for creating a checkpoint
 */
export interface CheckpointCreateOptions {
  /** Custom label for the checkpoint */
  label?: string;

  /** Whether this is an auto-checkpoint */
  isAuto?: boolean;

  /** Trigger source */
  trigger?: 'manual' | 'pre-tool' | 'pre-conversation';

  /** Tool name if applicable */
  toolName?: string;

  /** Capture git state */
  captureGitState?: boolean;

  /** Maximum file size to capture (bytes, default: 1MB) */
  maxFileSize?: number;

  /** File patterns to exclude */
  excludePatterns?: string[];
}

/**
 * Options for rewinding to a checkpoint
 */
export interface RewindOptions {
  /** What to restore */
  restoreMode: 'files' | 'conversation' | 'both';

  /** Whether to create a checkpoint before rewinding */
  createCheckpoint?: boolean;

  /** Dry run - show what would change */
  dryRun?: boolean;
}

/**
 * Result of a rewind operation
 */
export interface RewindResult {
  /** Whether rewind was successful */
  success: boolean;

  /** Files that were restored */
  filesRestored: string[];

  /** Files that failed to restore */
  filesFailed: string[];

  /** Git operations performed */
  gitOperations?: string[];

  /** Error message if failed */
  error?: string;

  /** Whether this was a dry run */
  dryRun: boolean;
}

/**
 * Checkpoint listing item
 */
export interface CheckpointListItem {
  id: string;
  timestamp: number;
  label?: string;
  sessionId: string;
  fileChangesCount: number;
  isAuto: boolean;
  toolName?: string;
}
