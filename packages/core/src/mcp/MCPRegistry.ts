/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { createDebugLogger } from '../utils/debugLogger.js';
import type {
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPServerInfo,
  MCPConnectionState,
} from './types.js';
import type { MCPServerConfigSchemaType } from './types.js';

const debugLogger = createDebugLogger('MCP_REGISTRY');

/**
 * Registry for managing MCP servers, tools, resources, and prompts
 * Tracks connection states and provides discovery mechanisms
 */
export class MCPRegistry extends EventEmitter {
  private servers: Map<string, MCPServerInfo> = new Map();
  private toolsByName: Map<string, MCPTool> = new Map();
  private resourcesByUri: Map<string, MCPResource> = new Map();
  private promptsByName: Map<string, MCPPrompt> = new Map();

  // Dynamic loading state
  private dynamicLoadingEnabled = true;
  private loadedServerIds: Set<string> = new Set();
  private tokenBudget: number = 50000;
  private currentTokenUsage: number = 0;

  /**
   * Register a new MCP server
   */
  registerServer(config: MCPServerConfigSchemaType): void {
    const serverInfo: MCPServerInfo = {
      config,
      state: 'disconnected',
      tools: [],
      resources: [],
      prompts: [],
      tokenCost: this.estimateTokenCost(config),
    };

    this.servers.set(config.id, serverInfo);
    debugLogger.debug(`Registered MCP server: ${config.id}`);
    this.emit('server:registered', { serverId: config.id });
  }

  /**
   * Unregister an MCP server
   */
  unregisterServer(serverId: string): boolean {
    const server = this.servers.get(serverId);
    if (!server) {
      return false;
    }

    // Remove all associated tools, resources, prompts
    server.tools.forEach((tool) => {
      this.toolsByName.delete(tool.name);
    });
    server.resources.forEach((resource) => {
      this.resourcesByUri.delete(resource.uri);
    });
    server.prompts.forEach((prompt) => {
      this.promptsByName.delete(prompt.name);
    });

    this.servers.delete(serverId);
    this.loadedServerIds.delete(serverId);

    debugLogger.debug(`Unregistered MCP server: ${serverId}`);
    this.emit('server:unregistered', { serverId });
    return true;
  }

  /**
   * Update server connection state
   */
  updateServerState(
    serverId: string,
    state: MCPConnectionState,
    error?: string,
  ): void {
    const server = this.servers.get(serverId);
    if (!server) {
      return;
    }

    server.state = state;
    if (state === 'connected') {
      server.lastConnected = new Date().toISOString();
      this.loadedServerIds.add(serverId);
      this.currentTokenUsage += server.tokenCost;
    } else if (state === 'error') {
      server.lastError = error;
    } else if (state === 'disconnected') {
      this.loadedServerIds.delete(serverId);
      this.currentTokenUsage = Math.max(
        0,
        this.currentTokenUsage - server.tokenCost,
      );
    }

    debugLogger.debug(`Server ${serverId} state: ${state}`);
    this.emit('server:state', { serverId, state, error });
  }

  /**
   * Add tools from a server
   */
  addTools(serverId: string, tools: MCPTool[]): void {
    const server = this.servers.get(serverId);
    if (!server) {
      debugLogger.warn(`Cannot add tools: server ${serverId} not found`);
      return;
    }

    server.tools = tools;
    tools.forEach((tool) => {
      this.toolsByName.set(tool.name, tool);
    });

    debugLogger.debug(`Added ${tools.length} tools from server ${serverId}`);
    this.emit('tools:updated', { serverId, tools });
  }

  /**
   * Add resources from a server
   */
  addResources(serverId: string, resources: MCPResource[]): void {
    const server = this.servers.get(serverId);
    if (!server) {
      return;
    }

    server.resources = resources;
    resources.forEach((resource) => {
      this.resourcesByUri.set(resource.uri, resource);
    });

    debugLogger.debug(
      `Added ${resources.length} resources from server ${serverId}`,
    );
    this.emit('resources:updated', { serverId, resources });
  }

  /**
   * Add prompts from a server
   */
  addPrompts(serverId: string, prompts: MCPPrompt[]): void {
    const server = this.servers.get(serverId);
    if (!server) {
      return;
    }

    server.prompts = prompts;
    prompts.forEach((prompt) => {
      this.promptsByName.set(prompt.name, prompt);
    });

    debugLogger.debug(
      `Added ${prompts.length} prompts from server ${serverId}`,
    );
    this.emit('prompts:updated', { serverId, prompts });
  }

