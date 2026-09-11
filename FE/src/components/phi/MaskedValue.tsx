import { useState } from 'react';
import { Box, IconButton, Stack, Tooltip } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { tokens } from '@/theme/tokens';

interface MaskedValueProps {
  /** The masked form, safe to render by default (e.g. `ptc_9f2a…`, `•••• 4821`). */
  masked: string;
  /**
   * The unmasked value. Omit when the backend has not sent it — with a redacted
   * data model (the likely OQ-02 outcome) the client should never receive it,
   * and the reveal control correctly disappears.
   */
  revealed?: string;
  label: string;
  /**
   * Called when a reveal actually happens. Every PHI reveal must be logged
   * server-side (BRD 11), so this should hit an audit endpoint — not just flip
   * local state.
   */
  onReveal?: () => void;
}

/**
 * Renders a PHI/PII value masked, with an optional audited reveal.
 *
 * Default-masked is the point: whether the client ever receives decrypted PHI
 * is still an open compliance question (OQ-02), so screens are built as if it
 * does not, and reveal is an explicit, logged action when it does.
 */
export function MaskedValue({ masked, revealed, label, onReveal }: MaskedValueProps) {
  const [visible, setVisible] = useState(false);
  const canReveal = Boolean(revealed);

  const handleToggle = () => {
    if (!visible && !revealed) return;
    if (!visible) onReveal?.();
    setVisible((current) => !current);
  };

  return (
    <Stack direction="row" component="span" sx={{ alignItems: 'center', gap: '6px' }}>
      <Box component="span" sx={{ fontFamily: tokens.font.mono, fontSize: '0.929em' }}>
        {visible && revealed ? revealed : masked}
      </Box>

      {canReveal && (
        <Tooltip title={visible ? `Hide ${label}` : `Reveal ${label} — this access is logged`}>
          <IconButton size="small" onClick={handleToggle} aria-label={visible ? `Hide ${label}` : `Reveal ${label}`}>
            {visible ? (
              <VisibilityOffOutlinedIcon sx={{ fontSize: 15 }} />
            ) : (
              <VisibilityOutlinedIcon sx={{ fontSize: 15 }} />
            )}
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}
