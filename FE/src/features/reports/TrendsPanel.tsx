import { Box, Button, Chip, Table, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useNavigate } from 'react-router';
import { Panel } from '@/components/common/Panel';
import { EmptyState } from '@/components/common/EmptyState';
import { Mono } from '@/components/common/Mono';
import { tokens } from '@/theme/tokens';
import { formatCount } from '@/utils/format';
import { downloadCsv } from '@/utils/csv';
import type { IntentConfusionTrend, TrendDirection } from '@/types/domain';

const directionMeta: Record<TrendDirection, { Icon: typeof TrendingUpIcon; color: string; label: string }> = {
  // Rising confusion between two intents is the failure mode CC-P1-013
  // exists to catch, so "up" reads as a warning colour, not a positive one.
  up: { Icon: TrendingUpIcon, color: tokens.color.high, label: 'Rising' },
  flat: { Icon: TrendingFlatIcon, color: tokens.color.inkFaint, label: 'Flat' },
  down: { Icon: TrendingDownIcon, color: tokens.color.success, label: 'Falling' },
};

/**
 * Recurring intent-confusion trends (FR-TREND-001, CC-P1-013) — the same pair
 * of intents matched together across multiple conversations in the window,
 * which per-turn findings alone would never surface as a pattern.
 */
export function TrendsPanel({ trends }: { trends: IntentConfusionTrend[] }) {
  const navigate = useNavigate();

  const exportCsv = () =>
    downloadCsv(
      'clinicchat-intent-confusion-trends.csv',
      trends.map((trend) => ({
        intent_a: trend.intentA,
        intent_b: trend.intentB,
        occurrences: trend.occurrences,
        window_days: trend.windowDays,
        direction: trend.direction,
        above_alert_threshold: trend.aboveAlertThreshold ? 'yes' : 'no',
      })),
    );

  return (
    <Panel
      title="Recurring intent-confusion trends"
      subtitle="Same pair confused across multiple conversations in the window"
      actions={
        trends.length > 0 ? (
          <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv}>
            Export CSV
          </Button>
        ) : undefined
      }
      flush
    >
      {trends.length === 0 ? (
        <EmptyState title="No recurring confusion" description="No intent pair has repeated above the alert threshold this period." />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Intent A</TableCell>
              <TableCell>Intent B</TableCell>
              <TableCell align="right">Occurrences</TableCell>
              <TableCell>Trend</TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {trends.map((trend) => {
              const direction = directionMeta[trend.direction];
              return (
                <TableRow
                  key={trend.id}
                  hover
                  onClick={() => navigate(`/queue?search=${encodeURIComponent(trend.intentA)}`)}
                  sx={{
                    cursor: 'pointer',
                    // Amber, not safety/"Critical" red — a rising content-
                    // confusion trend is a quality issue, never a
                    // STOP/escalation miss, and that colour stays reserved.
                    ...(trend.aboveAlertThreshold && { bgcolor: tokens.color.highTint }),
                  }}
                >
                  <TableCell>
                    <Mono>{trend.intentA}</Mono>
                  </TableCell>
                  <TableCell>
                    <Mono>{trend.intentB}</Mono>
                    {trend.similarity !== undefined && (
                      <Box sx={{ fontSize: 11, color: tokens.color.inkFaint, mt: 0.25 }}>
                        cosine similarity {trend.similarity.toFixed(2)}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Mono>{formatCount(trend.occurrences)}</Mono>
                    <Box sx={{ fontSize: 11, color: tokens.color.inkFaint }}>/ {trend.windowDays}d</Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={trend.aboveAlertThreshold ? 'Above alert threshold' : 'Within normal range'}>
                      <Chip
                        size="small"
                        icon={<direction.Icon sx={{ fontSize: 15 }} />}
                        label={direction.label}
                        sx={{
                          bgcolor: trend.aboveAlertThreshold ? tokens.color.highTint : tokens.color.surfaceSunk,
                          color: trend.aboveAlertThreshold ? tokens.color.high : direction.color,
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ color: tokens.color.inkFaint, fontSize: 12 }}>View</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
