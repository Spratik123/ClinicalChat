import { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { findingTypeMeta } from '@/config/findingTypes';
import { severityTokens, tokens } from '@/theme/tokens';
import type { FindingType, Severity } from '@/types/domain';
import { hasNarrowingFilters, type QueueFilterState } from './queueParams';

const severityOrder: Severity[] = ['safety', 'high', 'medium', 'low'];

interface QueueFilterBarProps {
  filters: QueueFilterState;
  onChange: (next: Partial<QueueFilterState>) => void;
  onReset: () => void;
}

/**
 * Compact toolbar: search + two narrowing selects, matching the client's
 * reference. The old always-visible chip row is now conditional — it only
 * reappears once a filter is actually active (typed, picked, or deep-linked
 * in from the dashboard), so the default view stays as clean as the
 * reference while a filtered view still says exactly what's applied.
 */
export function QueueFilterBar({ filters, onChange, onReset }: QueueFilterBarProps) {
  // Local mirror so typing is responsive; committed to the URL on a debounce.
  const [searchDraft, setSearchDraft] = useState(filters.search);

  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (searchDraft === filters.search) return;
    const timer = setTimeout(() => onChange({ search: searchDraft }), 300);
    return () => clearTimeout(timer);
    // `onChange` is stable enough here; re-running on it would reset the timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft, filters.search]);

  const narrowed = hasNarrowingFilters(filters);

  return (
    <Stack sx={{ gap: 1, mb: '14px' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1, alignItems: { md: 'center' } }}>
        <TextField
          size="small"
          placeholder="Search by message, issue, or turn ID"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          sx={{ flex: 1, minWidth: { xs: '100%', md: 260 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 17, color: tokens.color.inkFaint }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Select
          size="small"
          multiple
          displayEmpty
          value={filters.severities}
          onChange={(event) => {
            const value = event.target.value;
            onChange({ severities: typeof value === 'string' ? [] : (value as Severity[]) });
          }}
          renderValue={(selected) => (selected.length === 0 ? 'All severities' : `${selected.length} severity`)}
          sx={{ minWidth: 148 }}
        >
          {severityOrder.map((severity) => (
            <MenuItem key={severity} value={severity} sx={{ fontSize: 13 }}>
              {severityTokens[severity].label}
            </MenuItem>
          ))}
        </Select>

        <Select
          size="small"
          multiple
          displayEmpty
          value={filters.findingTypes}
          onChange={(event) => {
            const value = event.target.value;
            onChange({ findingTypes: typeof value === 'string' ? [] : (value as FindingType[]) });
          }}
          renderValue={(selected) => (selected.length === 0 ? 'All finding types' : `${selected.length} type`)}
          sx={{ minWidth: 160 }}
        >
          {Object.entries(findingTypeMeta).map(([type, meta]) => (
            <MenuItem key={type} value={type} sx={{ fontSize: 13 }}>
              {meta.label}
            </MenuItem>
          ))}
        </Select>

        <Chip
          label="Critical only"
          size="small"
          onClick={() => onChange({ safetyOnly: !filters.safetyOnly })}
          sx={{
            cursor: 'pointer',
            bgcolor: filters.safetyOnly ? tokens.color.safety : tokens.color.surface,
            color: filters.safetyOnly ? '#fff' : tokens.color.inkMuted,
            border: `1px solid ${filters.safetyOnly ? tokens.color.safety : tokens.color.borderStrong}`,
          }}
        />
      </Stack>

      {/* Only shown once something is actually narrowing the set — arrived
          via deep link (dashboard, reports) or picked here. */}
      {narrowed && (
        <Stack direction="row" sx={{ gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {filters.severities.map((severity) => (
            <Chip
              key={severity}
              size="small"
              label={severityTokens[severity].label}
              onDelete={() => onChange({ severities: filters.severities.filter((value) => value !== severity) })}
              sx={{ bgcolor: tokens.color.surfaceSunk, color: tokens.color.inkMuted }}
            />
          ))}
          {filters.findingTypes.map((type) => (
            <Chip
              key={type}
              size="small"
              label={findingTypeMeta[type].label}
              onDelete={() => onChange({ findingTypes: filters.findingTypes.filter((value) => value !== type) })}
              sx={{ bgcolor: tokens.color.accentTint, color: tokens.color.accent }}
            />
          ))}
          {filters.safetyOnly && (
            <Chip
              size="small"
              label="Critical only"
              onDelete={() => onChange({ safetyOnly: false })}
              sx={{ bgcolor: tokens.color.safety, color: '#fff', '& .MuiChip-deleteIcon': { color: '#ffffffb0' } }}
            />
          )}
          {filters.search.trim() && (
            <Chip
              size="small"
              label={`"${filters.search.trim()}"`}
              onDelete={() => onChange({ search: '' })}
              sx={{ bgcolor: tokens.color.surfaceSunk, color: tokens.color.inkMuted }}
            />
          )}
          <Box
            component="button"
            onClick={onReset}
            sx={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 12.5,
              fontWeight: 600,
              color: tokens.color.teal,
              ml: 'auto',
              p: 0,
            }}
          >
            Clear filters
          </Box>
        </Stack>
      )}
    </Stack>
  );
}
