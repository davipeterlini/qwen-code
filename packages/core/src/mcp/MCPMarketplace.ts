/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * MCP Server entry in the marketplace
 */
export interface MCPServerEntry {
  id: string;
  name: string;
  description: string;
  author: string;
  repository: string;
  npmPackage?: string;
  category: MCPServerCategory;
  tags: string[];
  rating: number;
  downloads: number;
  verified: boolean;
  transport: 'stdio' | 'sse' | 'websocket';
  requiresAuth: boolean;
  tokenCost: number;
  lastUpdated: string;
  version: string;
}

export type MCPServerCategory =
  | 'development'
  | 'productivity'
  | 'communication'
  | 'database'
  | 'filesystem'
  | 'web'
  | 'ai'
  | 'cloud'
  | 'monitoring'
  | 'other';

/**
 * Official MCP Servers curated for the marketplace
 */
export const OFFICIAL_MCP_SERVERS: MCPServerEntry[] = [
  {
    id: 'context7',
    name: 'Context7',
    description: 'Fetch up-to-date documentation for any library or framework',
    author: 'Upstash',
    repository: 'https://github.com/upstash/context7-mcp',
    npmPackage: '@upstash/context7-mcp',
    category: 'development',
    tags: ['documentation', 'libraries', 'frameworks', 'api'],
    rating: 4.9,
    downloads: 150000,
    verified: true,
    transport: 'stdio',
    requiresAuth: false,
    tokenCost: 3000,
    lastUpdated: '2025-02-01',
    version: '1.0.0',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access GitHub issues, PRs, and repository information',
    author: 'Anthropic',
    repository: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-github',
    category: 'development',
    tags: ['github', 'git', 'issues', 'pull requests', 'repository'],
    rating: 4.8,
    downloads: 200000,
    verified: true,
    transport: 'stdio',
    requiresAuth: true,
    tokenCost: 2500,
    lastUpdated: '2025-02-10',
    version: '1.0.0',
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Advanced file operations with sandbox access',
    author: 'Anthropic',
    repository: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-filesystem',
    category: 'filesystem',
    tags: ['files', 'directory', 'read', 'write', 'filesystem'],
    rating: 4.7,
    downloads: 180000,
    verified: true,
    transport: 'stdio',
    requiresAuth: false,
    tokenCost: 1500,
    lastUpdated: '2025-02-05',
    version: '1.0.0',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Query PostgreSQL databases',
    author: 'Anthropic',
    repository: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-postgres',
    category: 'database',
    tags: ['postgres', 'postgresql', 'database', 'sql', 'query'],
    rating: 4.6,
    downloads: 90000,
    verified: true,
    transport: 'stdio',
    requiresAuth: false,
    tokenCost: 1800,
    lastUpdated: '2025-01-28',
    version: '1.0.0',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages and search Slack channels',
    author: 'Anthropic',
    repository: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-slack',
    category: 'communication',
    tags: ['slack', 'messaging', 'channels', 'communication'],
    rating: 4.5,
    downloads: 75000,
    verified: true,
    transport: 'stdio',
    requiresAuth: true,
    tokenCost: 1200,
    lastUpdated: '2025-01-25',
    version: '1.0.0',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Read and write Notion pages and databases',
    author: 'Anthropic',
    repository: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-notion',
    category: 'productivity',
    tags: ['notion', 'pages', 'database', 'workspace', 'notes'],
    rating: 4.6,
    downloads: 85000,
    verified: true,
    transport: 'stdio',
    requiresAuth: true,
    tokenCost: 1500,
    lastUpdated: '2025-02-01',
    version: '1.0.0',
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Navigate websites and take screenshots',
    author: 'Anthropic',
    repository: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-puppeteer',
    category: 'web',
    tags: ['browser', 'puppeteer', 'screenshot', 'web', 'navigation'],
    rating: 4.4,
    downloads: 65000,
    verified: true,
    transport: 'stdio',
    requiresAuth: false,
    tokenCost: 2000,
    lastUpdated: '2025-01-30',
    version: '1.0.0',
  },
  {
    id: 'memory',
    name: 'Memory Bank',
    description: 'Long-term memory for Qwen Code conversations',
    author: 'Anthropic',
    repository: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-memory',
    category: 'ai',
    tags: ['memory', 'conversation', 'context', 'long-term'],
    rating: 4.7,
    downloads: 120000,
    verified: true,
    transport: 'stdio',
    requiresAuth: false,
    tokenCost: 1000,
    lastUpdated: '2025-02-08',
    version: '1.0.0',
  },
  {
    id: 'git',
    name: 'Git',
    description: 'Git operations and repository management',
    author: 'Anthropic',
    repository: 'https://github.com/modelcontextprotocol/servers',
    npmPackage: '@modelcontextprotocol/server-git',
    category: 'development',
    tags: ['git', 'repository', 'commit', 'branch', 'version control'],
    rating: 4.5,
    downloads: 95000,
    verified: true,
    transport: 'stdio',
    requiresAuth: false,
    tokenCost: 1800,
    lastUpdated: '2025-02-03',
    version: '1.0.0',
  },
];

