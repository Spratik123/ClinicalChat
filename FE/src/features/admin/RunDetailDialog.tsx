import { Alert, Box, CircularProgress, Dialog, DialogContent, DialogTitle, Divider, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/backend/services';
import { queryKeys } from '@/api/queryKeys';
import { Mono } from '@/components/common/Mono';
import { RunStatusChip } from '@/components/common/RunStatusChip';
import { tokens } from '@/theme/tokens';
import { formatCount, formatDateTime, formatUsd } from '@/utils/format';
import type { AuditRun } from '@/types/domain';

const humanize = (key: string) => {
  const text = key.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ border: `1px solid ${tokens.color.border}`, borderRadius: '8px', p: '10px 12px' }}>
      <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>{label}</Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 700, fontFamily: tokens.font.mono }}>{value}</Typography>
    </Box>
  );
}

/** A label → count breakdown; renders "—" when the backend sent nothing. */
function Breakdown({ title, data }: { title: string; data?: Record<string, number> }) {
  const entries = Object.entries(data ?? {}).sort((a, b) => b[1] - a[1]);
  return (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.color.inkMuted, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.75 }}>
        {title}
      </Typography>
      {entries.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: tokens.color.inkFaint }}>—</Typography>
      ) : (
        <Stack sx={{ gap: 0.5 }}>
          {entries.map(([key, count]) => (
            <Stack key={key} direction="row" sx={{ justifyContent: 'space-between', fontSize: 13 }}>
              <span>{humanize(key)}</span>
              <Mono>{formatCount(count)}</Mono>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
}

/** One run from GET /dashboard/runs/{run_id}; every consumer shares the same cached request. */
function useRunDetail(runId: string) {
  return useQuery({
    queryKey: queryKeys.runs.detail(runId),
    queryFn: () => dashboardApi.run(runId),
    enabled: Boolean(runId),
  });
}

function RunDetailStatus({ query }: { query: ReturnType<typeof useRunDetail> }) {
  if (query.isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={22} />
      </Box>
    );
  }
  if (query.isError) {
    return <Alert severity="error">{query.error instanceof Error ? query.error.message : 'Could not load run details.'}</Alert>;
  }
  return null;
}

/** Turns / Findings / Spent tiles (Spent can be hidden where cost is shown elsewhere). Missing fields render as "—". */
export function RunDetailStats({ runId, showSpent = true }: { runId: string; showSpent?: boolean }) {
  const query = useRunDetail(runId);
  const detail = query.data;
  return (
    <>
      <RunDetailStatus query={query} />
      {detail && (
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${showSpent ? 3 : 2}, 1fr)`, gap: 1.5 }}>
          <Stat label="Turns" value={detail.turns_total != null ? formatCount(detail.turns_total) : '—'} />
          <Stat label="Findings" value={detail.findings_total != null ? formatCount(detail.findings_total) : '—'} />
          {showSpent && (
            <Stat label="Spent" value={detail.spent_usd != null ? formatUsd(Number(detail.spent_usd)) : '—'} />
          )}
        </Box>
      )}
    </>
  );
}

/** Turns by status, findings by severity and by type. Empty maps render as "—". */
export function RunDetailBreakdowns({ runId }: { runId: string }) {
  const query = useRunDetail(runId);
  const detail = query.data;
  return (
    <>
      <RunDetailStatus query={query} />
      {detail && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          <Breakdown title="Turns by status" data={detail.turns_by_status} />
          <Breakdown title="Findings by severity" data={detail.findings_by_severity} />
          <Breakdown title="Findings by type" data={detail.findings_by_type} />
        </Box>
      )}
    </>
  );
}

export function RunDetailContent({ runId }: { runId: string }) {
  return (
    <Stack sx={{ gap: 2 }}>
      <RunDetailStats runId={runId} />
      <RunDetailBreakdowns runId={runId} />
    </Stack>
  );
}

export function RunDetailDialog({ run, onClose }: { run: AuditRun | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(run)} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Run details
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {run && (
          <Stack sx={{ gap: 2, pt: 0.5 }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Mono>{run.id}</Mono>
              <RunStatusChip status={run.status} />
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, fontSize: 13 }}>
              <Box>
                <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>Started</Typography>
                {formatDateTime(run.startedAt)}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>Completed</Typography>
                {run.completedAt ? formatDateTime(run.completedAt) : '—'}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>Trigger</Typography>
                {run.trigger === 'manual' ? 'Manual' : 'Scheduled'}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>Config version</Typography>
                v{run.configVersion}
              </Box>
            </Box>

            <Divider />

            <RunDetailContent runId={run.id} />
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
