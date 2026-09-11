import { useState } from 'react';
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { tokens } from '@/theme/tokens';
import type { JsonValue } from '@/types/domain';

/**
 * Generic renderer for the raw LangGraph trace.
 *
 * The trace structure changes over time by design — new flows and fields get
 * added and renamed without notice (FR-DATA-001, OQ-03). So this deliberately
 * does NOT map known fields to typed components: it walks whatever JSON arrives
 * and renders it. A hand-mapped viewer would silently drop new fields and break
 * on renames, which is exactly the failure mode the NFR forbids.
 *
 * Typed presentation for the *stable* parts of a turn (flow, matched intents,
 * confidences) lives in the turn detail screen instead.
 */

/** A trace value with no children — rendered directly rather than walked. */
type JsonPrimitive = string | number | boolean | null;

interface TraceViewerProps {
  trace: JsonValue;
  /** Depth to auto-expand. Beyond this, nodes start collapsed. */
  defaultExpandedDepth?: number;
}

export function TraceViewer({ trace, defaultExpandedDepth = 2 }: TraceViewerProps) {
  return (
    <Box
      sx={{
        fontFamily: tokens.font.mono,
        fontSize: 12.5,
        lineHeight: 1.7,
        bgcolor: tokens.color.surfaceSunk,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: '4px',
        p: '10px 12px',
        overflowX: 'auto',
      }}
    >
      <TraceNode label={null} value={trace} depth={0} defaultExpandedDepth={defaultExpandedDepth} />
    </Box>
  );
}

interface TraceNodeProps {
  label: string | null;
  value: JsonValue;
  depth: number;
  defaultExpandedDepth: number;
}

function TraceNode({ label, value, depth, defaultExpandedDepth }: TraceNodeProps) {
  const [expanded, setExpanded] = useState(depth < defaultExpandedDepth);

  const isArray = Array.isArray(value);
  const isObject = value !== null && typeof value === 'object' && !isArray;
  const isBranch = isArray || isObject;

  if (!isBranch) {
    return (
      <Stack direction="row" sx={{ gap: '8px', pl: depth > 0 ? '18px' : 0 }}>
        {label !== null && <TraceKey name={label} />}
        <TraceLeaf value={value as JsonPrimitive} />
      </Stack>
    );
  }

  const entries: Array<[string, JsonValue]> = isArray
    ? (value as JsonValue[]).map((item, index) => [String(index), item])
    : Object.entries(value as Record<string, JsonValue>);

  const summary = isArray ? `${entries.length} item${entries.length === 1 ? '' : 's'}` : `${entries.length} field${entries.length === 1 ? '' : 's'}`;

  return (
    <Box sx={{ pl: depth > 0 ? '18px' : 0 }}>
      <Stack direction="row" sx={{ alignItems: 'center', gap: '4px' }}>
        <IconButton
          size="small"
          onClick={() => setExpanded((current) => !current)}
          aria-label={expanded ? `Collapse ${label ?? 'trace'}` : `Expand ${label ?? 'trace'}`}
          sx={{ p: 0, color: tokens.color.inkFaint }}
        >
          {expanded ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
        </IconButton>

        {label !== null && <TraceKey name={label} />}

        <Typography component="span" sx={{ fontFamily: tokens.font.mono, fontSize: 12, color: tokens.color.inkFaint }}>
          {isArray ? '[' : '{'}
          {!expanded && ` ${summary} `}
          {!expanded && (isArray ? ']' : '}')}
        </Typography>
      </Stack>

      {expanded && (
        <>
          {entries.map(([key, child]) => (
            <TraceNode
              key={key}
              label={key}
              value={child}
              depth={depth + 1}
              defaultExpandedDepth={defaultExpandedDepth}
            />
          ))}
          <Box
            component="span"
            sx={{ pl: '18px', color: tokens.color.inkFaint, fontFamily: tokens.font.mono, fontSize: 12 }}
          >
            {isArray ? ']' : '}'}
          </Box>
        </>
      )}
    </Box>
  );
}

function TraceKey({ name }: { name: string }) {
  return (
    <Box component="span" sx={{ color: tokens.color.accent, fontWeight: 600 }}>
      {name}:
    </Box>
  );
}

function TraceLeaf({ value }: { value: JsonPrimitive }) {
  if (value === null) {
    return <Box component="span" sx={{ color: tokens.color.inkFaint, fontStyle: 'italic' }}>null</Box>;
  }

  if (typeof value === 'boolean') {
    return <Box component="span" sx={{ color: tokens.color.teal }}>{String(value)}</Box>;
  }

  if (typeof value === 'number') {
    // Confidences read as the most important numbers in a trace — flag the
    // 0..1 range so a reviewer can spot a near-miss at a glance.
    const isConfidence = value >= 0 && value <= 1;
    return (
      <Stack component="span" direction="row" sx={{ alignItems: 'center', gap: '6px' }}>
        <Box component="span" sx={{ color: tokens.color.high }}>{value}</Box>
        {isConfidence && value > 0 && value < 1 && (
          <Chip
            size="small"
            label={`${Math.round(value * 100)}%`}
            sx={{
              height: 16,
              fontSize: 10,
              bgcolor: tokens.color.surfaceSunk,
              color: tokens.color.inkMuted,
              border: `1px solid ${tokens.color.border}`,
            }}
          />
        )}
      </Stack>
    );
  }

  return <Box component="span" sx={{ color: tokens.color.ink, wordBreak: 'break-word' }}>{value}</Box>;
}
