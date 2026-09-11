# Clinic Chat — Audit Platform (Frontend)

Frontend for the **AI Conversational Audit & Continuous-Improvement Platform** described in
`Docs/ClinicChat_BRD_v2.docx` and `Docs/ClinicChat_Feature_List_v2.xlsx`.

This app is **not** the Clinic Chat SMS bot. The bot is live, revenue-generating, and out of
scope (BRD §6.4). This app is the audit layer around it: it reads conversation data, shows what
the audit found, and lets a human approve changes that are then **routed** into Clinic Chat's
existing content workflow. It never writes to the live intent library.

## Running

```bash
npm install
npm run dev        # http://localhost:5173, served entirely from mock data
```

Sign in with any fixture account and **any 6-digit code** except `000000` (which exercises the
MFA failure path):

| Email | Role |
|---|---|
`dana.whitfield@futransolutions.com` | Owner / Admin |
`marcus.lee@clinicchat.com` | Content Reviewer |
`priya.nair@clinicchat.com` | Developer |

In development the account menu also has a **Dev — switch role** control, so the role guards can
be exercised without signing in and out.

```bash
npm run typecheck  # tsc -b
npm run build      # tsc -b && vite build
npm run preview    # serve the production build
```

## Stack

| Concern | Choice |
|---|---|
Build | Vite 8 + React 19 + TypeScript 7 |
Routing | React Router 8 (`createBrowserRouter`) |
Server state | TanStack Query 5 + a typed `fetch` wrapper (`src/api/client.ts`) |
Client state | Zustand (`src/stores/uiStore.ts`) — filters, panel state, toasts only |
UI | MUI 9, themed to the client prototype (see below) |
Mock API | MSW 2 — the app runs with no backend at all |

## Architecture notes

### Everything server-side goes through TanStack Query

Audit data is batch-produced, not a live feed, so `staleTime` is 60s and focus-refetch is off.
Query keys live in one registry (`src/api/queryKeys.ts`) because a single review decision has to
invalidate the queue, the dashboard counters, and the run totals together.

Zustand holds **only** client state. If it came from the server, it does not belong there.

### MUI is themed to the client's reference designs, not left as Material

Two rounds of client-supplied references have shaped this theme. The first
(`Docs/ClinicChat_Audit_Dashboard_POC.html`) set the structure: serif headings (Newsreader), Inter
for UI, IBM Plex Mono for identifiers, flat dense tables, pill badges. A second round of
screenshots (a dark-rail, teal-accent product screen) prompted a full **retint** — navy replaced
with teal as the primary brand colour, a near-black slate side rail (`tokens.rail.*`) replacing the
solid-navy one, and the top severity tier displayed as "Critical" rather than "Safety-critical".
Structure carried over from round one; every colour comes from round two.

We keep MUI's **behaviour** (accessible dialogs, selects, tooltips, DataGrid, Drawer, Accordion,
Tabs) and override its **appearance** in `src/theme/theme.ts`, built from tokens in
`src/theme/tokens.ts`.

**Do not hardcode colour in components.** Import from `tokens`. When retinting, the model is:
change `tokens.ts`, never chase individual components — a grep for `#[0-9A-Fa-f]{6}` outside
`tokens.ts` should come back near-empty (the SVG hero illustration's `<feDropShadow>` colours are
the sanctioned exception, since gradients there are easiest expressed inline).

### Safety/"Critical" red is reserved

`tokens.color.safety` is used **only** for missed STOP opt-outs and missed emergency/self-harm
escalations — labelled "Critical" in the UI per the client's screenshots, but the token name and
the rule stay `safety` in code because it traces to one specific BRD concept (§4.2), not a general
top-severity tier. It is deliberately *not* wired into the MUI palette, so `color="error"` cannot
reach it — ordinary urgency uses `high`, destructive actions use `danger`.

