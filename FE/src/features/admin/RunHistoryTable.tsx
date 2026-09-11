import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { RunStatusChip } from '@/components/common/RunStatusChip';
import { Mono } from '@/components/common/Mono';
import { tokens } from '@/theme/tokens';
import { formatCount, formatDateTime, formatUsd } from '@/utils/format';
import type { AuditRun } from '@/types/domain';

/** Run history — every batch, scheduled or manual, with what it cost and found (CC-P1-002). */
export function RunHistoryTable({ runs }: { runs: AuditRun[] }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Run</TableCell>
          <TableCell>Started</TableCell>
          <TableCell align="right">Turns</TableCell>
          <TableCell align="right">Findings</TableCell>
          <TableCell align="right">Cost</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {runs.map((run) => (
          <TableRow key={run.id}>
            <TableCell>
              <Mono>{run.id}</Mono>
              {run.label && (
                <Box sx={{ fontSize: 12, mt: '2px' }}>{run.label}</Box>
              )}
              {run.trigger === 'manual' && (
                <Typography sx={{ fontSize: 11, color: tokens.color.inkFaint, mt: '2px' }}>
                  Manual{run.triggeredBy ? ` · ${run.triggeredBy}` : ''}
                </Typography>
              )}
            </TableCell>
            <TableCell>
              <Box sx={{ fontSize: 13 }}>{formatDateTime(run.startedAt)}</Box>
            </TableCell>
            <TableCell align="right">
              <Mono>{formatCount(run.turnsAudited)}</Mono>
            </TableCell>
            <TableCell align="right">
              <Mono>{formatCount(run.findingsCount)}</Mono>
            </TableCell>
            <TableCell align="right">
              <Mono>{formatUsd(run.costUsd)}</Mono>
              {run.capHit && (
                <Box sx={{ fontSize: 11, color: tokens.color.medium, mt: '2px' }}>Cost cap hit</Box>
              )}
            </TableCell>
            <TableCell>
              <RunStatusChip status={run.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
