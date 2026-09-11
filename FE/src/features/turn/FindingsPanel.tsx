import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { Panel } from '@/components/common/Panel';
import { EmptyState } from '@/components/common/EmptyState';
import { severityRank } from '@/theme/tokens';
import type { Finding, ReviewDecisionRecord } from '@/types/domain';
import { FindingCard } from './FindingCard';

interface FindingsPanelProps {
  turnId: string;
  findings: Finding[];
  decisions: ReviewDecisionRecord[];
  /** Finding to scroll to and highlight — set when arriving from the queue. */
  highlightFindingId?: string;
}

/**
 * All findings for this turn, in the same fixed order as the queue: safety
 * first, then severity, then oldest. A reviewer scanning top-to-bottom always
 * sees the most important thing first, regardless of what the audit found.
 */
export function FindingsPanel({ turnId, findings, decisions, highlightFindingId }: FindingsPanelProps) {
  const highlightRef = useRef<HTMLDivElement | null>(null);
  const [highlighted, setHighlighted] = useState(highlightFindingId);

  useEffect(() => {
    if (!highlightFindingId) return;
    highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // The ring fades after a few seconds so it reads as "you arrived here",
    // not as a permanent state of the card.
    const timer = setTimeout(() => setHighlighted(undefined), 2400);
    return () => clearTimeout(timer);
  }, [highlightFindingId]);

  const ordered = [...findings].sort(
    (a, b) =>
      Number(b.severity === 'safety') - Number(a.severity === 'safety') ||
      severityRank[a.severity] - severityRank[b.severity] ||
      Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );

  const openCount = findings.filter((f) => f.status === 'open').length;

  return (
    <Panel
      title="Audit findings"
      subtitle={
        findings.length === 0
          ? undefined
          : `${findings.length} finding${findings.length === 1 ? '' : 's'} · ${openCount} open`
      }
    >
      {ordered.length === 0 ? (
        <EmptyState title="No findings on this turn" description="The audit did not flag anything here." />
      ) : (
        <Box>
          {ordered.map((finding) => (
            <Box key={finding.id} ref={finding.id === highlightFindingId ? highlightRef : undefined}>
              <FindingCard
                finding={finding}
                turnId={turnId}
                decisions={decisions}
                highlighted={finding.id === highlighted}
              />
            </Box>
          ))}
        </Box>
      )}
    </Panel>
  );
}
