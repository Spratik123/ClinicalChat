import { Box } from '@mui/material';
import { Panel } from '@/components/common/Panel';
import { Mono } from '@/components/common/Mono';
import { tokens } from '@/theme/tokens';
import type { CatalogContext } from '@/types/domain';

/**
 * The content-library snapshot this turn was evaluated against.
 *
 * Without pinning a version and snapshot, a finding cannot be reproduced once
 * the library moves on — this is what makes a finding "traceable to the source
 * turn" per the NFR in BRD 12.
 */
export function CatalogPanel({ catalog }: { catalog: CatalogContext }) {
  return (
    <Panel title="Catalog context" subtitle="Pinned for reproducibility">
      <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: 13 }}>
        <Box component="dt" sx={{ color: tokens.color.inkMuted }}>
          Library version
        </Box>
        <Box component="dd" sx={{ m: 0, fontWeight: 500 }}>
          <Mono>{catalog.libraryVersion}</Mono>
        </Box>

        <Box component="dt" sx={{ color: tokens.color.inkMuted }}>
          Snapshot
        </Box>
        <Box component="dd" sx={{ m: 0, fontWeight: 500 }}>
          <Mono>{catalog.snapshotId}</Mono>
        </Box>

        {catalog.bestCatalogMatch && (
          <>
            <Box component="dt" sx={{ color: tokens.color.inkMuted }}>
              Best catalog match
            </Box>
            <Box component="dd" sx={{ m: 0, fontWeight: 500 }}>
              {catalog.bestCatalogMatch}
            </Box>
          </>
        )}
      </Box>
    </Panel>
  );
}
