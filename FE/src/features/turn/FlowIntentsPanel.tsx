import type { ReactNode } from 'react';
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { Panel } from '@/components/common/Panel';
import { Mono } from '@/components/common/Mono';
import { tokens } from '@/theme/tokens';
import { formatConfidence } from '@/utils/format';
import type { FlowAssessment, MatchedIntent } from '@/types/domain';

/**
 * Flow/sub-flow correctness (FR-FLOW-001, CC-P1-003) and the top-N matched
 * intents with a ranking verdict (FR-TOPN-001, CC-P1-005).
 *
 * Auditing the full candidate set — not only the selected intent — is what
 * catches ranking errors and overlap that a "was the answer right" check
 * alone would miss (BRD 9.2).
 */
export function FlowIntentsPanel({ flow, intents }: { flow: FlowAssessment; intents: MatchedIntent[] }) {
  const ordered = [...intents].sort((a, b) => a.rank - b.rank);

  return (
    <Panel title="Flow & matched intents" flush>
      <Box sx={{ p: '16px 18px', borderBottom: `1px solid ${tokens.color.border}` }}>
        <KvRow label="flow_type" value={<Mono>{flow.flowType}</Mono>} />
        <KvRow label="sub_flow" value={<Mono>{flow.subFlow}</Mono>} />
        <KvRow
          label="Flow correctness"
          value={
            <Chip
              size="small"
              label={flow.correct ? 'Correct' : 'Mis-routed'}
              sx={
                flow.correct
                  ? { bgcolor: tokens.color.successTint, color: tokens.color.success }
                  : { bgcolor: tokens.color.safetyTint, color: tokens.color.safety }
              }
            />
          }
        />
        {!flow.correct && (flow.expectedFlowType || flow.expectedSubFlow) && (
          <KvRow
            label="Expected route"
            value={
              <Mono>
                {flow.expectedFlowType ?? '—'} / {flow.expectedSubFlow ?? '—'}
              </Mono>
            }
          />
        )}
      </Box>

      <Box>
        <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: tokens.color.inkFaint, p: '12px 18px 0' }}>
          Top matched intents
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48 }}>Rank</TableCell>
              <TableCell>Intent</TableCell>
              <TableCell align="right" sx={{ width: 76 }}>
                Conf.
              </TableCell>
              <TableCell align="center" sx={{ width: 64 }}>
                Ranking
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ordered.map((intent) => (
              <TableRow
                key={intent.name}
                sx={intent.selected ? { bgcolor: tokens.color.accentTint } : undefined}
              >
                <TableCell>
                  <Mono dim>{intent.rank}</Mono>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mono>{intent.name}</Mono>
                    {intent.selected && (
                      <Chip
                        size="small"
                        label="Selected"
                        sx={{ height: 18, fontSize: 10, bgcolor: tokens.color.accent, color: '#fff' }}
                      />
                    )}
                  </Box>
                  {intent.responseText && (
                    <Tooltip title={intent.responseText}>
                      <Typography noWrap sx={{ fontSize: 11.5, color: tokens.color.inkFaint, maxWidth: 320, mt: 0.25 }}>
                        “{intent.responseText}”
                      </Typography>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Mono>{formatConfidence(intent.confidence)}</Mono>
                </TableCell>
                <TableCell align="center">
                  {intent.rankingCorrect === undefined ? (
                    <Box component="span" sx={{ color: tokens.color.inkFaint, fontSize: 11 }}>
                      —
                    </Box>
                  ) : intent.rankingCorrect ? (
                    <Tooltip title="Correctly ranked">
                      <CheckCircleIcon sx={{ fontSize: 17, color: tokens.color.success }} />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Mis-ranked">
                      <CancelIcon sx={{ fontSize: 17, color: tokens.color.high }} />
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Panel>
  );
}

function KvRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: 13, py: '4px' }}>
      <Box component="span" sx={{ color: tokens.color.inkMuted }}>
        {label}
      </Box>
      <Box component="span" sx={{ fontWeight: 500 }}>
        {value}
      </Box>
    </Box>
  );
}
