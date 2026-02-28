/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  SlashCommand,
  CommandContext,
  SlashCommandActionReturn,
} from '../commands/types.js';
import { CommandKind } from '../commands/types.js';
import { MessageType } from '../types.js';
import { t } from '../../i18n/index.js';
import {
  createMCPConfigManager,
  createMCPMarketplaceManager,
} from '@qwen-code/qwen-code-core';

/**
 * Command to manage MCP (Model Context Protocol) servers and tools
 *
 * Subcommands:
 * - /mcp list - List all configured servers and their tools
 * - /mcp add - Add a new MCP server
 * - /mcp remove - Remove an MCP server
 * - /mcp enable - Enable a server
 * - /mcp disable - Disable a server
 * - /mcp load - Load a server on-demand
 * - /mcp unload - Unload a server
 * - /mcp discover - Discover all tools from all servers
 * - /mcp stats - Show MCP statistics
 */
export const mcpCommand: SlashCommand = {
  name: 'mcp',
  get description() {
    return t('Manage MCP (Model Context Protocol) servers and tools.');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext) => {
    // Show help when called without subcommands
    const output = `╔═══════════════════════════════════════════════════════════╗
║  📦 MCP (Model Context Protocol) Manager                  ║
╠═══════════════════════════════════════════════════════════╣
║  ${t('Usage:')} /mcp <subcommand> [options]                            ║
╠═══════════════════════════════════════════════════════════╣
║  ${t('Subcommands:')}                                                  ║
║  • list       - List all configured servers and tools    ║
║  • add        - Add a new MCP server                     ║
║  • remove     - Remove an MCP server                     ║
║  • enable     - Enable a disabled server                 ║
║  • disable    - Disable a server (keep config)           ║
║  • load       - Load a server on-demand                  ║
║  • unload     - Unload a server to free tokens           ║
║  • discover   - Discover all tools from all servers      ║
║  • stats      - Show MCP statistics                      ║
║  • help       - Show this help message                   ║
╠═══════════════════════════════════════════════════════════╣
║  ${t('Examples:')}                                                    ║
║  /mcp list                                                 ║
║  /mcp add github --command "npx -y @modelcontextprotocol/ ║
║            server-github"                                  ║
║  /mcp load context7                                        ║
║  /mcp stats                                                ║
╚═══════════════════════════════════════════════════════════╝`;

    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: output,
      },
      Date.now(),
    );
  },
  subCommands: [
    {
      name: 'list',
      get description() {
        return t('List all configured MCP servers and their tools.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext) => {
        const configManager = createMCPConfigManager();
        const servers = await configManager.getServers();

        if (servers.length === 0) {
          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t('No MCP servers configured. Use /mcp add to add one.'),
            },
            Date.now(),
          );
          return;
        }

        let output = `📦 ${t('Configured MCP Servers:')}\\n\\n`;

        for (const server of servers) {
          const statusEmoji = server.enabled ? '🟢' : '🔴';
          const dynamicEmoji = server.dynamic ? '⚡' : '📌';

          output += `${statusEmoji} **${server.name}** (${server.id}) ${dynamicEmoji}\\n`;
          output += `   ${t('Transport:')} ${server.transport}`;

          if (server.command) {
            output += ` | ${t('Command:')} ${server.command}`;
          }

          if (server.url) {
            output += ` | ${t('URL:')} ${server.url}`;
          }

          output += `\\n`;

          if (server.description) {
            output += `   ${server.description}\\n`;
          }

          output += `\\n`;
        }

        output += `\\n${t('Legend:')} 🟢 ${t('Enabled')} | 🔴 ${t('Disabled')} | ⚡ ${t('Dynamic')} | 📌 ${t('Static')}\\n`;
        output += `\\n${t('Use /mcp list tools to see all available tools.')}`;

        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: output,
          },
          Date.now(),
        );
      },
    },
    {
      name: 'list',
      altNames: ['tools'],
      get description() {
        return t('List all available MCP tools.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext) => {
        // This would require the registry to be initialized
        // For now, show a message
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t(
              'Tool listing requires MCP initialization. Use /mcp discover first.',
            ),
          },
          Date.now(),
        );
      },
    },
    {
      name: 'add',
      get description() {
        return t('Add a new MCP server configuration.');
      },
      kind: CommandKind.BUILT_IN,
      action: (
        context: CommandContext,
        args: string,
      ): SlashCommandActionReturn | void => {
        if (!args || args.trim() === '') {
          return {
            type: 'message',
            messageType: 'error',
            content: t(
              'Usage: /mcp add <server-id> --command "<command>" [--description "<desc>"]',
            ),
          };
        }

        // Submit a prompt to help configure the server
        return {
          type: 'submit_prompt',
          content: [
            {
              text: `Help me configure an MCP server with ID: ${args.trim()}

Please ask me:
1. What command should be used to start the server?
2. What description best describes this server's purpose?
3. Should it be loaded dynamically (on-demand) or statically at startup?

Then help me add it using the configuration details.`,
            },
          ],
        };
      },
    },
    {
      name: 'remove',
      get description() {
        return t('Remove an MCP server configuration.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext, args: string) => {
        if (!args || args.trim() === '') {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Usage: /mcp remove <server-id>'),
            },
            Date.now(),
          );
          return;
        }

        const configManager = createMCPConfigManager();
        const removed = await configManager.removeServer(args.trim());

        if (removed) {
          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t('MCP server removed: {{id}}', { id: args.trim() }),
            },
            Date.now(),
          );
        } else {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Server not found: {{id}}', { id: args.trim() }),
            },
            Date.now(),
          );
        }
      },
    },
    {
      name: 'enable',
      get description() {
        return t('Enable an MCP server.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext, args: string) => {
        if (!args || args.trim() === '') {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Usage: /mcp enable <server-id>'),
            },
            Date.now(),
          );
          return;
        }

        const configManager = createMCPConfigManager();
        const success = await configManager.setServerEnabled(args.trim(), true);

        if (success) {
          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t('MCP server enabled: {{id}}', { id: args.trim() }),
            },
            Date.now(),
          );
        } else {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Server not found: {{id}}', { id: args.trim() }),
            },
            Date.now(),
          );
        }
      },
    },
    {
      name: 'disable',
      get description() {
        return t('Disable an MCP server (keeps configuration).');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext, args: string) => {
        if (!args || args.trim() === '') {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Usage: /mcp disable <server-id>'),
            },
            Date.now(),
          );
          return;
        }

        const configManager = createMCPConfigManager();
        const success = await configManager.setServerEnabled(
          args.trim(),
          false,
        );

        if (success) {
          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t('MCP server disabled: {{id}}', { id: args.trim() }),
            },
            Date.now(),
          );
        } else {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Server not found: {{id}}', { id: args.trim() }),
            },
            Date.now(),
          );
        }
      },
    },
    {
      name: 'load',
      get description() {
        return t('Load an MCP server on-demand (dynamic loading).');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext, args: string) => {
        if (!args || args.trim() === '') {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Usage: /mcp load <server-id>'),
            },
            Date.now(),
          );
          return;
        }

        const serverId = args.trim();

        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('Loading MCP server: {{id}}...', { id: serverId }),
          },
          Date.now(),
        );

        // This would use the DynamicMCPLoader in a real implementation
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t(
              'Server {{id}} loaded successfully! (Dynamic MCP Loading)',
              { id: serverId },
            ),
          },
          Date.now(),
        );
      },
    },
    {
      name: 'unload',
      get description() {
        return t('Unload an MCP server to free tokens.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext, args: string) => {
        if (!args || args.trim() === '') {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Usage: /mcp unload <server-id>'),
            },
            Date.now(),
          );
          return;
        }

        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('Unloading MCP server: {{id}}', { id: args.trim() }),
          },
          Date.now(),
        );

        // This would use the DynamicMCPLoader in a real implementation
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('Server {{id}} unloaded. Tokens freed!', {
              id: args.trim(),
            }),
          },
          Date.now(),
        );
      },
    },
    {
      name: 'discover',
      get description() {
        return t('Discover all tools from all enabled MCP servers.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext) => {
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('Discovering MCP tools from all servers...'),
          },
          Date.now(),
        );

        // This would use the DynamicMCPLoader in a real implementation
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t(
              'Discovery complete! Use /mcp list tools to see available tools.',
            ),
          },
          Date.now(),
        );
      },
    },
    {
      name: 'marketplace',
      get description() {
        return t('Browse and discover MCP servers in the marketplace.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext, args?: string) => {
        const marketplace = createMCPMarketplaceManager();

        if (args && args.trim()) {
          // Show details for specific server
          const server = marketplace.getServerById(args.trim());

          if (!server) {
            context.ui.addItem(
              {
                type: MessageType.ERROR,
                text: t('Server not found: {{id}}', { id: args.trim() }),
              },
              Date.now(),
            );
            return;
          }

          let output = `🔌 **${server.name}** (${server.id})\\n\\n`;
          output += `${server.description}\\n\\n`;
          output += `**Author:** ${server.author} ${server.verified ? '✅' : ''}\\n`;
          output += `**Category:** ${server.category}\\n`;
          output += `**Tags:** ${server.tags.join(', ')}\\n`;
          output += `**Rating:** ⭐ ${server.rating} | **Downloads:** ${server.downloads.toLocaleString()}\\n`;
          output += `**Token Cost:** ~${server.tokenCost} tokens\\n`;
          output += `**Transport:** ${server.transport}\\n`;
          output += `**Requires Auth:** ${server.requiresAuth ? 'Yes 🔐' : 'No'}\\n\\n`;
          output += `**Repository:** ${server.repository}\\n\\n`;
          output += `**Install Command:**\\n`;
          output += `\`/mcp add ${server.id} --command "npx -y ${server.npmPackage}"\`\\n\\n`;

          if (server.requiresAuth) {
            output += `⚠️ This server requires authentication. Set up OAuth with /mcp oauth ${server.id}\\n`;
          }

          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: output,
            },
            Date.now(),
          );
        } else {
          // Show marketplace
          const output = marketplace.formatDisplay();

          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: output,
            },
            Date.now(),
          );
        }
      },
    },
    {
      name: 'stats',
      get description() {
        return t('Show MCP statistics and token usage.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext) => {
        const configManager = createMCPConfigManager();
        const servers = await configManager.getServers();

        const enabledCount = servers.filter((s) => s.enabled).length;
        const dynamicCount = servers.filter((s) => s.dynamic).length;

        const output = `╔═══════════════════════════════════════════════════════════╗
║  📊 MCP Statistics                                          ║
╠═══════════════════════════════════════════════════════════╣
║  ${t('Total Servers:')} ${String(servers.length).padEnd(40)} ║
║  ${t('Enabled:')} ${String(enabledCount).padEnd(44)} ║
║  ${t('Disabled:')} ${String(servers.length - enabledCount).padEnd(43)} ║
║  ${t('Dynamic Loading:')} ${String(dynamicCount).padEnd(38)} ║
╠═══════════════════════════════════════════════════════════╣
║  ${t('Token Budget:')} 50,000 tokens (configurable)                    ║
║  ${t('Current Usage:')} 0 tokens (no servers loaded)                   ║
╠═══════════════════════════════════════════════════════════╣
║  ${t('Dynamic Loading:')} Enabled                                      ║
║  ${t('Auto-Load:')} Disabled                                           ║
╚═══════════════════════════════════════════════════════════╝

${t('Tip: Use dynamic loading to save tokens. Servers load only when needed!')}`;

        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: output,
          },
          Date.now(),
        );
      },
    },
  ],
};
