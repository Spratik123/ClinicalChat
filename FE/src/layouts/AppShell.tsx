import { Box } from '@mui/material';
import { Outlet, useLocation } from 'react-router';
import { SideRail } from './SideRail';
import { TopBar } from './TopBar';
import { navGroups } from '@/config/nav';
import { useAppContext, useDashboardSummary } from '@/api/queries/dashboard';
import { formatRelative } from '@/utils/format';

/** Resolve the top-bar title from the active route, so pages don't each repeat it. */
function useRouteTitle(): string {
  const { pathname } = useLocation();

  if (pathname.startsWith('/turns/')) return 'Turn detail';

  for (const group of navGroups) {
    for (const item of group.items) {
      if (pathname === item.to || pathname.startsWith(`${item.to}/`)) return item.label;
    }
  }
  return 'Clinic Chat Audit';
}

export function AppShell() {
  const title = useRouteTitle();

  // Chrome-level context: the queue badge and the library crumb appear on every
  // screen, so this loads once for the shell rather than per page.
  const { data: context } = useAppContext();

  // Also used by the Dashboard page itself — TanStack Query dedupes the
  // request, so this doesn't add a second network round trip in practice.
  const { data: summary } = useDashboardSummary();

  const crumb = context
    ? `Library ${context.library.version} · pulled ${formatRelative(context.library.pulledAt)}`
    : undefined;

  // The rail's "review context" widget: real progress against this period's
  // findings, not a fabricated campaign — total comes from the same number
  // the Dashboard's "Findings this period" stat shows.
  const reviewContext = summary
    ? {
        label: summary.lastRun ? `${summary.lastRun.id} review` : "This period's audit",
        cleared: Math.max(0, summary.findingsThisPeriod - summary.queueDepth),
        total: summary.findingsThisPeriod,
      }
    : undefined;

  return (
    // `height` (not `minHeight`): the shell is pinned to exactly the viewport
    // so only `main` below scrolls. `minHeight` let the whole page grow past
    // 100vh on tall content, which dragged the rail and top bar along with it
    // instead of leaving them fixed.
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <SideRail
        queueDepth={context?.queueDepth}
        safetyOpen={context?.safetyFindingsOpen}
        reviewContext={reviewContext}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        <TopBar title={title} crumb={crumb} />

        {/* No max-width cap: every page's own grids/flex layouts fill the
            available width instead of leaving dead space on wide viewports.
            `minHeight: 0` is the flexbox fix that lets this box's own
            `overflowY: auto` actually engage instead of growing to fit its
            content — without it a flex child refuses to shrink below its
            content's height. */}
        <Box component="main" sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: '26px 28px 60px' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
