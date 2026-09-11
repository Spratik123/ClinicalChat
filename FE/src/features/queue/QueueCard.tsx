import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { Mono } from '@/components/common/Mono';
import { categoryMeta, findingTypeMeta } from '@/config/findingTypes';
import { severityTokens, tokens } from '@/theme/tokens';
import { formatAge, humanizeFlowType } from '@/utils/format';
import type { QueueItem } from '@/types/domain';
import { QueueStatusPill } from './QueueStatusPill';

/**
 * One queue entry, card-shaped per the client's reference rather than a
 * table row: a left accent bar carrying the severity colour, the triggering
 * participant message quoted directly (so a reviewer can triage from the
 * list alone), category tags, and a risk score with its own colour band.
 */
export function QueueCard({ item, onOpen }: { item: QueueItem; onOpen: (item: QueueItem) => void }) {
  const meta = findingTypeMeta[item.findingType];
  const category = categoryMeta[meta.category];
  const severity = severityTokens[item.severity];
  const decided = item.status !== 'open';

  return (
    <Box
      role="link"
      tabIndex={0}
      aria-label={`Open turn ${item.turnId} — ${item.findingLabel}`}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(item);
        }
      }}
      sx={{
        display: 'flex',
        gap: '14px',
        p: '16px 18px',
        cursor: 'pointer',
        borderBottom: `1px solid ${tokens.color.border}`,
        borderLeft: `3px solid ${severity.fg}`,
        opacity: decided ? 0.68 : 1,
        '&:last-of-type': { borderBottom: 'none' },
        '&:hover': { bgcolor: tokens.color.surfaceSunk },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: '8px', mb: '6px', flexWrap: 'wrap' }}>
          <SeverityBadge severity={item.severity} />
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{item.findingLabel}</Typography>
        </Stack>

        <Typography
          sx={{
            fontSize: 13,
            fontStyle: 'italic',
            color: tokens.color.inkMuted,
            mb: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          “{item.signalQuote}”
        </Typography>

        <Stack direction="row" sx={{ gap: '6px', flexWrap: 'wrap' }}>
          <Chip size="small" label={humanizeFlowType(item.flowType)} sx={{ bgcolor: tokens.color.surfaceSunk, color: tokens.color.inkMuted, border: `1px solid ${tokens.color.border}` }} />
          <Chip size="small" label={category.label} sx={{ bgcolor: category.bg, color: category.fg }} />
        </Stack>
      </Box>

      <Stack sx={{ alignItems: 'flex-end', gap: '8px', flex: '0 0 auto', minWidth: 96 }}>
        <Mono dim>{item.turnId}</Mono>

        <Tooltip title={item.priorityReason ?? ''}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: 10.5, color: tokens.color.inkFaint, lineHeight: 1 }}>Risk score</Typography>
            <Typography sx={{ fontFamily: tokens.font.serif, fontWeight: 700, fontSize: 22, lineHeight: 1.15, color: severity.fg }}>
              {item.riskScore}
            </Typography>
            <Box sx={{ width: 64, height: 3, borderRadius: '2px', bgcolor: tokens.color.surfaceSunk, overflow: 'hidden', mt: '2px' }}>
              <Box sx={{ width: `${item.riskScore}%`, height: '100%', bgcolor: severity.fg }} />
            </Box>
          </Box>
        </Tooltip>

        <QueueStatusPill status={item.status} assignee={item.assignee} />

        <Typography sx={{ fontSize: 11, color: tokens.color.inkFaint }}>{formatAge(item.createdAt)} ago</Typography>
      </Stack>

      <ChevronRightIcon sx={{ fontSize: 18, color: tokens.color.inkFaint, alignSelf: 'center', flex: '0 0 auto' }} />
    </Box>
  );
}
