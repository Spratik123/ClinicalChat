import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Panel } from '@/components/common/Panel';
import { EmptyState } from '@/components/common/EmptyState';
import { tokens } from '@/theme/tokens';
import { formatDateTime } from '@/utils/format';
import type { AccessLogEntry } from '@/types/domain';

/**
 * The platform's admin activity trail (BRD 11): user invites, deactivations,
 * role changes, and audit-configuration saves all land here — every one of
 * them a consequence of an action taken on this screen or Audit configuration.
 */
export function AccessLogPanel({ entries }: { entries: AccessLogEntry[] }) {
  return (
    <Panel title="Access change log" subtitle="Every admin action, logged and retained per HIPAA/SOC-2" flush>
      {entries.length === 0 ? (
        <EmptyState title="No activity yet" description="Admin actions will appear here as they happen." />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 170 }}>When</TableCell>
              <TableCell sx={{ width: 160 }}>Actor</TableCell>
              <TableCell>Change</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <Typography sx={{ fontSize: 12.5, color: tokens.color.inkMuted }}>
                    {formatDateTime(entry.at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{entry.actor}</Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 13 }}>{entry.change}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
