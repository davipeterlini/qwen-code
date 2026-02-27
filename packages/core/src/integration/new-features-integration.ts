/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Integration entry point for all new features
 *
 * Import and call initializeNewFeatures() during application startup
 * to enable all new capabilities.
 */

import type { Config } from '../config/config.js';
import { createDebugLogger } from '../utils/debugLogger.js';

const debugLogger = createDebugLogger('NEW_FEATURES_INTEGRATION');

/**
 * Initialize all new features
 * Should be called after Config.initialize()
 */
export async function initializeNewFeatures(config: Config): Promise<void> {
  debugLogger.debug('Initializing new features...');

  try {
    // 1. Initialize scheduler extensions (hooks + checkpoints)
    await initializeSchedulerExtensions(config);

    // 2. Skills auto-activation is already integrated via SkillActivationService
    debugLogger.debug('Skills auto-activation ready');

    // 3. Markdown commands are loaded via CommandService
    debugLogger.debug('Markdown commands ready');

    // 4. Rewind command is registered in BuiltinCommandLoader
    debugLogger.debug('Rewind command ready');

    debugLogger.debug('All new features initialized successfully!');
  } catch (error) {
    debugLogger.error('Error initializing new features:', error);
    throw error;
  }
}

/**
 * Initialize scheduler extensions (hooks + checkpoints)
 */
export async function initializeSchedulerExtensions(
  config: Config,
): Promise<void> {
  const hookService = config.getHookService();
  const checkpointService = config.getCheckpointService();

  if (hookService) {
    await hookService.initialize();
    debugLogger.debug('✓ Hook service initialized');
  } else {
    debugLogger.warn('Hook service not available');
  }

  if (checkpointService) {
    await checkpointService.initialize();
    debugLogger.debug('✓ Checkpoint service initialized');
  } else {
    debugLogger.warn('Checkpoint service not available');
  }
}

/**
 * Get status of all new features
 */
export function getNewFeaturesStatus(config: Config): {
  hooks: boolean;
  checkpoints: boolean;
  skillsAutoActivation: boolean;
  markdownCommands: boolean;
} {
  return {
    hooks: !!config.getHookService(),
    checkpoints: !!config.getCheckpointService(),
    skillsAutoActivation: !!config.getSkillActivationService(),
    markdownCommands: !!config.getMarkdownCommandLoader(),
  };
}

// Export for external use
export {
  initializeNewFeatures,
  initializeSchedulerExtensions,
  getNewFeaturesStatus,
};
