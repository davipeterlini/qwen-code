/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import type { Config } from '../config/config.js';
import type {
  Checkpoint,
  FileChange,
  CheckpointCreateOptions,
  RewindOptions,
  RewindResult,
  CheckpointListItem,
  GitState,
} from './checkpoint-types.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { glob } from 'glob';
import picomatch from 'picomatch';

const debugLogger = createDebugLogger('CHECKPOINT_SERVICE');
const execAsync = promisify(exec);

const CHECKPOINTS_DIR = '.qwen/checkpoints';
const MAX_CHECKPOINTS = 50; // Keep last 50 checkpoints

/**
 * Service for managing auto-checkpoints and rewind functionality
 */
export class CheckpointService {
  private checkpoints: Map<string, Checkpoint> = new Map();
  private currentSessionId: string | null = null;
  private checkpointCounter = 0;

  constructor(private readonly config?: Config) {}

  /**
   * Initialize the checkpoint service
   */
  async initialize(): Promise<void> {
    debugLogger.debug('Initializing checkpoint service');

    if (!this.config) {
      debugLogger.debug(
        'No config provided, skipping checkpoint service initialization',
      );
      return;
    }

    // Ensure checkpoints directory exists
    const checkpointsDir = path.join(
      this.config.storage.getProjectRoot(),
      CHECKPOINTS_DIR,
    );
    await fs.mkdir(checkpointsDir, { recursive: true });

    // Load existing checkpoints
    await this.loadCheckpoints();

    debugLogger.debug(
      `Checkpoint service initialized with ${this.checkpoints.size} checkpoints`,
    );
  }

