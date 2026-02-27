/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { Config } from '../config/config.js';
import type {
  HooksConfig,
  HookMatcher,
  HookConfig,
  HookExecutionContext,
  HookExecutionResult,
  HookType,
} from './types.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const debugLogger = createDebugLogger('HOOK_SERVICE');
const execAsync = promisify(exec);

/**
 * Service for managing and executing hooks
 */
export class HookService {
  private config: HooksConfig | null = null;
  private configLoaded = false;
  private configPaths: string[] = [];

  constructor(private readonly appConfig?: Config) {}

  /**
   * Initialize hook service - load configuration
   */
  async initialize(): Promise<void> {
    debugLogger.debug('Initializing hook service');

    if (!this.appConfig) {
      debugLogger.debug(
        'No config provided, skipping hook service initialization',
      );
      this.configLoaded = true;
      return;
    }

    // Load hooks from multiple locations (project takes precedence)
    this.configPaths = [
      path.join(this.appConfig.storage.getProjectRoot(), '.qwen', 'hooks.json'),
      path.join(this.appConfig.storage.getUserHomeDir(), '.qwen', 'hooks.json'),
    ];

    await this.loadConfig();
    this.configLoaded = true;

    debugLogger.debug(
      `Hook service initialized with ${this.countHooks()} hooks`,
    );
  }

