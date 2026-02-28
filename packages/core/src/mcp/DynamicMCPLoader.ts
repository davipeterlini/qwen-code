/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createDebugLogger } from '../utils/debugLogger.js';
import type {
  MCPServerConfigSchemaType,
  MCPTool,
  MCPToolResult,
  MCPResource,
  MCPPrompt,
} from './types.js';
import type { MCPRegistry } from './MCPRegistry.js';

const debugLogger = createDebugLogger('MCP_DYNAMIC_LOADER');

/**
 * Dynamic MCP Loader
 *
 * Implements the core functionality of loading MCP tools on-demand,
 * similar to Claude Code's dynamic MCP loading feature.
 *
 * Key features:
 * - Lazy loading of MCP servers and tools
 * - Automatic tool discovery based on user prompts
 * - Token budget management
 * - Connection pooling and reuse
 */
export class DynamicMCPLoader extends EventEmitter {
  private registry: MCPRegistry;
  private connectionPool: Map<string, MCPConnection> = new Map();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  // Auto-load tracking
  private frequentlyUsedTools: Map<string, number> = new Map();
  private autoLoadThreshold = 3; // Load after 3 uses

  constructor(registry: MCPRegistry) {
    super();
    this.registry = registry;

    // Listen to registry events
    this.registry.on('server:state', (event) => {
      this.emit('server:state', event);
    });
  }

  /**
   * Load a specific MCP server on-demand
   */
  async loadServer(config: MCPServerConfigSchemaType): Promise<void> {
    // Check if already loading
    if (this.loadingPromises.has(config.id)) {
      debugLogger.debug(`Server ${config.id} is already loading`);
      return this.loadingPromises.get(config.id);
    }

    // Check if already loaded
    if (this.registry.isServerLoaded(config.id)) {
      debugLogger.debug(`Server ${config.id} is already loaded`);
      return;
    }

    const loadPromise = this.performLoadServer(config);
    this.loadingPromises.set(config.id, loadPromise);

    try {
      await loadPromise;
    } finally {
      this.loadingPromises.delete(config.id);
    }
  }

  /**
   * Perform the actual server loading
   */
  private async performLoadServer(
    config: MCPServerConfigSchemaType,
  ): Promise<void> {
    debugLogger.debug(`Loading MCP server: ${config.id}`);
    this.emit('server:loading', { serverId: config.id });

    try {
      // Update state to connecting
      this.registry.updateServerState(config.id, 'connecting');

      // Create connection based on transport type
      const connection = await this.createConnection(config);
      this.connectionPool.set(config.id, connection);

      // Discover and register tools
      const tools = await connection.listTools();
      this.registry.addTools(config.id, tools);

      // Discover resources
      const resourcesResult = await connection.listResources();
      const resources: MCPResource[] = resourcesResult.map((r) => ({
        ...r,
        serverId: config.id,
      }));
      this.registry.addResources(config.id, resources);

      // Discover prompts
      const promptsResult = await connection.listPrompts();
      const prompts: MCPPrompt[] = promptsResult.map((p) => ({
        ...p,
        serverId: config.id,
      }));
      this.registry.addPrompts(config.id, prompts);

      // Update state to connected
      this.registry.updateServerState(config.id, 'connected');

      debugLogger.debug(
        `Server ${config.id} loaded: ${tools.length} tools, ` +
          `${resources.length} resources, ${prompts.length} prompts`,
      );

      this.emit('server:loaded', {
        serverId: config.id,
        tools,
        resources,
        prompts,
      });
    } catch (error) {
      debugLogger.error(`Failed to load server ${config.id}:`, error);
      this.registry.updateServerState(
        config.id,
        'error',
        (error as Error).message,
      );
      this.emit('server:error', { serverId: config.id, error });
      throw error;
    }
  }

  /**
   * Unload a server to free up tokens
   */
  async unloadServer(serverId: string): Promise<void> {
    const connection = this.connectionPool.get(serverId);
    if (connection) {
      await connection.close();
      this.connectionPool.delete(serverId);
    }

    this.registry.updateServerState(serverId, 'disconnected');
    debugLogger.debug(`Server ${serverId} unloaded`);
    this.emit('server:unloaded', { serverId });
  }

