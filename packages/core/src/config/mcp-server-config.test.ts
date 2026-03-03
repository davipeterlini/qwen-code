/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { MCPServerConfig, isSdkMcpServerConfig } from './config.js';

describe('MCPServerConfig', () => {
  describe('constructor', () => {
    it('should create config with command', () => {
      const config = new MCPServerConfig(
        'npx -y test-server', // command
        ['--port', '3000'], // args
      );

      expect(config.command).toBe('npx -y test-server');
      expect(config.args).toEqual(['--port', '3000']);
    });

    it('should create config with url', () => {
      const config = new MCPServerConfig(
        undefined, // command
        undefined, // args
        undefined, // env
        undefined, // cwd
        'http://localhost:3000/mcp', // url
      );

      expect(config.url).toBe('http://localhost:3000/mcp');
      expect(config.command).toBeUndefined();
    });

    it('should create config with all parameters', () => {
      const config = new MCPServerConfig(
        'test-command', // command
        ['arg1', 'arg2'], // args
        { KEY: 'value' }, // env
        '/test/path', // cwd
        'http://test.com', // url
        undefined, // httpUrl
        undefined, // headers
        undefined, // tcp
        5000, // timeout
        true, // trust
        'Test description', // description
        ['tool1'], // includeTools
        ['tool2'], // excludeTools
        'extension-name', // extensionName
      );

      expect(config.command).toBe('test-command');
      expect(config.args).toEqual(['arg1', 'arg2']);
      expect(config.env).toEqual({ KEY: 'value' });
      expect(config.cwd).toBe('/test/path');
      expect(config.url).toBe('http://test.com');
      expect(config.timeout).toBe(5000);
      expect(config.trust).toBe(true);
      expect(config.description).toBe('Test description');
      expect(config.includeTools).toEqual(['tool1']);
      expect(config.excludeTools).toEqual(['tool2']);
      expect(config.extensionName).toBe('extension-name');
    });
  });
});

describe('isSdkMcpServerConfig', () => {
  it('should return true for SDK MCP server config', () => {
    // type is the last parameter (32nd)
    const config = new MCPServerConfig(
      undefined,
      undefined,
      undefined,
      undefined, // 1-4: command, args, env, cwd
      undefined,
      undefined,
      undefined,
      undefined, // 5-8: url, httpUrl, headers, tcp
      undefined,
      undefined,
      undefined,
      undefined, // 9-12: timeout, trust, description, includeTools
      undefined,
      undefined,
      undefined,
      undefined, // 13-16: excludeTools, extensionName, oauth, authProviderType
      undefined,
      undefined,
      'sdk', // 17-19: targetAudience, targetServiceAccount, type
    );

    expect(isSdkMcpServerConfig(config)).toBe(true);
  });

  it('should return false for stdio config', () => {
    const config = new MCPServerConfig('npx test-server');

    expect(isSdkMcpServerConfig(config)).toBe(false);
  });

  it('should return false for config without type', () => {
    const config = new MCPServerConfig();

    expect(isSdkMcpServerConfig(config)).toBe(false);
  });
});
