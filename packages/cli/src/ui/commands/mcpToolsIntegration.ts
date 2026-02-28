/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { createMCPRegistry } from '@qwen-code/qwen-code-core';
import type { MCPTool } from '@qwen-code/qwen-code-core';

/**
 * Get MCP tools from the registry
 */
export function getMCPTools(): MCPTool[] {
  const mcpRegistry = createMCPRegistry();
  return mcpRegistry.getAllTools();
}

/**
 * Get MCP tools stats
 */
export function getMCPToolsStats(): {
  totalTools: number;
  totalServers: number;
  connectedServers: number;
  tokenUsage: number;
  tokenBudget: number;
} {
  const mcpRegistry = createMCPRegistry();
  const stats = mcpRegistry.getStats();

  return {
    totalTools: stats.totalTools,
    totalServers: stats.totalServers,
    connectedServers: stats.connectedServers,
    tokenUsage: stats.tokenUsage,
    tokenBudget: stats.tokenBudget,
  };
}

/**
 * Format MCP tools for display
 */
export function formatMCPToolsDisplay(tools: MCPTool[]): string {
  if (tools.length === 0) {
    return 'No MCP tools loaded.';
  }

  let output = '🔌 MCP Tools:\\n\\n';

  // Group tools by server
  const toolsByServer = new Map<string, MCPTool[]>();
  for (const tool of tools) {
    const serverTools = toolsByServer.get(tool.serverId) || [];
    serverTools.push(tool);
    toolsByServer.set(tool.serverId, serverTools);
  }

  for (const [serverId, serverTools] of toolsByServer.entries()) {
    output += `📦 **${serverId}** (${serverTools.length} tools)\\n`;
    for (const tool of serverTools) {
      output += `  • ${tool.name} - ${tool.description}\\n`;
    }
    output += '\\n';
  }

  return output;
}
