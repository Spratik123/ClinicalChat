import { Box, Chip, Typography } from '@mui/material';
import { Panel } from '@/components/common/Panel';
import { Mono } from '@/components/common/Mono';
import { tokens } from '@/theme/tokens';
import type { SurveyStage, SurveyState } from '@/types/domain';

const stageLabels: Record<SurveyStage, string> = {
  survey_response: 'Response',
  invalid_response: 'Invalid response',
  interruption: 'Interruption',
  re_ask: 'Re-ask',
  back: 'Back',
  correction: 'Correction',
  override: 'Override',
  confirmation: 'Confirmation',
};

/**
 * Survey state handling (FR-SURV-001, CC-P1-010): valid/invalid responses,
 * interruption, re-ask after interruption, and correction/back. Surveys are a
 * stateful path — errors here affect the verification outcome downstream, not
 * just this one message.
 */
export function SurveyPanel({ survey }: { survey: SurveyState }) {
  return (
    <Panel title="Survey state">
      <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: 13, mb: survey.notes ? 1.5 : 0 }}>
        <Box component="dt" sx={{ color: tokens.color.inkMuted }}>
          Survey
        </Box>
        <Box component="dd" sx={{ m: 0, fontWeight: 500 }}>
          <Mono>{survey.surveyName}</Mono>
        </Box>

        <Box component="dt" sx={{ color: tokens.color.inkMuted }}>
          Stage
        </Box>
        <Box component="dd" sx={{ m: 0 }}>
          <Chip size="small" label={stageLabels[survey.stage]} sx={{ bgcolor: tokens.color.tealTint, color: tokens.color.teal }} />
        </Box>

        {survey.questionKey && (
          <>
            <Box component="dt" sx={{ color: tokens.color.inkMuted }}>
              Question
            </Box>
            <Box component="dd" sx={{ m: 0, fontWeight: 500 }}>
              <Mono>{survey.questionKey}</Mono>
            </Box>
          </>
        )}

        {survey.handledCorrectly !== undefined && (
          <>
            <Box component="dt" sx={{ color: tokens.color.inkMuted }}>
              Handling
            </Box>
            <Box component="dd" sx={{ m: 0 }}>
              <Chip
                size="small"
                label={survey.handledCorrectly ? 'Handled correctly' : 'Handling defect'}
                sx={
                  survey.handledCorrectly
                    ? { bgcolor: tokens.color.successTint, color: tokens.color.success }
                    : { bgcolor: tokens.color.highTint, color: tokens.color.high }
                }
              />
            </Box>
          </>
        )}
      </Box>

      {survey.notes && (
        <Typography sx={{ fontSize: 12.5, color: tokens.color.inkMuted, lineHeight: 1.55 }}>
          {survey.notes}
        </Typography>
      )}
    </Panel>
  );
}
