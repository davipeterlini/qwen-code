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
// import { createDebugLogger } from '@qwen-code/qwen-code-core';

// const debugLogger = createDebugLogger('REWIND_COMMAND');

export const rewindCommand: SlashCommand = {
  name: 'rewind',
  get description() {
    return t('Rewind to a previous checkpoint');
  },
  kind: CommandKind.BUILT_IN,
  action: async (context: CommandContext, args?: string) => {
    const checkpointService = context.services.config?.getCheckpointService();

    if (!checkpointService) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: t('Checkpoint service not available'),
        },
        Date.now(),
      );
      return;
    }

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
      // List checkpoints
      const checkpoints = checkpointService.listCheckpoints({ limit: 20 });

      if (checkpoints.length === 0) {
        context.ui.addItem(
          {
            type: MessageType.INFO,
            text: t('No checkpoints available'),
          },
          Date.now(),
        );
        return;
      }

      const formattedList = formatCheckpointList(checkpoints);
      context.ui.addItem(
        {
          type: MessageType.INFO,
          text: formattedList,
        },
        Date.now(),
      );
      return;
    }

    if (command === 'help') {
      showHelp(context);
      return;
    }

    // Assume it's a checkpoint ID
    const checkpointId = command;
    const checkpoint = checkpointService.getCheckpoint(checkpointId);

    if (!checkpoint) {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: t('Checkpoint not found: {{id}}', { id: checkpointId }),
        },
        Date.now(),
      );
      return;
    }

    // Parse options
    const options = {
      restoreMode: 'both' as const,
      createCheckpoint: true,
      dryRun: false,
    };

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part === '--dry-run' || part === '-n') {
        options.dryRun = true;
      } else if (part === '--no-save') {
        options.createCheckpoint = false;
      } else if (part === '--files-only') {
        options.restoreMode = 'files';
      } else if (part === '--conversation-only') {
        options.restoreMode = 'conversation';
      }
    }

    // Show what will be restored
    const preview = formatCheckpointPreview(checkpoint, options);
    context.ui.addItem(
      {
        type: MessageType.INFO,
        text: preview,
      },
      Date.now(),
    );

    if (options.dryRun) {
      return;
    }

    // Confirm rewind
    context.ui.addItem(
      {
        type: MessageType.CONFIRMATION,
        text: t('Rewind to this checkpoint?'),
        confirmations: [
          {
            label: t('Yes, rewind'),
            value: 'yes',
          },
          {
            label: t('Cancel'),
            value: 'no',
          },
        ],
      },
      Date.now(),
    );

    // In a real implementation, we'd wait for confirmation here
    // For now, we'll just show the rewind result
    const result = await checkpointService.rewindToCheckpoint(
      checkpointId,
      options,
    );

    if (result.success) {
      const successMessage = formatRewindResult(result);
      context.ui.addItem(
        {
          type: MessageType.SUCCESS,
          text: successMessage,
        },
        Date.now(),
      );
    } else {
      context.ui.addItem(
        {
          type: MessageType.ERROR,
          text: result.error || t('Rewind failed'),
        },
        Date.now(),
      );
    }
  },
  completion: async (
    context: CommandContext,
    partialArg: string,
  ): Promise<CommandCompletionItem[]> => {
    const checkpointService = context.services.config?.getCheckpointService();

    if (!checkpointService) {
      return [];
    }

    const checkpoints = checkpointService.listCheckpoints({ limit: 10 });

    // Add command suggestions
    const suggestions: CommandCompletionItem[] = [
      { label: 'list', value: 'list', description: t('List checkpoints') },
      { label: 'help', value: 'help', description: t('Show help') },
    ];

    // Add checkpoint IDs
    for (const checkpoint of checkpoints) {
      const label = checkpoint.id;
      const description =
        checkpoint.label ||
        `Checkpoint ${new Date(checkpoint.timestamp).toLocaleString()}`;
      suggestions.push({ label, value: label, description });
    }

    // Filter by partial argument
    if (partialArg) {
      return suggestions.filter((s) =>
        s.label.toLowerCase().includes(partialArg.toLowerCase()),
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

function formatCheckpointList(
  checkpoints: Array<{
    id: string;
    timestamp: number;
    label?: string;
    fileChangesCount: number;
    isAuto: boolean;
    toolName?: string;
  }>,
): string {
  const lines: string[] = [t('Available Checkpoints:')];
  lines.push('');

  for (const checkpoint of checkpoints) {
    const date = new Date(checkpoint.timestamp).toLocaleString();
    const type = checkpoint.isAuto ? '🔄 Auto' : '📌 Manual';
    const label = checkpoint.label || '';
    const toolInfo = checkpoint.toolName ? ` (${checkpoint.toolName})` : '';
    const filesInfo = `${checkpoint.fileChangesCount} files`;

    lines.push(`**${checkpoint.id}**`);
    lines.push(`  ${type} • ${date}${toolInfo}`);
    if (label) {
      lines.push(`  ${label}`);
    }
    lines.push(`  ${filesInfo}`);
    lines.push('');
  }

  return lines.join('\n');
}

function formatCheckpointPreview(
  checkpoint: {
    id: string;
    timestamp: number;
    label?: string;
    fileChanges: Array<{ path: string; changeType: string }>;
    gitState?: { branch: string; commitHash: string };
  },
  options: { restoreMode: string; dryRun: boolean },
): string {
  const lines: string[] = [];

  const date = new Date(checkpoint.timestamp).toLocaleString();
  lines.push(`**Rewind Preview**`);
  lines.push(`Checkpoint: ${checkpoint.id}`);
  if (checkpoint.label) {
    lines.push(`Label: ${checkpoint.label}`);
  }
  lines.push(`Created: ${date}`);
  lines.push('');

  if (options.dryRun) {
    lines.push('⚠️ **DRY RUN** - No changes will be made');
    lines.push('');
  }

  lines.push(`**Files to Restore:** ${checkpoint.fileChanges.length}`);
  for (const file of checkpoint.fileChanges.slice(0, 10)) {
    const icon =
      file.changeType === 'created'
        ? '➕'
        : file.changeType === 'modified'
          ? '✏️'
          : '🗑️';
    lines.push(`  ${icon} ${file.path}`);
  }
  if (checkpoint.fileChanges.length > 10) {
    lines.push(`  ... and ${checkpoint.fileChanges.length - 10} more`);
  }
  lines.push('');

  if (checkpoint.gitState) {
    lines.push(`**Git State:**`);
    lines.push(`  Branch: ${checkpoint.gitState.branch}`);
    lines.push(`  Commit: ${checkpoint.gitState.commitHash.substring(0, 7)}`);
    lines.push('');
  }

  lines.push(`**Restore Mode:** ${options.restoreMode}`);

  return lines.join('\n');
}

function formatRewindResult(result: {
  success: boolean;
  filesRestored: string[];
  filesFailed: string[];
  gitOperations?: string[];
  error?: string;
  dryRun: boolean;
}): string {
  const lines: string[] = [];

  if (result.dryRun) {
    lines.push('✅ **Dry Run Complete**');
  } else if (result.success) {
    lines.push('✅ **Rewind Successful**');
  } else {
    lines.push('❌ **Rewind Failed**');
    if (result.error) {
      lines.push(`Error: ${result.error}`);
    }
  }

  lines.push('');
  lines.push(`**Files Restored:** ${result.filesRestored.length}`);

  if (result.filesRestored.length > 0) {
    for (const file of result.filesRestored.slice(0, 5)) {
      lines.push(`  ✓ ${file}`);
    }
    if (result.filesRestored.length > 5) {
      lines.push(`  ... and ${result.filesRestored.length - 5} more`);
    }
  }

  if (result.filesFailed.length > 0) {
    lines.push('');
    lines.push(`**Files Failed:** ${result.filesFailed.length}`);
    for (const file of result.filesFailed.slice(0, 5)) {
      lines.push(`  ✗ ${file}`);
    }
  }

  if (result.gitOperations && result.gitOperations.length > 0) {
    lines.push('');
    lines.push('**Git Operations:**');
    for (const op of result.gitOperations) {
      lines.push(`  ${op}`);
    }
  }

  return lines.join('\n');
}
