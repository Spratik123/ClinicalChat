import { Box } from '@mui/material';
import { StatCard } from '@/components/common/StatCard';
import { tokens } from '@/theme/tokens';
import { formatCount, formatDate, formatPercentPoints } from '@/utils/format';
import type { ReportSummary } from '@/types/domain';

/**
 * Headline stats from BRD 4.3's success measures: audit-vs-human parity
 * (the ≥90% target), problems surfaced per period, and the reduction in
 * manual review effort — plus recurring trends still open, which feeds
 * straight into the panel below.
 */
export function ReportStats({ summary }: { summary: ReportSummary }) {
  const meetsTarget = summary.parityPct >= summary.parityTarget;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: '14px',
        mb: '18px',
      }}
    >
      <StatCard
        label="Audit-vs-human parity"
        value={formatPercentPoints(summary.parityPct)}
        tone={meetsTarget ? 'success' : 'warn'}
        foot={`Target ≥ ${formatPercentPoints(summary.parityTarget, 0)} · last validated ${formatDate(summary.parityValidatedAt)}`}
      />

      <StatCard
        label="Problems surfaced"
        value={formatCount(summary.problemsSurfaced)}
        foot={`Last ${summary.periodDays} days`}
      />

      <StatCard
        label="Recurring trends open"
        value={formatCount(summary.trendsAboveThreshold)}
        tone={summary.trendsAboveThreshold > 0 ? 'warn' : 'default'}
        foot="Above the alert threshold"
      />

      <StatCard
        label="Manual review time saved"
        value={`~${formatCount(summary.estimatedHoursSaved)} hrs`}
        foot={
          <Box component="span" sx={{ color: tokens.color.inkFaint }}>
            Estimated, last {summary.periodDays} days
          </Box>
        }
      />
    </Box>
  );
}
