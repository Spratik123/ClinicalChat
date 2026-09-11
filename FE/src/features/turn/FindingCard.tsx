import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { StatusTag } from '@/components/common/StatusTag';
import { Mono } from '@/components/common/Mono';
import { findingTypeMeta, ownerLabels } from '@/config/findingTypes';
import { usePermission } from '@/auth/useAuth';
import { severityTokens, tokens } from '@/theme/tokens';
import { formatDateTime } from '@/utils/format';
import type { DecisionKind, Finding, ReviewDecisionRecord } from '@/types/domain';
import { DecisionDialog } from './DecisionDialog';

interface FindingCardProps {
  finding: Finding;
  turnId: string;
  decisions: ReviewDecisionRecord[];
  highlighted?: boolean;
}

/**
 * One audit finding, with the actions that turn it from an observation into a
 * routed change (BRD 6.4, FR-ROUTE-001/002).
 *
 * Only `safety` severity gets a tinted background — matching the rule that
 * safety red stays reserved for STOP/escalation misses; every other severity
 * is a plain card with a coloured left border, same as the prototype.
 */
export function FindingCard({ finding, turnId, decisions, highlighted = false }: FindingCardProps) {
  const [dialogDecision, setDialogDecision] = useState<DecisionKind | null>(null);
  const meta = findingTypeMeta[finding.type];
  const isSafety = finding.severity === 'safety';

  // Safety-critical findings need the safety permission specifically;
  // everything else needs the general content-approval permission. A
  // Developer has neither — they see the finding but not the decision UI,
  // matching their BRD persona (investigate, not approve).
  const canDecide = usePermission(isSafety ? 'resolveSafetyFinding' : 'approveContentChange');

  const lastDecision = decisions.find((entry) => entry.findingId === finding.id);
  const isOpen = finding.status === 'open';

  return (
    <Box
      id={`finding-${finding.id}`}
      sx={{
        border: `1px solid ${tokens.color.border}`,
        borderLeft: `4px solid ${severityTokens[finding.severity].fg}`,
        borderRadius: '5px',
        p: '13px 15px',
        mb: '10px',
        bgcolor: isSafety ? tokens.color.safetyTint : tokens.color.surface,
        transition: 'box-shadow .25s ease',
        boxShadow: highlighted ? `0 0 0 3px ${tokens.color.accent}` : 'none',
        '&:last-of-type': { mb: 0 },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: '10px', mb: '6px' }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: '8px' }}>
          <SeverityBadge severity={finding.severity} />
          <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>{finding.title}</Typography>
        </Stack>
        <Mono dim>{finding.id}</Mono>
      </Stack>

      <Stack direction="row" sx={{ alignItems: 'center', gap: '8px', mb: '8px' }}>
        <Box
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: tokens.color.inkFaint,
          }}
        >
          Routes to {ownerLabels[meta.owner]}
        </Box>
        <StatusTag status={finding.status} routedToLabel={ownerLabels[meta.owner]} />
      </Stack>

      <Typography sx={{ fontSize: 13, color: tokens.color.inkMuted, mb: '10px', lineHeight: 1.55 }}>
        {finding.summary}
      </Typography>

      <Box
        sx={{
          fontSize: 12,
          bgcolor: tokens.color.surfaceSunk,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: '4px',
          p: '8px 10px',
          color: tokens.color.inkMuted,
          fontFamily: tokens.font.mono,
          mb: isOpen && canDecide ? '10px' : 0,
          overflowX: 'auto',
        }}
      >
        {finding.evidence}
      </Box>

      {isOpen && canDecide && (
        <Stack direction="row" sx={{ gap: '8px', flexWrap: 'wrap' }}>
          <Button size="small" variant="contained" onClick={() => setDialogDecision('approve')}>
            Approve
          </Button>
          <Button size="small" variant="outlined" onClick={() => setDialogDecision('request_changes')}>
            Request changes
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => setDialogDecision('reject')}
          >
            Reject
          </Button>
        </Stack>
      )}

      {isOpen && !canDecide && (
        <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, fontStyle: 'italic' }}>
          {meta.owner === 'engineering'
            ? 'Routed to engineering for investigation — no approval action here.'
            : 'Your role can view this finding but not decide it.'}
        </Typography>
      )}

      {!isOpen && lastDecision && (
        <Box sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mt: isOpen ? 0 : '2px' }}>
          {lastDecision.decision === 'approve' ? 'Approved' : lastDecision.decision === 'reject' ? 'Rejected' : 'Changes requested'}
          {' by '}
          <Box component="span" sx={{ fontWeight: 600, color: tokens.color.inkMuted }}>
            {lastDecision.actor}
          </Box>
          {' · '}
          {formatDateTime(lastDecision.at)}
          {lastDecision.comment && <> — “{lastDecision.comment}”</>}
        </Box>
      )}

      {dialogDecision && (
        <DecisionDialog
          open
          onClose={() => setDialogDecision(null)}
          turnId={turnId}
          findingId={finding.id}
          findingTitle={finding.title}
          initialDecision={dialogDecision}
        />
      )}
    </Box>
  );
}
