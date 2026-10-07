import type { AuditConfigVersionFields, AuditConfigVersionResponse } from './types';

/**
 * Form model for an audit configuration version. Everything is a string so a
 * half-typed number never gets coerced mid-edit; `toVersionBody` parses on save.
 */
export interface ConfigDraft {
  modelPhase1: string;
  modelPhase2: string;
  promptVersion: string;
  temperature: string;
  maxTokens: string;
  batchSize: string;
  maxToolIterations: string;
  dispatchMode: 'inline' | 'distributed';
  maxUsdPerRun: string;
  perMessageUsd: string;
  lowConfidenceThreshold: string;
  /** USD per 1k tokens, for every model the draft uses. */
  prices: Record<string, { input: string; output: string }>;
}

type Dict = Record<string, unknown>;

const asString = (value: unknown): string => (value === undefined || value === null ? '' : String(value));

export function toDraft(version: AuditConfigVersionResponse): ConfigDraft {
  const prices: ConfigDraft['prices'] = {};
  for (const [model, price] of Object.entries(version.price_table as Record<string, Dict>)) {
    prices[model] = { input: asString(price?.input), output: asString(price?.output) };
  }

  return {
    modelPhase1: version.model_id_phase1,
    modelPhase2: version.model_id_phase2,
    promptVersion: version.prompt_version,
    temperature: asString(version.temperature),
    maxTokens: asString(version.max_tokens),
    batchSize: asString(version.batch_size),
    maxToolIterations: asString(version.max_tool_iterations),
    dispatchMode: version.stage2_dispatch_mode === 'distributed' ? 'distributed' : 'inline',
    maxUsdPerRun: asString(version.cost_caps.max_usd_per_run),
    perMessageUsd: asString(version.cost_caps.per_message_usd),
    lowConfidenceThreshold: asString(version.thresholds.low_confidence_threshold),
    prices,
  };
}

/** The model ids the draft uses, de-duplicated — each one needs a price entry. */
export function modelsInUse(draft: ConfigDraft): string[] {
  return [...new Set([draft.modelPhase1, draft.modelPhase2].filter(Boolean))];
}

function numberOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Sets or removes a key depending on whether the field was filled in. */
function withOptional(target: Dict, key: string, value: number | undefined): Dict {
  const next = { ...target };
  if (value === undefined) delete next[key];
  else next[key] = value;
  return next;
}

/**
 * A new version does NOT inherit from the previous one — anything omitted
 * resets to its default. So the body starts from the full base version and the
 * draft overrides only what the form edits; untouched settings (lane models,
 * other thresholds, other cost caps, other priced models) carry over.
 */
export function toVersionBody(draft: ConfigDraft, base: AuditConfigVersionResponse): AuditConfigVersionFields {
  let thresholds: Dict = { ...base.thresholds };
  thresholds = withOptional(thresholds, 'low_confidence_threshold', numberOrUndefined(draft.lowConfidenceThreshold));

  let costCaps: Dict = { ...base.cost_caps };
  costCaps = withOptional(costCaps, 'max_usd_per_run', numberOrUndefined(draft.maxUsdPerRun));
  costCaps = withOptional(costCaps, 'per_message_usd', numberOrUndefined(draft.perMessageUsd));

  const priceTable: Dict = { ...(base.price_table as Dict) };
  for (const model of modelsInUse(draft)) {
    const price = draft.prices[model];
    if (price) priceTable[model] = { input: price.input.trim(), output: price.output.trim() };
  }

  return {
    model_id_phase1: draft.modelPhase1.trim(),
    model_id_phase2: draft.modelPhase2.trim(),
    prompt_version: draft.promptVersion.trim() || undefined,
    temperature: numberOrUndefined(draft.temperature),
    max_tokens: numberOrUndefined(draft.maxTokens),
    batch_size: numberOrUndefined(draft.batchSize),
    max_tool_iterations: numberOrUndefined(draft.maxToolIterations),
    stage2_dispatch_mode: draft.dispatchMode,
    lane_models: base.lane_models,
    lane_cost_estimates: base.lane_cost_estimates,
    lane_max_tokens: base.lane_max_tokens,
    thresholds,
    cost_caps: costCaps as Record<string, number | string>,
    price_table: priceTable,
  };
}

/** Client-side checks for what the backend would otherwise reject with a 422. */
export function validateDraft(draft: ConfigDraft): string | null {
  if (!draft.modelPhase1.trim() || !draft.modelPhase2.trim()) return 'Both models are required.';
  for (const model of modelsInUse(draft)) {
    const price = draft.prices[model];
    if (!price || price.input.trim() === '' || price.output.trim() === '') {
      return `Set the input and output price for ${model} — an unpriced model fails after the Bedrock call is paid for.`;
    }
  }
  const temperature = numberOrUndefined(draft.temperature);
  if (temperature !== undefined && (temperature < 0 || temperature > 1)) return 'Temperature must be between 0 and 1.';
  return null;
}
