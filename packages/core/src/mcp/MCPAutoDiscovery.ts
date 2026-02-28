/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createMCPRegistry,
  createDynamicMCPLoader,
} from '@qwen-code/qwen-code-core';
import type { MCPServerConfigSchemaType } from '@qwen-code/qwen-code-core';
import { createDebugLogger } from '@qwen-code/qwen-code-core';

const debugLogger = createDebugLogger('MCP_AUTO_DISCOVERY');

/**
 * Keywords that suggest specific MCP servers
 */
const SERVER_KEYWORDS: Record<string, string[]> = {
  github: [
    'github',
    'git',
    'issue',
    'pr',
    'pull request',
    'repository',
    'repo',
  ],
  context7: [
    'documentation',
    'docs',
    'library',
    'framework',
    'api reference',
    'npm package',
  ],
  filesystem: [
    'file',
    'directory',
    'folder',
    'path',
    'read file',
    'write file',
  ],
  postgres: ['postgres', 'postgresql', 'database', 'sql', 'query', 'table'],
  slack: ['slack', 'message', 'channel', 'send message'],
  notion: ['notion', 'page', 'database', 'workspace'],
  puppeteer: [
    'website',
    'browser',
    'screenshot',
    'navigate',
    'web page',
    'url',
  ],
  memory: ['memory', 'remember', 'recall', 'long-term'],
};

/**
 * Map keywords to server configurations
 */
const SERVER_CONFIGS: Record<string, Partial<MCPServerConfigSchemaType>> = {
  github: {
    id: 'github',
    name: 'GitHub',
    command: 'npx -y @modelcontextprotocol/server-github',
  },
  context7: {
    id: 'context7',
    name: 'Context7',
    command: 'npx -y @upstash/context7-mcp',
  },
  filesystem: {
    id: 'filesystem',
    name: 'Filesystem',
    command: 'npx -y @modelcontextprotocol/server-filesystem',
  },
  postgres: {
    id: 'postgres',
    name: 'PostgreSQL',
    command: 'npx -y @modelcontextprotocol/server-postgres',
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    command: 'npx -y @modelcontextprotocol/server-slack',
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    command: 'npx -y @modelcontextprotocol/server-notion',
  },
  puppeteer: {
    id: 'puppeteer',
    name: 'Puppeteer',
    command: 'npx -y @modelcontextprotocol/server-puppeteer',
  },
  memory: {
    id: 'memory',
    name: 'Memory',
    command: 'npx -y @modelcontextprotocol/server-memory',
  },
};

/**
 * Detect which MCP servers might be needed based on user prompt
 */
export function detectNeededServers(prompt: string): string[] {
  const lowerPrompt = prompt.toLowerCase();
  const neededServers: string[] = [];

  for (const [serverId, keywords] of Object.entries(SERVER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword)) {
        if (!neededServers.includes(serverId)) {
          neededServers.push(serverId);
        }
        break;
      }
    }
  }

  return neededServers;
}

/**
 * Auto-load MCP servers based on prompt
 */
export async function autoLoadServersForPrompt(
  prompt: string,
  configManager: { getServers(): Promise<MCPServerConfigSchemaType[]> },
): Promise<{ loaded: string[]; alreadyLoaded: string[] }> {
  const neededServers = detectNeededServers(prompt);
  const loaded: string[] = [];
  const alreadyLoaded: string[] = [];

  if (neededServers.length === 0) {
    return { loaded, alreadyLoaded };
  }

  const mcpRegistry = createMCPRegistry();
  const dynamicLoader = createDynamicMCPLoader(mcpRegistry);

  // Get configured servers
  const configuredServers = await configManager.getServers();
  const configuredIds = new Set(configuredServers.map((s) => s.id));

  for (const serverId of neededServers) {
    // Check if already loaded
    if (mcpRegistry.isServerLoaded(serverId)) {
      alreadyLoaded.push(serverId);
      continue;
    }

    // Check if configured
    if (!configuredIds.has(serverId)) {
      debugLogger.debug(
        `Server ${serverId} not configured, skipping auto-load`,
      );
      continue;
    }

    // Auto-load the server
    try {
      const serverConfig = configuredServers.find((s) => s.id === serverId);
      if (serverConfig && serverConfig.dynamic) {
        await dynamicLoader.loadServer(serverConfig);
        loaded.push(serverId);
        debugLogger.debug(`Auto-loaded server: ${serverId}`);
      }
    } catch (error) {
      debugLogger.debug(`Failed to auto-load server ${serverId}:`, error);
    }
  }

  return { loaded, alreadyLoaded };
}

/**
 * Get suggestions for MCP servers based on prompt
 */
export function getServerSuggestions(prompt: string): Array<{
  serverId: string;
  name: string;
  reason: string;
  command: string;
}> {
  const neededServers = detectNeededServers(prompt);
  const suggestions: Array<{
    serverId: string;
    name: string;
    reason: string;
    command: string;
  }> = [];

  for (const serverId of neededServers) {
    const config = SERVER_CONFIGS[serverId];
    if (config) {
      const matchedKeywords = SERVER_KEYWORDS[serverId].filter((keyword) =>
        prompt.toLowerCase().includes(keyword),
      );

      suggestions.push({
        serverId,
        name: config.name || serverId,
        reason: `Matches: ${matchedKeywords.join(', ')}`,
        command: config.command || '',
      });
    }
  }

  return suggestions;
}

/**
 * Format auto-discovery suggestions for display
 */
export function formatDiscoverySuggestions(
  suggestions: Array<{
    serverId: string;
    name: string;
    reason: string;
    command: string;
  }>,
): string {
  if (suggestions.length === 0) {
    return 'No MCP server suggestions for this prompt.';
  }

  let output = '💡 MCP Server Suggestions:\\n\\n';

  for (const suggestion of suggestions) {
    output += `📦 **${suggestion.name}** (${suggestion.serverId})\\n`;
    output += `   ${suggestion.reason}\\n`;
    output += `   Command: ${suggestion.command}\\n`;
    output += `   To add: /mcp add ${suggestion.serverId} --command "${suggestion.command}"\\n\\n`;
  }

  output +=
    '\\nTip: Configure these servers in ~/.qwen/mcp.json for auto-loading.';

  return output;
}
