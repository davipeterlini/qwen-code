/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SlashCommand, CommandContext } from './types.js';
import { CommandKind } from './types.js';
import { MessageType } from '../types.js';
import { t } from '../../i18n/index.js';
import { createMCPRegistry } from '@qwen-code/qwen-code-core';

/**
 * Command to display context window usage information.
 * Shows how tokens are being used across different categories.
 */
export const contextCommand: SlashCommand = {
  name: 'context',
  get description() {
    return t('Display context window usage and token breakdown.');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext) => {
    const config = context.services.config;
    if (!config) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: t('Configuration not available.'),
        },
        Date.now(),
      );
      return;
    }

    // Get memory content and file count
    const memoryContent = config.getUserMemory() || '';
    const fileCount = config.getGeminiMdFileCount() || 0;

    // Estimate token counts (rough approximation: 1 token ≈ 4 characters for English)
    const memoryTokens = Math.ceil(memoryContent.length / 4);

    // Get model info
    const modelName = config.getModel() || 'Unknown';

    // Get token limits based on model
    const tokenLimits = getTokenLimits(modelName);

    // Estimate other token usage
    const systemPromptTokens = 2500; // Approximate
    const toolsTokens = 8200; // Approximate for available tools

    // Get MCP tools token usage
    const mcpRegistry = createMCPRegistry();
    const mcpStats = mcpRegistry.getStats();
    const mcpToolsTokens = mcpStats.tokenUsage;

    // Calculate message history tokens
    // This would ideally come from the actual conversation history
    const estimatedMessageTokens = Math.max(
      0,
      tokenLimits.input -
        systemPromptTokens -
        toolsTokens -
        mcpToolsTokens -
        memoryTokens -
        50000, // Reserve buffer
    );

    const totalUsed =
      systemPromptTokens +
      toolsTokens +
      mcpToolsTokens +
      memoryTokens +
      estimatedMessageTokens;
    const available = tokenLimits.input - totalUsed;

    // Format the output
    const output = formatContextDisplay({
      systemPrompt: systemPromptTokens,
      tools: toolsTokens,
      mcpTools: mcpToolsTokens,
      memory: memoryTokens,
      memoryFileCount: fileCount,
      messages: estimatedMessageTokens,
      total: totalUsed,
      available,
      limit: tokenLimits.input,
      outputLimit: tokenLimits.output,
      modelName,
    });

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: output,
      },
      Date.now(),
    );
  },
};

interface TokenLimits {
  input: number;
  output: number;
}

