import { Box, Chip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { Panel } from '@/components/common/Panel';
import { Mono } from '@/components/common/Mono';
import { tokens } from '@/theme/tokens';
import type { Picklist } from '@/types/domain';

/**
 * Picklist correctness (FR-PICK-001, CC-P1-009): the menu presented and
 * whether the option the participant landed on matches what they actually
 * asked for — a distinct failure mode from intent matching, since every step
 * can "work" while the menu itself lacks the right option.
 */
export function PicklistPanel({ picklist }: { picklist: Picklist }) {
  return (
    <Panel
      title="Picklist"
      subtitle={
        picklist.selectionMatchedRequest === undefined
          ? undefined
          : picklist.selectionMatchedRequest
            ? 'Selection matched the request'
            : 'Selection did not match the request'
      }
      flush
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 40 }}>#</TableCell>
            <TableCell>Option</TableCell>
            <TableCell>Underlying intent</TableCell>
            <TableCell sx={{ width: 64 }}>Active</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {picklist.options.map((option) => {
            const isSelected = option.position === picklist.selectedPosition;
            return (
              <TableRow
                key={option.position}
                sx={
                  isSelected
                    ? {
                        bgcolor:
                          picklist.selectionMatchedRequest === false
                            ? tokens.color.safetyTint
                            : tokens.color.accentTint,
                      }
                    : undefined
                }
              >
                <TableCell>
                  <Mono dim>{option.position}</Mono>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {option.label}
                    {isSelected && (
                      <Chip
                        size="small"
                        label="Selected"
                        sx={{
                          height: 18,
                          fontSize: 10,
                          bgcolor: picklist.selectionMatchedRequest === false ? tokens.color.safety : tokens.color.accent,
                          color: '#fff',
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Mono dim>{option.intentName ?? '—'}</Mono>
                </TableCell>
                <TableCell>
                  <Box component="span" sx={{ fontSize: 12, color: option.active ? tokens.color.success : tokens.color.inkFaint }}>
                    {option.active ? 'Yes' : 'No'}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Panel>
  );
}
