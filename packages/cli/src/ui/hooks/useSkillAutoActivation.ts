/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  Config,
  SkillConfig,
  SkillMatchResult,
} from '@qwen-code/qwen-code-core';
import { createDebugLogger } from '@qwen-code/qwen-code-core';

const debugLogger = createDebugLogger('SKILL_AUTO_ACTIVATION');

/**
 * Hook for automatic skill activation based on user input
 */
export function useSkillAutoActivation(config: Config | null) {
  const [availableSkills, setAvailableSkills] = useState<SkillConfig[]>([]);
  const [activatedSkills, setActivatedSkills] = useState<SkillMatchResult[]>(
    [],
  );

  // Load skills on mount
  useEffect(() => {
    if (!config) return;

    const loadSkills = async () => {
      const skillManager = config.getSkillManager();
      if (skillManager) {
        const skills = await skillManager.listSkills();
        setAvailableSkills(skills);
        debugLogger.debug(`Loaded ${skills.length} skills for auto-activation`);
      }
    };

    loadSkills();
  }, [config]);

  /**
   * Check if input should trigger skill auto-activation
   */
  const checkAndActivateSkills = useCallback(
    async (
      userInput: string,
    ): Promise<{
      enhancedPrompt: string;
      activatedSkills: SkillMatchResult[];
      message?: string;
    }> => {
      if (!config || availableSkills.length === 0) {
        return { enhancedPrompt: userInput, activatedSkills: [] };
      }

      const skillActivationService = config.getSkillActivationService();
      if (!skillActivationService) {
        return { enhancedPrompt: userInput, activatedSkills: [] };
      }

      // Find matching skills
      const matchingSkills = skillActivationService.findMatchingSkills(
        availableSkills,
        userInput,
        { threshold: 0.3, maxResults: 3 },
      );

      if (matchingSkills.length === 0) {
        return { enhancedPrompt: userInput, activatedSkills: [] };
      }

      // Auto-activate skills
      const autoActivateSkills = matchingSkills.filter(
        (match) => match.autoActivate,
      );

      if (autoActivateSkills.length === 0) {
        return { enhancedPrompt: userInput, activatedSkills: matchingSkills };
      }

      // Build enhanced prompt with skill contexts
      let enhancedPrompt = userInput;
      const skillContexts: string[] = [];

      for (const match of autoActivateSkills) {
        const skillContext = skillActivationService.buildSkillContext(
          match.skill,
        );
        skillContexts.push(skillContext);
      }

      if (skillContexts.length > 0) {
        enhancedPrompt = `${skillContexts.join('\n\n')}\n\n${userInput}`;
      }

      // Build activation message
      const message =
        skillActivationService.buildActivationMessage(autoActivateSkills);

      setActivatedSkills(autoActivateSkills);

      debugLogger.debug(
        `Auto-activated ${autoActivateSkills.length} skills: ${autoActivateSkills.map((s) => s.skill.name).join(', ')}`,
      );

      return {
        enhancedPrompt,
        activatedSkills: autoActivateSkills,
        message,
      };
    },
    [config, availableSkills],
  );

  /**
   * Reset activated skills
   */
  const resetActivatedSkills = useCallback(() => {
    setActivatedSkills([]);
  }, []);

  return {
    availableSkills,
    activatedSkills,
    checkAndActivateSkills,
    resetActivatedSkills,
  };
}