  /**
   * Call a tool, auto-loading the server if needed
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<MCPToolResult> {
    // Find the tool
    const tool = await this.registry.getTool(toolName, true);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Track usage for auto-load
    this.trackToolUsage(toolName);

    // Ensure server is loaded
    if (!this.registry.isServerLoaded(tool.serverId)) {
      const serverConfig = this.registry.getServer(tool.serverId)?.config;
      if (serverConfig) {
        await this.loadServer(serverConfig);
      }
    }

    // Call the tool
    const connection = this.connectionPool.get(tool.serverId);
    if (!connection) {
      throw new Error(`No connection for server: ${tool.serverId}`);
    }

    const result = await connection.callTool(toolName, args);

    this.emit('tool:called', {
      toolName,
      args,
      result,
      serverId: tool.serverId,
    });

    return result;
  }

  /**
   * Discover tools from all enabled servers
   * This is used for the /mcp discover command
   */
  async discoverAllTools(): Promise<MCPTool[]> {
    debugLogger.debug('Discovering all tools from MCP servers...');
    this.emit('tools:discovering');

    const allTools: MCPTool[] = [];

    // Get all registered servers
    const servers = this.registry.getAllServers();

    for (const server of servers) {
      if (!server.config.enabled) {
        continue;
      }

      try {
        // Load server if not already loaded
        if (!this.registry.isServerLoaded(server.config.id)) {
          await this.loadServer(server.config);
        }

        const tools = this.registry.getToolsByServer(server.config.id);
        allTools.push(...tools);
      } catch (error) {
        debugLogger.error(
          `Failed to discover tools from ${server.config.id}:`,
          error,
        );
      }
    }

    this.emit('tools:discovered', { tools: allTools });
    return allTools;
  }

  /**
   * Get frequently used tools (candidates for auto-load)
   */
  getFrequentlyUsedTools(): Array<{ toolName: string; usageCount: number }> {
    const frequentlyUsed: Array<{ toolName: string; usageCount: number }> = [];

    for (const [toolName, count] of this.frequentlyUsedTools.entries()) {
      if (count >= this.autoLoadThreshold) {
        frequentlyUsed.push({ toolName, usageCount: count });
      }
    }

    return frequentlyUsed.sort((a, b) => b.usageCount - a.usageCount);
  }

  /**
   * Enable auto-load for frequently used tools
   */
  async enableAutoLoad(): Promise<void> {
    const frequentlyUsed = this.getFrequentlyUsedTools();

    for (const { toolName } of frequentlyUsed) {
      const tool = await this.registry.getTool(toolName, false);
      if (tool && !this.registry.isServerLoaded(tool.serverId)) {
        const serverConfig = this.registry.getServer(tool.serverId)?.config;
        if (serverConfig?.dynamic) {
          await this.loadServer(serverConfig);
        }
      }
    }

    debugLogger.debug(
      `Auto-loaded ${frequentlyUsed.length} frequently used tools`,
    );
  }

  /**
   * Track tool usage for auto-load heuristics
   */
  private trackToolUsage(toolName: string): void {
    const currentCount = this.frequentlyUsedTools.get(toolName) || 0;
    this.frequentlyUsedTools.set(toolName, currentCount + 1);
  }

  /**
   * Create a connection to an MCP server
   */
  private async createConnection(
    config: MCPServerConfigSchemaType,
  ): Promise<MCPConnection> {
    const connection = new MCPConnection(config);
    await connection.connect();
    return connection;
  }

  /**
   * Get connection pool stats
   */
  getConnectionStats(): {
    totalConnections: number;
    activeServers: string[];
  } {
    return {
      totalConnections: this.connectionPool.size,
      activeServers: Array.from(this.connectionPool.keys()),
    };
  }

  /**
   * Clear all connections and reset state
   */
  async clear(): Promise<void> {
    // Close all connections
    for (const [, connection] of this.connectionPool.entries()) {
      await connection.close();
    }

    this.connectionPool.clear();
    this.frequentlyUsedTools.clear();

    debugLogger.debug('Dynamic MCP Loader cleared');
  }
}

/**
 * MCP Connection - handles communication with a single MCP server
 */
