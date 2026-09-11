import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from '@/layouts/AppShell';
import { RequireAnonymous, RequireAuth, RequirePermission } from '@/auth/guards';
import { LoginPage } from '@/features/auth/LoginPage';
import { MfaPage } from '@/features/auth/MfaPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { QueuePage } from '@/features/queue/QueuePage';
import { TurnDetailPage } from '@/features/turn/TurnDetailPage';
import { RecommendationsPage } from '@/features/recommendations/RecommendationsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { UsersPage } from '@/features/admin/UsersPage';
import { AuditConfigPage } from '@/features/admin/AuditConfigPage';
import { SchedulerPage } from '@/features/admin/SchedulerPage';
import { ForbiddenPage, NotFoundPage, RouteErrorPage } from '@/features/misc/ErrorPages';

/**
 * Route tree.
 *
 * Turn detail lives at `/turns/:turnId` rather than nested under `/queue` so a
 * turn is linkable from the queue, a report drill-down, or a recommendation's
 * evidence list without the URL implying it came from the queue.
 */
export const router = createBrowserRouter([
  {
    element: <RequireAnonymous />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/login/verify', element: <MfaPage /> },
      { path: '/login/forgot', element: <ForgotPasswordPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },

          {
            element: <RequirePermission permission="viewReports" />,
            children: [
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'reports', element: <ReportsPage /> },
            ],
          },

          {
            element: <RequirePermission permission="reviewConversations" />,
            children: [
              { path: 'queue', element: <QueuePage /> },
              { path: 'turns/:turnId', element: <TurnDetailPage /> },
              { path: 'recommendations', element: <RecommendationsPage /> },
            ],
          },

          {
            element: <RequirePermission permission="manageUsers" />,
            children: [{ path: 'admin/users', element: <UsersPage /> }],
          },

          {
            element: <RequirePermission permission="manageAudit" />,
            children: [
              { path: 'admin/configuration', element: <AuditConfigPage /> },
              { path: 'admin/scheduler', element: <SchedulerPage /> },
            ],
          },

          { path: '403', element: <ForbiddenPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
