/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  MarkdownCommandConfig,
  ParsedCommand,
} from './markdown-command-types.js';
// import { createDebugLogger } from '../utils/debugLogger.js';

// const debugLogger = createDebugLogger('MARKDOWN_COMMAND_PROCESSOR');

/**
 * Processor for executing markdown-based custom commands
 */
export class MarkdownCommandProcessor {
  /**
   * Parse command arguments from user input
   */
  parseArguments(
    command: MarkdownCommandConfig,
    argsString: string,
  ): ParsedCommand {
    const positionalArgs: string[] = [];
    const namedArgs: Record<string, string> = {};

    // Parse arguments
    const tokens = this.tokenizeArgs(argsString);

    for (const token of tokens) {
      if (token.startsWith('--')) {
        // Named argument
        const [key, ...valueParts] = token.substring(2).split('=');
        const value = valueParts.join('=') || 'true';
        namedArgs[key] = value;
      } else if (token.startsWith('-') && token.length === 2) {
        // Short flag
        namedArgs[token.substring(1)] = 'true';
      } else {
        // Positional argument
        positionalArgs.push(token);
      }
    }

    return {
      config: command,
      rawArgs: argsString,
      positionalArgs,
      namedArgs,
    };
  }

  /**
   * Tokenize arguments string
   */
  private tokenizeArgs(argsString: string): string[] {
    const tokens: string[] = [];
    let currentToken = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if (inQuotes) {
        if (char === quoteChar && argsString[i - 1] !== '\\') {
          inQuotes = false;
          tokens.push(currentToken);
          currentToken = '';
        } else {
          currentToken += char;
        }
      } else {
        if (char === '"' || char === "'") {
          inQuotes = true;
          quoteChar = char;
        } else if (char === ' ' || char === '\t') {
          if (currentToken) {
            tokens.push(currentToken);
            currentToken = '';
          }
        } else {
          currentToken += char;
        }
      }
    }

    if (currentToken) {
      tokens.push(currentToken);
    }

    return tokens;
  }

  /**
   * Process command body, replacing variables with actual values
   */
  processCommandBody(parsed: ParsedCommand): string {
    let processed = parsed.config.body;

    // Replace $ARGUMENTS with raw arguments
    processed = processed.replace(/\$ARGUMENTS/g, parsed.rawArgs);

    // Replace positional arguments ($1, $2, etc.)
    for (let i = 0; i < parsed.positionalArgs.length; i++) {
      const regex = new RegExp(`\\$${i + 1}`, 'g');
      processed = processed.replace(regex, parsed.positionalArgs[i]);
    }

    // Replace named arguments (--name becomes $name)
    for (const [key, value] of Object.entries(parsed.namedArgs)) {
      const regex = new RegExp(`\\$${key}`, 'g');
      processed = processed.replace(regex, value);
    }

    // Process shell commands (!command)
    processed = this.processShellCommands(processed);

    return processed;
  }

  /**
   * Process inline shell commands (!command)
   */
  private processShellCommands(body: string): string {
    // In a real implementation, this would execute shell commands
    // and replace !command with the output
    // For now, we'll just mark them for later execution
    return body;
  }

  /**
   * Extract tool requirements from command body
   */
  extractToolRequirements(body: string): string[] {
    const tools = new Set<string>();

    // Look for tool mentions in the body
    const toolPatterns = [
      /Use the (\w+) tool/gi,
      /Call (\w+)/gi,
      /Run (\w+)/gi,
      /Execute (\w+)/gi,
    ];

    for (const pattern of toolPatterns) {
      let match;
      while ((match = pattern.exec(body)) !== null) {
        const toolName = match[1];
        // Capitalize first letter
        const capitalized =
          toolName.charAt(0).toUpperCase() + toolName.slice(1);
        tools.add(capitalized);
      }
    }

    return Array.from(tools);
  }

  /**
   * Build a prompt from the processed command
   */
  buildPrompt(processedBody: string, command: MarkdownCommandConfig): string {
    const parts: string[] = [];

    // Add command context
    parts.push(`# Custom Command: ${command.name}`);
    parts.push(`**Description:** ${command.description}`);
    parts.push('');

    // Add instructions from body
    parts.push('## Instructions');
    parts.push(processedBody);
    parts.push('');

    // Add allowed tools info
    if (command.allowedTools && command.allowedTools.length > 0) {
      parts.push(`**Allowed Tools:** ${command.allowedTools.join(', ')}`);
      parts.push('');
    }

    return parts.join('\n');
  }

  /**
   * Validate that a command can be executed
   */
  validateCommand(command: MarkdownCommandConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!command.body || command.body.trim().length === 0) {
      errors.push('Command body is empty');
    }

    if (!command.name || command.name.trim().length === 0) {
      errors.push('Command name is required');
    }

    if (!command.description || command.description.trim().length === 0) {
      errors.push('Command description is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
