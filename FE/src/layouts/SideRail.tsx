import { NavLink, useLocation } from 'react-router';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PlaylistAddCheckOutlinedIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GpsFixedOutlinedIcon from '@mui/icons-material/GpsFixedOutlined';
import { navGroups, type NavIcon } from '@/config/nav';
import { can } from '@/auth/roles';
import { roleLabels } from '@/auth/roles';
import { usePermission, useAuth } from '@/auth/useAuth';
import { Link as RouterLink } from 'react-router';
import { tokens } from '@/theme/tokens';

const icons: Record<NavIcon, typeof DashboardOutlinedIcon> = {
  dashboard: DashboardOutlinedIcon,
  queue: PlaylistAddCheckOutlinedIcon,
  recommendations: LightbulbOutlinedIcon,
  reports: AssessmentOutlinedIcon,
  users: GroupOutlinedIcon,
  config: TuneOutlinedIcon,
  scheduler: ScheduleOutlinedIcon,
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Derived "how much of the current gate is cleared" widget — see AppShell. */
export interface ReviewContext {
  label: string;
  cleared: number;
  total: number;
}

interface SideRailProps {
  /** Number of open items in the review queue. */
  queueDepth?: number;
  /**
   * Open safety-critical findings. Decides the badge colour: `Critical` red is
   * reserved for STOP/escalation misses, so a queue that is merely busy gets a
   * neutral badge instead.
   */
  safetyOpen?: number;
  reviewContext?: ReviewContext;
}

export function SideRail({ queueDepth, safetyOpen = 0, reviewContext }: SideRailProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const canManage = usePermission('manageAudit') || usePermission('manageUsers');

  return (
    <Box
      component="aside"
      sx={{
        width: tokens.layout.railWidth,
        flex: `0 0 ${tokens.layout.railWidth}px`,
        bgcolor: tokens.rail.bg,
        color: tokens.rail.text,
        display: 'flex',
        flexDirection: 'column',
        px: '14px',
        py: '18px',
      }}
    >
      {/* Brand */}
      <Stack direction="row" sx={{ alignItems: 'center', gap: '9px', px: '8px', pb: '18px' }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            flex: '0 0 30px',
            borderRadius: '8px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: tokens.color.accent,
            color: '#fff',
          }}
        >
          <ShieldOutlinedIcon sx={{ fontSize: 17 }} />
        </Box>
        <Box>
          <Typography sx={{ fontFamily: tokens.font.serif, fontSize: 15, fontWeight: 700, color: tokens.rail.textActive, lineHeight: 1.2 }}>
            Clinic Chat
          </Typography>
          <Typography sx={{ fontSize: 10.5, letterSpacing: '.03em', color: tokens.rail.textMuted }}>
            AUDIT REVIEW
          </Typography>
        </Box>
      </Stack>

      {/* Workspace switcher — cosmetic; this build is single-tenant (Clinic
          Chat auditing its own bot), so there is nothing behind the chevron
          yet. Kept as a static display so the chrome matches the client's
          reference without implying a multi-workspace capability we haven't
          built. */}
      <Tooltip title="Single workspace — switching isn't wired up yet" placement="right">
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            gap: '9px',
            p: '9px 10px',
            mb: '14px',
            borderRadius: '8px',
            bgcolor: tokens.rail.bgRaised,
            border: `1px solid ${tokens.rail.border}`,
            cursor: 'default',
          }}
        >
          <Box
            sx={{
              width: 26,
              height: 26,
              flex: '0 0 26px',
              borderRadius: '6px',
              bgcolor: tokens.color.accent,
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            CC
          </Box>
          <Box sx={{ overflow: 'hidden', flex: 1 }}>
            <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600, color: tokens.rail.textActive }}>
              Clinic Chat
            </Typography>
            <Typography noWrap sx={{ fontSize: 11, color: tokens.rail.textMuted }}>
              Clinical assistant · audit
            </Typography>
          </Box>
          <UnfoldMoreIcon sx={{ fontSize: 15, color: tokens.rail.textMuted, flex: '0 0 auto' }} />
        </Stack>
      </Tooltip>

      {/* Navigation — the only part of the rail that scrolls. `minHeight: 0`
          is required for a flex child's `overflowY: auto` to actually engage
          instead of growing to fit its content and pushing the fixed
          sections below (review context, settings, profile) off-screen. */}
      <Box component="nav" aria-label="Main navigation" sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {navGroups.map((group, groupIndex) => {
          const visible = group.items.filter((item) => can(user?.role, item.permission));
          if (visible.length === 0) return null;

          return (
            <Box key={group.label ?? groupIndex}>
              <Typography
                sx={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '.05em',
                  color: tokens.rail.textMuted,
                  m: groupIndex === 0 ? '0 10px 6px' : '16px 10px 6px',
                }}
              >
                {group.label ?? 'WORKSPACE'}
              </Typography>

              <Stack sx={{ gap: '2px' }}>
                {visible.map((item) => {
                  const Icon = icons[item.icon];
                  const active =
                    pathname === item.to ||
                    pathname.startsWith(`${item.to}/`) ||
                    (item.matchPrefixes ?? []).some((prefix) => pathname.startsWith(prefix));
                  const badgeValue = item.badge === 'queueDepth' ? queueDepth : undefined;

                  return (
                    <Box
                      key={item.to}
                      component={NavLink}
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        p: '8px 10px',
                        borderRadius: '7px',
                        textDecoration: 'none',
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: active ? tokens.rail.textActive : tokens.rail.text,
                        bgcolor: active ? tokens.rail.bgActive : 'transparent',
                        '&:hover': { bgcolor: active ? tokens.rail.bgActive : tokens.rail.bgHover, color: tokens.rail.textActive },
                      }}
                    >
                      <Icon sx={{ fontSize: 17, opacity: 0.9 }} />
                      <Box component="span" sx={{ flex: 1 }}>
                        {item.label}
                      </Box>

                      {badgeValue !== undefined && badgeValue > 0 && (
                        <Box
                          title={
                            safetyOpen > 0
                              ? `${badgeValue} in queue · ${safetyOpen} critical`
                              : `${badgeValue} in queue`
                          }
                          sx={{
                            bgcolor: safetyOpen > 0 ? tokens.color.safety : 'rgba(255,255,255,0.14)',
                            color: '#fff',
                            fontSize: 10.5,
                            fontWeight: 700,
                            fontFamily: tokens.font.mono,
                            p: '1px 6px',
                            borderRadius: 20,
                          }}
                        >
                          {badgeValue}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Box>

      {/* Review context — progress on the current audit gate, derived from
          real queue/finding counts (not a fabricated campaign). */}
      {reviewContext && reviewContext.total > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', color: tokens.rail.textMuted, m: '0 10px 6px' }}>
            REVIEW CONTEXT
          </Typography>
          <Box sx={{ p: '10px 12px', borderRadius: '8px', bgcolor: tokens.rail.bgRaised, border: `1px solid ${tokens.rail.border}` }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: '8px', mb: '8px' }}>
              <GpsFixedOutlinedIcon sx={{ fontSize: 15, color: tokens.color.accent }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.rail.textActive }}>
                {reviewContext.label}
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 11, color: tokens.rail.textMuted, mb: '6px' }}>
              {reviewContext.cleared} of {reviewContext.total} conversations cleared
            </Typography>
            <Box sx={{ height: 5, borderRadius: '3px', bgcolor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${Math.min(100, (reviewContext.cleared / reviewContext.total) * 100)}%`,
                  height: '100%',
                  bgcolor: tokens.color.accent,
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* Settings + signed-in user */}
      <Box sx={{ mt: 2, pt: '12px', borderTop: `1px solid ${tokens.rail.border}` }}>
        {canManage && (
          <Box
            component={RouterLink}
            to="/admin/users"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              p: '8px 10px',
              mb: '6px',
              borderRadius: '7px',
              textDecoration: 'none',
              fontSize: 13,
              color: tokens.rail.text,
              '&:hover': { bgcolor: tokens.rail.bgHover, color: tokens.rail.textActive },
            }}
          >
            <SettingsOutlinedIcon sx={{ fontSize: 16 }} />
            Workspace settings
          </Box>
        )}

        <Stack direction="row" sx={{ alignItems: 'center', gap: '9px', p: '8px' }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              flex: '0 0 28px',
              borderRadius: '50%',
              bgcolor: tokens.color.accent,
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            {user ? initials(user.name) : '—'}
          </Box>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600, color: tokens.rail.textActive }}>
              {user?.name ?? 'Not signed in'}
            </Typography>
            <Typography noWrap sx={{ fontSize: 11, color: tokens.rail.textMuted }}>
              {user ? roleLabels[user.role] : ''}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
