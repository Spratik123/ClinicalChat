import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import { Link as RouterLink } from 'react-router';
import { useTurn, useQueueItem } from '@/api/queries/queue';
import { useAssignToSelf } from '@/api/mutations/review';
import { useAuth, usePermission } from '@/auth/useAuth';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { SeverityBadge } from '@/components/common/SeverityBadge';
import { Mono } from '@/components/common/Mono';
import { findingTypeMeta, ownerLabels } from '@/config/findingTypes';
import { tokens } from '@/theme/tokens';
import { deriveEvidenceState, evidenceStateLabel } from '@/utils/risk';
import { formatConfidence, formatDateTime, humanizeFlowType } from '@/utils/format';
import { DecisionDialog } from './DecisionDialog';
import { QueueStatusPill } from '@/features/queue/QueueStatusPill';
import type { DecisionKind, TurnDetail } from '@/types/domain';

interface TurnDetailDrawerProps {
  open: boolean;
  turnId: string;
  /** The finding this drawer instance is about — the queue card that was clicked. */
  findingId: string;
  onClose: () => void;
}

/**
 * Turn detail as a slide-over, opened from the review queue — the client's
 * reference shows this as a right-side drawer over a dimmed queue rather than
 * a full page. Deep links (from Reports, the dashboard, Recommendations)
 * still land on the full `/turns/:turnId` page — this drawer is specifically
 * the queue's "click a card" interaction, reusing the same `useTurn` data and
 * `useRecordDecision` mutation as that page so behaviour never diverges.
 */
export function TurnDetailDrawer({ open, turnId, findingId, onClose }: TurnDetailDrawerProps) {
  const turnQuery = useTurn(turnId);
  const queueItemQuery = useQueueItem(findingId);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: tokens.layout.drawerWidth } } } }}>
      <QueryBoundary query={turnQuery}>
        {(turn) => (
          <QueryBoundary query={queueItemQuery}>
            {(queueItem) => (
              <DrawerContent turn={turn} findingId={findingId} riskScore={queueItem.riskScore} assignee={queueItem.assignee} onClose={onClose} />
            )}
          </QueryBoundary>
        )}
      </QueryBoundary>
    </Drawer>
  );
}

