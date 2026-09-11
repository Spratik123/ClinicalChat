import { Box } from '@mui/material';
import { tokens } from '@/theme/tokens';

const blue = tokens.blue;
const { color, font } = tokens;

/**
 * Hero illustration for the auth screens.
 *
 * Composition deliberately mirrors the reference design — a glowing central
 * engine with floating information cards around it — but the content is this
 * product's: conversation turns flow in on the left, the audit engine
 * re-examines them, and findings, safety flags, and recommendations come out on
 * the right. That is the platform in one picture (BRD 8.2).
 *
 * Inline SVG rather than a raster asset so it inherits the theme's blue ramp,
 * stays crisp at any size, and adds no network request.
 */
export function AuditHeroGraphic() {
  return (
    <Box
      component="svg"
      viewBox="0 0 760 560"
      role="img"
      aria-label="Conversation turns flowing into the audit engine, producing findings, safety flags, and recommendations."
      sx={{ width: '100%', height: 'auto', maxWidth: 760, display: 'block' }}
    >
      <defs>
        <linearGradient id="cc-core" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={blue[600]} />
          <stop offset="55%" stopColor={blue[700]} />
          <stop offset="100%" stopColor={blue[900]} />
        </linearGradient>

        <radialGradient id="cc-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={blue[400]} stopOpacity="0.45" />
          <stop offset="60%" stopColor={blue[400]} stopOpacity="0.12" />
          <stop offset="100%" stopColor={blue[400]} stopOpacity="0" />
        </radialGradient>

        <radialGradient id="cc-glow-teal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color.teal} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color.teal} stopOpacity="0" />
        </radialGradient>

        <filter id="cc-card-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0A1F1C" floodOpacity="0.10" />
        </filter>

        <filter id="cc-core-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#071815" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* Ambient glows */}
      <circle cx="380" cy="250" r="215" fill="url(#cc-glow)" />
      <circle cx="600" cy="430" r="150" fill="url(#cc-glow-teal)" />

      {/* ---------------- Left: incoming conversation turns ---------------- */}
      <TurnCard x={24} y={166} accent={blue[400]} label="PARTICIPANT" barWidth={112} />
      <TurnCard x={44} y={234} accent={color.teal} label="BOT REPLY" barWidth={132} />
      {/* Third turn is the one the audit flags — the "yes stop" that was missed. */}
      <TurnCard x={24} y={302} accent={color.safety} label="PARTICIPANT" barWidth={68} barColor={color.safety} />

      {/* Flow lines into the engine */}
      <g stroke={blue[300]} strokeWidth="1.5" fill="none" strokeDasharray="4 5" opacity="0.85">
        <path d="M200 191 C 240 191, 250 240, 286 258" />
        <path d="M220 259 C 250 259, 258 264, 286 266" />
        <path d="M200 327 C 240 327, 252 292, 286 276" />
      </g>

      {/* ---------------- Centre: the audit engine ---------------- */}
      {/* Soft upward halo. An explicit beam shape reads as a rendering
          artefact at this size, so this is a diffuse ellipse instead. */}
      <ellipse cx="400" cy="158" rx="132" ry="76" fill="url(#cc-glow)" opacity="0.55" />

      <g filter="url(#cc-core-shadow)">
        <rect x="286" y="186" width="228" height="212" rx="30" fill="url(#cc-core)" />
      </g>

      {/* Node graph inside the core — the LangGraph flow being re-examined */}
      <g opacity="0.95">
        <g stroke={blue[300]} strokeWidth="1.6" fill="none" opacity="0.6">
          <path d="M340 248 L 400 224 L 460 248" />
          <path d="M340 248 L 400 286 L 460 248" />
          <path d="M400 224 L 400 286" />
          <path d="M340 248 L 400 340 L 460 248" />
        </g>
        <circle cx="400" cy="224" r="9" fill={blue[200]} />
        <circle cx="340" cy="248" r="7" fill={blue[400]} />
        <circle cx="460" cy="248" r="7" fill={blue[400]} />
        <circle cx="400" cy="286" r="11" fill="#FFFFFF" />
        <circle cx="400" cy="286" r="4.5" fill={blue[700]} />
        <circle cx="400" cy="340" r="7" fill={color.teal} />
      </g>

      {/* Core label plate */}
      <rect x="316" y="358" width="168" height="26" rx="8" fill="rgba(255,255,255,0.10)" />
      <text
        x="400"
        y="375"
        textAnchor="middle"
        fill="#DCEFEC"
        fontFamily={font.mono}
        fontSize="11"
        letterSpacing="1.6"
      >
        CONVERSATION AUDIT
      </text>

      {/* Orbiting capability chips */}
      <g>
        {/* Transcript */}
        <circle cx="286" cy="212" r="19" fill="#FFFFFF" filter="url(#cc-card-shadow)" />
        <g stroke={blue[700]} strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M279 207 h14 M279 212 h14 M279 217 h9" />
        </g>

        {/* Safety shield */}
        <circle cx="514" cy="212" r="19" fill="#FFFFFF" filter="url(#cc-card-shadow)" />
        <path
          d="M514 204 l7 3 v5 c0 4.5 -3 8 -7 9.5 c-4 -1.5 -7 -5 -7 -9.5 v-5 z"
          fill="none"
          stroke={color.safety}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Ranking / bars */}
        <circle cx="286" cy="372" r="19" fill="#FFFFFF" filter="url(#cc-card-shadow)" />
        <g fill={blue[700]}>
          <rect x="279" y="373" width="3.6" height="6" rx="1.5" />
          <rect x="285" y="368" width="3.6" height="11" rx="1.5" />
          <rect x="291" y="364" width="3.6" height="15" rx="1.5" />
        </g>

        {/* Approved check */}
        <circle cx="514" cy="372" r="19" fill="#FFFFFF" filter="url(#cc-card-shadow)" />
        <path
          d="M507 372 l4.5 4.5 L521 367"
          fill="none"
          stroke={color.success}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ---------------- Right: audit output cards ---------------- */}
      {/* Findings */}
      <g filter="url(#cc-card-shadow)">
        <rect x="556" y="150" width="188" height="112" rx="14" fill="#FFFFFF" />
      </g>
      <text x="574" y="174" fill={color.inkFaint} fontFamily={font.sans} fontSize="9.5" fontWeight="700" letterSpacing="1.1">
        AUDIT FINDINGS
      </text>
      <FindingRow y={186} label="Flow routing" value="Mis-routed" valueColor={color.high} dot={color.high} />
      <FindingRow y={212} label="Intent ranking" value="Rank 2 → 1" valueColor={color.medium} dot={color.medium} />
      <FindingRow y={238} label="Answers question" value="No" valueColor={color.high} dot={color.high} />

      {/* Safety flags — the only place safety red appears */}
      <g filter="url(#cc-card-shadow)">
        <rect x="556" y="280" width="188" height="86" rx="14" fill="#FFFFFF" />
        <rect x="556" y="280" width="188" height="86" rx="14" fill={color.safetyTint} opacity="0.55" />
      </g>
      <text x="574" y="304" fill={color.safety} fontFamily={font.sans} fontSize="9.5" fontWeight="700" letterSpacing="1.1">
        SAFETY FLAGS
      </text>
      <FindingRow y={316} label="Missed STOP" value="1" valueColor={color.safety} dot={color.safety} />
      <FindingRow y={342} label="Escalation miss" value="0" valueColor={color.success} dot={color.success} />

      {/* Recommendations */}
      <g filter="url(#cc-card-shadow)">
        <rect x="556" y="384" width="188" height="86" rx="14" fill="#FFFFFF" />
      </g>
      <text x="574" y="408" fill={color.teal} fontFamily={font.sans} fontSize="9.5" fontWeight="700" letterSpacing="1.1">
        RECOMMENDATIONS
      </text>
      <FindingRow y={420} label="Draft answer" value="Ready" valueColor={color.teal} dot={color.teal} />
      <FindingRow y={446} label="Intent merge" value="0.91" valueColor={color.teal} dot={color.teal} mono />

      {/* Output flow lines */}
      <g stroke={blue[300]} strokeWidth="1.5" fill="none" strokeDasharray="4 5" opacity="0.85">
        <path d="M514 250 C 534 250, 536 206, 556 206" />
        <path d="M514 292 C 534 292, 536 322, 556 322" />
        <path d="M514 330 C 536 330, 538 426, 556 426" />
      </g>

      {/* Sparkles */}
      <g fill={blue[300]} opacity="0.75">
        <circle cx="252" cy="150" r="3" />
        <circle cx="536" cy="126" r="2.4" />
        <circle cx="232" cy="418" r="2.6" />
        <circle cx="470" cy="452" r="3.2" />
        <circle cx="330" cy="470" r="2.2" />
      </g>
    </Box>
  );
}

