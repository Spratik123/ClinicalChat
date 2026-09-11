import { Box, Stack, Typography } from '@mui/material';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { Panel } from '@/components/common/Panel';
import { Mono } from '@/components/common/Mono';
import { tokens } from '@/theme/tokens';
import { formatTime } from '@/utils/format';
import type { TranscriptMessage } from '@/types/domain';

/**
 * Conversation transcript (FR-VIEW-001).
 *
 * The participant is identified only by hash in the panel header — never a
 * raw phone number. Media messages (survey document uploads) render as an
 * attachment chip rather than the literal placeholder text, since the actual
 * image lives in the document panel where its legibility and extracted values
 * are audited.
 */
export function TranscriptPanel({
  messages,
  participantHash,
}: {
  messages: TranscriptMessage[];
  participantHash: string;
}) {
  return (
    <Panel
      title="Conversation transcript"
      subtitle={`Participant: ${participantHash}`}
    >
      <Stack sx={{ gap: '10px' }}>
        {messages.map((message) => {
          const isUser = message.who === 'user';
          const isMedia = message.messageType === 'media';

          return (
            <Box
              key={message.id}
              sx={{
                alignSelf: isUser ? 'flex-start' : 'flex-end',
                maxWidth: '78%',
                p: '10px 13px',
                borderRadius: '10px',
                fontSize: 13.5,
                lineHeight: 1.5,
                ...(isUser
                  ? {
                      bgcolor: tokens.color.surfaceSunk,
                      border: `1px solid ${tokens.color.border}`,
                      borderBottomLeftRadius: '2px',
                    }
                  : {
                      bgcolor: tokens.color.accentTint,
                      border: `1px solid ${tokens.color.accentTintBorder}`,
                      borderBottomRightRadius: '2px',
                    }),
              }}
            >
              {isMedia ? (
                <Stack direction="row" sx={{ alignItems: 'center', gap: '6px', fontStyle: 'italic', color: tokens.color.inkMuted }}>
                  <ImageOutlinedIcon sx={{ fontSize: 16 }} />
                  Image attached — see document panel
                </Stack>
              ) : (
                message.text
              )}

              <Typography
                sx={{
                  fontFamily: tokens.font.mono,
                  fontSize: 10.5,
                  color: tokens.color.inkFaint,
                  mt: '4px',
                }}
              >
                {message.who === 'user' ? 'Participant' : 'Bot response'} · <Mono dim>{formatTime(message.at)}</Mono>
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Panel>
  );
}
