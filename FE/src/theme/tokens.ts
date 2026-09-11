/**
 * Design tokens.
 *
 * Retinted from the original client prototype
 * (FE/Docs/ClinicChat_Audit_Dashboard_POC.html) to match a second round of
 * client-provided screenshots: a dark slate side rail, teal as the primary
 * brand colour (navy retired), and coral-red for the "Critical" severity tier.
 * Structure and the underlying rules (safety colour reserved, fixed severity
 * ordering) are unchanged — only the palette moved.
 *
 * These are the single source of truth for colour. The MUI theme is built
 * from them — do not hardcode hex values in components.
 */

export const tokens = {
  color: {
    bg: '#F4F6F6',
    surface: '#FFFFFF',
    surfaceSunk: '#F7F9F9',

    ink: '#151B1E',
    inkMuted: '#5C6B6D',
    inkFaint: '#8A9698',

    border: '#E1E7E7',
    borderStrong: '#C7D1D1',

    /** Teal — primary brand / action. */
    accent: '#0D9488',
    accentInk: '#0B776D',
    accentTint: '#E1F0EE',
    /** Slightly stronger than `accentTint` — a border that reads against a tinted background. */
    accentTintBorder: '#CBE5E1',

    /** Secondary action / links — kept distinct from `accent` for text on tint backgrounds. */
    teal: '#0B776D',
    tealInk: '#075C54',
    tealTint: '#DFF1EF',

    /**
     * RESERVED EXCLUSIVELY for missed STOP opt-outs and missed emergency /
     * self-harm escalations (BRD 4.2, OQ-06). Displayed as "Critical" per the
     * client's own screenshots, but the underlying concept — and the rule —
     * is unchanged: this is the STOP/escalation-miss tier specifically, not a
     * generic "urgent" colour.
     *
     * Never use this for validation errors, destructive buttons, or generic
     * "high severity". If this colour appears anywhere on screen it must mean
     * a safety-critical audit finding, or the signal is worthless. Use
     * `color.high` for ordinary urgency and `color.danger` for destructive UI.
     */
    safety: '#DC5B4C',
    safetyTint: '#FCEBE8',
    /** Hover state for a `safetyTint`-bg row (e.g. the queue's critical rows). */
    safetyTintHover: '#F9DCD6',
    safetyInk: '#B23F32',

    high: '#D97706',
    highTint: '#FCEEDA',
    /** Hover/darker variant of `high`, for reject-style buttons. */
    highInk: '#B36305',

    medium: '#A6690C',
    mediumTint: '#FAF0DA',

    low: '#5C6B6D',
    lowTint: '#ECF0F0',

    /** Distinctly green — kept apart from `accent` teal so "approved" doesn't visually blend into "primary action". */
    success: '#16A34A',
    successTint: '#E4F7EA',

    /** Destructive-but-not-safety actions (deactivate user, reject). */
    danger: '#D97706',

    focus: '#0B776D',
  },

  /** The five failure categories used by the review queue's tags and the Insights breakdown (BRD 9.7, CC-P1-020). */
  category: {
    safetyPolicy: { fg: '#DC5B4C', bg: '#FCEBE8' },
    intentQuality: { fg: '#0D9488', bg: '#E1F0EE' },
    knowledgeCoverage: { fg: '#D97706', bg: '#FCEEDA' },
    conversationFlow: { fg: '#334352', bg: '#EAEDF1' },
    evidenceQuality: { fg: '#7C5CBF', bg: '#F1ECFB' },
  },

  /** Dark side rail — distinct from `color.accent`; the rail is near-black, not teal-filled. */
  rail: {
    bg: '#0A1416',
    bgRaised: '#0F1C1F',
    bgActive: 'rgba(255,255,255,0.09)',
    bgHover: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.08)',
    text: '#AEC0C1',
    textMuted: '#71898B',
    textActive: '#FFFFFF',
  },

  /**
   * Historically a blue ramp (the prototype's navy brand); retinted to teal
   * so the auth hero illustration stays consistent with the new brand colour.
   * Key name kept as `blue` to avoid touching every file that references it.
   */
  blue: {
    900: '#07211E',
    800: '#0A322D',
    /** ≈ `color.accent`. */
    700: '#0D9488',
    600: '#128F82',
    500: '#3E8F87',
    400: '#6BA9A2',
    300: '#9AC6C0',
    200: '#C8E3DF',
    100: '#E1F0EE',
    50: '#F1F8F7',
  },

  gradient: {
    /** Left brand panel ground. */
    brandPanel:
      'radial-gradient(circle at 22% 24%, rgba(13,148,136,0.10), transparent 48%), radial-gradient(circle at 78% 76%, rgba(11,119,109,0.09), transparent 46%), linear-gradient(155deg, #EEF5F4 0%, #F6FAF9 55%, #E9F3F1 100%)',
    /** Right form panel ground — lighter, so the form reads as the focal point. */
    formPanel: 'linear-gradient(200deg, #FAFBFB 0%, #FFFFFF 42%, #F2F8F7 100%)',
    /** Illustration core. */
    core: 'linear-gradient(150deg, #128F82 0%, #0D9488 55%, #0A322D 100%)',
  },

  font: {
    /** Headings and large numerals. */
    serif: "'Newsreader', 'Iowan Old Style', Georgia, serif",
    /** All UI text. */
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    /**
     * Identifiers, confidences, hashes, timestamps, cost figures — anything a
     * reviewer may need to compare character-by-character or quote in a ticket.
     */
    mono: "'IBM Plex Mono', 'SFMono-Regular', Consolas, monospace",
  },

  radius: 8,

  shadow: {
    pop: '0 8px 28px rgba(10,20,22,0.16), 0 2px 6px rgba(10,20,22,0.08)',
    card: '0 20px 50px rgba(10,20,22,0.10)',
  },

  layout: {
    railWidth: 232,
    topBarHeight: 58,
    /** The turn-detail slide-over opened from the review queue. */
    drawerWidth: 720,
  },
} as const;

/** Severity ramp used by findings, the review queue, and reporting. */
export const severityTokens = {
  // Label reads "Critical" per the client's screenshots; the token key stays
  // `safety` throughout the codebase because it traces to a specific BRD
  // concept (missed STOP/escalation), not a general top-severity tier.
  safety: { fg: tokens.color.safety, bg: tokens.color.safetyTint, label: 'Critical' },
  high: { fg: tokens.color.high, bg: tokens.color.highTint, label: 'High' },
  medium: { fg: tokens.color.medium, bg: tokens.color.mediumTint, label: 'Medium' },
  low: { fg: tokens.color.low, bg: tokens.color.lowTint, label: 'Low' },
} as const;

/**
 * Fixed sort weight — safety-critical always outranks everything else,
 * unconditionally (BRD 4.2, CC-P1-017). Anywhere findings or queue items are
 * ordered should sort by this, not by a user-adjustable column.
 */
export const severityRank: Record<keyof typeof severityTokens, number> = {
  safety: 0,
  high: 1,
  medium: 2,
  low: 3,
};
