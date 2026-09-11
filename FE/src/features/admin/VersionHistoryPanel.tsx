import { Button, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Panel } from '@/components/common/Panel';
import { tokens } from '@/theme/tokens';
import { formatDateTime } from '@/utils/format';
import type { AuditConfig } from '@/types/domain';

interface VersionHistoryPanelProps {
  versions: AuditConfig[];
  onRestore: (version: AuditConfig) => void;
}

/**
 * Every past configuration, newest first. "Restore" loads a past version's
 * settings into the draft above for review — it does not reactivate it
 * directly; saving still requires a note, same as any other change.
 */
export function VersionHistoryPanel({ versions, onRestore }: VersionHistoryPanelProps) {
  return (
    <Panel title="Version history" flush>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 90 }}>Version</TableCell>
            <TableCell sx={{ width: 150 }}>Saved by</TableCell>
            <TableCell sx={{ width: 150 }}>When</TableCell>
            <TableCell>Note</TableCell>
            <TableCell sx={{ width: 100 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {versions.map((version) => (
            <TableRow key={version.version}>
              <TableCell>
                <Typography component="span" sx={{ fontFamily: tokens.font.mono, fontSize: 13 }}>
                  v{version.version}
                </Typography>
                {version.active && (
                  <Chip
                    size="small"
                    label="Active"
                    sx={{ ml: 1, bgcolor: tokens.color.successTint, color: tokens.color.success }}
                  />
                )}
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: 13 }}>{version.savedBy}</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: 12.5, color: tokens.color.inkMuted }}>
                  {formatDateTime(version.savedAt)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: 13 }}>{version.note}</Typography>
              </TableCell>
              <TableCell>
                {!version.active && (
                  <Button size="small" variant="text" onClick={() => onRestore(version)}>
                    Restore
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Panel>
  );
}
