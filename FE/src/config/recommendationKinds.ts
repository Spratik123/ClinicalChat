import { tokens } from '@/theme/tokens';
import type { RecommendationKind } from '@/types/domain';

interface RecommendationKindMeta {
  /** Short label for badges. */
  label: string;
  /** The client reference's exact tab wording — used for the left-hand tab list on Library review. */
  tabLabel: string;
  fg: string;
  bg: string;
  /** What approving this kind actually does, shown in the decision dialog. */
  approveHelp: string;
}

/**
 * Display metadata for the four recommendation kinds (CC-P1-006 intent
 * merges, CC-P1-014 new flows, CC-P1-015 prompt review, CC-P1-018 content
 * gaps) — the tabs on the client's "Library review" reference map exactly
 * onto `RecommendationKind`.
 */
export const recommendationKindMeta: Record<RecommendationKind, RecommendationKindMeta> = {
  content_gap: {
    label: 'Content gap',
    tabLabel: 'Unanswered clusters',
    fg: tokens.category.knowledgeCoverage.fg,
    bg: tokens.category.knowledgeCoverage.bg,
    approveHelp: 'Routes the drafted answer to the existing content workflow / CMS for publishing.',
  },
  intent_merge: {
    label: 'Intent merge',
    tabLabel: 'Merge suggestions',
    fg: tokens.category.intentQuality.fg,
    bg: tokens.category.intentQuality.bg,
    approveHelp: 'Routes the merge suggestion to the content workflow for a human to combine the two intents.',
  },
  new_flow: {
    label: 'New flow',
    tabLabel: 'New-flow recommendations',
    fg: tokens.category.conversationFlow.fg,
    bg: tokens.category.conversationFlow.bg,
    approveHelp: 'Routes the new-flow proposal to the content/engineering team to design and build it.',
  },
  prompt_change: {
    label: 'Prompt review',
    tabLabel: 'Prompt review',
    fg: tokens.category.evidenceQuality.fg,
    bg: tokens.category.evidenceQuality.bg,
    approveHelp: 'Routes the wording change to engineering — this platform never edits the production prompt directly.',
  },
};

/** Fixed tab order, independent of what the API happens to return. */
export const recommendationKindOrder: RecommendationKind[] = [
  'content_gap',
  'intent_merge',
  'new_flow',
  'prompt_change',
];
