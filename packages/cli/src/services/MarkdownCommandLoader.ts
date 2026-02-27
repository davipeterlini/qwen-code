/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ICommandLoader } from './types.js';
import type {
  SlashCommand,
  CommandContext,
  CommandCompletionItem,
} from '../ui/commands/types.js';
import { CommandKind } from '../ui/commands/types.js';
import type { Config } from '@qwen-code/qwen-code-core';
import { Storage, createDebugLogger } from '@qwen-code/qwen-code-core';
import { MessageType } from '../ui/types.js';
import { t } from '../i18n/index.js';

const debugLogger = createDebugLogger('MARKDOWN_COMMAND_LOADER_CLI');

/**
 * Loads markdown-based custom commands from .qwen/commands directories
 */
export class MarkdownCommandLoader implements ICommandLoader {
  constructor(private config: Config | null) {}

  /**
   * Load all markdown commands from configured directories
   */
  async loadCommands(_signal: AbortSignal): Promise<SlashCommand[]> {
    if (!this.config) {
      return [];
    }

    const markdownLoader = this.config.getMarkdownCommandLoader();
    if (!markdownLoader) {
      debugLogger.debug('Markdown command loader not available');
      return [];
    }

    try {
      // Load commands from .qwen/commands directories
      const commandConfigs = await markdownLoader.loadCommands(
        this.config.getWorkingDir(),
        Storage.getGlobalQwenDir(),
      );

      debugLogger.debug(`Loaded ${commandConfigs.length} markdown commands`);

      // Convert each markdown config to a SlashCommand
      const commands: SlashCommand[] = [];

      for (const commandConfig of commandConfigs) {
        const slashCommand = this.createSlashCommand(commandConfig);
        commands.push(slashCommand);
      }

      return commands;
    } catch (error) {
      debugLogger.warn('Error loading markdown commands:', error);
      return [];
    }
  }

  /**
   * Create a SlashCommand from a markdown command config
   */
  private createSlashCommand(commandConfig: {
    name: string;
    description: string;
    body: string;
    allowedTools?: string[];
    shellMode?: boolean;
    cwd?: string;
    env?: Record<string, string>;
  }): SlashCommand {
    return {
      name: commandConfig.name,
      description: commandConfig.description,
      kind: CommandKind.MARKDOWN,
      action: async (context: CommandContext, args?: string) => {
        const markdownLoader =
          context.services.config?.getMarkdownCommandLoader();
        if (!markdownLoader) {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Markdown command loader not available'),
            },
            Date.now(),
          );
          return;
        }

        // Get the command config
        const command = markdownLoader.getCommand(commandConfig.name);
        if (!command) {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Command not found: {{name}}', {
                name: commandConfig.name,
              }),
            },
            Date.now(),
          );
          return;
        }

        // Process the command body with arguments
        const processedBody = this.processCommandBody(command.body, args || '');

        // Build the prompt to send to the AI
        const prompt = this.buildPrompt(command, processedBody);

        // Submit the prompt
        return {
          type: 'submit_prompt',
          content: [{ text: prompt }],
        };
      },
      completion: async (
        _context: CommandContext,
        _partialArg: string,
      ): Promise<CommandCompletionItem[]> =>
        // No completion for markdown commands themselves
        // (arguments would be handled separately)
        [],
    };
  }

  /**
   * Process command body, replacing variables
   */
  private processCommandBody(body: string, args: string): string {
    let processed = body;

    // Replace $ARGUMENTS
    processed = processed.replace(/\$ARGUMENTS/g, args);

    // Parse and replace positional arguments
    const tokens = this.tokenizeArgs(args);
    for (let i = 0; i < tokens.length; i++) {
      const regex = new RegExp(`\\$${i + 1}`, 'g');
      processed = processed.replace(regex, tokens[i]);
    }

    // Parse and replace named arguments
    const namedArgs = this.parseNamedArgs(args);
    for (const [key, value] of Object.entries(namedArgs)) {
      const regex = new RegExp(`\\$${key}`, 'g');
      processed = processed.replace(regex, value);
    }

    return processed;
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
   * Parse named arguments (--key=value)
   */
  private parseNamedArgs(argsString: string): Record<string, string> {
    const namedArgs: Record<string, string> = {};
    const tokens = this.tokenizeArgs(argsString);

    for (const token of tokens) {
      if (token.startsWith('--')) {
        const [key, ...valueParts] = token.substring(2).split('=');
        const value = valueParts.join('=') || 'true';
        namedArgs[key] = value;
      }
    }

    return namedArgs;
  }

  /**
   * Build prompt from command
   */
  private buildPrompt(
    command: { name: string; description: string },
    processedBody: string,
  ): string {
    return `
# Custom Command: ${command.name}

**Description:** ${command.description}

## Instructions

${processedBody}

Proceed with the instructions above.
`.trim();
  }
}
