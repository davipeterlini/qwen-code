/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { Config } from '@qwen-code/qwen-code-core';
import { createDebugLogger, Storage } from '@qwen-code/qwen-code-core';
import type { ICommandLoader } from './types.js';
import type {
  SlashCommand,
  CommandContext,
  SlashCommandActionReturn,
} from '../ui/commands/types.js';
import { CommandKind } from '../ui/commands/types.js';

const debugLogger = createDebugLogger('JSON_COMMAND_LOADER');

/**
 * Schema for custom command definition in JSON format
 */
const CustomCommandSchema = z.object({
  description: z.string().optional().default('Custom command'),
  prompt: z.string(),
  tools: z.array(z.string()).optional(),
  autoApprove: z.boolean().optional().default(false),
});

type CustomCommandDef = z.infer<typeof CustomCommandSchema>;

/**
 * Schema for the commands.json file
 */
const CommandsJsonSchema = z.object({
  commands: z.record(z.string(), CustomCommandSchema),
});

/**
 * Loads custom slash commands from .qwen/commands.json files
 *
 * This loader allows users to define custom commands in JSON format
 * that execute predefined prompts with optional tool restrictions.
 */
export class JsonCommandLoader implements ICommandLoader {
  private readonly projectRoot: string;

  constructor(_config: Config | null) {
    this.projectRoot = _config?.getProjectRoot() || process.cwd();
  }

  /**
   * Get the paths to commands.json files (project and user level)
   */
  private getCommandsFilePaths(): Array<{
    path: string;
    scope: 'project' | 'user';
  }> {
    const files: Array<{ path: string; scope: 'project' | 'user' }> = [];

    // Project-level commands
    const projectCommandsPath = path.join(
      this.projectRoot,
      '.qwen',
      'commands.json',
    );
    files.push({ path: projectCommandsPath, scope: 'project' });

    // User-level commands
    const userCommandsPath = path.join(
      Storage.getUserCommandsDir(),
      'commands.json',
    );
    files.push({ path: userCommandsPath, scope: 'user' });

    return files;
  }

  /**
   * Load commands from all commands.json files
   */
  async loadCommands(_signal: AbortSignal): Promise<SlashCommand[]> {
    const commands: SlashCommand[] = [];
    const files = this.getCommandsFilePaths();

    for (const file of files) {
      try {
        const content = await fs.readFile(file.path, 'utf-8');
        const parsed = JSON.parse(content);
        const validated = CommandsJsonSchema.parse(parsed);

        for (const [name, def] of Object.entries(validated.commands)) {
          const command = this.createCommand(name, def, file.scope);
          if (command) {
            commands.push(command);
          }
        }

        debugLogger.debug(`Loaded commands from ${file.path}`);
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          debugLogger.debug(`Error loading ${file.path}:`, error);
        }
        // File doesn't exist or is invalid, skip silently
      }
    }

    return commands;
  }

  /**
   * Create a SlashCommand from a custom command definition
   */
  private createCommand(
    name: string,
    def: CustomCommandDef,
    _scope: 'project' | 'user',
  ): SlashCommand | null {
    try {
      return {
        name,
        description: def.description || `Custom command: ${name}`,
        kind: CommandKind.FILE,
        action: (
          context: CommandContext,
          args: string,
        ): SlashCommandActionReturn | void => {
          // Combine the predefined prompt with any additional args
          const fullPrompt =
            args && args.trim()
              ? `${def.prompt}\n\nAdditional context: ${args}`
              : def.prompt;

          // Return a tool action to execute the prompt
          return {
            type: 'submit_prompt',
            content: [{ text: fullPrompt }],
          };
        },
      };
    } catch (error) {
      debugLogger.debug(`Error creating command ${name}:`, error);
      return null;
    }
  }
}
