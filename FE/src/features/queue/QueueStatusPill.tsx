import { Box, Chip } from '@mui/material';
import { tokens } from '@/theme/tokens';
import type { ReviewStatus } from '@/types/domain';

interface QueueStatusPillProps {
  status: ReviewStatus;
  assignee: string | null;
}

/**
 * Workflow-state pill for a queue card: "Needs review" / "In review" / the
 * resolved states. Distinct on purpose from `<SeverityBadge>` — severity says
 * *how bad*, this says *what stage of triage it's in*, and the client's
 * reference (rightly) colours them independently: a Critical-severity item
 * can sit at "In review" in amber right alongside a "Needs review" one in
 * red.
 *
 * "Needs review" deliberately does NOT reuse the reserved safety/"Critical"
 * red — that colour stays exclusive to the severity badge (BRD 4.2), so a
 * merely-unclaimed Low-severity item never borrows the same alarm colour as
 * a missed STOP opt-out.
 *
 * Takes just the two fields it needs rather than a full `QueueItem`, so
 * callers that only have a `Finding` (the turn-detail drawer) don't have to
 * fabricate one.
 */
export function QueueStatusPill({ status, assignee }: QueueStatusPillProps) {
  const style = statusStyle(status, assignee);

  return (
    <Chip
      size="small"
      label={
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />
          {style.label}
        </Box>
      }
      sx={{ bgcolor: style.bg, color: style.fg }}
    />
  );
}

function statusStyle(status: ReviewStatus, assignee: string | null): { label: string; fg: string; bg: string } {
  if (status === 'open') {
    return assignee
      ? { label: 'In review', fg: tokens.color.accent, bg: tokens.color.accentTint }
      : { label: 'Needs review', fg: tokens.color.high, bg: tokens.color.highTint };
  }
  switch (status) {
    case 'routed':
    case 'approved':
      return { label: 'Approved & routed', fg: tokens.color.success, bg: tokens.color.successTint };
    case 'changes_requested':
      return { label: 'Changes requested', fg: tokens.color.medium, bg: tokens.color.mediumTint };
    case 'rejected':
      return { label: 'Rejected', fg: tokens.color.inkMuted, bg: tokens.color.lowTint };
  }
}
