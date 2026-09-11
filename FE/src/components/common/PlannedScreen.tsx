import { Box, Paper, Stack, Typography } from '@mui/material';
import { tokens } from '@/theme/tokens';

interface PlannedScreenProps {
  /** Feature IDs from ClinicChat_Feature_List_v2.xlsx that this screen delivers. */
  features: Array<{ id: string; name: string }>;
  /** What the screen will contain, in reviewer-facing terms. */
  contents: string[];
  /** Open confirmations that gate this screen, if any. */
  blockedBy?: string[];
}

/**
 * Honest placeholder for a route that exists in the shell but has no
 * implementation yet. Deliberately not a fake screen: it states which feature
 * IDs land here so scope stays traceable to the feature list.
 */
export function PlannedScreen({ features, contents, blockedBy }: PlannedScreenProps) {
  return (
    <Paper variant="outlined" sx={{ p: 3, borderStyle: 'dashed' }}>
      <Stack sx={{ gap: 2.5 }}>
        <Box>
          <Typography variant="overline">Not built yet</Typography>
          <Typography variant="h3" sx={{ mt: 0.5 }}>
            Delivers {features.map((f) => f.id).join(', ')}
          </Typography>
        </Box>

        <Box component="ul" sx={{ m: 0, pl: 2.5, color: tokens.color.inkMuted }}>
          {features.map((feature) => (
            <Box component="li" key={feature.id} sx={{ fontSize: 13, mb: 0.5 }}>
              <Box component="span" sx={{ fontFamily: tokens.font.mono, color: tokens.color.accent }}>
                {feature.id}
              </Box>
              {' — '}
              {feature.name}
            </Box>
          ))}
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Planned contents
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5, color: tokens.color.inkMuted }}>
            {contents.map((item) => (
              <Box component="li" key={item} sx={{ fontSize: 13, mb: 0.25 }}>
                {item}
              </Box>
            ))}
          </Box>
        </Box>

        {blockedBy && blockedBy.length > 0 && (
          <Box
            sx={{
              bgcolor: tokens.color.mediumTint,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: '4px',
              p: '10px 12px',
            }}
          >
            <Typography sx={{ fontSize: 12.5, color: tokens.color.medium, fontWeight: 600 }}>
              Gated by open confirmations: {blockedBy.join(', ')}
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
