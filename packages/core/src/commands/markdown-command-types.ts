/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Configuration for a markdown-based custom command
 */
export interface MarkdownCommandConfig {
  /** Command name (used to invoke with /command-name) */
  name: string;

  /** Human-readable description */
  description: string;

  /** Tools that are pre-approved for this command */
  allowedTools?: string[];

  /** Whether to run in shell mode */
  shellMode?: boolean;

  /** Working directory for command execution */
  cwd?: string;

  /** Environment variables to set */
  env?: Record<string, string>;

  /** Command body (markdown content after frontmatter) */
  body: string;

  /** Path to the command file */
  filePath: string;

  /** Whether this is a project-level command */
  isProject: boolean;
}

/**
 * Parsed command with extracted arguments
 */
export interface ParsedCommand {
  /** The command configuration */
  config: MarkdownCommandConfig;

  /** Raw arguments string */
  rawArgs: string;

  /** Positional arguments ($1, $2, etc.) */
  positionalArgs: string[];

  /** Named arguments (--name=value) */
  namedArgs: Record<string, string>;
}
