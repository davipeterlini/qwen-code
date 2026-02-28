/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

/**
 * Schema for MCP server configuration
 * Defines how to connect to an MCP server
 */
export const MCPServerConfigSchema = z.object({
  /** Unique identifier for this server */
  id: z.string(),
  /** Display name for the server */
  name: z.string(),
  /** Command to start the MCP server (for stdio transport) */
  command: z.string().optional(),
  /** Arguments to pass to the command */
  args: z.array(z.string()).optional(),
  /** Environment variables for the server */
  env: z.record(z.string()).optional(),
  /** URL for SSE or WebSocket transport */
  url: z.string().url().optional(),
  /** Transport type: 'stdio' | 'sse' | 'websocket' */
  transport: z.enum(['stdio', 'sse', 'websocket']).default('stdio'),
  /** Whether this server is enabled */
  enabled: z.boolean().default(true),
  /** Whether to load this server dynamically (on-demand) */
  dynamic: z.boolean().default(true),
  /** Timeout in milliseconds for server operations */
  timeout: z.number().default(30000),
  /** Description of what this server provides */
  description: z.string().optional(),
});

export type MCPServerConfigSchemaType = z.infer<typeof MCPServerConfigSchema>;

/**
 * Schema for MCP tool definition
 */
export const MCPToolSchema = z.object({
  /** Unique tool name */
  name: z.string(),
  /** Human-readable description */
  description: z.string(),
  /** JSON Schema for input parameters */
  inputSchema: z.object({
    type: z.literal('object'),
    properties: z.record(z.unknown()).optional(),
    required: z.array(z.string()).optional(),
  }),
  /** Server that provides this tool */
  serverId: z.string(),
});

export type MCPTool = z.infer<typeof MCPToolSchema>;

/**
 * Schema for MCP resource definition
 */
export const MCPResourceSchema = z.object({
  /** Unique resource URI */
  uri: z.string(),
  /** Human-readable name */
  name: z.string(),
  /** Description of the resource */
  description: z.string().optional(),
  /** MIME type of the resource content */
  mimeType: z.string().optional(),
  /** Server that provides this resource */
  serverId: z.string(),
});

export type MCPResource = z.infer<typeof MCPResourceSchema>;

/**
 * Schema for MCP prompt definition
 */
export const MCPPromptSchema = z.object({
  /** Unique prompt name */
  name: z.string(),
  /** Human-readable description */
  description: z.string().optional(),
  /** Arguments the prompt accepts */
  arguments: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        required: z.boolean().optional(),
      }),
    )
    .optional(),
  /** Server that provides this prompt */
  serverId: z.string(),
});

export type MCPPrompt = z.infer<typeof MCPPromptSchema>;

/**
 * Schema for MCP connection state
 */
export const MCPConnectionStateSchema = z.enum([
  'disconnected',
  'connecting',
  'connected',
  'error',
]);

export type MCPConnectionState = z.infer<typeof MCPConnectionStateSchema>;

/**
 * Schema for MCP server runtime info
 */
export const MCPServerInfoSchema = z.object({
  config: MCPServerConfigSchema,
  state: MCPConnectionStateSchema,
  tools: z.array(MCPToolSchema),
  resources: z.array(MCPResourceSchema),
  prompts: z.array(MCPPromptSchema),
  lastConnected: z.string().datetime().optional(),
  lastError: z.string().optional(),
  tokenCost: z.number().default(0),
});

export type MCPServerInfo = z.infer<typeof MCPServerInfoSchema>;

/**
 * Schema for MCP configuration file
 */
export const MCPConfigSchema = z.object({
  /** MCP servers configuration */
  servers: z.array(MCPServerConfigSchema).default([]),
  /** Enable/disable dynamic loading */
  dynamicLoading: z.boolean().default(true),
  /** Auto-load frequently used tools */
  autoLoad: z.boolean().default(false),
  /** Token budget for MCP tools */
  tokenBudget: z.number().default(50000),
});

export type MCPConfig = z.infer<typeof MCPConfigSchema>;

/**
 * Schema for MCP tool call result
 */
export const MCPToolResultSchema = z.object({
  content: z.array(
    z.object({
      type: z.enum(['text', 'image', 'resource']),
      text: z.string().optional(),
      data: z.string().optional(),
      mimeType: z.string().optional(),
    }),
  ),
  isError: z.boolean().default(false),
});

export type MCPToolResult = z.infer<typeof MCPToolResultSchema>;
