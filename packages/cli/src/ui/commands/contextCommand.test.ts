/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contextCommand } from './contextCommand.js';
import { MessageType } from '../types.js';
import type { CommandContext } from './types.js';

describe('contextCommand', () => {
  const mockConfig = {
    getUserMemory: vi.fn(),
    getGeminiMdFileCount: vi.fn(),
    getModel: vi.fn(),
  };

  const mockUi = {
    addItem: vi.fn(),
    clear: vi.fn(),
    setDebugMessage: vi.fn(),
    pendingItem: null,
    setPendingItem: vi.fn(),
    loadHistory: vi.fn(),
    toggleVimEnabled: vi.fn(),
    setGeminiMdFileCount: vi.fn(),
    reloadCommands: vi.fn(),
    extensionsUpdateState: new Map(),
    dispatchExtensionStateUpdate: vi.fn(),
    addConfirmUpdateExtensionRequest: vi.fn(),
  };

  const mockContext: CommandContext = {
    services: {
      config: mockConfig as unknown as CommandContext['services']['config'],
      settings: {} as CommandContext['services']['settings'],
      git: undefined,
      logger: null,
    },
    ui: mockUi,
    session: {
      stats: {
        sessionId: 'test',
        sessionStartTime: new Date(),
        metrics: {
          models: {},
          tools: {
            totalCalls: 0,
            totalSuccess: 0,
            totalFail: 0,
            totalDurationMs: 0,
            totalDecisions: {
              accept: 0,
              reject: 0,
              modify: 0,
              auto_accept: 0,
            },
            byName: {},
          },
          files: {
            totalLinesAdded: 0,
            totalLinesRemoved: 0,
          },
        },
        lastPromptTokenCount: 0,
        promptCount: 0,
      },
      sessionShellAllowlist: new Set(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('should display context usage information', async () => {
    mockConfig.getUserMemory.mockReturnValue('Some memory content');
    mockConfig.getGeminiMdFileCount.mockReturnValue(2);
    mockConfig.getModel.mockReturnValue('qwen3-coder-plus');

    await contextCommand.action!(mockContext, '');

    expect(mockUi.addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MessageType.INFO,
        text: expect.stringContaining('CONTEXT WINDOW USAGE'),
      }),
      expect.any(Number),
    );
  });

  it.skip('should handle missing config gracefully', async () => {
    mockContext.services.config = null;

    await contextCommand.action!(mockContext, '');

    expect(mockUi.addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MessageType.ERROR,
      }),
      expect.any(Number),
    );
  });

  it.skip('should show warning when usage is above 80%', async () => {
    mockConfig.getUserMemory.mockReturnValue('x'.repeat(200000));
    mockConfig.getGeminiMdFileCount.mockReturnValue(10);
    mockConfig.getModel.mockReturnValue('qwen3-coder-plus');

    await contextCommand.action!(mockContext, '');

    const call = mockUi.addItem.mock.calls[0];
    const text = (call[0] as { text: string }).text;
    expect(text).toContain('Warning');
    expect(text).toContain('80%');
  });

  it.skip('should display memory file count', async () => {
    mockConfig.getUserMemory.mockReturnValue('Memory content');
    mockConfig.getGeminiMdFileCount.mockReturnValue(5);
    mockConfig.getModel.mockReturnValue('qwen3-coder-plus');

    await contextCommand.action!(mockContext, '');

    const call = mockUi.addItem.mock.calls[0];
    const text = (call[0] as { text: string }).text;
    expect(text).toContain('5 files');
  });
});
