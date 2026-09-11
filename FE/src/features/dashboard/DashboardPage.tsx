import { Alert, Box, Button, Stack } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Link as RouterLink } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { useDashboardSummary, useFindingsByType, useRecentRuns } from '@/api/queries/dashboard';
import { tokens } from '@/theme/tokens';
import { OnboardingCard } from './OnboardingCard';
import { DashboardStats } from './DashboardStats';
import { FindingsByTypePanel } from './FindingsByTypePanel';
import { RecentRunsPanel } from './RecentRunsPanel';

export function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const findingsQuery = useFindingsByType();
  const runsQuery = useRecentRuns();

  return (
    <>
      <PageHeader
        title="Overview"
        description="Audit health at a glance: the last run, findings this period, review-queue depth, and cost burn against the per-run cap."
      />

      <QueryBoundary query={summaryQuery}>
        {(summary) => (
          <>
            {/*
              Open safety-critical findings get an unmissable banner above
              everything else. A missed STOP opt-out or emergency escalation
              carries regulatory and human-safety weight (BRD 4.2), so it must
              not be something the operator has to notice in a table.
            */}
            {summary.safetyFindingsOpen > 0 && (
              <Alert
                severity="error"
                icon={<WarningAmberIcon />}
                action={
                  <Button
                    component={RouterLink}
                    to="/queue?safetyOnly=true"
                    size="small"
                    variant="contained"
                    sx={{ bgcolor: tokens.color.safety, '&:hover': { bgcolor: tokens.color.safetyInk } }}
                  >
                    Review now
                  </Button>
                }
                sx={{
                  mb: '18px',
                  alignItems: 'center',
                  bgcolor: tokens.color.safetyTint,
                  color: tokens.color.safety,
                  border: `1px solid ${tokens.color.safety}33`,
                  '& .MuiAlert-icon': { color: tokens.color.safety },
                }}
              >
                <Box component="b">
                  {summary.safetyFindingsOpen} safety-critical{' '}
                  {summary.safetyFindingsOpen === 1 ? 'finding' : 'findings'} unresolved
                </Box>{' '}
                — a STOP opt-out or emergency escalation was missed.
              </Alert>
            )}

            <OnboardingCard steps={summary.onboarding} />

            <DashboardStats summary={summary} />

            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              sx={{ gap: '18px', alignItems: 'flex-start' }}
            >
              <Box sx={{ flex: { lg: '1.5 1 0' }, width: '100%', minWidth: 0 }}>
                <QueryBoundary query={findingsQuery}>
                  {(rows) => <FindingsByTypePanel rows={rows} periodDays={summary.periodDays} />}
                </QueryBoundary>
              </Box>

              <Box sx={{ flex: { lg: '1 1 0' }, width: '100%', minWidth: 0 }}>
                <QueryBoundary query={runsQuery}>{(runs) => <RecentRunsPanel runs={runs} />}</QueryBoundary>
              </Box>
            </Stack>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
