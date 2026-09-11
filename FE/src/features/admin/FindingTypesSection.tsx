import { Box, Checkbox, FormControlLabel, Tooltip } from '@mui/material';
import { Panel } from '@/components/common/Panel';
import { findingTypeMeta } from '@/config/findingTypes';
import { tokens } from '@/theme/tokens';
import type { FindingType } from '@/types/domain';

const allTypes = Object.keys(findingTypeMeta) as FindingType[];

interface FindingTypesSectionProps {
  value: FindingType[];
  onChange: (next: FindingType[]) => void;
}

/** Which failure types this configuration detects at all (CC-P1-004). */
export function FindingTypesSection({ value, onChange }: FindingTypesSectionProps) {
  const toggle = (type: FindingType) => {
    onChange(value.includes(type) ? value.filter((candidate) => candidate !== type) : [...value, type]);
  };

  return (
    <Panel title="Enabled finding types" subtitle="Unchecked types are never detected or reported by this configuration">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2 }}>
        {allTypes.map((type) => {
          const meta = findingTypeMeta[type];
          const isSafety = type === 'stop_escalation_miss';
          const control = (
            <FormControlLabel
              key={type}
              control={
                <Checkbox
                  size="small"
                  checked={value.includes(type)}
                  disabled={isSafety}
                  onChange={() => toggle(type)}
                />
              }
              label={meta.label}
              sx={{ fontSize: 13 }}
            />
          );
          return isSafety ? (
            <Tooltip key={type} title="Always enabled — this is the missed STOP/escalation detector (BRD 4.2).">
              <Box>{control}</Box>
            </Tooltip>
          ) : (
            <Box key={type}>{control}</Box>
          );
        })}
      </Box>
      <Box sx={{ fontSize: 11.5, color: tokens.color.inkFaint, mt: 1.5 }}>
        {value.length} of {allTypes.length} enabled
      </Box>
    </Panel>
  );
}