function getTokenLimits(modelName: string): TokenLimits {
  // Token limits for various Qwen and other models
  const limits: Record<string, TokenLimits> = {
    // Qwen models
    'qwen3-coder-plus': { input: 256000, output: 32000 },
    'qwen3.5-plus': { input: 256000, output: 32000 },
    'qwen3-coder-480a35': { input: 256000, output: 32000 },
    'qwen3-coder-30ba3b': { input: 256000, output: 32000 },
    'qwen-max': { input: 256000, output: 32000 },
    'qwen-plus': { input: 256000, output: 32000 },

    // Claude models
    'claude-sonnet-4-20250514': { input: 200000, output: 64000 },
    'claude-opus-4-20250514': { input: 200000, output: 64000 },
    'claude-3-5-sonnet': { input: 200000, output: 64000 },
    'claude-3-opus': { input: 200000, output: 64000 },

    // Gemini models
    'gemini-2.5-pro': { input: 2000000, output: 64000 },
    'gemini-2.0-flash': { input: 1000000, output: 64000 },

    // GPT models
    'gpt-4o': { input: 128000, output: 16384 },
    'gpt-4-turbo': { input: 128000, output: 4096 },

    // Default fallback
    default: { input: 256000, output: 32000 },
  };

  // Try to find exact match first
  if (limits[modelName]) {
    return limits[modelName];
  }

  // Try partial match
  for (const [key, value] of Object.entries(limits)) {
    if (modelName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return limits['default'];
}

interface ContextDisplayData {
  systemPrompt: number;
  tools: number;
  mcpTools: number;
  memory: number;
  memoryFileCount: number;
  messages: number;
  total: number;
  available: number;
  limit: number;
  outputLimit: number;
  modelName: string;
}

function formatContextDisplay(data: ContextDisplayData): string {
  const formatNumber = (n: number) => n.toLocaleString();
  const percentage = (value: number, total: number) =>
    ((value / total) * 100).toFixed(1);

  const barWidth = 30;
  const createBar = (value: number, total: number) => {
    const filled = Math.round((value / total) * barWidth);
    const empty = barWidth - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  const usagePercentage = percentage(data.total, data.limit);
  const bar = createBar(data.total, data.limit);

  // Get MCP stats for additional info
  const mcpRegistry = createMCPRegistry();
  const mcpStats = mcpRegistry.getStats();

  let output = `╔═══════════════════════════════════════════════════════════╗\n`;
  output += `║  📊 CONTEXT WINDOW USAGE                      ${usagePercentage}% used  ║\n`;
  output += `╠═══════════════════════════════════════════════════════════╣\n`;
  output += `║  Model: ${data.modelName.padEnd(52)} ║\n`;
  output += `╠═══════════════════════════════════════════════════════════╣\n`;
  output += `║  ${bar}  ║\n`;
  output += `╠═══════════════════════════════════════════════════════════╣\n`;
  output += `║  BREAKDOWN:                                               ║\n`;
  output += `║  ├─ System Prompt:  ${formatNumber(data.systemPrompt).padStart(8)} tokens (${percentage(data.systemPrompt, data.limit).padStart(5)}%)           ║\n`;
  output += `║  ├─ Tools:          ${formatNumber(data.tools).padStart(8)} tokens (${percentage(data.tools, data.limit).padStart(5)}%)           ║\n`;
  output += `║  ├─ MCP Tools:      ${formatNumber(data.mcpTools).padStart(8)} tokens (${percentage(data.mcpTools, data.limit).padStart(5)}%)  (${mcpStats.connectedServers}/${mcpStats.totalServers}) ║\n`;
  output += `║  ├─ Memory Files:   ${formatNumber(data.memory).padStart(8)} tokens (${percentage(data.memory, data.limit).padStart(5)}%)  (${data.memoryFileCount} files)   ║\n`;
  output += `║  ├─ Messages:       ${formatNumber(data.messages).padStart(8)} tokens (${percentage(data.messages, data.limit).padStart(5)}%)           ║\n`;
  output += `╠═══════════════════════════════════════════════════════════╣\n`;
  output += `║  TOTAL USED:        ${formatNumber(data.total).padStart(8)} / ${formatNumber(data.limit)} tokens                     ║\n`;
  output += `║  AVAILABLE:         ${formatNumber(data.available).padStart(8)} tokens remaining                        ║\n`;
  output += `║  OUTPUT LIMIT:      ${formatNumber(data.outputLimit).padStart(8)} tokens                               ║\n`;
  output += `╚═══════════════════════════════════════════════════════════╝\n`;

  // Add MCP info
  if (mcpStats.totalServers > 0) {
    output += `\n🔌 ${t('MCP Status:')} ${mcpStats.connectedServers}/${mcpStats.totalServers} ${t('servers loaded')} | ${t('Tools:')} ${mcpStats.totalTools} | ${t('Budget:')} ${formatNumber(mcpStats.tokenUsage)}/${formatNumber(mcpStats.tokenBudget)} tokens\n`;
  }

  // Add tips if usage is high
  if (data.total > data.limit * 0.8) {
    output += `\n⚠️  ${t('Warning: Context usage is above 80%. Consider using /compress to reduce token usage.')}\n`;
  }

  output += `\n${t('Tip: Use /memory show to view memory content, /compress to compact history, /mcp to manage MCP servers.')}\n`;

  return output;
}
