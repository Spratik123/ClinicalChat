import { Box, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import { Panel } from '@/components/common/Panel';
import { Mono } from '@/components/common/Mono';
import { tokens } from '@/theme/tokens';
import type { AuditedDocument, JsonValue, VerificationRuleOutcome } from '@/types/domain';

const legibilityStyle: Record<AuditedDocument['legibility'], { label: string; fg: string; bg: string }> = {
  clear: { label: 'Clear', fg: tokens.color.success, bg: tokens.color.successTint },
  degraded: { label: 'Degraded', fg: tokens.color.medium, bg: tokens.color.mediumTint },
  unreadable: { label: 'Unreadable', fg: tokens.color.high, bg: tokens.color.highTint },
};

const outcomeStyle: Record<VerificationRuleOutcome['outcome'], { label: string; fg: string; bg: string }> = {
  pass: { label: 'Pass', fg: tokens.color.success, bg: tokens.color.successTint },
  fail: { label: 'Fail', fg: tokens.color.high, bg: tokens.color.highTint },
  inconclusive: { label: 'Inconclusive', fg: tokens.color.medium, bg: tokens.color.mediumTint },
};

/**
 * Document extraction and verification-rule auditing (FR-VER-001, FR-IMG-001;
 * CC-P1-011, CC-P1-012) — gated in production by OQ-02/OQ-08.
 *
 * Deliberately audits two different things side by side: whether the OCR read
 * the document correctly (`legibility`), and whether the *rule logic* applied
 * to what it read was correct (`ruleCorrect`). The BRD's own example — a
 * document dated April checked against a June system date — is a rule bug on
 * a perfectly legible document, which is why these cannot be one score.
 */
export function DocumentPanel({ documents }: { documents: AuditedDocument[] }) {
  return (
    <Panel
      title="Documents"
      subtitle="Source image kept out of this preview build — access to it is logged (BRD 11)"
    >
      <Stack sx={{ gap: 2.5 }}>
        {documents.map((doc, index) => {
          const legibility = legibilityStyle[doc.legibility];
          return (
            <Box key={doc.id}>
              {index > 0 && <Box sx={{ height: 1, bgcolor: tokens.color.border, mb: 2.5 }} />}

              <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                {/* Placeholder for the source image. A real backend would
                    render it here behind an access-logged, short-lived URL —
                    never a raw S3 link. */}
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    flex: '0 0 64px',
                    borderRadius: '6px',
                    bgcolor: tokens.color.surfaceSunk,
                    border: `1px dashed ${tokens.color.borderStrong}`,
                    display: 'grid',
                    placeItems: 'center',
                    color: tokens.color.inkFaint,
                  }}
                >
                  <ImageOutlinedIcon />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Mono dim>{doc.assetRef}</Mono>
                  <Typography sx={{ fontSize: 11.5, color: tokens.color.inkFaint }}>{doc.mimeType}</Typography>
                </Box>

                <Chip size="small" label={legibility.label} sx={{ bgcolor: legibility.bg, color: legibility.fg }} />
              </Stack>

              <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: tokens.color.inkFaint, mb: 0.5 }}>
                Extracted values
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr',
                  gap: '4px 12px',
                  fontSize: 12.5,
                  mb: 2,
                }}
              >
                {Object.entries(doc.extractedValues).map(([field, value]) => (
                  <Box key={field} sx={{ display: 'contents' }}>
                    <Box component="dt" sx={{ color: tokens.color.inkMuted }}>
                      <Mono dim>{field}</Mono>
                    </Box>
                    <Box component="dd" sx={{ m: 0, fontWeight: 500 }}>
                      {renderExtractedValue(value)}
                    </Box>
                  </Box>
                ))}
              </Box>

              <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: tokens.color.inkFaint, mb: 0.5 }}>
                Verification rules
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rule</TableCell>
                    <TableCell sx={{ width: 110 }}>Outcome</TableCell>
                    <TableCell align="center" sx={{ width: 90 }}>
                      Rule correct
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {doc.verificationRules.map((rule) => {
                    const outcome = outcomeStyle[rule.outcome];
                    return (
                      <TableRow key={rule.rule}>
                        <TableCell>
                          <Mono>{rule.rule}</Mono>
                          {rule.detail && (
                            <Typography sx={{ fontSize: 11.5, color: tokens.color.inkMuted, mt: 0.25, lineHeight: 1.5 }}>
                              {rule.detail}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={outcome.label} sx={{ bgcolor: outcome.bg, color: outcome.fg }} />
                        </TableCell>
                        <TableCell align="center">
                          {rule.ruleCorrect === undefined ? (
                            <Tooltip title="Not assessed">
                              <HelpOutlineIcon sx={{ fontSize: 16, color: tokens.color.inkFaint }} />
                            </Tooltip>
                          ) : rule.ruleCorrect ? (
                            <Tooltip title="Rule logic is correct">
                              <CheckCircleIcon sx={{ fontSize: 17, color: tokens.color.success }} />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Rule logic itself is wrong">
                              <CancelIcon sx={{ fontSize: 17, color: tokens.color.safety }} />
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          );
        })}
      </Stack>
    </Panel>
  );
}

function renderExtractedValue(value: JsonValue): string {
  if (value === null) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