This matters beyond the severity badge: the **queue-card status pill** ("Needs review" / "In
review") intentionally does *not* reuse this colour even for a Critical-severity item — status uses
its own independent palette (`QueueStatusPill.tsx`) so an unclaimed Low-severity item never borrows
the same alarm colour as a missed STOP opt-out. If safety/"Critical" red appears on screen it must
mean a safety-critical audit finding, or the signal is worthless. Render severities only via
`<SeverityBadge>`.

### The raw trace is rendered generically, on purpose

The LangGraph trace structure **changes over time by design** (FR-DATA-001, OQ-03). So
`src/components/trace/TraceViewer.tsx` walks whatever JSON arrives instead of mapping known
fields. A hand-mapped viewer would silently drop new fields and break on renames — the exact
failure mode the NFR forbids.

The two turn fixtures carry **deliberately different trace shapes** (nested objects vs. a flat
`nodes` array with fields the app has never seen) so this is tested from day one.

Typed presentation is reserved for the parts of a turn that are stable: flow, sub-flow, matched
intents, confidences.

### PHI is masked by default

Whether the browser ever receives decrypted PHI is an open compliance question (OQ-02), so
screens are built as if it never does. Participants appear as hashes (`ptc_9f2a…`).
`<MaskedValue>` renders masked by default and only offers a reveal when the backend actually
sent an unmasked value — and its `onReveal` must hit an audit endpoint, because every PHI access
is logged (BRD §11).

### Auth screens follow the client's split-screen reference

`src/features/auth/` implements the client-supplied reference layout: brand wordmark and hero
illustration left, form right, joined by a hairline with a badge on it. `AuthLayout` is the shell,
`authStyles.ts` holds the tall-field and pill-button styling (scoped to auth — those proportions
would be too heavy on the dense data screens), and `AuditHeroGraphic` is an inline SVG so it themes
with the brand ramp and costs no network request. `tokens.blue` is that ramp's variable name —
historical (the prototype's brand was navy); its values are teal now, so the illustration retinted
for free when the rest of the app did.

Two deliberate departures from the reference:

- **No "Create an account".** Access is role-based and granted by invitation from an Owner/Admin
  (BRD §11). A public sign-up route would hand anyone an account on a PHI-bearing system, so the
  slot explains how to request access instead.
- **Password reset never confirms whether an address has an account.** Doing so would let anyone
  enumerate staff. The mock handler always returns 204 for the same reason.

Below `md` the brand panel is dropped and a compact wordmark sits above the form.

### Permissions are capabilities, not role checks

`src/auth/roles.ts` maps capabilities (`approveContentChange`, `manageAudit`, …) to roles.
Components ask `usePermission('approveContentChange')`, never `role === 'owner_admin'`, so a
fourth role does not mean auditing every comparison in the codebase. Route subtrees are gated by
`<RequirePermission>`; the side rail reads the same registry, so navigation and access can't drift.

### Routes

```
/login                    email + password
/login/verify             MFA — mandatory (BRD §11)
/login/forgot             request a password-reset link
/dashboard                overview
/queue                    prioritised review queue
                             ?severity= ?findingType= ?safetyOnly= ?search=
                             ?status=decided ("Recently reviewed" tab) | all (API-only, no UI control)
                             ?open=<turnId>&finding=<findingId>  → opens the turn-detail drawer in place
/turns/:turnId            turn detail, full page (?finding=<id> scrolls to and highlights that finding)
/recommendations          "Library review" in the nav — drafted answers, merges, new flows, prompt changes
/reports                  failure patterns, trends, unanswered topics
/admin/users              Owner/Admin only
/admin/configuration      Owner/Admin only
/admin/scheduler          "Audit runs" in the nav — Owner/Admin only
/403, *
```

Two nav labels are relabelled from the BRD/code names to match the client's second round of
screenshots — "Recommendations" displays as **Library review**, "Scheduler" as **Audit runs**.
Routes, permissions, and code identifiers are untouched; only `src/config/nav.ts`'s `label` strings
changed, so this is display-only and does not affect anything else in the codebase.

The full `/turns/:turnId` page still exists — and still has its own Previous/Next-turn
navigation — for deep links (a dashboard findings-by-type row, a future Reports/Recommendations
drill-down). The **review queue itself no longer navigates there**: clicking a queue card opens
`<TurnDetailDrawer>` in place via the `open`/`finding` query params, matching the client's
reference (a right-side slide-over with the queue visibly dimmed behind it) instead of a full page
transition. Both surfaces read the same `useTurn`/`useQueueItem` queries and the same
`useRecordDecision`/`useAssignToSelf` mutations, so a decision behaves identically wherever it's
made.

## Mock layer

MSW handlers are in `src/mocks/handlers.ts`, fixtures in `src/mocks/fixtures/`.

`VITE_USE_MOCKS=true` is intentionally supported in **production** builds too: OQ-01 (data access
+ signed BAA) blocks all real data, so a deployed mock build is how the client reviews screens
before the API exists. MSW is a separate chunk and is never loaded when mocks are off.

The canonical fixture is turn `T-88213`, taken from the prototype: the participant sends
"yes stop", the classifier picks `gratitude_feedback_or_ender` at 0.74, `stop_opt_out` sits
unselected at 0.69, and the bot replies about a renewal deadline. That one record exercises
transcript rendering, flow-correctness verdicts, top-N ranking, safety severity, and evidence
display at once — develop the turn detail screen against it.

## Build state

Done: shell, routing, auth screens, theme, domain model, mock layer, the **Dashboard**, the
**Review queue** (card list + tabs + stat strip), **Turn detail** (full page), the **turn-detail
drawer**, **Library review** (Recommendations), **Reports**, **Audit runs** (Scheduler), **Users &
roles**, and **Audit configuration**. Every screen in the app is now real — nothing left is a
`<PlannedScreen>` placeholder.

The palette is on its second iteration: v1 followed the original prototype (navy/teal); v2 (current)
retints the whole app to a dark-slate rail + teal-primary look per a later round of client
screenshots — see "MUI is themed to the client's reference designs" above for what moved and why.

### Dashboard

Implements the prototype's Overview flow (`CC-P1-002`, `CC-P1-004`, `CC-P1-017`):

- Safety banner above everything when any STOP/escalation miss is unresolved, linking to
  `/queue?safetyOnly=true`
- Setup checklist — invite team, set configuration, work the queue — with per-step actions hidden
  for roles that cannot perform them. Disappears once every step is complete.
- Four counters: last run, findings this period, queue depth, and cost burn with a bar against the
  per-run cap (a capped run reports `partial`, not `succeeded`)
- Findings by type, ordered safety-first then by volume, with the owner each routes to. A row
  click opens `/queue?findingType=<type>` — the filter travels in the URL so a filtered queue is
  linkable, rather than living only in the client store.
- Recent runs, with manual-trigger attribution and cost-cap notes

`useAppContext()` supplies the rail's queue badge and the top-bar library crumb once for the whole
shell. The badge is safety red **only** when a safety-critical finding is open; a merely busy queue
gets a neutral badge, so red keeps its meaning.

### Review queue (`src/features/queue/`)

Implements CC-P1-017 (prioritised queue) and the queue-facing half of CC-P1-004 (failure-type
detection). Restyled as a **card list** per the client's second reference (a support-ticket-style
worklist), not the dense table from round one — but the underlying rules that make the queue
trustworthy are unchanged and still enforced in the same places:

- Ordering is **fixed, not sortable**: safety-critical first unconditionally, then severity, then
  oldest. There is no column-sort affordance to defeat, because there are no columns — `QueueCard`
  renders one item as a block, and `buildQueue()`/the `/queue` handler own the order, not the UI.
- Every filter (severity, finding type, safety-only, search) and the active tab live in the URL
  via `queueParams.ts`, not a client store — a filtered queue is linkable and survives a refresh.
  `hasNarrowingFilters` vs `hasActiveFilters` are deliberately different predicates: severity/type/
  search *narrow* the set, switching tabs *changes which set you're looking at* (open vs. decided),
  and the two need different empty-state and count copy (see the bug note below).
- **Tabs**, matching the reference: "Needs review" (`status` unset — the live worklist, fixed
  priority order) and "Recently reviewed" (`status=decided` — everything already acted on, newest
  decision first; a history view, so it deliberately ignores the safety-first ordering rule that
  governs the worklist). `status=all` still exists for API completeness but has no tab — nothing in
  the UI produces it any more.
- A **stat strip** (`QueueStatStrip`) — critical signals, median review age, today's throughput,
  last synced — computed server-side over the *whole* open queue regardless of the current tab or
  filter, so it can't silently disagree with what's on screen.
- Each card shows a **risk score** (0–100, `utils/risk.ts`'s `computeRiskScore`) and two **category
  tags** (`config/findingTypes.ts`'s `categoryMeta` — the same five buckets the client's Insights
  screenshot calls "issue buckets": Safety/policy, Intent quality, Knowledge coverage, Conversation
  flow, Evidence quality). Neither field exists in the BRD's data model; both are documented,
  formula-driven derivations from data already on hand — see "New fields" below.
- A card's **status pill** ("Needs review" / "In review" / …) is a distinct concept from its
  **severity badge** and is deliberately never safety/"Critical" red — see `QueueStatusPill.tsx`
  and the palette note above.
- Clicking a card opens `<TurnDetailDrawer>` in place (see below) rather than navigating away.

### Turn detail (`src/features/turn/`) — CC-P1-016, the centrepiece screen

One screen assembled from nine focused panels, each mapped to a specific FR:

| Panel | Covers |
|---|---|
`TranscriptPanel` | FR-VIEW-001 — participant hash only, never a raw phone number |
`FindingsPanel` + `FindingCard` + `DecisionDialog` | FR-ROUTE-001/002 — approve/request-changes/reject, comment mandatory, routes to an owner rather than editing the bot |
`FlowIntentsPanel` | FR-FLOW-001, FR-TOPN-001 — flow correctness and top-N ranking verdicts |
`PicklistPanel` | FR-PICK-001 |
`SurveyPanel` | FR-SURV-001 |
`DocumentPanel` | FR-VER-001, FR-IMG-001 — extraction legibility *and* verification-rule correctness scored separately, since the BRD's own example (a rule comparing against the wrong reference date) is a rule bug on a perfectly legible document |
`CatalogPanel` | Library version + snapshot, so a finding is reproducible after the library moves on |
`RawTracePanel` | The one deliberately unstyled, collapsed-by-default panel — wraps `<TraceViewer>` |
`DecisionHistoryPanel` | What a colleague already decided, so a second visit doesn't re-litigate it |

Approving a finding never edits the live bot: `useRecordDecision()` posts to
`/findings/:id/decision` and the mock handler sets the finding's status to `routed`, `rejected`, or
`changes_requested` — the same vocabulary as `ReviewStatus` everywhere else in the app. One
decision invalidates the queue, the turn, the dashboard counters, and the rail badge together.

### Turn-detail drawer (`TurnDetailDrawer.tsx`) — the "popup" from the client's screenshots

The review queue's "click a card" interaction is this drawer, not the full page above — a
right-side `<Drawer>` opened via the `open`/`finding` query params on `/queue` itself, so the queue
list stays mounted and visibly dimmed behind it, matching the reference exactly. It reuses the
*same* `useTurn`/`useQueueItem` queries and `useRecordDecision`/`useAssignToSelf` mutations as the
full page — nothing about how a decision is recorded differs by which surface you're looking at it
from.

Structure, matching the reference: header (finding ID, severity badge, status pill, close ✕) → a
**"Proposed review action" card** (a per-finding-type recommended action from
`findingTypeMeta[type].proposedAction`, with Approve & route / Request changes / Reject / Assign)
→ a **mini-stat row** (risk score, model confidence, evidence state, assignee) → three
`<Accordion>` sections (Conversation trace — expanded by default, with a synthesized "System
decision" line after the real transcript; Flow context; Matched intent candidates) → any other open
findings on the same turn, reusing `<FindingCard>` so their decision flow is identical to the full
page → a footer with a read-only note and links back to the queue or the full page.

One intentional departure from the reference: the "Proposed review action" card keeps all **three**
decision options (Approve & route / Request changes / Reject), not just the two the screenshot
shows (Approve & route / Reject). Dropping "Request changes" would have changed the review *flow*,
which this pass was explicitly told to leave alone — only "Request changes" is visually
de-emphasised (outlined, not filled) to keep Approve/Reject as the primary pair.

#### New fields this introduced, and how they're derived

None of these exist in the BRD's data model. Each is a documented formula over data the audit
already produces, not a fabricated number — and each is called out in code as a mock-layer
approximation a real backend would eventually own outright:

- **Risk score** (`computeRiskScore`, `utils/risk.ts`) — a fixed 0–99 band per severity tier
  (Critical 90–99, High 60–85, Medium 35–55, Low 10–25), with confidence-of-the-selected-intent
  moving the score within its band. The score can never contradict the severity badge next to it,
  because severity picks the band.
- **Assignee** (`assignQueueItem`/`useAssignToSelf`) — assign-to-self only. There's no user
  directory picker in this pass; clicking "Assign" claims the item for whoever clicks it, which is
  what flips its status pill from "Needs review" to "In review".
- **Evidence state** (`deriveEvidenceState`, `utils/risk.ts`) — `missing` if the raw trace has a
  `guardrails` object with any check that evaluated `false` (a corroborating rule that should have
  run and didn't); `missing` if an attached document isn't `clear`; `present` if there's a
  document/picklist/survey and neither of those apply; `not_collected` otherwise. This is the
  heuristic most likely to need a real backend field — it's a plausible reconstruction from the
  trace, not a designed signal.

Six fixtures in `src/mocks/fixtures/turns/` between them exercise every Phase-1 audit dimension —
flow mis-routing, top-N ranking, intent overlap, response-vs-intent mismatch, picklist mismatch,
survey interruption handling, a genuine AI miss, missing content, document extraction quality, and
a verification-rule bug — across **two different raw-trace shapes** (nested objects vs. a flat
`nodes` array with fields the app has never seen), so the generic trace viewer is proven against a
moving target rather than one convenient sample. The mock queue (`src/mocks/fixtures/queue.ts`) is
*derived* from these fixtures' findings rather than hand-written, so recording a decision mutates
the same finding object the queue reads and the two can't drift apart.

**Real bugs found by screenshotting, not just typechecking** — none of these would have shown up
in a typecheck:
1. *(Historical — the surface this affected no longer exists.)* While the queue was still a
   `<Table>` (before the card-list redesign), MUI's default `table-layout: auto` starved the one
   column meant to wrap (Finding) in favour of short unwrappable columns — every finding title got
   squeezed onto three lines. Fixed at the time with `table-layout: fixed` plus widths sized against
   the table's own padding. Recorded here only because the fix technique (browsers protect columns
   whose content can't shrink at the expense of ones that can) is worth remembering if a dense table
   returns anywhere else in this app.
2. The queue subtitle read "9 of 8 open" when "include decided" was combined with the default
   (no narrowing) filter state — treating "widen to include decided" as an instance of "narrow by
   filter" produced backwards phrasing. Fixed by separating `hasNarrowingFilters` from
   `hasActiveFilters` and giving each combination of the two axes its own copy; this distinction
   carried forward into the tabs redesign (`status=decided` vs. a narrowing filter) unchanged.
3. **`<StatusTag>`'s "routed" state always read "Routed to content workflow"**, regardless of which
   owner a finding or recommendation actually routed to — wrong (and misleadingly specific) for
   anything owned by `safety` or `engineering`. This was live on the Turn Detail page (`FindingCard`)
   before Library review ever surfaced it; it just hadn't been noticed there. Fixed by making
   `routed`'s default label owner-agnostic ("Routed") and adding an optional `routedToLabel` prop
   that callers pass when they know the real destination (`FindingCard` and `RecommendationCard`
   both now pass `ownerLabels[owner]`). Caught by literally reading the screenshot: the status chip
   said "content workflow" one line above a footnote that correctly said "Routed to Engineering
   backlog" — an internal contradiction visible on the same card.

### Library review (`src/features/recommendations/`) — CC-P1-006/014/015/018/019

The BRD/code name is "Recommendations"; the nav shows "Library review" per the client's
screenshots, and the page itself now uses that title too (previously only the nav label had been
renamed, ahead of the page being built). Structure follows the reference closely:

- A **"Protected workspace" banner** (shield icon, teal-tinted, a `READ-ONLY` chip) restates BRD
  §6.4 on the one screen where it matters most — this is where approvals actually happen, so the
  constraint needs to be visible here, not just in a README.
- **Left vertical tabs**, one per `RecommendationKind`, each with a live count: *Unanswered
  clusters* (`content_gap`), *Merge suggestions* (`intent_merge`), *New-flow recommendations*
  (`new_flow`), *Prompt review* (`prompt_change`) — the reference's exact tab wording, config'd in
  `recommendationKindMeta` alongside each kind's icon/colour and what approving it actually routes
  to.
- Each recommendation renders as a full card (title, evidence list, drafted-answer block when one
  exists, Approve & route / Request changes / Reject) rather than the reference's compact
  list-row-plus-single-button pattern — a deliberate choice for consistency with how `FindingCard`
  already handles decisions elsewhere in this app, at the cost of some density.
- `?highlight=<recommendationId>` jumps to the right tab and scrolls to that card — this is what
  makes the Reports page's "Draft ready" links land somewhere real instead of just changing pages.
- Approving mutates the fixture (same pattern as finding decisions) via
  `useRecordRecommendationDecision()`; when a `content_gap` recommendation is routed, the
  `UnansweredTopic` fixture it came from flips to `routed` too, so Reports and Library review can't
  quietly disagree about the same topic's state.
- One fixture was added (`REC-4005`) to fix a latent inconsistency: `UNA-02` ("proof of Colorado
  residency") already claimed `status: 'draft_ready'` with no recommendation backing that claim.

### Reports (`src/features/reports/`) — FR-RPT-001 / CC-P1-020, drawing on CC-P1-013

Four headline stats straight from BRD §4.3's success measures (audit-vs-human parity against the
≥90% target, problems surfaced, recurring trends open, manual review time saved), plus two panels:

- **Recurring intent-confusion trends** — rising pairs tint amber (`tokens.color.high`), *not*
  safety/"Critical" red, even though "above alert threshold" sounds urgent — that colour stays
  reserved for STOP/escalation misses specifically (see the palette section above). A row click
  jumps to the queue filtered by that intent, and the panel has a real **Export CSV** button
  (`utils/csv.ts` — a small dependency-free Blob-download helper, no library, since the datasets
  here are small and already loaded client-side).
- **Unanswered question topics** — ranked by frequency; a "Draft ready" status is a real link into
  Library review's matching recommendation (`?highlight=`), not decorative text. Also has its own
  Export CSV button rather than one page-level button, since the two tables have different row
  shapes and forcing them into one CSV would have meant fabricating a shared schema.

### Layout — top bar and rail are now genuinely fixed

The root shell used `minHeight: '100vh'`, which let the whole page grow past the viewport on tall
content — instead of the intended inner scroll region taking over, the *entire document* scrolled,
dragging the top bar and the rail's bottom section (review context, workspace settings, the
signed-in user) off-screen with it. Fixed by pinning the shell to `height: '100vh'` with
`overflow: hidden`, and adding `minHeight: 0` to the two flex children that needed to actually
shrink to their flex-basis instead of growing to fit their content (`main`'s content area, and the
rail's own nav list) — a standard flexbox gotcha: a flex child won't shrink below its content's
intrinsic size unless told to. Verified with a short 700px viewport (to force scrolling) that the
document itself never scrolls, only `<main>` does, and that the rail's top brand mark and its
bottom profile/settings section both stay pinned throughout.

### Audit runs (`src/features/admin/`) — CC-P1-002's scheduling & run-history half

The BRD/code name is "Scheduler"; the nav (and now the page itself) shows "Audit runs" per the
client's screenshots. Three pieces, all backed by real mutations rather than static display:

- **`RunInProgressCard`** — shown only while a batch is `running`/`paused`. A batch is modelled as
  staying non-terminal until its findings are triaged, not just until the audit pass finishes —
  matching human-in-the-loop: a "release gate" run isn't really done until people have acted on it.
  Its `criticalOpen` count is one of the few legitimate uses of safety/"Critical" red outside
  `<SeverityBadge>`, since it's a literal count of the batch's unresolved STOP/escalation-miss
  findings. **Pause/Resume** are real: they flip the run's status via `usePauseRun`/`useResumeRun`,
  which is why `RunStatus` gained a `paused` variant (added to `RunStatusChip` too).
- **`SchedulerStatCards`** — the recurring job's next run (with a real on/off `Switch` via
  `useToggleSchedulerJob`, and a link to Audit configuration) plus average batch duration, computed
  from actual run timestamps (`runStats.ts`'s `computeAverageDuration`, comparing the most recent
  completed runs against the ones before them) — not a fabricated trend number.
- **`RunHistoryTable`** plus a **"Schedule a run"** dialog that starts a real ad-hoc batch
  (`useCreateRun`) using the active configuration's cost cap, same governance a scheduled run gets.
  The dialog deliberately has no window/flow-filter picker — those inputs would be decorative until
  the batch engine actually accepts them, so it asks for confirmation and nothing it can't act on.

One bug this surfaced and fixed along the way: the dashboard's "Last run" stat read `mockRuns[0]`,
which was safe only because every run happened to be terminal. Adding a `running` run at the front
of the list would have made the dashboard claim an in-progress batch had "Succeeded" — fixed by
having that handler explicitly find the most recent *completed* run instead of trusting array order.

### Users & roles (`src/features/admin/`) — BRD §11, no dedicated feature-list line item

Role-based access with mandatory MFA. Every action here is a real mutation, not a static table:

- **Invite, deactivate, reactivate, resend invite, change role** — all wired (`api/mutations/
  users.ts`), each one recording an entry in the access log via a shared `logAccessChange` helper
  rather than five different ad-hoc log-writing call sites.
- **You can't touch your own account.** The row for the signed-in user shows its role as a locked
  chip and "—" for actions; the mock handlers enforce the same rule server-side (`deactivate` and
  `role` both reject a self-target with 400), so this isn't just a UI nicety.
- **Deactivate asks for a plain yes/no confirmation** (`<ConfirmDialog>`), not a written reason —
  deliberately lighter than the required-comment pattern used for content and safety decisions
  elsewhere. Reversible admin actions that are already actor+timestamp logged automatically don't
  need the same bar as a change to what the bot does.
- **The access log is the platform's whole admin trail, not just user management** — Audit
  configuration saves land in the same `mockAccessLog` feed (BRD 11 covers "content changes...and
  admin actions" together), so this one panel is where an auditor looks for everything.

### Audit configuration (`src/features/admin/`) — CC-P1-002's operator controls, CC-P1-004's enabled finding types

A **draft-then-save** form, not a live-edit one: the active version loads into local draft state,
every section edits that draft, and nothing takes effect until "Save as new version" — which
requires a note, same required-reason rule as every other decision in this app. The active version
is never mutated in place; saving always creates version N+1 (`createConfigVersion` in the mock
fixtures), and "Restore" on a past version loads its values back into the draft for review rather
than reactivating it directly.

Two toggles needed a real design decision rather than just wiring a switch to a boolean:

- **"Always include safety findings in the queue" is locked on**, not a real toggle — BRD §4.2
  states safety-critical findings are *never* sampled out as a hard rule, not a preference, so a
  switch that could turn it off would misrepresent the guarantee. It renders as a disabled,
  permanently-on `Switch` with an explanatory tooltip and a small "Locked" label.
- **"STOP / escalation detection" stays a real, live switch** (the client's own original prototype
  showed it as one), but turning it off shows an immediate, unmissable `Alert`: *"missed STOP
  opt-outs and emergency escalations will not be flagged."* The risk is made visible rather than
  prevented outright — consistent with how this app treats every other safety-adjacent control.

The finding-types checkbox grid applies the same rule at the type level: `stop_escalation_miss` is
checked and disabled, with a tooltip explaining why, everywhere `findingTypeMeta` drives a control.

One UX rough edge caught by screenshotting the actual interaction, not by reasoning about the code:
switching "Population mode" from Full to Sampled inherited whatever `samplePct` the full-population
state happened to have — which was 100, since that field persists across modes and is simply
ignored while `full`. A fresh switch to Sampled silently showing "100%" reads as "sample
everything," which is confusing enough to be worth a small fix: switching to Sampled now resets a
100%-or-higher value to a more sensible 50% default, so the operator has an obvious reason to look
at the slider rather than an easy-to-miss stale number.

### Open question — timestamp timezone

Times currently render in the **viewer's local timezone**. Clinic Chat is Colorado-based and the
nightly job is scheduled in `America/Denver`, so a reviewer elsewhere sees a different clock time
for the same run than the prototype shows. Decide whether to display times in the organisation's
timezone, the viewer's, or the viewer's with an explicit zone label — then change `formatTime` /
`formatDateTime` in `src/utils/format.ts` in one place.

### Verified states

Dashboard was checked in a real browser as Owner/Admin and as Content Reviewer, confirming the
click-throughs and that admin surfaces are hidden and `/admin/*` redirects to `/403`. The
**first-run state** (no completed audit run) is implemented — `lastRun: null` drops the cost card
and shows an empty runs panel — but is not yet exercised by a fixture.

Review queue and turn detail were driven end-to-end in a real browser at every stage of the build,
not just typechecked — most recently: sign-in → the retinted dashboard/queue/auth screens (no
console errors, no residual navy) → the "Needs review" and "Recently reviewed" tabs → open the
drawer from a queue card (dimmed queue confirmed visible behind it, exactly as the client's
screenshot shows) → **Approve & route** the safety finding with a required comment → confirm in the
*same SPA session* that the queue count actually drops (8→7), the rail badge/stat-strip/review-
context widget update together, a success toast appears, and the drawer's own status pill flips to
"Approved & routed" in place → the "Recently reviewed" tab now lists it first (recency-sorted) →
**Assign** on a second, non-safety card, confirming the status pill moves from "Needs review" to
"In review" and the mini-stat row's Assignee updates. Full-page `page.goto()` navigations are
avoided for these checks because they reload the tab and reset the mock layer's in-memory state — a
property of the mock, not the app, but worth knowing if you extend the harness in `scratchpad`.

Two real layout bugs were caught this way and fixed (see the Review Queue section's "bug note").
Everything above was re-verified after both fixes.

### Known issues

- **Node version.** `react-router@8.3.1` requires Node `>=22.22.0`; this machine has `22.19.0`.
  It installs and runs, but the engine constraint should be satisfied before CI is set up —
  either upgrade Node or pin React Router to 7.x.
- **No linter yet.** `typescript-eslint` support for TypeScript 7 needs verifying before an
  ESLint config is added, so there is deliberately no broken `lint` script.
- **No tests yet.** Vitest + Testing Library should go in alongside the first real screen; the
  MSW fixtures double as test data.

### Unfunded scope

The feature list allocates **31 FE person-days** across 13 features, with the review view
(`CC-P1-016`, now built) the largest single item at 8 days. Login + MFA, Users & roles, versioned
audit configuration, and the scheduler all appear in the prototype and are implied by BRD §11, but
have **no line item and no FE days** in the estimate. All four — Audit runs (Scheduler), Library
review (Recommendations), Users & roles, and Audit configuration — are now built despite that; the
estimate still has no day count for any of them, so this is a paperwork gap for sprint planning to
close, not a build gap.
