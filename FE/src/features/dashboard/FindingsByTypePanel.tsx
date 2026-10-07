import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router';
import { Panel } from '@/components/common/Panel';
import { EmptyState } from '@/components/common/EmptyState';
import { ownerLabels } from '@/config/findingTypes';
import { tokens } from '@/theme/tokens';
import { formatCount } from '@/utils/format';
import type { FindingTypeCount } from '@/types/domain';

const ownerChipStyles = {
  // Solid fill, not a tint: this chip sits on a safety-tinted row, where a
  // tinted chip would be invisible.
  safety: { fg: '#fff', bg: tokens.color.safety },
  content: { fg: tokens.color.teal, bg: tokens.color.tealTint },
  engineering: { fg: tokens.color.accent, bg: tokens.color.accentTint },
} as const;

/**
 * Findings grouped by type, with the owner each one routes to.
 *
 * Clicking a row opens the queue filtered to that type — the prototype's
 * primary path from "what is wrong" to "the conversations that are wrong". The
 * filter travels in the URL so the filtered view is linkable and shareable.
 */
export function FindingsByTypePanel({
  rows,
}: {
  rows: FindingTypeCount[];
}) {
  const navigate = useNavigate();

  // Safety-critical first, then by volume — the same ordering rule as the queue.
  const ordered = [...rows].sort(
    (a, b) => Number(b.safetyCritical) - Number(a.safetyCritical) || b.count - a.count,
  );

  const openFiltered = (row: FindingTypeCount) => {
    navigate(`/queue?findingType=${encodeURIComponent(row.type)}`);
  };

  return (
    <Panel
      title="Findings by type"
      subtitle="All runs · click a row to open the filtered queue"
      flush
    >
      {ordered.length === 0 ? (
        <EmptyState
          title="No findings in this period"
          description="Either the last run found nothing, or no run has completed yet."
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Finding type</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell align="right">Count</TableCell>
              <TableCell sx={{ width: 40 }} />
            </TableRow>
          </TableHead>

          <TableBody>
            {ordered.map((row) => {
              const owner = ownerChipStyles[row.owner];

              return (
                <TableRow
                  key={row.type}
                  hover
                  tabIndex={0}
                  role="link"
                  aria-label={`Open queue filtered to ${row.label}, ${row.count} findings`}
                  onClick={() => openFiltered(row)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openFiltered(row);
                    }
                  }}
                  sx={{
                    cursor: 'pointer',
                    // Safety-critical rows are tinted, not just badged.
                    ...(row.safetyCritical && {
                      bgcolor: tokens.color.safetyTint,
                      '&:hover': { bgcolor: tokens.color.safetyTintHover },
                    }),
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {row.safetyCritical && (
                        <Box
                          sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tokens.color.safety, flex: '0 0 6px' }}
                        />
                      )}
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 13,
                          fontWeight: row.safetyCritical ? 600 : 400,
                          color: row.safetyCritical ? tokens.color.safety : 'inherit',
                        }}
                      >
                        {row.label}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip size="small" label={ownerLabels[row.owner]} sx={{ bgcolor: owner.bg, color: owner.fg }} />
                  </TableCell>

                  <TableCell align="right">
                    <Box component="span" sx={{ fontFamily: tokens.font.mono, fontWeight: 600 }}>
                      {formatCount(row.count)}
                    </Box>
                  </TableCell>

                  <TableCell sx={{ color: tokens.color.inkFaint }}>
                    <ChevronRightIcon sx={{ fontSize: 18, display: 'block' }} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
