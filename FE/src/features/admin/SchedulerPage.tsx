import { useState } from 'react';
import { Button, Link as MuiLink } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PageHeader } from '@/components/common/PageHeader';
import { Panel } from '@/components/common/Panel';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { useScheduler } from '@/api/queries/scheduler';
import { usePermission } from '@/auth/useAuth';
import { RunInProgressCard } from './RunInProgressCard';
import { SchedulerStatCards } from './SchedulerStatCards';
import { RunHistoryTable } from './RunHistoryTable';
import { ScheduleRunDialog } from './ScheduleRunDialog';

const COLLAPSED_HISTORY_COUNT = 4;

/**
 * "Audit runs" in the nav — the BRD/code name is Scheduler (CC-P1-002's
 * scheduling & run-history half). The recurring batch job, its next run,
 * and the history of every run with turns audited, findings, and cost.
 */
export function SchedulerPage() {
  const schedulerQuery = useScheduler();
  const canManage = usePermission('manageAudit');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  return (
    <>
      <PageHeader
        title="Audit runs"
        description="Schedule, monitor, and inspect batch audit coverage."
        actions={
          canManage ? (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={() => setScheduleDialogOpen(true)}
            >
              Schedule a run
            </Button>
          ) : undefined
        }
      />

      <QueryBoundary query={schedulerQuery}>
        {({ job, runs }) => {
          const inProgress = runs.find((run) => run.status === 'running' || run.status === 'paused');
          const visibleRuns = showFullHistory ? runs : runs.slice(0, COLLAPSED_HISTORY_COUNT);

          return (
            <>
              {inProgress && <RunInProgressCard run={inProgress} />}

              <SchedulerStatCards job={job} runs={runs} />

              <Panel
                title="Run history"
                subtitle="Completed and active batches"
                actions={
                  <Button size="small" variant="text" startIcon={<RefreshIcon />} onClick={() => void schedulerQuery.refetch()}>
                    Refresh
                  </Button>
                }
                flush
              >
                <RunHistoryTable runs={visibleRuns} />

                {!showFullHistory && runs.length > COLLAPSED_HISTORY_COUNT && (
                  <MuiLink
                    component="button"
                    onClick={() => setShowFullHistory(true)}
                    sx={{ display: 'block', fontSize: 12.5, fontWeight: 600, p: '12px 16px' }}
                  >
                    Show full run history ({runs.length}) ›
                  </MuiLink>
                )}
              </Panel>
            </>
          );
        }}
      </QueryBoundary>

      <ScheduleRunDialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} />
    </>
  );
}