  /**
   * Set current session ID
   */
  setSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  /**
   * Load checkpoints from disk
   */
  private async loadCheckpoints(): Promise<void> {
    const checkpointsDir = path.join(
      this.config.storage.getProjectRoot(),
      CHECKPOINTS_DIR,
    );

    try {
      const files = await fs.readdir(checkpointsDir);
      const checkpointFiles = files.filter((f) => f.endsWith('.json'));

      for (const file of checkpointFiles) {
        const filePath = path.join(checkpointsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const checkpoint = JSON.parse(content) as Checkpoint;
        this.checkpoints.set(checkpoint.id, checkpoint);
      }

      // Sort by timestamp and keep only recent ones
      this.pruneOldCheckpoints();
    } catch (error) {
      debugLogger.warn('Error loading checkpoints:', error);
    }
  }

  /**
   * Create a new checkpoint
   */
  async createCheckpoint(
    options: CheckpointCreateOptions = {},
  ): Promise<Checkpoint> {
    const {
      label,
      isAuto = false,
      trigger = 'manual',
      toolName,
      captureGitState = true,
      maxFileSize = 1024 * 1024, // 1MB default
      excludePatterns = ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
    } = options;

    debugLogger.debug(
      `Creating checkpoint: ${label || 'auto'} (trigger: ${trigger})`,
    );

    const checkpointId = this.generateCheckpointId();
    const projectRoot = this.config.storage.getProjectRoot();

    // Capture file changes
    const fileChanges = await this.captureFileChanges(
      projectRoot,
      maxFileSize,
      excludePatterns,
    );

    // Capture git state if requested
    let gitState: GitState | undefined;
    if (captureGitState) {
      gitState = await this.captureGitState(projectRoot);
    }

    const checkpoint: Checkpoint = {
      id: checkpointId,
      timestamp: Date.now(),
      label,
      sessionId: this.currentSessionId || 'unknown',
      messageId: 0, // config.getMessageCount(),
      fileChanges,
      gitState,
      metadata: {
        createdBy: process.env['USER'] || 'unknown',
        isAuto,
        trigger,
        toolName,
      },
    };

    // Save checkpoint
    await this.saveCheckpoint(checkpoint);

    debugLogger.debug(
      `Checkpoint created: ${checkpointId} (${fileChanges.length} files)`,
    );

    return checkpoint;
  }

  /**
   * Capture current state of files
   */
  private async captureFileChanges(
    projectRoot: string,
    maxFileSize: number,
    excludePatterns: string[],
  ): Promise<FileChange[]> {
    const fileChanges: FileChange[] = [];
    const excludeMatcher = picomatch(excludePatterns, { dot: true });

    try {
      // Find all files
      const files = await glob('**/*', {
        cwd: projectRoot,
        nodir: true,
        absolute: false,
      });

      for (const file of files) {
        // Skip excluded files
        if (excludeMatcher(file)) {
          continue;
        }

        const filePath = path.join(projectRoot, file);

        try {
          const stats = await fs.stat(filePath);

          // Skip large files
          if (stats.size > maxFileSize) {
            debugLogger.debug(
              `Skipping large file: ${file} (${stats.size} bytes)`,
            );
            continue;
          }

          const content = await fs.readFile(filePath, 'utf-8');
          const hash = this.hashContent(content);

          fileChanges.push({
            path: filePath,
            changeType: 'modified', // We'll detect actual changes on rewind
            originalContent: content,
            size: stats.size,
            hash,
          });
        } catch (error) {
          debugLogger.debug(`Error reading file ${file}:`, error);
        }
      }
    } catch (error) {
      debugLogger.warn('Error capturing file changes:', error);
    }

    return fileChanges;
  }

  /**
   * Capture git state
   */
  private async captureGitState(
    projectRoot: string,
  ): Promise<GitState | undefined> {
    try {
      // Check if git is available
      await fs.access(path.join(projectRoot, '.git'));

      // Get current branch
      const { stdout: branchOutput } = await execAsync(
        'git rev-parse --abbrev-ref HEAD',
        { cwd: projectRoot },
      );
      const branch = branchOutput.trim();

      // Get current commit hash
      const { stdout: commitOutput } = await execAsync('git rev-parse HEAD', {
        cwd: projectRoot,
      });
      const commitHash = commitOutput.trim();

      // Check if working directory is clean
      const { stdout: statusOutput } = await execAsync(
        'git status --porcelain',
        {
          cwd: projectRoot,
        },
      );
      const isClean = statusOutput.trim().length === 0;

      return {
        branch,
        commitHash,
        isClean,
      };
    } catch (error) {
      debugLogger.debug('Git not available or error capturing state:', error);
      return undefined;
    }
  }

  /**
   * Rewind to a checkpoint
   */
  async rewindToCheckpoint(
    checkpointId: string,
    options: RewindOptions,
  ): Promise<RewindResult> {
    const {
      restoreMode = 'both',
      createCheckpoint = true,
      dryRun = false,
    } = options;

    debugLogger.debug(
      `Rewinding to checkpoint: ${checkpointId} (mode: ${restoreMode}, dryRun: ${dryRun})`,
    );

    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return {
        success: false,
        error: `Checkpoint not found: ${checkpointId}`,
        filesRestored: [],
        filesFailed: [],
        dryRun,
      };
    }

    // Create checkpoint before rewinding if requested
    if (createCheckpoint && !dryRun) {
      debugLogger.debug('Creating pre-rewind checkpoint');
      await this.createCheckpoint({
        label: `Pre-rewind to ${checkpointId}`,
        isAuto: true,
        trigger: 'pre-tool' as const,
      });
    }

    const filesRestored: string[] = [];
    const filesFailed: string[] = [];
    const gitOperations: string[] = [];

    // Restore files
    if (restoreMode === 'files' || restoreMode === 'both') {
      for (const fileChange of checkpoint.fileChanges) {
        if (dryRun) {
          filesRestored.push(fileChange.path);
          continue;
        }

        try {
          if (
            fileChange.changeType === 'deleted' &&
            fileChange.originalContent
          ) {
            // File was deleted - recreate it
            await fs.writeFile(fileChange.path, fileChange.originalContent);
            filesRestored.push(fileChange.path);
          } else if (
            fileChange.changeType === 'modified' &&
            fileChange.originalContent
          ) {
            // File was modified - restore original
            await fs.writeFile(fileChange.path, fileChange.originalContent);
            filesRestored.push(fileChange.path);
          } else if (fileChange.changeType === 'created') {
            // File was created - delete it
            await fs.unlink(fileChange.path);
            filesRestored.push(fileChange.path);
          }
        } catch (error) {
          debugLogger.warn(`Error restoring file ${fileChange.path}:`, error);
          filesFailed.push(fileChange.path);
        }
      }
    }

    // Restore git state if available
    if (
      checkpoint.gitState &&
      (restoreMode === 'files' || restoreMode === 'both') &&
      !dryRun
    ) {
      try {
        const projectRoot = this.config.storage.getProjectRoot();

        // Reset to commit
        if (!checkpoint.gitState.isClean) {
          debugLogger.debug('Restoring git state');
          await execAsync(
            `git reset --hard ${checkpoint.gitState.commitHash}`,
            {
              cwd: projectRoot,
            },
          );
          gitOperations.push(`reset --hard ${checkpoint.gitState.commitHash}`);
        }

        // Checkout branch
        if (checkpoint.gitState.branch) {
          await execAsync(`git checkout ${checkpoint.gitState.branch}`, {
            cwd: projectRoot,
          });
          gitOperations.push(`checkout ${checkpoint.gitState.branch}`);
        }
      } catch (error) {
        debugLogger.warn('Error restoring git state:', error);
        gitOperations.push(`Error: ${error}`);
      }
    }

    const result: RewindResult = {
      success: filesFailed.length === 0,
      filesRestored,
      filesFailed,
      gitOperations: gitOperations.length > 0 ? gitOperations : undefined,
      error:
        filesFailed.length > 0 ? 'Some files failed to restore' : undefined,
      dryRun,
    };

    debugLogger.debug(
      `Rewind complete: ${filesRestored.length} files restored, ${filesFailed.length} failed`,
    );

    return result;
  }

