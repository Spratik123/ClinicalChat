import { Chip } from '@mui/material';
import { tokens } from '@/theme/tokens';
import type { RunStatus } from '@/types/domain';

const runStatusStyles: Record<RunStatus, { label: string; fg: string; bg: string }> = {
  queued: { label: 'Queued', fg: tokens.color.inkMuted, bg: tokens.color.lowTint },
  running: { label: 'Running', fg: tokens.color.accent, bg: tokens.color.accentTint },
  paused: { label: 'Paused', fg: tokens.color.medium, bg: tokens.color.mediumTint },
  succeeded: { label: 'Succeeded', fg: tokens.color.success, bg: tokens.color.successTint },
  // `partial` normally means the run stopped on its cost cap — not a failure,
  // but the operator needs to know coverage was incomplete.
  partial: { label: 'Partial', fg: tokens.color.medium, bg: tokens.color.mediumTint },
  failed: { label: 'Failed', fg: tokens.color.high, bg: tokens.color.highTint },
};

export function RunStatusChip({ status }: { status: RunStatus }) {
  const style = runStatusStyles[status];
  return <Chip size="small" label={style.label} sx={{ bgcolor: style.bg, color: style.fg }} />;
}
