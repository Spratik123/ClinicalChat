import { useMemo, useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryBoundary } from '@/components/common/QueryBoundary';
import { useActiveAuditConfig, useConfigVersions } from '@/api/queries/auditConfig';
import type { ConfigDraft } from '@/api/mutations/auditConfig';
import { SafetySection } from './SafetySection';
import { BatchSection } from './BatchSection';
import { ModelSection } from './ModelSection';
import { FindingTypesSection } from './FindingTypesSection';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { SaveVersionDialog } from './SaveVersionDialog';
import type { AuditConfig, FindingType } from '@/types/domain';

/**
 * Versioned settings for the batch audit (CC-P1-002's operator controls,
 * CC-P1-004's enabled finding types). Saving creates a new version with a
 * required note — the active version is never edited in place, matching how
 * every other decision in this app works.
 */
export function AuditConfigPage() {
  const configQuery = useActiveAuditConfig();
  const versionsQuery = useConfigVersions();

  return (
    <>
      <PageHeader
        title="Audit configuration"
        description="Versioned settings for the batch audit. Saving creates a new version with a note — configuration itself is auditable."
      />

      <QueryBoundary query={configQuery}>
        {(activeConfig) => (
          <QueryBoundary query={versionsQuery}>
            {(versions) => <AuditConfigForm activeConfig={activeConfig} versions={versions} />}
          </QueryBoundary>
        )}
      </QueryBoundary>
    </>
  );
}

/** `stop_escalation_miss` can never be dropped from a draft — see FindingTypesSection's locked checkbox. */
function toDraft(config: AuditConfig): ConfigDraft {
  const enabledFindingTypes: FindingType[] = config.enabledFindingTypes.includes('stop_escalation_miss')
    ? config.enabledFindingTypes
    : [...config.enabledFindingTypes, 'stop_escalation_miss'];

  return { safety: config.safety, batch: config.batch, models: config.models, enabledFindingTypes };
}

function AuditConfigForm({ activeConfig, versions }: { activeConfig: AuditConfig; versions: AuditConfig[] }) {
  const baseline = useMemo(() => toDraft(activeConfig), [activeConfig]);
  const [draft, setDraft] = useState<ConfigDraft>(baseline);
  const [saveOpen, setSaveOpen] = useState(false);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(baseline);

  return (
    <>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: '14px', gap: 2, flexWrap: 'wrap' }}
      >
        {isDirty ? (
          <Alert severity="info" sx={{ flex: 1, minWidth: 240 }}>
            Unsaved changes — nothing takes effect until you save as a new version.
          </Alert>
        ) : (
          <span />
        )}
        <Stack direction="row" sx={{ gap: 1, flex: '0 0 auto' }}>
          {isDirty && (
            <Button size="small" variant="outlined" onClick={() => setDraft(baseline)}>
              Discard changes
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveOutlinedIcon />}
            disabled={!isDirty}
            onClick={() => setSaveOpen(true)}
          >
            Save as new version
          </Button>
        </Stack>
      </Stack>

      <SafetySection value={draft.safety} onChange={(safety) => setDraft((current) => ({ ...current, safety }))} />
      <BatchSection value={draft.batch} onChange={(batch) => setDraft((current) => ({ ...current, batch }))} />
      <ModelSection value={draft.models} onChange={(models) => setDraft((current) => ({ ...current, models }))} />
      <FindingTypesSection
        value={draft.enabledFindingTypes}
        onChange={(enabledFindingTypes) => setDraft((current) => ({ ...current, enabledFindingTypes }))}
      />

      <VersionHistoryPanel versions={versions} onRestore={(version) => setDraft(toDraft(version))} />

      <SaveVersionDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        draft={draft}
        nextVersion={activeConfig.version + 1}
      />
    </>
  );
}