interface TurnCardProps {
  x: number;
  y: number;
  accent: string;
  label: string;
  barWidth: number;
  barColor?: string;
}

/** One incoming conversation turn on the left of the illustration. */
function TurnCard({ x, y, accent, label, barWidth, barColor }: TurnCardProps) {
  return (
    <g filter="url(#cc-card-shadow)">
      <rect x={x} y={y} width={176} height={50} rx={12} fill="#FFFFFF" />
      <rect x={x} y={y} width={4} height={50} rx={2} fill={accent} />
      <text
        x={x + 20}
        y={y + 20}
        fill={tokens.color.inkFaint}
        fontFamily={tokens.font.sans}
        fontSize="8"
        fontWeight="700"
        letterSpacing="1"
      >
        {label}
      </text>
      <rect x={x + 20} y={y + 28} width={barWidth} height={6} rx={3} fill={barColor ?? tokens.blue[200]} opacity={barColor ? 0.5 : 1} />
      <rect x={x + 20} y={y + 38} width={barWidth * 0.62} height={5} rx={2.5} fill={tokens.blue[100]} />
    </g>
  );
}

interface FindingRowProps {
  y: number;
  label: string;
  value: string;
  valueColor: string;
  dot: string;
  mono?: boolean;
}

/** One label/value line inside a floating output card. */
function FindingRow({ y, label, value, valueColor, dot, mono = false }: FindingRowProps) {
  return (
    <g>
      <rect x={574} y={y} width={152} height={18} rx={6} fill={tokens.color.surfaceSunk} />
      <circle cx={584} cy={y + 9} r={3.2} fill={dot} />
      <text x={594} y={y + 12.5} fill={tokens.color.inkMuted} fontFamily={tokens.font.sans} fontSize="9.5">
        {label}
      </text>
      <text
        x={718}
        y={y + 12.5}
        textAnchor="end"
        fill={valueColor}
        fontFamily={mono ? tokens.font.mono : tokens.font.sans}
        fontSize="9.5"
        fontWeight="600"
      >
        {value}
      </text>
    </g>
  );
}
