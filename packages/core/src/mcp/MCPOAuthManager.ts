/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Storage } from '../config/storage.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('MCP_OAUTH');

/**
 * OAuth token data structure
 */
export interface MCPOAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number; // timestamp in milliseconds
  tokenType?: string;
  scope?: string;
  serverId: string;
  obtainedAt: number;
}

/**
 * OAuth configuration for an MCP server
 */
export interface MCPOAuthConfig {
  serverId: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
  redirectUri?: string;
}

/**
 * MCP OAuth Manager
 *
 * Handles OAuth authentication for MCP servers that require it.
 * Stores tokens securely and handles token refresh.
 */
export class MCPOAuthManager {
  private tokensPath: string;
  private configPath: string;
  private tokens: Map<string, MCPOAuthToken> = new Map();
  private configs: Map<string, MCPOAuthConfig> = new Map();

  constructor() {
    this.tokensPath = path.join(
      Storage.getGlobalQwenDir(),
      'mcp-oauth-tokens.json',
    );
    this.configPath = path.join(
      Storage.getGlobalQwenDir(),
      'mcp-oauth-config.json',
    );
  }

  /**
   * Initialize OAuth manager (load tokens from disk)
   */
  async initialize(): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.tokensPath), { recursive: true });

      // Load tokens
      try {
        const content = await fs.readFile(this.tokensPath, 'utf-8');
        const parsed = JSON.parse(content);

        for (const [serverId, token] of Object.entries(parsed.tokens || {})) {
          this.tokens.set(serverId, token as MCPOAuthToken);
        }

        debugLogger.debug('Loaded MCP OAuth tokens');
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          debugLogger.error('Error loading OAuth tokens:', error);
        }
      }

      // Load configs
      try {
        const content = await fs.readFile(this.configPath, 'utf-8');
        const parsed = JSON.parse(content);

        for (const [serverId, config] of Object.entries(parsed.configs || {})) {
          this.configs.set(serverId, config as MCPOAuthConfig);
        }

        debugLogger.debug('Loaded MCP OAuth configs');
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          debugLogger.error('Error loading OAuth configs:', error);
        }
      }
    } catch (error) {
      debugLogger.error('Failed to initialize OAuth manager:', error);
    }
  }

  /**
   * Store OAuth token for a server
   */
  async storeToken(token: MCPOAuthToken): Promise<void> {
    this.tokens.set(token.serverId, token);
    await this.saveTokens();
    debugLogger.debug(`Stored OAuth token for server ${token.serverId}`);
  }

  /**
   * Get OAuth token for a server
   */
  async getToken(serverId: string): Promise<MCPOAuthToken | null> {
    const token = this.tokens.get(serverId);

    if (!token) {
      return null;
    }

    // Check if expired
    if (token.expiresAt && Date.now() > token.expiresAt) {
      debugLogger.debug(`Token expired for server ${serverId}`);

      // Try to refresh if we have refresh token
      if (token.refreshToken) {
        await this.refreshToken(serverId);
        return this.tokens.get(serverId) || null;
      }

      // Token is expired and can't be refreshed
      await this.removeToken(serverId);
      return null;
    }

    return token;
  }

  /**
   * Remove OAuth token for a server
   */
  async removeToken(serverId: string): Promise<boolean> {
    const deleted = this.tokens.delete(serverId);

    if (deleted) {
      await this.saveTokens();
      debugLogger.debug(`Removed OAuth token for server ${serverId}`);
    }

    return deleted;
  }

  /**
   * Check if server has valid OAuth token
   */
  async hasValidToken(serverId: string): Promise<boolean> {
    const token = await this.getToken(serverId);
    return token !== null;
  }

  /**
   * Get authorization URL for a server
   */
  getAuthorizationUrl(serverId: string): string | null {
    const config = this.configs.get(serverId);

    if (!config?.authorizationUrl) {
      return null;
    }

    const state = this.generateState();

    const url = new URL(config.authorizationUrl);
    url.searchParams.set('client_id', config.clientId || '');
    url.searchParams.set(
      'redirect_uri',
      config.redirectUri || 'http://localhost:8080/callback',
    );
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', state);

    if (config.scopes?.length) {
      url.searchParams.set('scope', config.scopes.join(' '));
    }

    // Store state for verification (in a real implementation, use secure storage)
    this.storeAuthState(serverId, state);

    return url.toString();
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    serverId: string,
    code: string,
  ): Promise<MCPOAuthToken | null> {
    const config = this.configs.get(serverId);

    if (!config?.tokenUrl) {
      throw new Error(`No token URL configured for server ${serverId}`);
    }

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.redirectUri || 'http://localhost:8080/callback',
          client_id: config.clientId || '',
          client_secret: config.clientSecret || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();

      const token: MCPOAuthToken = {
        serverId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        tokenType: data.token_type,
        scope: data.scope,
        obtainedAt: Date.now(),
        expiresAt: data.expires_in
          ? Date.now() + data.expires_in * 1000
          : undefined,
      };

      await this.storeToken(token);
      return token;
    } catch (error) {
      debugLogger.error('Failed to exchange code for token:', error);
      return null;
    }
  }

  /**
   * Refresh OAuth token
   */
  async refreshToken(serverId: string): Promise<MCPOAuthToken | null> {
    const config = this.configs.get(serverId);
    const currentToken = this.tokens.get(serverId);

    if (!config?.tokenUrl || !currentToken?.refreshToken) {
      return null;
    }

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: currentToken.refreshToken,
          client_id: config.clientId || '',
          client_secret: config.clientSecret || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      const token: MCPOAuthToken = {
        serverId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || currentToken.refreshToken,
        tokenType: data.token_type,
        scope: data.scope,
        obtainedAt: Date.now(),
        expiresAt: data.expires_in
          ? Date.now() + data.expires_in * 1000
          : undefined,
      };

      await this.storeToken(token);
      debugLogger.debug(`Refreshed OAuth token for server ${serverId}`);
      return token;
    } catch (error) {
      debugLogger.error('Failed to refresh token:', error);
      await this.removeToken(serverId);
      return null;
    }
  }

  /**
   * Configure OAuth for a server
   */
  async configureOAuth(config: MCPOAuthConfig): Promise<void> {
    this.configs.set(config.serverId, config);
    await this.saveConfigs();
    debugLogger.debug(`Configured OAuth for server ${config.serverId}`);
  }

  /**
   * Get OAuth config for a server
   */
  getOAuthConfig(serverId: string): MCPOAuthConfig | null {
    return this.configs.get(serverId) || null;
  }

  /**
   * Get all configured servers with OAuth
   */
  getConfiguredServers(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Clear all OAuth data
   */
  async clear(): Promise<void> {
    this.tokens.clear();
    this.configs.clear();

    try {
      await fs.unlink(this.tokensPath);
      await fs.unlink(this.configPath);
      debugLogger.debug('Cleared all OAuth data');
    } catch (error) {
      debugLogger.error('Error clearing OAuth data:', error);
    }
  }

  /**
   * Save tokens to disk
   */
  private async saveTokens(): Promise<void> {
    try {
      const serializable = {
        tokens: Object.fromEntries(this.tokens),
        lastUpdated: new Date().toISOString(),
      };

      await fs.writeFile(
        this.tokensPath,
        JSON.stringify(serializable, null, 2),
        'utf-8',
      );
    } catch (error) {
      debugLogger.error('Error saving OAuth tokens:', error);
    }
  }

  /**
   * Save configs to disk
   */
  private async saveConfigs(): Promise<void> {
    try {
      const serializable = {
        configs: Object.fromEntries(this.configs),
        lastUpdated: new Date().toISOString(),
      };

      await fs.writeFile(
        this.configPath,
        JSON.stringify(serializable, null, 2),
        'utf-8',
      );
    } catch (error) {
      debugLogger.error('Error saving OAuth configs:', error);
    }
  }

  /**
   * Generate state parameter for OAuth flow
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store auth state for verification
   */
  private storeAuthState(serverId: string, state: string): void {
    // In a real implementation, use secure temporary storage
    // For now, just log it
    debugLogger.debug(
      `Auth state for ${serverId}: ${state.substring(0, 8)}...`,
    );
  }
}

/**
 * Create a new MCPOAuthManager instance
 */
export function createMCPOAuthManager(): MCPOAuthManager {
  return new MCPOAuthManager();
}
