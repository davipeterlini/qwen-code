/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommandKind,
  type CommandCompletionItem,
  type CommandContext,
  type SlashCommand,
} from './types.js';
import { MessageType } from '../types.js';
import { t } from '../../i18n/index.js';

export const rewindCommand: SlashCommand = {
  name: 'rewind',
  description: t('Rewind to a previous checkpoint'),
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args?: string) => {
    const rawArgs = args?.trim() ?? '';

    // Show help if no arguments
    if (!rawArgs) {
      showHelp(context);
      return;
    }

    // Parse arguments
    const parts = rawArgs.split(/\s+/);
    const command = parts[0];

    if (command === 'list' || command === 'ls') {
      // List checkpoints - placeholder
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: t(
            'Checkpoint listing will be available soon.\n\nCheckpoints are automatically created before file modifications.\n\nUsage:\n  /rewind list          - List checkpoints\n  /rewind <id>          - Rewind to checkpoint\n  /rewind <id> --dry-run - Preview changes',
          ),
        },
        Date.now(),
      );
      return;
    }

    if (command === 'help') {
      showHelp(context);
      return;
    }

    // Placeholder for rewind functionality
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: t(`Rewind functionality placeholder.

Checkpoint ID: ${command}

In the next update, this will:
1. Show you what files will be restored
2. Ask for confirmation
3. Restore files to their previous state

For now, use git to restore files:
  git restore <file>
  git restore --staged <file>
  git reset --hard <commit>
`),
      },
      Date.now(),
    );
  },
  completion: async (
    _context: CommandContext,
    partialArg: string,
  ): Promise<CommandCompletionItem[]> => {
    // Add command suggestions
    const suggestions: CommandCompletionItem[] = [
      { label: 'list', value: 'list', description: t('List checkpoints') },
      { label: 'help', value: 'help', description: t('Show help') },
    ];

    // Filter by partial argument
    if (partialArg) {
      return suggestions.filter((s) =>
        (s.label || '').toLowerCase().includes(partialArg.toLowerCase()),
      );
    }

    return suggestions;
  },
};

function showHelp(context: CommandContext): void {
  const helpText = `
${t('Rewind Command Usage:')}

/rewind <checkpoint-id> [options]  ${t('Rewind to a checkpoint')}
/rewind list                       ${t('List available checkpoints')}
/rewind help                       ${t('Show this help')}

${t('Options:')}
  --dry-run, -n      ${t('Show what would be restored without making changes')}
  --no-save          ${t("Don't create a checkpoint before rewinding")}
  --files-only       ${t('Only restore files, not conversation')}
  --conversation-only ${t('Only restore conversation, not files')}

${t('Examples:')}
  /rewind chk_1234567890_1
  /rewind chk_1234567890_1 --dry-run
  /rewind list
`.trim();

  context.ui.addItem(
    {
      type: MessageType.INFO,
      text: helpText,
    },
    Date.now(),
  );
}