  /**
   * Get a tool by name (auto-loads server if dynamic loading is enabled)
   */
  async getTool(
    name: string,
    autoLoad: boolean = true,
  ): Promise<MCPTool | null> {
    const tool = this.toolsByName.get(name);

    if (tool || !autoLoad || !this.dynamicLoadingEnabled) {
      return tool || null;
    }

    // Tool not found, try to discover from available servers
    await this.discoverTools();
    return this.toolsByName.get(name) || null;
  }

  /**
   * Get all registered tools
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.toolsByName.values());
  }

  /**
   * Get tools by server
   */
  getToolsByServer(serverId: string): MCPTool[] {
    const server = this.servers.get(serverId);
    return server?.tools || [];
  }

  /**
   * Get all resources
   */
  getAllResources(): MCPResource[] {
    return Array.from(this.resourcesByUri.values());
  }

  /**
   * Get all prompts
   */
  getAllPrompts(): MCPPrompt[] {
    return Array.from(this.promptsByName.values());
  }

  /**
   * Get server info by ID
   */
  getServer(serverId: string): MCPServerInfo | null {
    return this.servers.get(serverId) || null;
  }

  /**
   * Get all servers
   */
  getAllServers(): MCPServerInfo[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get only connected servers
   */
  getConnectedServers(): MCPServerInfo[] {
    return Array.from(this.servers.values()).filter(
      (s) => s.state === 'connected',
    );
  }

  /**
   * Check if dynamic loading is enabled
   */
  isDynamicLoadingEnabled(): boolean {
    return this.dynamicLoadingEnabled;
  }

  /**
   * Enable/disable dynamic loading
   */
  setDynamicLoadingEnabled(enabled: boolean): void {
    this.dynamicLoadingEnabled = enabled;
    debugLogger.debug(`Dynamic loading: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set token budget for MCP tools
   */
  setTokenBudget(budget: number): void {
    this.tokenBudget = budget;
  }

  /**
   * Get current token usage
   */
  getTokenUsage(): { current: number; budget: number; percentage: number } {
    return {
      current: this.currentTokenUsage,
      budget: this.tokenBudget,
      percentage: (this.currentTokenUsage / this.tokenBudget) * 100,
    };
  }

  /**
   * Check if a server is loaded (connected)
   */
  isServerLoaded(serverId: string): boolean {
    return this.loadedServerIds.has(serverId);
  }

  /**
   * Discover tools from all enabled servers (for dynamic loading)
   */
  async discoverTools(): Promise<void> {
    // This would connect to servers and fetch their tools
    // For now, it's a placeholder for the actual implementation
    debugLogger.debug('Discovering tools from MCP servers...');
    this.emit('tools:discovering');
  }

  /**
   * Estimate token cost for a server configuration
   */
  private estimateTokenCost(config: MCPServerConfigSchemaType): number {
    // Rough estimate based on typical MCP tool sizes
    // This would be more accurate with actual server introspection
    const baseCost = 500; // Base overhead for server connection

    // Estimate based on description length and complexity
    const descriptionTokens = (config.description?.length || 0) / 4;

    return baseCost + descriptionTokens;
  }

  /**
   * Clear all registry data
   */
  clear(): void {
    this.servers.clear();
    this.toolsByName.clear();
    this.resourcesByUri.clear();
    this.promptsByName.clear();
    this.loadedServerIds.clear();
    this.currentTokenUsage = 0;
    debugLogger.debug('MCP Registry cleared');
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalServers: number;
    connectedServers: number;
    totalTools: number;
    totalResources: number;
    totalPrompts: number;
    tokenUsage: number;
    tokenBudget: number;
  } {
    return {
      totalServers: this.servers.size,
      connectedServers: this.getConnectedServers().length,
      totalTools: this.toolsByName.size,
      totalResources: this.resourcesByUri.size,
      totalPrompts: this.promptsByName.size,
      tokenUsage: this.currentTokenUsage,
      tokenBudget: this.tokenBudget,
    };
  }
}

/**
 * Create a new MCPRegistry instance
 */
export function createMCPRegistry(): MCPRegistry {
  return new MCPRegistry();
}
