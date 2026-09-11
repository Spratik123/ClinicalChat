import { Chip } from '@mui/material';
import { tokens } from '@/theme/tokens';
import type { ReviewStatus } from '@/types/domain';

const statusStyles: Record<ReviewStatus, { label: string; fg: string; bg: string }> = {
  open: { label: 'Open', fg: tokens.color.medium, bg: tokens.color.mediumTint },
  approved: { label: 'Approved', fg: tokens.color.success, bg: tokens.color.successTint },
  changes_requested: { label: 'Changes requested', fg: tokens.color.high, bg: tokens.color.highTint },
  rejected: { label: 'Rejected', fg: tokens.color.inkMuted, bg: tokens.color.lowTint },
  // `routed` is the terminal success state: the change left this platform for
  // its owning workflow. This platform never writes to the library directly.
  // No destination is claimed by default — a finding or recommendation can
  // route to safety, content, or engineering, and naming the wrong one is
  // worse than naming none; pass `routedToLabel` when the caller actually
  // knows where it went.
  routed: { label: 'Routed', fg: tokens.color.teal, bg: tokens.color.tealTint },
};

interface StatusTagProps {
  status: ReviewStatus;
  /** Where a `routed` item actually went (e.g. "Safety", "Engineering") — shown as "Routed to {label}" when provided. */
  routedToLabel?: string;
}

export function StatusTag({ status, routedToLabel }: StatusTagProps) {
  const style = statusStyles[status];
  const label = status === 'routed' && routedToLabel ? `Routed to ${routedToLabel}` : style.label;
  return (
    <Chip
      size="small"
      label={label}
      sx={{ bgcolor: style.bg, color: style.fg, borderRadius: '4px' }}
    />
  );
}