function DrawerContent({
  turn,
  findingId,
  riskScore,
  assignee,
  onClose,
}: {
  turn: TurnDetail;
  findingId: string;
  riskScore: number;
  assignee: string | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const finding = turn.findings.find((f) => f.id === findingId) ?? turn.findings[0];
  const otherFindings = turn.findings.filter((f) => f.id !== finding?.id);

  const [dialogDecision, setDialogDecision] = useState<DecisionKind | null>(null);
  const assignMutation = useAssignToSelf();

  const meta = finding ? findingTypeMeta[finding.type] : undefined;
  const canDecide = usePermission(finding?.severity === 'safety' ? 'resolveSafetyFinding' : 'approveContentChange');
  const evidenceState = deriveEvidenceState(turn);
  const selectedIntent = turn.matchedIntents.find((intent) => intent.selected);

  const isOpen = finding?.status === 'open';
  const isAssignedToMe = assignee !== null && assignee === user?.name;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Stack sx={{ p: '18px 20px', borderBottom: `1px solid ${tokens.color.border}` }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: '10px' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: '8px' }}>
            <Mono dim>{finding?.id}</Mono>
            {finding && <SeverityBadge severity={finding.severity} />}
            {finding && <QueueStatusPill status={finding.status} assignee={assignee} />}
          </Stack>
          <IconButton size="small" onClick={onClose} aria-label="Close">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Typography sx={{ fontFamily: tokens.font.serif, fontWeight: 700, fontSize: 19, lineHeight: 1.3 }}>
          {finding?.title}
        </Typography>
        <Typography sx={{ fontSize: 12, color: tokens.color.inkFaint, mt: '4px' }}>
          {formatDateTime(turn.occurredAt)} · {turn.transcript.length} turns · {humanizeFlowType(turn.flow.flowType)}
        </Typography>
      </Stack>

      <Box sx={{ flex: 1, overflowY: 'auto', p: '18px 20px' }}>
        {/* Proposed review action */}
        {finding && meta && (
          <Box
            sx={{
              p: '16px 18px',
              mb: '16px',
              borderRadius: `${tokens.radius}px`,
              bgcolor: tokens.color.accentTint,
              border: `1px solid ${tokens.color.accentTintBorder}`,
            }}
          >
            <Stack direction="row" sx={{ gap: '10px', mb: '8px' }}>
              <AutoAwesomeOutlinedIcon sx={{ fontSize: 18, color: tokens.color.accent, mt: '2px' }} />
              <Box>
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: tokens.color.accent, mb: '2px' }}>
                  PROPOSED REVIEW ACTION
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{meta.proposedAction}</Typography>
              </Box>
            </Stack>

            <Typography sx={{ fontSize: 12, color: tokens.color.inkMuted, mb: '14px', lineHeight: 1.5 }}>
              Approval routes this change to {ownerLabels[meta.owner].toLowerCase()}
              {meta.owner === 'content' ? ' (the existing CMS)' : ''}. The live library remains untouched.
            </Typography>

            {isOpen && canDecide ? (
              <Stack direction="row" sx={{ gap: '8px', flexWrap: 'wrap' }}>
                <Button size="small" variant="contained" onClick={() => setDialogDecision('approve')}>
                  Approve & route
                </Button>
                <Button size="small" variant="outlined" onClick={() => setDialogDecision('request_changes')}>
                  Request changes
                </Button>
                <Button size="small" variant="outlined" color="error" onClick={() => setDialogDecision('reject')}>
                  Reject
                </Button>

                <Box sx={{ ml: 'auto' }}>
                  {isAssignedToMe ? (
                    <Chip size="small" icon={<PersonOutlineIcon sx={{ fontSize: 15 }} />} label="Assigned to you" sx={{ bgcolor: tokens.color.surface, border: `1px solid ${tokens.color.border}` }} />
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PersonOutlineIcon sx={{ fontSize: 15 }} />}
                      disabled={assignMutation.isPending}
                      onClick={() => user && assignMutation.mutate({ findingId: finding.id })}
                    >
                      {assignee ? `Assigned: ${assignee}` : 'Assign'}
                    </Button>
                  )}
                </Box>
              </Stack>
            ) : !isOpen ? (
              <Typography sx={{ fontSize: 12, fontStyle: 'italic', color: tokens.color.inkFaint }}>
                Already decided — see decision history on the full turn page.
              </Typography>
            ) : (
              <Typography sx={{ fontSize: 12, fontStyle: 'italic', color: tokens.color.inkFaint }}>
                Your role can view this finding but not decide it.
              </Typography>
            )}
          </Box>
        )}

        {/* Mini stat row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', mb: '18px' }}>
          <MiniStat label="Risk score" value={`${riskScore}/100`} tone={riskScore >= 90 ? 'safety' : undefined} />
          <MiniStat label="Model confidence" value={selectedIntent ? formatConfidence(selectedIntent.confidence) : '—'} />
          <MiniStat
            label="Evidence state"
            value={evidenceStateLabel[evidenceState]}
            tone={evidenceState === 'missing' ? 'safety' : undefined}
          />
          <MiniStat label="Assignee" value={assignee ?? 'Unassigned'} />
        </Box>

        {/* Conversation trace */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Conversation trace{' '}
            <Chip size="small" label={turn.transcript.length} sx={{ ml: 1, height: 18, fontSize: 10.5 }} />
          </AccordionSummary>
          <AccordionDetails>
            <Stack sx={{ gap: '14px', pt: '12px' }}>
              {turn.transcript.map((message) => (
                <Stack key={message.id} direction="row" sx={{ gap: '10px' }}>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      flex: '0 0 26px',
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: message.who === 'user' ? tokens.color.surfaceSunk : tokens.color.accentTint,
                      color: message.who === 'user' ? tokens.color.inkMuted : tokens.color.accent,
                    }}
                  >
                    {message.who === 'user' ? <PersonOutlineIcon sx={{ fontSize: 15 }} /> : <SmartToyOutlinedIcon sx={{ fontSize: 15 }} />}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mb: '2px' }}>
                      {message.who === 'user' ? 'Participant' : 'AI response'} · {formatDateTime(message.at)}
                    </Typography>
                    <Typography sx={{ fontSize: 13 }}>{message.text}</Typography>
                  </Box>
                </Stack>
              ))}

              {/* Synthetic system-decision line — the audit's own read of what happened. */}
              {selectedIntent && (
                <Stack direction="row" sx={{ gap: '10px' }}>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      flex: '0 0 26px',
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: tokens.color.surfaceSunk,
                      color: tokens.color.inkMuted,
                    }}
                  >
                    <SettingsSuggestOutlinedIcon sx={{ fontSize: 15 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mb: '2px' }}>System decision</Typography>
                    <Typography sx={{ fontSize: 13 }}>
                      Selected <Mono>{selectedIntent.name}</Mono> · confidence {formatConfidence(selectedIntent.confidence)}
                    </Typography>
                    {finding?.severity === 'safety' && (
                      <Chip size="small" label="Flagged response" sx={{ mt: '6px', bgcolor: tokens.color.safetyTint, color: tokens.color.safety }} />
                    )}
                  </Box>
                </Stack>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Flow context */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>Flow context</AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '6px 12px', fontSize: 13, pt: '12px' }}>
              <Box component="dt" sx={{ color: tokens.color.inkMuted }}>flow_type</Box>
              <Box component="dd" sx={{ m: 0 }}><Mono>{turn.flow.flowType}</Mono></Box>
              <Box component="dt" sx={{ color: tokens.color.inkMuted }}>sub_flow</Box>
              <Box component="dd" sx={{ m: 0 }}><Mono>{turn.flow.subFlow}</Mono></Box>
              <Box component="dt" sx={{ color: tokens.color.inkMuted }}>Correctness</Box>
              <Box component="dd" sx={{ m: 0 }}>
                <Chip
                  size="small"
                  label={turn.flow.correct ? 'Correct' : 'Mis-routed'}
                  sx={turn.flow.correct ? { bgcolor: tokens.color.successTint, color: tokens.color.success } : { bgcolor: tokens.color.safetyTint, color: tokens.color.safety }}
                />
              </Box>
              {!turn.flow.correct && turn.flow.expectedFlowType && (
                <>
                  <Box component="dt" sx={{ color: tokens.color.inkMuted }}>Expected</Box>
                  <Box component="dd" sx={{ m: 0 }}>
                    <Mono>{turn.flow.expectedFlowType} / {turn.flow.expectedSubFlow}</Mono>
                  </Box>
                </>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Matched intent candidates */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            Matched intent candidates <Chip size="small" label={turn.matchedIntents.length} sx={{ ml: 1, height: 18, fontSize: 10.5 }} />
          </AccordionSummary>
          <AccordionDetails>
            <Stack sx={{ gap: '8px', pt: '12px' }}>
              {[...turn.matchedIntents]
                .sort((a, b) => a.rank - b.rank)
                .map((intent) => (
                  <Stack key={intent.name} direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <Mono dim>{intent.rank}</Mono>
                      <Mono>{intent.name}</Mono>
                      {intent.selected && <Chip size="small" label="Selected" sx={{ height: 18, fontSize: 10, bgcolor: tokens.color.accent, color: '#fff' }} />}
                    </Stack>
                    <Mono>{formatConfidence(intent.confidence)}</Mono>
                  </Stack>
                ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Other open findings on this same turn, reusing the full FindingCard so their own decision flow stays identical to the full page. */}
        {otherFindings.length > 0 && (
          <Box sx={{ mt: '18px' }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: tokens.color.inkFaint, mb: '8px' }}>
              OTHER FINDINGS ON THIS TURN
            </Typography>
            {otherFindings.map((other) => (
              <OtherFindingRow key={other.id} findingId={other.id} title={other.title} status={other.status} />
            ))}
          </Box>
        )}
      </Box>

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: '12px 20px', borderTop: `1px solid ${tokens.color.border}` }}>
        <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>📄 Read-only source record</Typography>
        <Stack direction="row" sx={{ gap: 2, alignItems: 'center' }}>
          <RouterLink to={`/turns/${turn.id}`} style={{ fontSize: 12.5, color: tokens.color.teal, fontWeight: 600, textDecoration: 'none' }}>
            Open full page
          </RouterLink>
          <Box component="button" onClick={onClose} sx={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: tokens.color.teal, p: 0 }}>
            Back to queue ›
          </Box>
        </Stack>
      </Stack>

      {finding && dialogDecision && (
        <DecisionDialog
          open
          onClose={() => setDialogDecision(null)}
          turnId={turn.id}
          findingId={finding.id}
          findingTitle={finding.title}
          initialDecision={dialogDecision}
        />
      )}
    </Box>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'safety' }) {
  return (
    <Box sx={{ p: '10px 12px', borderRadius: '6px', bgcolor: tokens.color.surfaceSunk, border: `1px solid ${tokens.color.border}` }}>
      <Typography sx={{ fontSize: 10.5, color: tokens.color.inkFaint, mb: '2px' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: tone === 'safety' ? tokens.color.safety : tokens.color.ink }}>
        {value}
      </Typography>
    </Box>
  );
}

/** Compact reuse of a finding's decision affordance inside the drawer's "other findings" list. */
function OtherFindingRow({ findingId, title, status }: { findingId: string; title: string; status: string }) {
  const decided = status !== 'open';
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        p: '10px 12px',
        mb: '6px',
        borderRadius: '6px',
        border: `1px solid ${tokens.color.border}`,
        opacity: decided ? 0.6 : 1,
      }}
    >
      <Typography sx={{ fontSize: 12.5 }}>{title}</Typography>
      <Mono dim>{findingId}</Mono>
    </Box>
  );
}
