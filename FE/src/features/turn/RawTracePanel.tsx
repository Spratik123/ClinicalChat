import { Button, Collapse, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Panel } from '@/components/common/Panel';
import { TraceViewer } from '@/components/trace/TraceViewer';
import { useUiStore } from '@/stores/uiStore';
import { tokens } from '@/theme/tokens';
import type { JsonValue } from '@/types/domain';

/**
 * Raw LangGraph trace, collapsed by default.
 *
 * Collapsed on purpose: this is the one panel whose shape changes over time by
 * design (FR-DATA-001, OQ-03), so it is deliberately the least prominent thing
 * on the page — the typed panels above answer "what happened" for the parts
 * that are stable; this is here for when a reviewer needs to go one level
 * deeper.
 */
export function RawTracePanel({ trace }: { trace: JsonValue }) {
  const expanded = useUiStore((state) => state.traceExpanded);
  const setExpanded = useUiStore((state) => state.setTraceExpanded);

  return (
    <Panel
      title="Raw AI trace"
      actions={
        <Button
          size="small"
          variant="text"
          onClick={() => setExpanded(!expanded)}
          startIcon={expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      }
    >
      <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mb: expanded ? 1.5 : 0 }}>
        Verbatim LangGraph execution record. Its shape changes as flows evolve, so it is rendered
        generically rather than mapped field-by-field.
      </Typography>

      <Collapse in={expanded}>
        <TraceViewer trace={trace} />
      </Collapse>
    </Panel>
  );
}
