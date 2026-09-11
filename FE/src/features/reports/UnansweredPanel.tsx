import { Box, Button, Chip, Link as MuiLink, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { Link as RouterLink } from 'react-router';
import { Panel } from '@/components/common/Panel';
import { EmptyState } from '@/components/common/EmptyState';
import { tokens } from '@/theme/tokens';
import { formatCount } from '@/utils/format';
import { downloadCsv } from '@/utils/csv';
import type { UnansweredTopic } from '@/types/domain';

const statusMeta: Record<UnansweredTopic['status'], { label: string; fg: string; bg: string }> = {
  not_drafted: { label: 'Not yet drafted', fg: tokens.color.inkMuted, bg: tokens.color.lowTint },
  draft_ready: { label: 'Draft ready', fg: tokens.color.teal, bg: tokens.color.tealTint },
  routed: { label: 'Routed', fg: tokens.color.success, bg: tokens.color.successTint },
};

/**
 * Recurring unanswered questions, grouped by topic and ranked by frequency
 * (FR-CGR-001, CC-P1-018). "Draft ready" topics link straight to their
 * drafted answer in Library review so a reviewer can go from "here's a gap"
 * to "here's what to approve" in one click.
 */
export function UnansweredPanel({ topics }: { topics: UnansweredTopic[] }) {
  const ranked = [...topics].sort((a, b) => b.occurrences - a.occurrences);

  const exportCsv = () =>
    downloadCsv(
      'clinicchat-unanswered-topics.csv',
      ranked.map((topic) => ({
        topic: topic.topic,
        occurrences: topic.occurrences,
        status: topic.status,
        recommendation_id: topic.recommendationId ?? '',
      })),
    );

  return (
    <Panel
      title="Unanswered question topics"
      subtitle="Grouped and ranked by frequency"
      actions={
        ranked.length > 0 ? (
          <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv}>
            Export CSV
          </Button>
        ) : undefined
      }
      flush
    >
      {ranked.length === 0 ? (
        <EmptyState title="No recurring gaps" description="Nothing has repeated often enough to surface here this period." />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Topic</TableCell>
              <TableCell align="right">Occurrences</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ranked.map((topic) => {
              const status = statusMeta[topic.status];
              return (
                <TableRow key={topic.id}>
                  <TableCell>{topic.topic}</TableCell>
                  <TableCell align="right">{formatCount(topic.occurrences)}</TableCell>
                  <TableCell>
                    {topic.recommendationId ? (
                      <MuiLink
                        component={RouterLink}
                        to={`/recommendations?highlight=${topic.recommendationId}`}
                        sx={{ fontSize: 12.5, fontWeight: 600 }}
                      >
                        <Chip
                          size="small"
                          component="span"
                          label={status.label}
                          sx={{ bgcolor: status.bg, color: status.fg, cursor: 'pointer' }}
                        />
                      </MuiLink>
                    ) : (
                      <Box component="span">
                        <Chip size="small" label={status.label} sx={{ bgcolor: status.bg, color: status.fg }} />
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