  /**
   * Load hooks configuration from files
   */
  private async loadConfig(): Promise<void> {
    for (const configPath of this.configPaths) {
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const parsed = JSON.parse(content) as HooksConfig;

        // Merge configs (later paths override earlier ones)
        this.config = this.mergeConfigs(this.config || {}, parsed);

        debugLogger.debug(`Loaded hooks from ${configPath}`);
      } catch (error) {
        // File doesn't exist or is invalid - continue
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          debugLogger.warn(`Error loading hooks from ${configPath}:`, error);
        }
      }
    }

    if (!this.config) {
      this.config = {};
      debugLogger.debug('No hooks configuration found');
    }
  }

  /**
   * Merge two hook configurations
   */
  private mergeConfigs(base: HooksConfig, override: HooksConfig): HooksConfig {
    const result: HooksConfig = { ...base };

    const hookTypes: HookType[] = [
      'PreToolUse',
      'PostToolUse',
      'UserPromptSubmit',
      'SessionStart',
      'SessionEnd',
      'SubagentStart',
      'SubagentStop',
    ];

    for (const hookType of hookTypes) {
      const baseHooks = base[hookType] || [];
      const overrideHooks = override[hookType] || [];

      // Override hooks replace base hooks with same matcher
      const merged: HookMatcher[] = [...baseHooks];

      for (const overrideHook of overrideHooks) {
        const existingIndex = merged.findIndex(
          (h) => h.matcher === overrideHook.matcher,
        );

        if (existingIndex >= 0) {
          merged[existingIndex] = overrideHook;
        } else {
          merged.push(overrideHook);
        }
      }

      if (merged.length > 0) {
        result[hookType] = merged;
      }
    }

    return result;
  }

  /**
   * Count total number of hooks
   */
  private countHooks(): number {
    if (!this.config) return 0;

    let count = 0;
    const hookTypes: HookType[] = [
      'PreToolUse',
      'PostToolUse',
      'UserPromptSubmit',
      'SessionStart',
      'SessionEnd',
      'SubagentStart',
      'SubagentStop',
    ];

    for (const hookType of hookTypes) {
      const matchers = this.config[hookType] || [];
      for (const matcher of matchers) {
        count += matcher.hooks.length;
      }
    }

    return count;
  }

  /**
   * Execute hooks for a specific event type
   */
  async executeHooks(
    hookType: HookType,
    context: HookExecutionContext,
    signal?: AbortSignal,
  ): Promise<HookExecutionResult[]> {
    if (!this.configLoaded) {
      debugLogger.warn('Hook service not initialized');
      return [];
    }

    const matchers = this.config?.[hookType] || [];
    if (matchers.length === 0) {
      return [];
    }

    const results: HookExecutionResult[] = [];

    for (const matcher of matchers) {
      if (this.matchesContext(matcher, context)) {
        debugLogger.debug(`Executing hooks for matcher: ${matcher.matcher}`);

        for (const hook of matcher.hooks) {
          const result = await this.executeSingleHook(
            hook,
            context,
            signal,
            hookType,
          );
          results.push(result);

          // If blocking and should block, stop processing
          if (hook.blocking && result.shouldBlock) {
            return results;
          }
        }
      }
    }

    return results;
  }

  /**
   * Check if a matcher matches the current context
   */
  private matchesContext(
    matcher: HookMatcher,
    context: HookExecutionContext,
  ): boolean {
    const pattern = matcher.matcher;
    const flags = matcher.caseSensitive ? '' : 'i';
    const regex = new RegExp(pattern, flags);

    // Get the value to match against based on hook type
    let matchValue = '';

    if (context.toolName) {
      matchValue = context.toolName;
    } else if (context.userPrompt) {
      matchValue = context.userPrompt;
    }

    return regex.test(matchValue);
  }

  /**
   * Execute a single hook
   */
  private async executeSingleHook(
    hook: HookConfig,
    context: HookExecutionContext,
    signal: AbortSignal | undefined,
    hookType: HookType,
  ): Promise<HookExecutionResult> {
    const startTime = Date.now();

    try {
      if (hook.type === 'command') {
        return await this.executeCommandHook(hook, context, signal);
      } else if (hook.type === 'prompt') {
        return await this.executePromptHook(hook, context, signal, hookType);
      } else {
        throw new Error(`Unknown hook type: ${hook.type}`);
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      debugLogger.error(`Hook execution failed:`, errorMessage);

      return {
        success: false,
        error: errorMessage,
        executionTime,
        shouldBlock: hook.blocking,
      };
    }
  }

  /**
   * Execute a command-type hook
   */
  private async executeCommandHook(
    hook: HookConfig,
    context: HookExecutionContext,
    signal: AbortSignal | undefined,
  ): Promise<HookExecutionResult> {
    if (!hook.command) {
      throw new Error('Command hook missing command field');
    }

    const startTime = Date.now();
    const timeout = hook.timeout || 30000;

    debugLogger.debug(`Executing command hook: ${hook.command}`);

    try {
      const { stdout, stderr } = await execAsync(hook.command, {
        cwd: context.cwd,
        timeout,
        signal,
        env: {
          ...process.env,
          QWEN_HOOK_TOOL_NAME: context.toolName || '',
          QWEN_HOOK_SESSION_ID: context.sessionId || '',
        },
      });

      const executionTime = Date.now() - startTime;
      const output = stdout || stderr;

      debugLogger.debug(`Command hook completed: ${output?.substring(0, 100)}`);

      return {
        success: true,
        output,
        executionTime,
        shouldBlock: false,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        success: false,
        error: errorMessage,
        executionTime,
        shouldBlock: hook.blocking,
      };
    }
  }

  /**
   * Execute a prompt-type hook
   */
  private async executePromptHook(
    hook: HookConfig,
    context: HookExecutionContext,
    signal: AbortSignal | undefined,
    hookType: HookType,
  ): Promise<HookExecutionResult> {
    if (!hook.prompt) {
      throw new Error('Prompt hook missing prompt field');
    }

    const startTime = Date.now();

    debugLogger.debug(`Executing prompt hook: ${hook.prompt}`);

    // For prompt hooks, we send a request to the AI
    // This is a simplified implementation - in production you'd want to use the actual AI service
    try {
      const promptContext = this.buildPromptContext(context, hookType);
      const fullPrompt = `${hook.prompt}\n\nContext:\n${promptContext}`;

      // In a real implementation, this would call the AI service
      // For now, we'll just return the prompt as output
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: `Prompt hook executed: ${fullPrompt.substring(0, 200)}...`,
        executionTime,
        shouldBlock: false,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      return {
        success: false,
        error: errorMessage,
        executionTime,
        shouldBlock: hook.blocking,
      };
    }
  }

  /**
   * Build context string for prompt hooks
   */
  private buildPromptContext(
    context: HookExecutionContext,
    hookType: HookType,
  ): string {
    const lines: string[] = [];

    if (context.toolName) {
      lines.push(`Tool: ${context.toolName}`);
    }

    if (context.toolArgs && Object.keys(context.toolArgs).length > 0) {
      lines.push(`Arguments: ${JSON.stringify(context.toolArgs, null, 2)}`);
    }

    if (context.userPrompt) {
      lines.push(`User Prompt: ${context.userPrompt}`);
    }

    if (context.toolOutput) {
      lines.push(`Tool Output: ${context.toolOutput.substring(0, 500)}`);
    }

    if (context.sessionId) {
      lines.push(`Session ID: ${context.sessionId}`);
    }

    lines.push(`Working Directory: ${context.cwd}`);
    lines.push(`Hook Type: ${hookType}`);

    return lines.join('\n');
  }

  /**
   * Reload hooks configuration
   */
  async reloadConfig(): Promise<void> {
    debugLogger.debug('Reloading hooks configuration');
    this.config = null;
    this.configLoaded = false;
    await this.initialize();
  }

  /**
   * Get current hooks configuration (for debugging)
   */
  getConfig(): HooksConfig | null {
    return this.config;
  }

  /**
   * Check if hooks are configured for a specific type
   */
  hasHooks(hookType: HookType): boolean {
    return (this.config?.[hookType]?.length || 0) > 0;
  }
}