/**
 * MCP Marketplace Manager
 *
 * Provides access to the official MCP server marketplace.
 * Allows browsing, searching, and installing MCP servers.
 */
export class MCPMarketplaceManager {
  private servers: MCPServerEntry[] = OFFICIAL_MCP_SERVERS;

  /**
   * Get all marketplace servers
   */
  getAllServers(): MCPServerEntry[] {
    return [...this.servers];
  }

  /**
   * Search servers by query
   */
  search(query: string): MCPServerEntry[] {
    const lowerQuery = query.toLowerCase();

    return this.servers.filter(
      (server) =>
        server.name.toLowerCase().includes(lowerQuery) ||
        server.description.toLowerCase().includes(lowerQuery) ||
        server.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        server.category.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * Get servers by category
   */
  getByCategory(category: MCPServerCategory): MCPServerEntry[] {
    return this.servers.filter((server) => server.category === category);
  }

  /**
   * Get server by ID
   */
  getServerById(id: string): MCPServerEntry | null {
    return this.servers.find((server) => server.id === id) || null;
  }

  /**
   * Get verified servers
   */
  getVerifiedServers(): MCPServerEntry[] {
    return this.servers.filter((server) => server.verified);
  }

  /**
   * Get top rated servers
   */
  getTopRated(limit: number = 10): MCPServerEntry[] {
    return [...this.servers]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Get most downloaded servers
   */
  getMostDownloaded(limit: number = 10): MCPServerEntry[] {
    return [...this.servers]
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }

  /**
   * Get recently updated servers
   */
  getRecentlyUpdated(limit: number = 10): MCPServerEntry[] {
    return [...this.servers]
      .sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      )
      .slice(0, limit);
  }

  /**
   * Get servers that don't require auth
   */
  getNoAuthServers(): MCPServerEntry[] {
    return this.servers.filter((server) => !server.requiresAuth);
  }

  /**
   * Get installation command for a server
   */
  getInstallCommand(serverId: string): string | null {
    const server = this.getServerById(serverId);

    if (!server?.npmPackage) {
      return null;
    }

    return `npx -y ${server.npmPackage}`;
  }

  /**
   * Format marketplace display
   */
  formatDisplay(filter?: {
    category?: MCPServerCategory;
    search?: string;
    verified?: boolean;
  }): string {
    let servers = this.servers;

    if (filter?.category) {
      servers = this.getByCategory(filter.category);
    }

    if (filter?.search) {
      servers = this.search(filter.search);
    }

    if (filter?.verified) {
      servers = this.getVerifiedServers();
    }

    if (servers.length === 0) {
      return 'No MCP servers found matching your criteria.';
    }

    let output = '🔌 MCP Server Marketplace\\n\\n';
    output += '='.repeat(60) + '\\n\\n';

    // Group by category
    const byCategory = new Map<MCPServerCategory, MCPServerEntry[]>();
    for (const server of servers) {
      const categoryServers = byCategory.get(server.category) || [];
      categoryServers.push(server);
      byCategory.set(server.category, categoryServers);
    }

    for (const [category, categoryServers] of byCategory.entries()) {
      output += `📁 **${this.formatCategory(category)}** (${categoryServers.length})\\n`;
      output += '-'.repeat(40) + '\\n';

      for (const server of categoryServers) {
        const verifiedBadge = server.verified ? ' ✅' : '';
        const authBadge = server.requiresAuth ? ' 🔐' : '';

        output += `\\n  **${server.name}** (${server.id})${verifiedBadge}${authBadge}\\n`;
        output += `     ${server.description}\\n`;
        output += `     ⭐ ${server.rating} | ⬇️ ${this.formatDownloads(server.downloads)} | 💰 ${server.tokenCost} tokens\\n`;
        output += `     Tags: ${server.tags.join(', ')}\\n`;
        output += `     Install: /mcp add ${server.id} --command "npx -y ${server.npmPackage}"\\n`;
      }

      output += '\\n';
    }

    output += '\\n' + '='.repeat(60) + '\\n';
    output += '\\nTip: Use /mcp add <server-id> to install a server\\n';
    output += 'See full details: /mcp marketplace <server-id>\\n';

    return output;
  }

  /**
   * Format category name
   */
  private formatCategory(category: MCPServerCategory): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }

  /**
   * Format downloads number
   */
  private formatDownloads(downloads: number): string {
    if (downloads >= 1000000) {
      return `${(downloads / 1000000).toFixed(1)}M`;
    }
    if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(0)}K`;
    }
    return downloads.toString();
  }
}

/**
 * Create a new MCPMarketplaceManager instance
 */
export function createMCPMarketplaceManager(): MCPMarketplaceManager {
  return new MCPMarketplaceManager();
}