  /**
   * List available checkpoints
   */
  listCheckpoints(options?: {
    limit?: number;
    sessionId?: string;
  }): CheckpointListItem[] {
    const { limit = 20, sessionId } = options || {};

    let checkpoints = Array.from(this.checkpoints.values());

    // Filter by session if specified
    if (sessionId) {
      checkpoints = checkpoints.filter((c) => c.sessionId === sessionId);
    }

    // Sort by timestamp descending
    checkpoints.sort((a, b) => b.timestamp - a.timestamp);

    // Map to list items
    return checkpoints.slice(0, limit).map((c) => ({
      id: c.id,
      timestamp: c.timestamp,
      label: c.label,
      sessionId: c.sessionId,
      fileChangesCount: c.fileChanges.length,
      isAuto: c.metadata.isAuto,
      toolName: c.metadata.toolName,
    }));
  }

  /**
   * Get a specific checkpoint
   */
  getCheckpoint(checkpointId: string): Checkpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  /**
   * Delete a checkpoint
   */
  async deleteCheckpoint(checkpointId: string): Promise<boolean> {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) {
      return false;
    }

    try {
      const checkpointFile = path.join(
        this.config.storage.getProjectRoot(),
        CHECKPOINTS_DIR,
        `${checkpointId}.json`,
      );
      await fs.unlink(checkpointFile);
      this.checkpoints.delete(checkpointId);

      debugLogger.debug(`Deleted checkpoint: ${checkpointId}`);
      return true;
    } catch (error) {
      debugLogger.warn(`Error deleting checkpoint ${checkpointId}:`, error);
      return false;
    }
  }

  /**
   * Save checkpoint to disk
   */
  private async saveCheckpoint(checkpoint: Checkpoint): Promise<void> {
    const checkpointFile = path.join(
      this.config.storage.getProjectRoot(),
      CHECKPOINTS_DIR,
      `${checkpoint.id}.json`,
    );

    const content = JSON.stringify(checkpoint, null, 2);
    await fs.writeFile(checkpointFile, content, 'utf-8');

    this.checkpoints.set(checkpoint.id, checkpoint);

    // Prune old checkpoints
    this.pruneOldCheckpoints();
  }

  /**
   * Remove old checkpoints to stay under limit
   */
  private pruneOldCheckpoints(): void {
    if (this.checkpoints.size <= MAX_CHECKPOINTS) {
      return;
    }

    const sorted = Array.from(this.checkpoints.values()).sort(
      (a, b) => b.timestamp - a.timestamp,
    );

    const toDelete = sorted.slice(MAX_CHECKPOINTS);
    for (const checkpoint of toDelete) {
      this.deleteCheckpoint(checkpoint.id);
    }

    debugLogger.debug(`Pruned ${toDelete.length} old checkpoints`);
  }

  /**
   * Generate unique checkpoint ID
   */
  private generateCheckpointId(): string {
    this.checkpointCounter++;
    const timestamp = Date.now();
    return `chk_${timestamp}_${this.checkpointCounter}`;
  }

  /**
   * Hash content for quick comparison
   */
  private hashContent(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Get statistics about checkpoints
   */
  getStats(): {
    total: number;
    auto: number;
    manual: number;
    oldestTimestamp?: number;
    newestTimestamp?: number;
  } {
    const checkpoints = Array.from(this.checkpoints.values());
    const auto = checkpoints.filter((c) => c.metadata.isAuto).length;
    const manual = checkpoints.length - auto;

    return {
      total: checkpoints.length,
      auto,
      manual,
      oldestTimestamp:
        checkpoints.length > 0
          ? Math.min(...checkpoints.map((c) => c.timestamp))
          : undefined,
      newestTimestamp:
        checkpoints.length > 0
          ? Math.max(...checkpoints.map((c) => c.timestamp))
          : undefined,
    };
  }
}
