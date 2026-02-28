/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  SlashCommand,
  CommandContext,
  SlashCommandActionReturn,
} from './types.js';
import { CommandKind } from './types.js';
import { MessageType } from '../types.js';
import { t } from '../../i18n/index.js';
import { createPlanDocumentsManager } from '../../services/PlanDocumentsManager.js';

/**
 * Command to manage plan documents for spec-driven development
 */
export const plansCommand: SlashCommand = {
  name: 'plans',
  get description() {
    return t('Manage plan documents for spec-driven development.');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext) => {
    const manager = createPlanDocumentsManager(context.services.config);
    await manager.initialize();

    const plans = await manager.listPlans();

    if (plans.length === 0) {
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t('No plans found. Create one with /plans create <title>'),
        },
        Date.now(),
      );
      return;
    }

    let output = `📋 ${t('Available Plans:')}\n\n`;

    for (const plan of plans) {
      const statusEmoji =
        {
          draft: '📝',
          in_progress: '🔄',
          completed: '✅',
          abandoned: '❌',
        }[plan.status] || '📄';

      output += `${statusEmoji} **${plan.title}**\n`;
      output += `   ${t('ID:')} \`${plan.id}\`\n`;
      output += `   ${t('Status:')} ${plan.status} | ${t('Created:')} ${new Date(plan.createdAt).toLocaleDateString()}\n\n`;
    }

    output += `\n${t('Use /plans show <id> to view details, /plans create <title> to create a new plan.')}`;

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
        return t('List all available plans.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext) => {
        // Same as main action
        const manager = createPlanDocumentsManager(context.services.config);
        await manager.initialize();

        const plans = await manager.listPlans();

        if (plans.length === 0) {
          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t('No plans found.'),
            },
            Date.now(),
          );
          return;
        }

        let output = `📋 ${t('Available Plans:')}\n\n`;
        for (const plan of plans) {
          output += `- **${plan.title}** (${plan.id}) - ${plan.status}\n`;
        }

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
      name: 'show',
      get description() {
        return t('Show details of a specific plan.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext, args: string) => {
        if (!args || args.trim() === '') {
          return {
            type: 'message',
            messageType: 'error',
            content: t('Usage: /plans show <plan-id>'),
          };
        }

        const manager = createPlanDocumentsManager(context.services.config);
        await manager.initialize();

        const plan = await manager.getPlan(args.trim());

        if (!plan) {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Plan not found: {{id}}', { id: args.trim() }),
            },
            Date.now(),
          );
          return;
        }

        let output = `📋 **${plan.title}**\n\n`;
        output += `${t('Description:')} ${plan.description}\n\n`;
        output += `${t('Status:')} ${plan.status}\n`;
        output += `${t('Created:')} ${new Date(plan.createdAt).toLocaleString()}\n`;
        output += `${t('Updated:')} ${new Date(plan.updatedAt).toLocaleString()}\n\n`;

        output += `**${t('Steps:')}**\n`;
        for (const step of plan.steps) {
          const statusEmoji =
            {
              pending: '⏳',
              in_progress: '🔄',
              completed: '✅',
              skipped: '⏭️',
            }[step.status] || '📄';

          output += `${statusEmoji} ${step.description}`;
          if (step.completedAt) {
            output += ` (${new Date(step.completedAt).toLocaleDateString()})`;
          }
          output += '\n';
        }

        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: output,
          },
          Date.now(),
        );
        return;
      },
    },
    {
      name: 'create',
      get description() {
        return t('Create a new plan.');
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
              'Usage: /plans create <title> --description "<description>"',
            ),
          };
        }

        // Submit a prompt to help create the plan
        return {
          type: 'submit_prompt',
          content: [
            {
              text: `Help me create a detailed plan for: ${args.trim()}\n\nPlease create a structured plan with clear steps that I can track using the /plans command.`,
            },
          ],
        };
      },
    },
    {
      name: 'update',
      get description() {
        return t("Update a plan's status or steps.");
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
            content: t('Usage: /plans update <plan-id> --status "<status>"'),
          };
        }

        return {
          type: 'submit_prompt',
          content: [
            {
              text: `Help me update the plan: ${args.trim()}\n\nWhat changes would you like to make to the plan?`,
            },
          ],
        };
      },
    },
    {
      name: 'delete',
      get description() {
        return t('Delete a plan.');
      },
      kind: CommandKind.BUILT_IN,
      action: async (context: CommandContext, args: string) => {
        if (!args || args.trim() === '') {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Usage: /plans delete <plan-id>'),
            },
            Date.now(),
          );
          return;
        }

        const manager = createPlanDocumentsManager(context.services.config);
        await manager.initialize();

        const deleted = await manager.deletePlan(args.trim());

        if (deleted) {
          context.ui.addItem(
            {
              type: MessageType.INFO,
              text: t('Plan deleted successfully: {{id}}', { id: args.trim() }),
            },
            Date.now(),
          );
        } else {
          context.ui.addItem(
            {
              type: MessageType.ERROR,
              text: t('Failed to delete plan: {{id}}', { id: args.trim() }),
            },
            Date.now(),
          );
        }
      },
    },
  ],
};
