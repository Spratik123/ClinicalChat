import { Box, Stack } from '@mui/material';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { useReportSummary, useReportTrends, useUnansweredTopics } from '@/api/queries/reports';
import { ReportStats } from './ReportStats';
import { TrendsPanel } from './TrendsPanel';
import { UnansweredPanel } from './UnansweredPanel';

/**
 * Failure-pattern, overlap, and unanswered-question reporting with trend
 * analysis (FR-RPT-001, CC-P1-020), plus the standalone trend-analysis
 * requirement it draws on (FR-TREND-001, CC-P1-013).
 */
export function ReportsPage() {
  const summaryQuery = useReportSummary();
  const trendsQuery = useReportTrends();
  const unansweredQuery = useUnansweredTopics();

  return (
    <>
      <PageHeader
        title="Failure-pattern & trend report"
        description="Recurring failure patterns, overlapping intents, and unanswered questions over time — not just counts and percentages."
      />

      <QueryBoundary query={summaryQuery}>{(summary) => <ReportStats summary={summary} />}</QueryBoundary>

      <Stack direction={{ xs: 'column', lg: 'row' }} sx={{ gap: '18px', alignItems: 'flex-start' }}>
        <Box sx={{ flex: '1 1 0', width: '100%', minWidth: 0 }}>
          <QueryBoundary query={trendsQuery}>{(trends) => <TrendsPanel trends={trends} />}</QueryBoundary>
        </Box>
        <Box sx={{ flex: '1 1 0', width: '100%', minWidth: 0 }}>
          <QueryBoundary query={unansweredQuery}>
            {(topics) => <UnansweredPanel topics={topics} />}
          </QueryBoundary>
        </Box>
      </Stack>
    </>
  );
}
