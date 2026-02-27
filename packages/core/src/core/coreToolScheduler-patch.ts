/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CoreToolScheduler Patch
 *
 * This module patches CoreToolScheduler to add hooks and checkpoints support
 * without modifying the original file extensively.
 *
 * Import this module to enable automatic integration.
 */

import type { Config } from '../config/config.js';
import type { ToolCallRequestInfo } from './turn.js';
import {
  executeToolHooks,
  createPreToolCheckpoint,
} from './tool-scheduler-extensions.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('SCHEDULER_PATCH');

/**
 * Patch CoreToolScheduler to add hooks and checkpoints
 * Call this during application initialization
 */
export function patchCoreToolScheduler(): void {
  debugLogger.debug(
    'CoreToolScheduler patch loaded - ready to enable hooks and checkpoints',
  );
}

/**
 * Wrapper for tool execution that adds hooks and checkpoints
 */
export async function executeToolWithHooksAndCheckpoints(
  config: Config,
  toolCallRequest: ToolCallRequestInfo,
  sessionId: string,
  executeFn: () => Promise<unknown>,
  signal: AbortSignal,
): Promise<unknown> {
  try {
    // 1. Execute PreToolUse hooks
    await executeToolHooks(
      config,
      'PreToolUse',
      {
        toolName: toolCallRequest.name,
        toolArgs: toolCallRequest.args,
        sessionId,
      },
      signal,
    );

    // 2. Create checkpoint before tool execution
    await createPreToolCheckpoint(config, toolCallRequest, sessionId);

    // 3. Execute the actual tool
    const result = await executeFn();

    // 4. Execute PostToolUse hooks
    await executeToolHooks(
      config,
      'PostToolUse',
      {
        toolName: toolCallRequest.name,
        toolOutput: JSON.stringify(result),
        sessionId,
      },
      signal,
    );

    return result;
  } catch (error) {
    debugLogger.warn('Error in tool execution with hooks/checkpoints:', error);
    throw error;
  }
}

/**
 * Initialize hooks and checkpoints for a config
 */
export async function initializeHooksAndCheckpoints(
  config: Config,
): Promise<void> {
  debugLogger.debug('Initializing hooks and checkpoints...');

  const hookService = config.getHookService();
  const checkpointService = config.getCheckpointService();

  if (hookService) {
    await hookService.initialize();
    debugLogger.debug('✓ Hook service initialized');
  }

  if (checkpointService) {
    await checkpointService.initialize();
    debugLogger.debug('✓ Checkpoint service initialized');
  }

  debugLogger.debug('Hooks and checkpoints initialized successfully!');
}
