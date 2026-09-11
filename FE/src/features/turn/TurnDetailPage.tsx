import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Link as RouterLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { Mono } from '@/components/common/Mono';
import { useTurn } from '@/api/queries/queue';
import { tokens } from '@/theme/tokens';
import { formatDateTime } from '@/utils/format';
import { TranscriptPanel } from './TranscriptPanel';
import { FindingsPanel } from './FindingsPanel';
import { DecisionHistoryPanel } from './DecisionHistoryPanel';
import { FlowIntentsPanel } from './FlowIntentsPanel';
import { CatalogPanel } from './CatalogPanel';
import { PicklistPanel } from './PicklistPanel';
import { SurveyPanel } from './SurveyPanel';
import { DocumentPanel } from './DocumentPanel';
import { RawTracePanel } from './RawTracePanel';

/**
 * The centrepiece screen (CC-P1-016) — everything a reviewer needs to
 * understand and act on one turn, without reading raw logs (FR-VIEW-001).
 *
 * Layout: transcript and findings on the left (the narrative — what happened,
 * what's wrong, what to do about it); flow/intents, picklist, survey,
 * document, catalog, and the raw trace on the right (the supporting evidence,
 * roughly in order from most to least commonly needed).
 */
export function TurnDetailPage() {
  const { turnId } = useParams<{ turnId: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const highlightFindingId = searchParams.get('finding') ?? undefined;
  const queueReturnTo = (location.state as { queueReturnTo?: string } | null)?.queueReturnTo ?? '/queue';

  const turnQuery = useTurn(turnId);

  return (
    <>
      <Stack sx={{ mb: 1.5 }}>
        <Button
          component={RouterLink}
          to={queueReturnTo}
          size="small"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to queue
        </Button>
      </Stack>

      <QueryBoundary query={turnQuery}>
        {(turn) => (
          <>
            <PageHeader
              title="Turn detail"
              description="What the bot did in this turn, what the audit found, and what a reviewer can do about it — without reading raw logs."
              actions={
                <Stack direction="row" sx={{ gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ChevronLeftIcon />}
                    disabled={!turn.neighbours.previousTurnId}
                    onClick={() =>
                      turn.neighbours.previousTurnId &&
                      navigate(`/turns/${turn.neighbours.previousTurnId}`, { state: { queueReturnTo } })
                    }
                  >
                    Previous turn
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<ChevronRightIcon />}
                    disabled={!turn.neighbours.nextTurnId}
                    onClick={() =>
                      turn.neighbours.nextTurnId &&
                      navigate(`/turns/${turn.neighbours.nextTurnId}`, { state: { queueReturnTo } })
                    }
                  >
                    Next turn
                  </Button>
                </Stack>
              }
            />

            <Typography sx={{ fontFamily: tokens.font.mono, fontSize: 12.5, color: tokens.color.inkFaint, mb: 2 }}>
              <Mono>{turn.id}</Mono> · {turn.flow.flowType}/{turn.flow.subFlow} · {formatDateTime(turn.occurredAt)}
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' },
                gap: '18px',
                alignItems: 'start',
              }}
            >
              {/* Left: narrative */}
              <Stack sx={{ gap: 0, minWidth: 0 }}>
                <TranscriptPanel messages={turn.transcript} participantHash={turn.participantHash} />
                <FindingsPanel
                  turnId={turn.id}
                  findings={turn.findings}
                  decisions={turn.decisions}
                  highlightFindingId={highlightFindingId}
                />
                <DecisionHistoryPanel decisions={turn.decisions} />
              </Stack>

              {/* Right: supporting evidence */}
              <Stack sx={{ gap: 0, minWidth: 0 }}>
                <FlowIntentsPanel flow={turn.flow} intents={turn.matchedIntents} />
                {turn.picklist && <PicklistPanel picklist={turn.picklist} />}
                {turn.survey && <SurveyPanel survey={turn.survey} />}
                {turn.documents && turn.documents.length > 0 && <DocumentPanel documents={turn.documents} />}
                <CatalogPanel catalog={turn.catalog} />
                <RawTracePanel trace={turn.rawTrace} />
              </Stack>
            </Box>
          </>
        )}
      </QueryBoundary>
    </>
  );
}
