import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useSearchParams } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { EmptyState } from '@/components/common/EmptyState';
import { useRecommendations } from '@/api/queries/recommendations';
import { recommendationKindMeta, recommendationKindOrder } from '@/config/recommendationKinds';
import { tokens } from '@/theme/tokens';
import type { Recommendation, RecommendationKind } from '@/types/domain';
import { RecommendationCard } from './RecommendationCard';

/**
 * "Library review" in the nav — the BRD/code name is Recommendations
 * (CC-P1-006/014/015/018/019). Drafted answers, intent merges, new-flow
 * proposals, and prompt-change suggestions awaiting a human decision.
 */
export function RecommendationsPage() {
  const recommendationsQuery = useRecommendations();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight') ?? undefined;

  const [activeKind, setActiveKind] = useState<RecommendationKind>('content_gap');
  const highlightRef = useRef<HTMLDivElement | null>(null);

  // Arriving from a Reports deep link: jump to the right tab and scroll to it.
  useEffect(() => {
    if (!highlightId || !recommendationsQuery.data) return;
    const target = recommendationsQuery.data.items.find((rec) => rec.id === highlightId);
    if (target) setActiveKind(target.kind);
  }, [highlightId, recommendationsQuery.data]);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightId, activeKind]);

  return (
    <>
      <PageHeader
        title="Library review"
        description="Turn repeated review signals into changes for the existing CMS."
      />

      {/* Reinforces BRD 6.4 for the one screen where it matters most — this is
          where approvals are made, so the constraint has to be visible right
          here, not just in a README. */}
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: '10px',
          p: '12px 16px',
          mb: '18px',
          borderRadius: `${tokens.radius}px`,
          bgcolor: tokens.color.accentTint,
          border: `1px solid ${tokens.color.accentTintBorder}`,
        }}
      >
        <ShieldOutlinedIcon sx={{ fontSize: 18, color: tokens.color.accent, flex: '0 0 auto' }} />
        <Typography sx={{ fontSize: 12.5, color: tokens.color.ink, flex: 1 }}>
          <Box component="b">Protected workspace.</Box> Review suggestions here are proposals only.
          Approvals route to the existing content workflow / CMS; no live library content is edited
          in this platform.
        </Typography>
        <Chip
          size="small"
          label="READ-ONLY"
          sx={{
            fontFamily: tokens.font.mono,
            fontSize: 10.5,
            bgcolor: tokens.color.surface,
            color: tokens.color.accent,
            border: `1px solid ${tokens.color.accentTintBorder}`,
          }}
        />
      </Stack>

      <QueryBoundary query={recommendationsQuery}>
        {(data) => (
          <RecommendationsBody
            items={data.items}
            activeKind={activeKind}
            onKindChange={setActiveKind}
            highlightId={highlightId}
            highlightRef={highlightRef}
          />
        )}
      </QueryBoundary>
    </>
  );
}

function RecommendationsBody({
  items,
  activeKind,
  onKindChange,
  highlightId,
  highlightRef,
}: {
  items: Recommendation[];
  activeKind: RecommendationKind;
  onKindChange: (kind: RecommendationKind) => void;
  highlightId?: string;
  highlightRef: RefObject<HTMLDivElement | null>;
}) {
  const counts = useMemo(() => {
    const map = new Map<RecommendationKind, number>();
    for (const kind of recommendationKindOrder) map.set(kind, 0);
    for (const item of items) map.set(item.kind, (map.get(item.kind) ?? 0) + 1);
    return map;
  }, [items]);

  const filtered = items.filter((item) => item.kind === activeKind);

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: '18px', alignItems: 'flex-start' }}>
      {/* Left vertical tabs — matching the client reference's "Unanswered
          clusters / Merge suggestions / New-flow recommendations / Prompt
          review" list, each labelled straight from `recommendationKindMeta`. */}
      <Stack sx={{ gap: '2px' }}>
        {recommendationKindOrder.map((kind) => {
          const meta = recommendationKindMeta[kind];
          const active = kind === activeKind;
          const count = counts.get(kind) ?? 0;

          return (
            <Box
              key={kind}
              component="button"
              onClick={() => onKindChange(kind)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                textAlign: 'left',
                border: 'none',
                cursor: 'pointer',
                p: '9px 12px',
                borderRadius: `${tokens.radius}px`,
                fontSize: 13.5,
                fontWeight: active ? 700 : 500,
                bgcolor: active ? tokens.color.accentTint : 'transparent',
                color: active ? tokens.color.accent : tokens.color.inkMuted,
                '&:hover': { bgcolor: active ? tokens.color.accentTint : tokens.color.surfaceSunk },
              }}
            >
              <Box component="span" sx={{ flex: 1 }}>
                {meta.tabLabel}
              </Box>
              <Box
                component="span"
                sx={{
                  fontFamily: tokens.font.mono,
                  fontSize: 11,
                  color: active ? tokens.color.accent : tokens.color.inkFaint,
                }}
              >
                {count}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {/* Right: recommendations for the active kind. */}
      <Box>
        {filtered.length === 0 ? (
          <EmptyState
            title="Nothing here right now"
            description={`No ${recommendationKindMeta[activeKind].tabLabel.toLowerCase()} at the moment. New ones appear here as the next audit run surfaces them.`}
          />
        ) : (
          filtered.map((rec) => (
            <Box key={rec.id} ref={rec.id === highlightId ? highlightRef : undefined}>
              <RecommendationCard recommendation={rec} highlighted={rec.id === highlightId} />
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
