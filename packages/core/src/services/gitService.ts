/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { isCommandAvailable } from '../utils/shell-utils.js';
import type { SimpleGit } from 'simple-git';
import { simpleGit, CheckRepoActions } from 'simple-git';
import type { Storage } from '../config/storage.js';
import { isNodeError } from '../utils/errors.js';

/**
 * Checkpoint metadata interface
 */
export interface Checkpoint {
  hash: string;
  message: string;
  timestamp: Date;
  filesChanged: string[];
}

export class GitService {
  private projectRoot: string;
  private storage: Storage;

  constructor(projectRoot: string, storage: Storage) {
    this.projectRoot = path.resolve(projectRoot);
    this.storage = storage;
  }

  private getHistoryDir(): string {
    return this.storage.getHistoryDir();
  }

  async initialize(): Promise<void> {
    const { available: gitAvailable } = isCommandAvailable('git');
    if (!gitAvailable) {
      throw new Error(
        'Checkpointing is enabled, but Git is not installed. Please install Git or disable checkpointing to continue.',
      );
    }
    try {
      await this.setupShadowGitRepository();
    } catch (error) {
      throw new Error(
        `Failed to initialize checkpointing: ${error instanceof Error ? error.message : 'Unknown error'}. Please check that Git is working properly or disable checkpointing.`,
      );
    }
  }

  /**
   * Creates a hidden git repository in the project root.
   * The Git repository is used to support checkpointing.
   */
  async setupShadowGitRepository() {
    const repoDir = this.getHistoryDir();
    const gitConfigPath = path.join(repoDir, '.gitconfig');

    await fs.mkdir(repoDir, { recursive: true });

    // We don't want to inherit the user's name, email, or gpg signing
    // preferences for the shadow repository, so we create a dedicated gitconfig.
    const gitConfigContent =
      '[user]\n  name = Qwen Code\n  email = qwen-code@qwen.ai\n[commit]\n  gpgsign = false\n';
    await fs.writeFile(gitConfigPath, gitConfigContent);

    const repo = simpleGit(repoDir);
    const isRepoDefined = await repo.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);

    if (!isRepoDefined) {
      await repo.init(false, {
        '--initial-branch': 'main',
      });

      await repo.commit('Initial commit', { '--allow-empty': null });
    }

    const userGitIgnorePath = path.join(this.projectRoot, '.gitignore');
    const shadowGitIgnorePath = path.join(repoDir, '.gitignore');

    let userGitIgnoreContent = '';
    try {
      userGitIgnoreContent = await fs.readFile(userGitIgnorePath, 'utf-8');
    } catch (error) {
      if (isNodeError(error) && error.code !== 'ENOENT') {
        throw error;
      }
    }

    await fs.writeFile(shadowGitIgnorePath, userGitIgnoreContent);
  }

  private get shadowGitRepository(): SimpleGit {
    const repoDir = this.getHistoryDir();
    return simpleGit(this.projectRoot).env({
      GIT_DIR: path.join(repoDir, '.git'),
      GIT_WORK_TREE: this.projectRoot,
      // Prevent git from using the user's global git config.
      HOME: repoDir,
      XDG_CONFIG_HOME: repoDir,
    });
  }

  async getCurrentCommitHash(): Promise<string> {
    const hash = await this.shadowGitRepository.raw('rev-parse', 'HEAD');
    return hash.trim();
  }

  async createFileSnapshot(message: string): Promise<string> {
    try {
      const repo = this.shadowGitRepository;
      await repo.add('.');
      const commitResult = await repo.commit(message);
      return commitResult.commit;
    } catch (error) {
      throw new Error(
        `Failed to create checkpoint snapshot: ${error instanceof Error ? error.message : 'Unknown error'}. Checkpointing may not be working properly.`,
      );
    }
  }

  async restoreProjectFromSnapshot(commitHash: string): Promise<void> {
    const repo = this.shadowGitRepository;
    await repo.raw(['restore', '--source', commitHash, '.']);
    // Removes any untracked files that were introduced post snapshot.
    await repo.clean('f', ['-d']);
  }

  /**
   * List all checkpoints in chronological order (newest first)
   */
  async listCheckpoints(): Promise<Checkpoint[]> {
    try {
      const repo = this.shadowGitRepository;
      const log = await repo.log();
      return log.all.map((commit) => ({
        hash: commit.hash,
        message: commit.message,
        timestamp: new Date(commit.date),
        filesChanged: commit.diff?.files?.map((f) => f.file) || [],
      }));
    } catch (error) {
      throw new Error(
        `Failed to list checkpoints: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get previous checkpoint hash (for undo)
   */
  async getPreviousCheckpoint(): Promise<string | null> {
    try {
      const repo = this.shadowGitRepository;
      const hash = await repo.raw('rev-parse', 'HEAD~1');
      return hash.trim();
    } catch {
      return null; // No previous commit
    }
  }

  /**
   * Get next checkpoint hash (for redo)
   * Returns the commit that comes after the current one in history
   */
  async getNextCheckpoint(currentHash: string): Promise<string | null> {
    try {
      const commits = await this.listCheckpoints();
      const currentIndex = commits.findIndex((c) => c.hash === currentHash);
      if (currentIndex > 0) {
        return commits[currentIndex - 1].hash;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Auto-generate checkpoint name based on file changes
   */
  async generateCheckpointName(files: string[]): Promise<string> {
    if (files.length === 0) return 'Empty checkpoint';
    if (files.length === 1) return `Modified ${path.basename(files[0])}`;
    if (files.length <= 3) {
      return `Modified ${files.map((f) => path.basename(f)).join(', ')}`;
    }
    return `Modified ${files.length} files`;
  }

  /**
   * Create optimized checkpoint with automatic naming and deduplication
   */
  async createOptimizedCheckpoint(message?: string): Promise<string> {
    try {
      const repo = this.shadowGitRepository;
      const status = await repo.status();
      const changedFiles = [
        ...status.modified,
        ...status.not_added,
        ...status.created,
      ];

      const checkpointMessage =
        message || (await this.generateCheckpointName(changedFiles));

      return this.createFileSnapshot(checkpointMessage);
    } catch (error) {
      throw new Error(
        `Failed to create optimized checkpoint: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
