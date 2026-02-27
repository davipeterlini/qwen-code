/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { MarkdownCommandConfig } from './markdown-command-types.js';
import { parse as parseYaml } from '../utils/yaml-parser.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('MARKDOWN_COMMAND_LOADER');

const PROJECT_COMMANDS_DIR = '.qwen/commands';
const USER_COMMANDS_DIR = '.qwen/commands';

/**
 * Loader for markdown-based custom commands
 */
export class MarkdownCommandLoader {
  private commandsCache: Map<string, MarkdownCommandConfig> = new Map();
  private cacheLoaded = false;

  /**
   * Load all markdown commands from configured directories
   */
  async loadCommands(
    projectRoot: string,
    userHome: string,
  ): Promise<MarkdownCommandConfig[]> {
    debugLogger.debug('Loading markdown commands');

    const commands: MarkdownCommandConfig[] = [];

    // Load from project directory
    const projectCommandsDir = path.join(projectRoot, PROJECT_COMMANDS_DIR);
    const projectCommands = await this.loadCommandsFromDirectory(
      projectCommandsDir,
      true,
    );
    commands.push(...projectCommands);

    // Load from user directory
    const userCommandsDir = path.join(userHome, USER_COMMANDS_DIR);
    const userCommands = await this.loadCommandsFromDirectory(
      userCommandsDir,
      false,
    );

    // Project commands take precedence
    const projectNames = new Set(commands.map((c) => c.name));
    for (const command of userCommands) {
      if (!projectNames.has(command.name)) {
        commands.push(command);
      }
    }

    // Update cache
    this.commandsCache.clear();
    for (const command of commands) {
      this.commandsCache.set(command.name, command);
    }
    this.cacheLoaded = true;

    debugLogger.debug(`Loaded ${commands.length} markdown commands`);
    return commands;
  }

  /**
   * Load commands from a single directory
   */
  private async loadCommandsFromDirectory(
    dirPath: string,
    isProject: boolean,
  ): Promise<MarkdownCommandConfig[]> {
    const commands: MarkdownCommandConfig[] = [];

    try {
      await fs.access(dirPath);
    } catch {
      // Directory doesn't exist - return empty
      return [];
    }

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const filePath = path.join(dirPath, entry.name);
          const command = await this.loadCommandFile(filePath, isProject);

          if (command) {
            commands.push(command);
          }
        }
      }
    } catch (error) {
      debugLogger.warn(`Error reading commands from ${dirPath}:`, error);
    }

    return commands;
  }

  /**
   * Load a single command file
   */
  private async loadCommandFile(
    filePath: string,
    isProject: boolean,
  ): Promise<MarkdownCommandConfig | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = this.parseMarkdownCommand(content, filePath, isProject);

      if (parsed) {
        debugLogger.debug(`Loaded command: ${parsed.name}`);
      }

      return parsed;
    } catch (error) {
      debugLogger.warn(`Error loading command from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Parse markdown command file
   */
  private parseMarkdownCommand(
    content: string,
    filePath: string,
    isProject: boolean,
  ): MarkdownCommandConfig | null {
    // Extract YAML frontmatter
    const frontmatterMatch = content.match(
      /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/,
    );

    if (!frontmatterMatch) {
      debugLogger.warn(`No frontmatter found in ${filePath}`);
      return null;
    }

    const [, frontmatterRaw, body] = frontmatterMatch;

    // Parse YAML frontmatter
    let frontmatter: Record<string, unknown>;
    try {
      frontmatter = parseYaml(frontmatterRaw) as Record<string, unknown>;
    } catch (error) {
      debugLogger.warn(`Error parsing YAML frontmatter in ${filePath}:`, error);
      return null;
    }

    // Validate required fields
    const name = frontmatter['name'] as string;
    const description = frontmatter['description'] as string;

    if (!name || typeof name !== 'string') {
      debugLogger.warn(`Command missing 'name' field in ${filePath}`);
      return null;
    }

    if (!description || typeof description !== 'string') {
      debugLogger.warn(
        `Command '${name}' missing 'description' field in ${filePath}`,
      );
      return null;
    }

    // Validate name format
    if (!/^[a-z][a-z0-9-]*$/i.test(name)) {
      debugLogger.warn(
        `Command name '${name}' must be alphanumeric with hyphens in ${filePath}`,
      );
      return null;
    }

    // Extract optional fields
    const allowedTools = frontmatter['allowed-tools'] as string[] | undefined;
    const shellMode = frontmatter['shell-mode'] as boolean | undefined;
    const cwd = frontmatter['cwd'] as string | undefined;
    const env = frontmatter['env'] as Record<string, string> | undefined;

    return {
      name,
      description,
      allowedTools,
      shellMode,
      cwd,
      env,
      body: body.trim(),
      filePath,
      isProject,
    };
  }

  /**
   * Get a command by name from cache
   */
  getCommand(name: string): MarkdownCommandConfig | undefined {
    return this.commandsCache.get(name);
  }

  /**
   * Clear the cache and reload commands
   */
  async reloadCommands(
    projectRoot: string,
    userHome: string,
  ): Promise<MarkdownCommandConfig[]> {
    debugLogger.debug('Reloading markdown commands');
    this.commandsCache.clear();
    this.cacheLoaded = false;
    return this.loadCommands(projectRoot, userHome);
  }

  /**
   * Check if cache is loaded
   */
  isCacheLoaded(): boolean {
    return this.cacheLoaded;
  }
}
