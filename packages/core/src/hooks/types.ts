/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Hook types - events that can trigger hooks
 */
export type HookType =
  | 'PreToolUse' // Before a tool is executed
  | 'PostToolUse' // After a tool is executed
  | 'UserPromptSubmit' // When user submits a prompt
  | 'SessionStart' // When session starts
  | 'SessionEnd' // When session ends
  | 'SubagentStart' // When a subagent starts
  | 'SubagentStop'; // When a subagent stops

/**
 * Hook execution type
 */
export type HookExecutionType = 'command' | 'prompt';

/**
 * Configuration for a single hook
 */
export interface HookConfig {
  /** Type of hook execution */
  type: HookExecutionType;

  /** Command to execute (for 'command' type) */
  command?: string;

  /** Prompt to send to AI (for 'prompt' type) */
  prompt?: string;

  /** Optional model to use for prompt hooks */
  model?: string;

  /** Whether to block tool execution until hook completes */
  blocking?: boolean;

  /** Timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Hook matcher configuration
 */
export interface HookMatcher {
  /** Regex pattern to match against tool name or prompt */
  matcher: string;

  /** Whether the pattern is case-sensitive */
  caseSensitive?: boolean;

  /** Hooks to execute when matcher matches */
  hooks: HookConfig[];
}

/**
 * Hooks configuration structure
 */
export interface HooksConfig {
  PreToolUse?: HookMatcher[];
  PostToolUse?: HookMatcher[];
  UserPromptSubmit?: HookMatcher[];
  SessionStart?: HookMatcher[];
  SessionEnd?: HookMatcher[];
  SubagentStart?: HookMatcher[];
  SubagentStop?: HookMatcher[];
}

/**
 * Hook execution context
 */
export interface HookExecutionContext {
  /** Current working directory */
  cwd: string;

  /** Tool name (for tool-related hooks) */
  toolName?: string;

  /** Tool arguments (for tool-related hooks) */
  toolArgs?: Record<string, unknown>;

  /** User prompt (for prompt-related hooks) */
  userPrompt?: string;

  /** Tool output (for PostToolUse hooks) */
  toolOutput?: string;

  /** Session ID */
  sessionId?: string;
}

/**
 * Hook execution result
 */
export interface HookExecutionResult {
  /** Whether hook executed successfully */
  success: boolean;

  /** Hook output/result */
  output?: string;

  /** Error message if failed */
  error?: string;

  /** Whether to block the original action */
  shouldBlock?: boolean;

  /** Modified prompt (for UserPromptSubmit hooks) */
  modifiedPrompt?: string;

  /** Execution time in milliseconds */
  executionTime: number;
}
