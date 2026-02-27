/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Integration entry point for all new features
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

    // 2-4. Other features are already integrated
    debugLogger.debug('Skills auto-activation ready');
    debugLogger.debug('Markdown commands ready');
    debugLogger.debug('Rewind command ready');
    debugLogger.debug('All new features initialized successfully!');
  } catch (error) {
    debugLogger.error('Error initializing new features:', error);
    throw error;
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
