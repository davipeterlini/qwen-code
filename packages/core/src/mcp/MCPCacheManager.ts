/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Storage } from '../config/storage.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import type { MCPTool, MCPResource, MCPPrompt } from './types.js';

const debugLogger = createDebugLogger('MCP_CACHE');

/**
 * Cached data structure
 */
interface MCPCacheData {
  servers: Map<string, MCPServerCacheEntry>;
  lastUpdated: string;
  version: number;
}

interface MCPServerCacheEntry {
  serverId: string;
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
  tokenCost: number;
  cachedAt: string;
  expiresAt: string;
}

/**
 * MCP Cache Manager
 *
 * Caches MCP server tools, resources, and prompts between sessions
 * to speed up initialization and reduce API calls.
 */
export class MCPCacheManager {
  private cachePath: string;
  private cache: MCPCacheData | null = null;
  private cacheTTL: number; // in milliseconds

  constructor(cacheTTLMinutes: number = 60) {
    this.cachePath = path.join(
      Storage.getGlobalQwenDir(),
      'tmp',
      'mcp-cache.json',
    );
    this.cacheTTL = cacheTTLMinutes * 60 * 1000;
  }

  /**
   * Initialize cache (load from disk)
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.cachePath), { recursive: true });

      const content = await fs.readFile(this.cachePath, 'utf-8');
      const parsed = JSON.parse(content);

      // Convert plain objects back to Maps
      this.cache = {
        servers: new Map(Object.entries(parsed.servers || {})),
        lastUpdated: parsed.lastUpdated,
        version: parsed.version || 1,
      };

      debugLogger.debug('MCP cache loaded from disk');
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        debugLogger.debug('MCP cache file not found, creating new cache');
      } else {
        debugLogger.error('Error loading MCP cache:', error);
      }

      this.cache = {
        servers: new Map(),
        lastUpdated: new Date().toISOString(),
        version: 1,
      };
    }
  }

  /**
   * Cache server data
   */
  async cacheServer(
    serverId: string,
    tools: MCPTool[],
    resources: MCPResource[],
    prompts: MCPPrompt[],
    tokenCost: number,
  ): Promise<void> {
    if (!this.cache) {
      await this.initialize();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.cacheTTL);

    const entry: MCPServerCacheEntry = {
      serverId,
      tools,
      resources,
      prompts,
      tokenCost,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.cache!.servers.set(serverId, entry);
    this.cache!.lastUpdated = now.toISOString();

    await this.save();
    debugLogger.debug(`Cached server ${serverId} with ${tools.length} tools`);
  }

  /**
   * Get cached server data
   */
  async getCachedServer(serverId: string): Promise<MCPServerCacheEntry | null> {
    if (!this.cache) {
      await this.initialize();
    }

    const entry = this.cache!.servers.get(serverId);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(entry.expiresAt);

    if (now > expiresAt) {
      debugLogger.debug(`Cache expired for server ${serverId}`);
      await this.removeCachedServer(serverId);
      return null;
    }

    debugLogger.debug(`Cache hit for server ${serverId}`);
    return entry;
  }

  /**
   * Remove cached server data
   */
  async removeCachedServer(serverId: string): Promise<boolean> {
    if (!this.cache) {
      return false;
    }

    const deleted = this.cache.servers.delete(serverId);

    if (deleted) {
      await this.save();
      debugLogger.debug(`Removed cached server ${serverId}`);
    }

    return deleted;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache = {
      servers: new Map(),
      lastUpdated: new Date().toISOString(),
      version: 1,
    };

    await this.save();
    debugLogger.debug('MCP cache cleared');
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalServers: number;
    totalTools: number;
    totalResources: number;
    totalPrompts: number;
    cacheSize: number;
    lastUpdated: string | null;
  }> {
    if (!this.cache) {
      await this.initialize();
    }

    let totalTools = 0;
    let totalResources = 0;
    let totalPrompts = 0;

    for (const [, entry] of this.cache!.servers.entries()) {
      totalTools += entry.tools.length;
      totalResources += entry.resources.length;
      totalPrompts += entry.prompts.length;
    }

    // Calculate cache size
    let cacheSize = 0;
    try {
      const stats = await fs.stat(this.cachePath);
      cacheSize = stats.size;
    } catch {
      // File doesn't exist yet
    }

    return {
      totalServers: this.cache!.servers.size,
      totalTools,
      totalResources,
      totalPrompts,
      cacheSize,
      lastUpdated: this.cache!.lastUpdated || null,
    };
  }

  /**
   * Get frequently used servers (based on cache hits)
   */
  getFrequentlyUsedServers(): Array<{ serverId: string; toolCount: number }> {
    if (!this.cache) {
      return [];
    }

    const servers: Array<{ serverId: string; toolCount: number }> = [];

    for (const [serverId, entry] of this.cache!.servers.entries()) {
      servers.push({
        serverId,
        toolCount: entry.tools.length,
      });
    }

    return servers.sort((a, b) => b.toolCount - a.toolCount);
  }

  /**
   * Save cache to disk
   */
  private async save(): Promise<void> {
    try {
      if (!this.cache) {
        return;
      }

      // Convert Map to plain object for JSON serialization
      const serializable = {
        servers: Object.fromEntries(this.cache.servers),
        lastUpdated: this.cache.lastUpdated,
        version: this.cache.version,
      };

      await fs.writeFile(
        this.cachePath,
        JSON.stringify(serializable, null, 2),
        'utf-8',
      );
    } catch (error) {
      debugLogger.error('Error saving MCP cache:', error);
    }
  }

  /**
   * Clean expired entries
   */
  async cleanExpired(): Promise<number> {
    if (!this.cache) {
      await this.initialize();
    }

    const now = new Date();
    let removed = 0;

    for (const [serverId, entry] of this.cache!.servers.entries()) {
      const expiresAt = new Date(entry.expiresAt);

      if (now > expiresAt) {
        this.cache!.servers.delete(serverId);
        removed++;
      }
    }

    if (removed > 0) {
      await this.save();
      debugLogger.debug(`Cleaned ${removed} expired cache entries`);
    }

    return removed;
  }

  /**
   * Pre-warm cache with frequently used servers
   */
  async preWarmFrequentlyUsed(): Promise<void> {
    const frequentServers = this.getFrequentlyUsedServers();

    debugLogger.debug(
      `Pre-warming cache with ${frequentServers.length} frequently used servers`,
    );

    // Cache will be populated when servers are loaded
    // This method is mainly for tracking and statistics
  }
}

/**
 * Create a new MCPCacheManager instance
 */
export function createMCPCacheManager(ttlMinutes?: number): MCPCacheManager {
  return new MCPCacheManager(ttlMinutes);
}
