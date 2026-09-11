import { Box, Chip } from '@mui/material';
import { severityTokens, tokens } from '@/theme/tokens';
import type { Severity } from '@/types/domain';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'small' | 'medium';
}

/**
 * The only sanctioned way to render a severity.
 *
 * `safety` is a solid red fill with a leading dot — visually louder than every
 * other tier on purpose. Missed STOP opt-outs and missed emergency escalations
 * carry regulatory and human-safety weight (BRD 4.2), so they must never look
 * like ordinary "high priority".
 */
export function SeverityBadge({ severity, size = 'small' }: SeverityBadgeProps) {
  const token = severityTokens[severity];
  const isSafety = severity === 'safety';

  return (
    <Chip
      size={size}
      label={
        isSafety ? (
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Box
              component="span"
              sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }}
            />
            {token.label}
          </Box>
        ) : (
          token.label
        )
      }
      sx={{
        bgcolor: isSafety ? tokens.color.safety : token.bg,
        color: isSafety ? '#fff' : token.fg,
      }}
    />
  );
}
