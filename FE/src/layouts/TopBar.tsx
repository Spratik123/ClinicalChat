import { useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Menu,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { useAuth } from '@/auth/useAuth';
import { useAppContext } from '@/api/queries/dashboard';
import { roleLabels } from '@/auth/roles';
import { env } from '@/config/env';
import { tokens } from '@/theme/tokens';

interface TopBarProps {
  title: string;
  /** Secondary context line — e.g. "Library v128 · pulled 40 min ago". */
  crumb?: string;
}

export function TopBar({ title, crumb }: TopBarProps) {
  const { user, logout } = useAuth();
  const { data: context } = useAppContext();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');

  const handleLogout = async () => {
    setAnchor(null);
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && search.trim()) {
      navigate(`/queue?search=${encodeURIComponent(search.trim())}`);
    }
  };

  const safetyOpen = context?.safetyFindingsOpen ?? 0;

  return (
    <Box
      component="header"
      sx={{
        height: tokens.layout.topBarHeight,
        flex: `0 0 ${tokens.layout.topBarHeight}px`,
        bgcolor: 'background.paper',
        borderBottom: `1px solid ${tokens.color.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" sx={{ alignItems: 'baseline', gap: '6px', minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 13, color: tokens.color.inkFaint }}>
            Clinic Chat
          </Typography>
          <Typography sx={{ fontSize: 13, color: tokens.color.inkFaint }}>›</Typography>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 700, color: tokens.color.ink }}>
            {title}
          </Typography>
        </Stack>
        {crumb && (
          <Typography noWrap sx={{ fontSize: 11, color: tokens.color.inkFaint, mt: '1px' }}>
            {crumb}
          </Typography>
        )}
      </Box>

      <Stack direction="row" sx={{ alignItems: 'center', gap: '12px', flex: '0 0 auto' }}>
        <TextField
          size="small"
          placeholder="Search audits"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          sx={{ width: 220, display: { xs: 'none', md: 'block' } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: tokens.color.inkFaint }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box
                    sx={{
                      fontFamily: tokens.font.mono,
                      fontSize: 10,
                      color: tokens.color.inkFaint,
                      border: `1px solid ${tokens.color.border}`,
                      borderRadius: '4px',
                      px: '4px',
                    }}
                  >
                    ⏎
                  </Box>
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Environment marker — prevents mistaking mock data for production. */}
        <Chip
          label={env.envLabel}
          size="small"
          sx={{
            fontFamily: tokens.font.mono,
            fontSize: 11,
            bgcolor: tokens.color.tealTint,
            color: tokens.color.teal,
            border: `1px solid ${tokens.color.accentTintBorder}`,
          }}
        />

        <Tooltip title={safetyOpen > 0 ? `${safetyOpen} critical finding${safetyOpen === 1 ? '' : 's'} open` : 'No critical findings open'}>
          <IconButton size="small" onClick={() => navigate('/queue?safetyOnly=true')} aria-label="Critical findings">
            <Badge
              variant="dot"
              color="error"
              invisible={safetyOpen === 0}
              sx={{ '& .MuiBadge-dot': { bgcolor: tokens.color.safety } }}
            >
              <NotificationsNoneOutlinedIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <IconButton size="small" onClick={(event) => setAnchor(event.currentTarget)} aria-label="Account menu">
          <MoreVertIcon fontSize="small" />
        </IconButton>

        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{user?.name}</Typography>
            <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>
              {user ? roleLabels[user.role] : ''}
            </Typography>
          </Box>

          <Divider />
          <Box sx={{ px: 2, py: 1 }}>
            <Button size="small" variant="outlined" fullWidth onClick={handleLogout}>
              Sign out
            </Button>
          </Box>
        </Menu>
      </Stack>
    </Box>
  );
}
