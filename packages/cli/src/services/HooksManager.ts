/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { z } from 'zod';
import type { Config } from '@qwen-code/qwen-code-core';
import { createDebugLogger, Storage } from '@qwen-code/qwen-code-core';

const execAsync = promisify(exec);
const debugLogger = createDebugLogger('HOOKS_SYSTEM');

/**
 * Schema for hook definition
 */
const HookSchema = z.object({
  enabled: z.boolean().optional().default(true),
  script: z.string(),
  timeout: z.number().optional().default(30000),
  continueOnError: z.boolean().optional().default(false),
});

/**
 * Schema for hooks.json configuration
 */
const HooksConfigSchema = z.object({
  hooks: z.object({
    /**
     * Called when a session starts (after auth is complete)
     */
    onSessionStart: HookSchema.optional(),
    /**
     * Called before a prompt is submitted to the model
     */
    onPromptSubmit: HookSchema.optional(),
    /**
     * Called after a response is received from the model
     */
    onResponse: HookSchema.optional(),
    /**
     * Called before a tool is executed
     */
    onToolCall: HookSchema.optional(),
    /**
     * Called after a tool is executed
     */
    onToolComplete: HookSchema.optional(),
    /**
     * Called when a session ends
     */
    onSessionEnd: HookSchema.optional(),
    /**
     * Called before a file is edited
     */
    onFileEdit: HookSchema.optional(),
    /**
     * Called after a file is edited
     */
    onFileEditComplete: HookSchema.optional(),
  }),
});

export type HooksConfig = z.infer<typeof HooksConfigSchema>['hooks'];

/**
 * Hook execution result
 */
export interface HookResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  duration: number;
}

/**
 * Manages the lifecycle and execution of automation hooks
 */
export class HooksManager {
  private hooks: HooksConfig = {};
  private projectRoot: string;
  private isInitialized = false;

  constructor(_config: Config | null) {
    this.projectRoot = _config?.getProjectRoot() || process.cwd();
  }

  /**
   * Initialize the hooks system by loading configuration files
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.loadHooks();
    this.isInitialized = true;
    debugLogger.debug('Hooks system initialized');
  }

  /**
   * Load hooks from project and user configuration files
   */
  private async loadHooks(): Promise<void> {
    const hooksFiles = [
      path.join(Storage.getGlobalQwenDir(), 'hooks.json'),
      path.join(this.projectRoot, '.qwen', 'hooks.json'),
    ];

    for (const hooksFile of hooksFiles) {
      try {
        const content = await fs.readFile(hooksFile, 'utf-8');
        const parsed = JSON.parse(content);
        const validated = HooksConfigSchema.parse(parsed);

        // Merge hooks (project hooks override user hooks)
        this.hooks = {
          ...this.hooks,
          ...validated.hooks,
        };

        debugLogger.debug(`Loaded hooks from ${hooksFile}`);
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          debugLogger.debug(`Error loading hooks from ${hooksFile}:`, error);
        }
        // File doesn't exist, skip silently
      }
    }
  }

  /**
   * Execute a hook by name with provided context
   */
  async executeHook(
    hookName: keyof HooksConfig,
    context: Record<string, unknown> = {},
  ): Promise<HookResult | null> {
    const hook = this.hooks[hookName];

    if (!hook || !hook.enabled) {
      return null;
    }

    const startTime = Date.now();

    try {
      debugLogger.debug(`Executing hook: ${hookName}`);

      // Prepare environment variables with context
      const env = {
        ...process.env,
        QWEN_HOOK_NAME: hookName,
        QWEN_PROJECT_ROOT: this.projectRoot,
        ...this.contextToEnv(context),
      };

      const { stdout, stderr } = await execAsync(hook.script, {
        env,
        cwd: this.projectRoot,
        timeout: hook.timeout,
      });

      const duration = Date.now() - startTime;

      debugLogger.debug(`Hook ${hookName} completed in ${duration}ms`);

      return {
        success: true,
        stdout,
        stderr,
        exitCode: 0,
        duration,
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      if (error instanceof Error && 'code' in error) {
        const execError = error as {
          code?: string;
          status?: number;
          stdout?: string;
          stderr?: string;
        };

        debugLogger.debug(`Hook ${hookName} failed:`, execError);

        if (hook.continueOnError) {
          return {
            success: false,
            stdout: execError.stdout || '',
            stderr: execError.stderr || '',
            exitCode: execError.status || null,
            duration,
          };
        }

        throw error;
      }

      debugLogger.debug(`Hook ${hookName} failed with unknown error:`, error);

      if (hook.continueOnError) {
        return {
          success: false,
          stdout: '',
          stderr: (error as Error).message,
          exitCode: null,
          duration,
        };
      }

      throw error;
    }
  }

  /**
   * Convert context object to environment variables
   */
  private contextToEnv(
    context: Record<string, unknown>,
  ): Record<string, string> {
    const env: Record<string, string> = {};

    for (const [key, value] of Object.entries(context)) {
      const envKey = `QWEN_${key.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}`;
      if (typeof value === 'string') {
        env[envKey] = value;
      } else if (value !== undefined && value !== null) {
        env[envKey] = JSON.stringify(value);
      }
    }

    return env;
  }

  /**
   * Check if a hook is defined and enabled
   */
  isHookEnabled(hookName: keyof HooksConfig): boolean {
    const hook = this.hooks[hookName];
    return !!hook && hook.enabled !== false;
  }

  /**
   * Get all available hooks
   */
  getHooks(): HooksConfig {
    return { ...this.hooks };
  }
}

/**
 * Create a new HooksManager instance
 */
export function createHooksManager(config: Config | null): HooksManager {
  return new HooksManager(config);
}
