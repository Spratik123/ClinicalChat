import { Box, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { StatCard } from '@/components/common/StatCard';
import { Mono } from '@/components/common/Mono';
import { tokens } from '@/theme/tokens';
import { formatCount, formatTime, formatUsd } from '@/utils/format';
import type { DashboardSummary } from '@/types/domain';

/**
 * The four dashboard counters from the prototype: last run, findings this
 * period, queue depth, and cost burn against the per-run cap.
 */
export function DashboardStats({ summary }: { summary: DashboardSummary }) {
  const { lastRun, queueBreakdown } = summary;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: '14px',
        mb: '18px',
      }}
    >
      {/* Last run */}
      <StatCard
        label="Last run"
        value={lastRun ? <Mono>{lastRun.id}</Mono> : '—'}
        foot={
          lastRun ? (
            <>
              {lastRun.status === 'partial' ? 'Partial' : 'Succeeded'} ·{' '}
              {formatCount(lastRun.turnsAudited)} turns · {formatTime(lastRun.completedAt ?? lastRun.startedAt)}
            </>
          ) : (
            'No completed run yet'
          )
        }
      />

      {/* Findings this period */}
      <StatCard
        label="Findings (all runs)"
        value={formatCount(summary.findingsThisPeriod)}
        foot={
          summary.safetyFindingsOpen > 0 ? (
            <Box component="span" sx={{ color: tokens.color.safety, fontWeight: 600 }}>
              {summary.safetyFindingsOpen} safety-critical, unresolved
            </Box>
          ) : (
            'No safety-critical findings open'
          )
        }
      />

      {/* Review queue depth */}
      <StatCard
        label="Review queue depth"
        value={formatCount(summary.queueDepth)}
        tone={queueBreakdown.safety > 0 ? 'safety' : 'default'}
        foot={
          <>
            {queueBreakdown.content} content, {queueBreakdown.safety} safety
            {queueBreakdown.engineering > 0 && `, ${queueBreakdown.engineering} engineering`}
          </>
        }
      />

      {/* Cost burn */}
      {lastRun ? <CostBurnCard runCost={lastRun.costUsd} cap={lastRun.costCapUsd} capHit={lastRun.capHit} /> : null}
    </Box>
  );
}

/**
 * Cost against the per-run cap.
 *
 * Not in the BRD's feature list, but the prototype treats it as first-class —
 * and it is the operator's only warning that a run is about to be truncated
 * (OQ-04). A capped run reports `partial`, not `succeeded`.
 */
function CostBurnCard({ runCost, cap, capHit }: { runCost: number; cap: number; capHit: boolean }) {
  const ratio = cap > 0 ? Math.min(runCost / cap, 1) : 0;
  const nearCap = ratio >= 0.8;

  return (
    <StatCard
      label="Cost burn — last run"
      tone={capHit ? 'warn' : 'default'}
      value={
        <Stack direction="row" sx={{ alignItems: 'baseline', gap: 0.5 }}>
          <Box component="span">{formatUsd(runCost)}</Box>
          <Typography component="span" sx={{ fontSize: 15, color: tokens.color.inkFaint, fontFamily: tokens.font.serif }}>
            {cap > 0 ? `/ ${formatUsd(cap)}` : '· no cap set'}
          </Typography>
        </Stack>
      }
      foot={
        <>
          <Box
            sx={{
              height: 7,
              mt: 0.25,
              mb: 0.75,
              borderRadius: '4px',
              bgcolor: tokens.color.surfaceSunk,
              border: `1px solid ${tokens.color.border}`,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${ratio * 100}%`,
                height: '100%',
                bgcolor: nearCap ? tokens.color.high : tokens.color.teal,
              }}
            />
          </Box>

          {capHit ? (
            <Box component="span" sx={{ color: tokens.color.high, fontWeight: 600 }}>
              Cap hit — run truncated.{' '}
              <Link component={RouterLink} to="/admin/configuration" sx={{ fontSize: 'inherit' }}>
                Raise the cap
              </Link>
            </Box>
          ) : (
            cap > 0 ? `${Math.round(ratio * 100)}% of cap` : 'Set max_usd_per_run in the audit configuration'
          )}
        </>
      }
    />
  );
}
