import { Box, Stack, Typography } from '@mui/material';
import { Panel } from '@/components/common/Panel';
import { StatusTag } from '@/components/common/StatusTag';
import { tokens } from '@/theme/tokens';
import { formatDateTime } from '@/utils/format';
import type { ReviewDecisionRecord } from '@/types/domain';

/**
 * What has already been decided on this turn — visible so a reviewer opening
 * a turn a second time (e.g. after a colleague acted) sees the history rather
 * than re-litigating it. Every entry here is what BRD 11 requires be logged.
 */
export function DecisionHistoryPanel({ decisions }: { decisions: ReviewDecisionRecord[] }) {
  if (decisions.length === 0) return null;

  return (
    <Panel title="Decision history">
      <Stack sx={{ gap: 1.5 }}>
        {decisions.map((entry, index) => (
          <Box key={`${entry.findingId}-${entry.at}-${index}`}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.25 }}>
              <StatusTag status={entry.resultingStatus} />
              <Typography sx={{ fontSize: 12, color: tokens.color.inkFaint }}>{formatDateTime(entry.at)}</Typography>
            </Stack>
            <Typography sx={{ fontSize: 12.5 }}>
              <Box component="span" sx={{ fontWeight: 600 }}>
                {entry.actor}
              </Box>{' '}
              on <Box component="span" sx={{ fontFamily: tokens.font.mono, fontSize: 12 }}>{entry.findingId}</Box>
              {entry.comment && <>: “{entry.comment}”</>}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Panel>
  );
}
