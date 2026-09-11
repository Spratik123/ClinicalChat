import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { Panel } from '@/components/common/Panel';
import { EmptyState } from '@/components/common/EmptyState';
import { RunStatusChip } from '@/components/common/RunStatusChip';
import { Mono } from '@/components/common/Mono';
import { usePermission } from '@/auth/useAuth';
import { tokens } from '@/theme/tokens';
import { formatCount } from '@/utils/format';
import type { AuditRun } from '@/types/domain';

export function RecentRunsPanel({ runs }: { runs: AuditRun[] }) {
  const canManage = usePermission('manageAudit');

  return (
    <Panel
      title="Recent runs"
      actions={
        canManage ? (
          <Button component={RouterLink} to="/admin/scheduler" size="small" variant="outlined">
            Scheduler
          </Button>
        ) : undefined
      }
      flush
    >
      {runs.length === 0 ? (
        <EmptyState
          title="No runs yet"
          description="The nightly audit has not run. An Owner / Admin can start one from the scheduler."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Run</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Turns</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell>
                  <Mono>{run.id}</Mono>
                  {run.trigger === 'manual' && (
                    <Box sx={{ fontSize: 11, color: tokens.color.inkFaint, mt: 0.25 }}>
                      Manual{run.triggeredBy ? ` · ${run.triggeredBy}` : ''}
                    </Box>
                  )}
                </TableCell>

                <TableCell>
                  <RunStatusChip status={run.status} />
                  {run.capHit && (
                    <Box sx={{ fontSize: 11, color: tokens.color.medium, mt: 0.25 }}>Cost cap hit</Box>
                  )}
                </TableCell>

                <TableCell align="right">
                  <Mono>{formatCount(run.turnsAudited)}</Mono>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
