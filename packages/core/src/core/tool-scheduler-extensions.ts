/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Integration layer for hooks and checkpoints in CoreToolScheduler
 *
 * This module provides wrapper functions to integrate the new features
 * with the existing tool execution flow.
 */

import type { Config } from '../config/config.js';
import type { ToolCallRequestInfo } from './turn.js';
import type { HookType } from '../hooks/types.js';
// import type { CheckpointCreateOptions } from '../checkpoints/types.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('TOOL_SCHEDULER_EXTENSIONS');

/**
 * Execute hooks for a tool call
 */
export async function executeToolHooks(
  config: Config,
  hookType: HookType,
  context: {
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    userPrompt?: string;
    toolOutput?: string;
    sessionId?: string;
  },
  signal?: AbortSignal,
): Promise<void> {
  const hookService = config.getHookService();
  if (!hookService) {
    debugLogger.debug('Hook service not available, skipping hooks');
    return;
  }

  try {
    const results = await hookService.executeHooks(
      hookType,
      {
        cwd: config.getWorkingDir(),
        ...context,
      },
      signal,
    );

    if (results.length > 0) {
      debugLogger.debug(`Executed ${results.length} hooks for ${hookType}`);

      // Log any blocking hooks
      const blockingHooks = results.filter((r) => r.shouldBlock);
      if (blockingHooks.length > 0) {
        debugLogger.info(`${blockingHooks.length} hooks requested blocking`);
      }
    }
  } catch (error) {
    debugLogger.warn(`Error executing hooks for ${hookType}:`, error);
    // Don't throw - hooks should not break tool execution
  }
}

/**
 * Create automatic checkpoint before tool execution
 */
export async function createPreToolCheckpoint(
  config: Config,
  toolCallRequest: ToolCallRequestInfo,
  _sessionId: string,
): Promise<void> {
  const checkpointService = config.getCheckpointService();
  if (!checkpointService) {
    debugLogger.debug('Checkpoint service not available, skipping checkpoint');
    return;
  }

  try {
    // Only create checkpoints for tools that modify state
    const toolsThatModifyState = [
      'WriteFile',
      'Edit',
      'DeleteFile',
      'Shell',
      'CreateFile',
    ];

    if (toolsThatModifyState.includes(toolCallRequest.name)) {
      debugLogger.debug(
        `Creating pre-tool checkpoint for ${toolCallRequest.name}`,
      );

      await checkpointService.createCheckpoint({
        label: `Pre-${toolCallRequest.name}`,
        isAuto: true,
        trigger: 'pre-tool',
        toolName: toolCallRequest.name,
        captureGitState: true,
      });
    }
  } catch (error) {
    debugLogger.warn('Error creating pre-tool checkpoint:', error);
    // Don't throw - checkpoints should not break tool execution
  }
}

/**
 * Check if any hook wants to block tool execution
 */
export function shouldBlockToolExecution(
  config: Config,
  hookResults: Array<{ shouldBlock?: boolean }> = [],
): boolean {
  // Check if any hook requested to block
  return hookResults.some((r) => r.shouldBlock);
}

/**
 * Get modified prompt from hooks
 */
export function getModifiedPromptFromHooks(
  hookResults: Array<{ modifiedPrompt?: string }> = [],
): string | undefined {
  // Return the last modified prompt from hooks
  const modifiedPrompts = hookResults.filter((r) => r.modifiedPrompt);
  if (modifiedPrompts.length > 0) {
    return modifiedPrompts[modifiedPrompts.length - 1].modifiedPrompt;
  }
  return undefined;
}

/**
 * Initialize all scheduler extensions
 */
export async function initializeSchedulerExtensions(
  config: Config,
): Promise<void> {
  debugLogger.debug('Initializing scheduler extensions');

  // Initialize hook service
  const hookService = config.getHookService();
  if (hookService) {
    await hookService.initialize();
    debugLogger.debug('Hook service initialized');
  }

  // Initialize checkpoint service
  const checkpointService = config.getCheckpointService();
  if (checkpointService) {
    await checkpointService.initialize();
    debugLogger.debug('Checkpoint service initialized');
  }

  debugLogger.debug('Scheduler extensions initialized');
}
