/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Storage } from '../config/storage.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import type { MCPConfig } from './types.js';
import { MCPConfigSchema, type MCPServerConfigSchemaType } from './types.js';

const debugLogger = createDebugLogger('MCP_CONFIG');

/**
 * Manages MCP configuration loading and persistence
 */
export class MCPConfigManager {
  private configPath: string;
  private config: MCPConfig | null = null;

  constructor() {
    this.configPath = path.join(Storage.getGlobalQwenDir(), 'mcp.json');
  }

  /**
   * Load MCP configuration from disk
   */
  async loadConfig(): Promise<MCPConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(content);
      this.config = MCPConfigSchema.parse(parsed);
      debugLogger.debug(`Loaded MCP config from ${this.configPath}`);
      return this.config;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        debugLogger.debug('MCP config file not found, using defaults');
        this.config = MCPConfigSchema.parse({});
        return this.config;
      }

      debugLogger.error('Error loading MCP config:', error);
      this.config = MCPConfigSchema.parse({});
      return this.config;
    }
  }

  /**
   * Save MCP configuration to disk
   */
  async saveConfig(config: MCPConfig): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });

      await fs.writeFile(
        this.configPath,
        JSON.stringify(config, null, 2),
        'utf-8',
      );

      this.config = config;
      debugLogger.debug(`Saved MCP config to ${this.configPath}`);
    } catch (error) {
      debugLogger.error('Error saving MCP config:', error);
      throw error;
    }
  }

  /**
   * Add a new MCP server configuration
   */
  async addServer(server: MCPServerConfigSchemaType): Promise<void> {
    const config = await this.loadConfig();

    // Check if server with same ID exists
    const existingIndex = config.servers.findIndex((s) => s.id === server.id);

    if (existingIndex !== -1) {
      config.servers[existingIndex] = server;
    } else {
      config.servers.push(server);
    }

    await this.saveConfig(config);
  }

  /**
   * Remove an MCP server configuration
   */
  async removeServer(serverId: string): Promise<boolean> {
    const config = await this.loadConfig();
    const initialLength = config.servers.length;

    config.servers = config.servers.filter((s) => s.id !== serverId);

    if (config.servers.length < initialLength) {
      await this.saveConfig(config);
      return true;
    }

    return false;
  }

  /**
   * Get a specific server configuration
   */
  async getServer(serverId: string): Promise<MCPServerConfigSchemaType | null> {
    const config = await this.loadConfig();
    return config.servers.find((s) => s.id === serverId) || null;
  }

  /**
   * Get all server configurations
   */
  async getServers(): Promise<MCPServerConfigSchemaType[]> {
    const config = await this.loadConfig();
    return config.servers;
  }

  /**
   * Enable or disable a server
   */
  async setServerEnabled(serverId: string, enabled: boolean): Promise<boolean> {
    const config = await this.loadConfig();
    const server = config.servers.find((s) => s.id === serverId);

    if (!server) {
      return false;
    }

    server.enabled = enabled;
    await this.saveConfig(config);
    return true;
  }

  /**
   * Get the global config path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Clear cached config (force reload on next access)
   */
  clearCache(): void {
    this.config = null;
  }
}

/**
 * Create a new MCPConfigManager instance
 */
export function createMCPConfigManager(): MCPConfigManager {
  return new MCPConfigManager();
}
