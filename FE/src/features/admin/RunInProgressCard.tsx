import { useState } from 'react';
import { ApiError } from '@/api/client';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import type { BudgetApprovalRequest, BudgetApprovalResponse } from '@/api/backend/types';
import { useBudgetApproval } from '@/api/mutations/scheduler';
import { useRunProgress } from '@/api/queries/runProgress';
import { usePermission } from '@/auth/useAuth';
import { useUiStore } from '@/stores/uiStore';
import { tokens } from '@/theme/tokens';
import { formatCount, formatDayTime } from '@/utils/format';
import type { AuditRun } from '@/types/domain';

/**
 * The current in-progress batch, shown only while one exists (`running` or
 * `paused`). A batch counts as "in progress" until its findings are triaged,
 * not just until the audit pass finishes — matching the human-in-the-loop
 * rule that a run isn't really done until people have acted on it.
 *
 * `criticalOpen` is one of the few legitimate uses of safety/"Critical" red
 * outside `<SeverityBadge>`: it's a literal count of this batch's unresolved
 * STOP/escalation-miss findings, not a generic urgency indicator.
 */
export function RunInProgressCard({ run }: { run: AuditRun }) {
  const live = useRunProgress(run.id).data;
  if (!run.progress && !live) return null;

  const fallback = run.progress ?? { cleared: 0, criticalOpen: 0, pending: 0, total: 0 };
  const total = live?.turns_total ?? fallback.total;
  const cleared = live?.turns_processed ?? fallback.cleared;
  const pending = live ? Math.max(0, total - cleared) : fallback.pending;
  const criticalOpen = fallback.criticalOpen;
  const percent = live
    ? Math.min(100, Math.max(0, Math.round(live.percent_complete)))
    : total > 0
      ? Math.round((cleared / total) * 100)
      : 0;
  const isPaused = run.status === 'paused';
  const approval = live?.budget_approval;
  const decision = approval?.decision?.toLowerCase();
  const approvalPending = live?.phase === 'awaiting_budget_approval' && !!approval && !decision;

  return (
    <Box
      sx={{
        p: '18px 20px',
        mb: '18px',
        borderRadius: `${tokens.radius}px`,
        bgcolor: tokens.color.accentTint,
        border: `1px solid ${tokens.color.accentTintBorder}`,
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: '18px', alignItems: { md: 'center' } }}>
        <Stack direction="row" sx={{ gap: '14px', alignItems: 'center', flex: '1 1 auto', minWidth: 0 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              flex: '0 0 40px',
              borderRadius: '9px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: tokens.color.surface,
              color: tokens.color.accent,
            }}
          >
            <MonitorHeartOutlinedIcon sx={{ fontSize: 21 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', color: tokens.color.accent }}>
              {isPaused ? 'PAUSED' : 'RUN IN PROGRESS'}
            </Typography>
            <Typography sx={{ fontFamily: tokens.font.serif, fontWeight: 700, fontSize: 17 }}>
              <Box component="span" sx={{ fontFamily: tokens.font.mono, fontWeight: 400, fontSize: 14, mr: 1 }}>
                {run.id}
              </Box>
              {run.label ?? 'Audit batch'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: tokens.color.inkMuted }}>
              Audit window from {formatDayTime(run.startedAt)}
              {run.trigger === 'manual' ? ' · manual run' : ' · scheduled run'}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ flex: '1 1 320px', minWidth: 240 }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', mb: '6px' }}>
            <Typography sx={{ fontSize: 12.5, color: tokens.color.inkMuted }}>
              {formatCount(cleared)} of {formatCount(total)} conversations cleared
            </Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.color.accent }}>{percent}%</Typography>
          </Stack>
          <Box sx={{ height: 8, borderRadius: '4px', bgcolor: 'rgba(13,148,136,0.15)', overflow: 'hidden', mb: '8px' }}>
            <Box sx={{ width: `${percent}%`, height: '100%', bgcolor: tokens.color.accent }} />
          </Box>
          <Stack direction="row" sx={{ gap: '14px', flexWrap: 'wrap' }}>
            <Legend color={tokens.color.success} label={`${formatCount(cleared)} audited`} />
            <Legend color={tokens.color.safety} label={`${formatCount(criticalOpen)} critical`} />
            <Legend color={tokens.color.inkFaint} label={`${formatCount(pending)} pending`} />
          </Stack>
        </Box>

      </Stack>

      {approval && approvalPending && <BudgetApprovalPanel runId={run.id} approval={approval} />}
    </Box>
  );
}

/** Maps the budget-approval failure modes (README: 409 not waiting, 422 bad amount) to plain messages. */
function describeApprovalError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'This run is no longer waiting for a budget decision — it may already be decided or still processing.';
    }
    if (error.status === 422) return 'Enter a maximum additional amount greater than $0 to approve.';
    if (error.isForbidden) return 'You do not have permission to decide this run’s budget.';
  }
  return 'Could not record the budget decision. Please try again.';
}

/** Spend past the per-message cap is held until an admin approves (with a ceiling) or declines. */
function BudgetApprovalPanel({ runId, approval }: { runId: string; approval: BudgetApprovalResponse }) {
  const canManage = usePermission('triggerAuditRun');
  const pushToast = useUiStore((state) => state.pushToast);
  const mutation = useBudgetApproval(runId);
  const projected = Number(approval.projected_additional_usd);
  const [maxAdditional, setMaxAdditional] = useState(() =>
    Number.isFinite(projected) && projected > 0 ? String(Math.ceil(projected * 100) / 100) : '1',
  );
  const amount = Number(maxAdditional);
  const validAmount = Number.isFinite(amount) && amount > 0;

  const submit = (decision: BudgetApprovalRequest['decision']) =>
    mutation.mutate(
      decision === 'approve' ? { decision, max_additional_usd: amount } : { decision },
      {
        onSuccess: () => pushToast(decision === 'approve' ? 'Extra spend approved' : 'Extra spend declined', 'success'),
        onError: (error) => pushToast(describeApprovalError(error), 'safety'),
      },
    );

  return (
    <Box sx={{ mt: '16px', pt: '14px', borderTop: `1px solid ${tokens.color.accentTintBorder}` }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, mb: '2px' }}>Budget approval needed</Typography>
      <Typography sx={{ fontSize: 12.5, color: tokens.color.inkMuted, mb: '10px' }}>
        {formatCount(approval.held_turns)} conversation{approval.held_turns === 1 ? ' is' : 's are'} held past the
        per-message cap
        {Number.isFinite(projected) ? ` — projected additional spend about $${projected.toFixed(2)}.` : '.'}
      </Typography>
      {canManage ? (
        <Stack direction="row" sx={{ gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            type="number"
            label="Max additional (USD)"
            value={maxAdditional}
            onChange={(event) => setMaxAdditional(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
            sx={{ width: 190 }}
          />
          <Button
            size="small"
            variant="contained"
            disabled={!validAmount || mutation.isPending}
            onClick={() => submit('approve')}
          >
            Approve
          </Button>
          <Button size="small" variant="outlined" disabled={mutation.isPending} onClick={() => submit('decline')}>
            Decline
          </Button>
        </Stack>
      ) : (
        <Typography sx={{ fontSize: 12, color: tokens.color.inkMuted }}>
          An Owner / Admin must approve or decline this.
        </Typography>
      )}
    </Box>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: '6px' }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color }} />
      <Typography sx={{ fontSize: 12, color: tokens.color.inkMuted }}>{label}</Typography>
    </Stack>
  );
}
