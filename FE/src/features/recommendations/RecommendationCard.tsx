import { useState } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CallMergeOutlinedIcon from '@mui/icons-material/CallMergeOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { StatusTag } from '@/components/common/StatusTag';
import { Mono } from '@/components/common/Mono';
import { usePermission } from '@/auth/useAuth';
import { recommendationKindMeta } from '@/config/recommendationKinds';
import { ownerLabels } from '@/config/findingTypes';
import { tokens } from '@/theme/tokens';
import { formatCount, formatDate } from '@/utils/format';
import type { DecisionKind, Recommendation, RecommendationKind } from '@/types/domain';
import { RecommendationDecisionDialog } from './RecommendationDecisionDialog';

const kindIcons: Record<RecommendationKind, typeof LightbulbOutlinedIcon> = {
  content_gap: LightbulbOutlinedIcon,
  intent_merge: CallMergeOutlinedIcon,
  new_flow: AccountTreeOutlinedIcon,
  prompt_change: TuneOutlinedIcon,
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  highlighted?: boolean;
}

/**
 * One recommendation — a drafted content-gap answer, an intent-merge
 * suggestion, a new-flow proposal, or a prompt-change suggestion. Approving
 * routes it to the owning workflow (BRD 6.4); this platform never writes to
 * the live intent library directly, regardless of kind.
 */
export function RecommendationCard({ recommendation, highlighted = false }: RecommendationCardProps) {
  const [dialogDecision, setDialogDecision] = useState<DecisionKind | null>(null);
  const meta = recommendationKindMeta[recommendation.kind];
  const Icon = kindIcons[recommendation.kind];
  const canDecide = usePermission('approveContentChange');
  const isOpen = recommendation.status === 'open';

  return (
    <Box
      id={`recommendation-${recommendation.id}`}
      sx={{
        border: `1px solid ${tokens.color.border}`,
        borderRadius: `${tokens.radius}px`,
        p: '16px 18px',
        mb: '14px',
        bgcolor: tokens.color.surface,
        transition: 'box-shadow .25s ease',
        boxShadow: highlighted ? `0 0 0 3px ${tokens.color.accent}` : 'none',
      }}
    >
      <Stack direction="row" sx={{ gap: '12px', alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            flex: '0 0 34px',
            borderRadius: '8px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: meta.bg,
            color: meta.fg,
          }}
        >
          <Icon sx={{ fontSize: 18 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: '10px', mb: '4px' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{recommendation.title}</Typography>
            <Mono dim>{recommendation.id}</Mono>
          </Stack>

          <Stack direction="row" sx={{ alignItems: 'center', gap: '8px', mb: '8px', flexWrap: 'wrap' }}>
            <Chip size="small" label={meta.label} sx={{ bgcolor: meta.bg, color: meta.fg }} />
            <StatusTag status={recommendation.status} routedToLabel={ownerLabels[recommendation.owner]} />
            {recommendation.occurrences !== undefined && (
              <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>
                {formatCount(recommendation.occurrences)} conversations
              </Typography>
            )}
            <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>
              · Updated {formatDate(recommendation.createdAt)}
            </Typography>
          </Stack>

          <Typography sx={{ fontSize: 13, color: tokens.color.inkMuted, mb: '10px', lineHeight: 1.55 }}>
            {recommendation.body}
          </Typography>

          {recommendation.evidence.length > 0 && (
            <Box component="ul" sx={{ m: 0, mb: '10px', pl: '18px', fontSize: 12.5, color: tokens.color.inkMuted }}>
              {recommendation.evidence.map((line) => (
                <Box component="li" key={line} sx={{ mb: '2px' }}>
                  {line}
                </Box>
              ))}
            </Box>
          )}

          {recommendation.draft && (
            <Box
              sx={{
                bgcolor: tokens.color.surfaceSunk,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: '5px',
                p: '10px 12px',
                mb: '10px',
              }}
            >
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: tokens.color.inkFaint, mb: '4px' }}>
                {recommendation.draftLabel?.toUpperCase() ?? 'DRAFT'}
              </Typography>
              <Typography sx={{ fontSize: 13, fontStyle: 'italic' }}>{recommendation.draft}</Typography>
            </Box>
          )}

          {recommendation.routedTo && recommendation.routedAt && (
            <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mb: isOpen ? 0 : '4px' }}>
              Routed to {recommendation.routedTo} on {formatDate(recommendation.routedAt)}
            </Typography>
          )}

          {isOpen && canDecide && (
            <Stack direction="row" sx={{ gap: '8px', flexWrap: 'wrap', mt: '4px' }}>
              <Button size="small" variant="contained" onClick={() => setDialogDecision('approve')}>
                Approve & route
              </Button>
              <Button size="small" variant="outlined" onClick={() => setDialogDecision('request_changes')}>
                Request changes
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => setDialogDecision('reject')}>
                Reject
              </Button>
            </Stack>
          )}

          {isOpen && !canDecide && (
            <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, fontStyle: 'italic' }}>
              Your role can view this recommendation but not decide it. Routes to{' '}
              {ownerLabels[recommendation.owner].toLowerCase()} once approved.
            </Typography>
          )}
        </Box>
      </Stack>

      {dialogDecision && (
        <RecommendationDecisionDialog
          open
          onClose={() => setDialogDecision(null)}
          recommendationId={recommendation.id}
          recommendationTitle={recommendation.title}
          approveHelp={meta.approveHelp}
          initialDecision={dialogDecision}
        />
      )}
    </Box>
  );
}
