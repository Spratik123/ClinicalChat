import { useCallback, useMemo } from 'react';
import { Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useSearchParams } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { useQueue } from '@/api/queries/queue';
import { tokens } from '@/theme/tokens';
import { formatCount } from '@/utils/format';
import { QueueFilterBar } from './QueueFilterBar';
import { QueueCard } from './QueueCard';
import { QueueStatStrip } from './QueueStatStrip';
import { emptyQueueFilters, hasActiveFilters, parseQueueParams, toSearchParams } from './queueParams';
import type { QueueFilterState } from './queueParams';
import type { QueueItem } from '@/types/domain';
import { TurnDetailDrawer } from '@/features/turn/TurnDetailDrawer';

export function QueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => parseQueueParams(searchParams), [searchParams]);
  const queueQuery = useQueue(filters);

  const openTurnId = searchParams.get('open');
  const openFindingId = searchParams.get('finding');

  const applyFilters = useCallback(
    (patch: Partial<QueueFilterState>) => {
      const next: QueueFilterState = { ...filters, ...patch };
      const params = toSearchParams(next);
      // Preserve a currently-open drawer across a filter tweak.
      if (openTurnId) params.set('open', openTurnId);
      if (openFindingId) params.set('finding', openFindingId);
      // `replace` so filter fiddling does not fill the back button with
      // intermediate states; a reviewer expects Back to leave the queue.
      setSearchParams(params, { replace: true });
    },
    [filters, openTurnId, openFindingId, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams(toSearchParams(emptyQueueFilters), { replace: true });
  }, [setSearchParams]);

  const openDrawer = useCallback(
    (item: QueueItem) => {
      const params = toSearchParams(filters);
      params.set('open', item.turnId);
      params.set('finding', item.findingId);
      setSearchParams(params);
    },
    [filters, setSearchParams],
  );

  const closeDrawer = useCallback(() => {
    setSearchParams(toSearchParams(filters), { replace: true });
  }, [filters, setSearchParams]);

  const activeTab = filters.status === 'decided' ? 1 : 0;

  return (
    <>
      <PageHeader
        title="Review queue"
        description="Safety-critical findings — a missed STOP opt-out or emergency escalation — always sort first, regardless of anything else in the queue."
        actions={
          <>
            <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={() => void queueQuery.refetch()}>
              Refresh queue
            </Button>
          </>
        }
      />

      <QueryBoundary query={queueQuery}>
        {(data) => (
          <>
            <QueueStatStrip data={data} />

            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: '10px', flexWrap: 'wrap', gap: 1 }}>
              <Tabs value={activeTab} onChange={(_event, value) => applyFilters({ status: value === 1 ? 'decided' : undefined })}>
                <Tab label={`Needs review ${data.totalOpen}`} />
                <Tab label="Recently reviewed" />
              </Tabs>

              {data.items.length > 0 && activeTab === 0 && (
                <Button size="small" variant="contained" startIcon={<PlayArrowIcon />} onClick={() => openDrawer(data.items[0]!)}>
                  Start next review
                </Button>
              )}
            </Stack>

            <QueueFilterBar filters={filters} onChange={applyFilters} onReset={resetFilters} />

            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: '10px' }}>
              <Typography sx={{ fontSize: 12.5, color: tokens.color.inkMuted }}>
                {formatCount(data.total)} conversation{data.total === 1 ? '' : 's'} in view
              </Typography>
              <Stack direction="row" sx={{ alignItems: 'center', gap: '5px' }}>
                <DescriptionOutlinedIcon sx={{ fontSize: 14, color: tokens.color.inkFaint }} />
                <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>Source records are read-only</Typography>
              </Stack>
            </Stack>

            <Box sx={{ border: `1px solid ${tokens.color.border}`, borderRadius: `${tokens.radius}px`, bgcolor: tokens.color.surface }}>
              {data.items.length === 0 ? (
                hasActiveFilters(filters) ? (
                  <EmptyState
                    title="Nothing matches these filters"
                    description="Widen the filters, or clear them to see the full queue."
                    action={
                      <Button variant="outlined" size="small" onClick={resetFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                ) : activeTab === 1 ? (
                  <EmptyState title="Nothing reviewed yet" description="Decisions recorded this session will show up here." />
                ) : (
                  <EmptyState
                    title="Queue clear"
                    description="Every finding from the last run has been reviewed. The next scheduled audit will refill this list."
                  />
                )
              ) : (
                data.items.map((item) => <QueueCard key={item.findingId} item={item} onOpen={openDrawer} />)
              )}
            </Box>

            {openTurnId && openFindingId && (
              <TurnDetailDrawer open turnId={openTurnId} findingId={openFindingId} onClose={closeDrawer} />
            )}
          </>
        )}
      </QueryBoundary>

      <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mt: 1.5 }}>
        Ordering is fixed: safety-critical first, then severity, then oldest. Safety findings are
        never sampled out of the queue.
      </Typography>
    </>
  );
}