class MCPConnection {
  private config: MCPServerConfigSchemaType;
  private process: ReturnType<typeof spawn> | null = null;
  private messageId = 0;
  private pendingRequests: Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
    }
  > = new Map();

  constructor(config: MCPServerConfigSchemaType) {
    this.config = config;
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    if (this.config.transport === 'stdio' && this.config.command) {
      await this.connectStdio();
    } else if (this.config.transport === 'sse' && this.config.url) {
      await this.connectSSE();
    } else if (this.config.transport === 'websocket' && this.config.url) {
      await this.connectWebSocket();
    } else {
      throw new Error(
        `Invalid transport configuration for server ${this.config.id}`,
      );
    }
  }

  /**
   * Connect using stdio transport
   */
  private async connectStdio(): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = this.config.command!.split(' ')[0];
      const args = [
        ...this.config.command!.split(' ').slice(1),
        ...(this.config.args || []),
      ];

      debugLogger.debug(`Spawning MCP server: ${command} ${args.join(' ')}`);

      this.process = spawn(command, args, {
        env: { ...process.env, ...this.config.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.process.on('error', (error) => {
        debugLogger.error(`MCP server process error:`, error);
        reject(error);
      });

      this.process.on('exit', (code) => {
        debugLogger.debug(`MCP server exited with code ${code}`);
        this.process = null;
      });

      // Set up message handler
      let buffer = '';
      if (this.process?.stdout) {
        this.process.stdout.on('data', (data: Buffer) => {
          buffer += data.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              this.handleMessage(JSON.parse(line));
            }
          }
        });
      }

      // Give the process a moment to start
      setTimeout(resolve, 100);
    });
  }

  /**
   * Connect using SSE transport
   */
  private async connectSSE(): Promise<void> {
    // Placeholder for SSE implementation
    debugLogger.debug(
      `SSE connection to ${this.config.url} not yet implemented`,
    );
    throw new Error('SSE transport not yet implemented');
  }

  /**
   * Connect using WebSocket transport
   */
  private async connectWebSocket(): Promise<void> {
    // Placeholder for WebSocket implementation
    debugLogger.debug(
      `WebSocket connection to ${this.config.url} not yet implemented`,
    );
    throw new Error('WebSocket transport not yet implemented');
  }

  /**
   * Handle incoming messages from the server
   */
  private handleMessage(message: {
    id?: number;
    result?: unknown;
    error?: { message: string };
  }): void {
    if (message.id !== undefined) {
      const pending = this.pendingRequests.get(message.id);
      if (pending) {
        this.pendingRequests.delete(message.id);

        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
      }
    }
  }

  /**
   * Send a JSON-RPC request to the server
   */
  private async sendRequest(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<unknown> {
    const id = ++this.messageId;

    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params: params || {},
      };

      this.pendingRequests.set(id, { resolve, reject });

      if (this.process?.stdin) {
        this.process.stdin.write(JSON.stringify(request) + '\n');
      } else {
        reject(new Error('Not connected'));
      }

      // Timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, this.config.timeout);
    });
  }

  /**
   * List available tools from the server
   */
  async listTools(): Promise<MCPTool[]> {
    const result = await this.sendRequest('tools/list');
    return (result as { tools: MCPTool[] }).tools || [];
  }

  /**
   * List available resources from the server
   */
  async listResources(): Promise<
    Array<{ uri: string; name: string; serverId?: string }>
  > {
    const result = await this.sendRequest('resources/list');
    return (
      (result as { resources: Array<{ uri: string; name: string }> })
        .resources || []
    );
  }

  /**
   * List available prompts from the server
   */
  async listPrompts(): Promise<
    Array<{ name: string; description?: string; serverId?: string }>
  > {
    const result = await this.sendRequest('prompts/list');
    return (result as { prompts: Array<{ name: string }> }).prompts || [];
  }

  /**
   * Call a tool on the server
   */
  async callTool(
    name: string,
    toolArgs: Record<string, unknown>,
  ): Promise<MCPToolResult> {
    const result = await this.sendRequest('tools/call', {
      name,
      arguments: toolArgs,
    });
    return result as MCPToolResult;
  }

  /**
   * Close the connection
   */
  async close(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }

    // Reject any pending requests
    for (const [id, pending] of this.pendingRequests.entries()) {
      pending.reject(new Error('Connection closed'));
      this.pendingRequests.delete(id);
    }

    debugLogger.debug(`Connection closed for server ${this.config.id}`);
  }
}

/**
 * Create a new DynamicMCPLoader instance
 */
export function createDynamicMCPLoader(
  registry: MCPRegistry,
): DynamicMCPLoader {
  return new DynamicMCPLoader(registry);
}
