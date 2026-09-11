import { http, HttpResponse, delay } from 'msw';
import { env } from '@/config/env';
import { findingTypeMeta } from '@/config/findingTypes';
import { roleLabels } from '@/auth/roles';
import { findUser, inviteUser, logAccessChange, mockAccessLog, mockUsers } from './fixtures/users';
import { findFinding, findTurn, mockTurns } from './fixtures/turns';
import { assignQueueItem, buildQueue, findQueueItem } from './fixtures/queue';
import {
  createConfigVersion,
  createManualRun,
  findRecommendation,
  findRun,
  mockConfigVersions,
  mockFindingsByType,
  mockRecommendations,
  mockReportSummary,
  mockRuns,
  mockScheduledJob,
  mockTrends,
  mockUnanswered,
} from './fixtures/audit';
import type { AuditConfig, AuthUser, ReviewStatus, Role, Severity } from '@/types/domain';

const base = env.apiBaseUrl.replace(/\/$/, '');
const url = (path: string) => `${base}${path}`;

/** Open queue items — the basis of every dashboard counter. */
const openQueueItems = () => buildQueue().filter((item) => item.status === 'open');

/** In-memory challenge store so the MFA step behaves like a real two-step flow. */
const challenges = new Map<string, AuthUser>();

/** Any 6-digit code is accepted except this one, which exercises the error path. */
const REJECTED_MFA_CODE = '000000';

/**
 * Decisions recorded this session, newest first.
 *
 * The real API persists these to the HIPAA/SOC-2 audit log (BRD 11); here they
 * are kept in memory so the turn detail screen can show what a reviewer did.
 */
export interface RecordedDecision {
  findingId: string;
  decision: 'approve' | 'request_changes' | 'reject';
  comment: string;
  actor: string;
  at: string;
  resultingStatus: ReviewStatus;
}
const decisionLog: RecordedDecision[] = [];

/**
 * Approving a finding does not edit anything in the live bot — it routes the
 * finding to its owner for action (BRD 6.4, FR-ROUTE-001/002).
 */
const statusForDecision: Record<RecordedDecision['decision'], ReviewStatus> = {
  approve: 'routed',
  request_changes: 'changes_requested',
  reject: 'rejected',
};

/**
 * Sort key for "Recently reviewed": this session's own decision timestamp if
 * one was recorded, else the finding's creation time pushed far into the past
 * so anything the reviewer just acted on surfaces above pre-seeded fixture
 * data that arrived already decided.
 */
function decisionRank(findingId: string): number {
  const entry = decisionLog.find((candidate) => candidate.findingId === findingId);
  if (entry) return Date.parse(entry.at);
  const finding = findFinding(findingId);
  return finding ? Date.parse(finding.createdAt) - 365 * 24 * 60 * 60 * 1000 : 0;
}

/** Median age (minutes) of a set of queue items, for the "Median review age" stat. */
function medianAgeMinutes(items: { createdAt: string }[]): number {
  if (items.length === 0) return 0;
  const now = Date.now();
  const ages = items.map((item) => (now - Date.parse(item.createdAt)) / 60_000).sort((a, b) => a - b);
  const mid = Math.floor(ages.length / 2);
  const median = ages.length % 2 === 0 ? (ages[mid - 1]! + ages[mid]!) / 2 : ages[mid]!;
  return Math.round(median);
}

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function userFromAuthHeader(request: Request): AuthUser | undefined {
  const auth = request.headers.get('Authorization') ?? '';
  const userId = auth.replace('Bearer mock.', '');
  return mockUsers.find((candidate) => candidate.id === userId);
}

export const handlers = [
  /* ---------------------------- Auth ---------------------------- */

  http.post(url('/auth/login'), async ({ request }) => {
    await delay(300);
    const { email, password } = (await request.json()) as { email?: string; password?: string };

    if (!email || !password) {
      return HttpResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    const user = mockUsers.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return HttpResponse.json(
        { message: 'No account matches that email. Try dana.whitfield@futransolutions.com.' },
        { status: 401 },
      );
    }

    if (user.status === 'deactivated') {
      return HttpResponse.json({ message: 'This account is deactivated.' }, { status: 403 });
    }

    const challengeId = `chl_${crypto.randomUUID()}`;
    challenges.set(challengeId, { id: user.id, name: user.name, email: user.email, role: user.role });

    return HttpResponse.json({ challengeId, name: user.name, role: user.role });
  }),

  http.post(url('/auth/mfa'), async ({ request }) => {
    await delay(300);
    const { challengeId, code } = (await request.json()) as { challengeId?: string; code?: string };

    const user = challengeId ? challenges.get(challengeId) : undefined;
    if (!challengeId || !user) {
      return HttpResponse.json({ message: 'That sign-in attempt expired. Start again.' }, { status: 401 });
    }
    if (!code || code.length !== 6 || code === REJECTED_MFA_CODE) {
      return HttpResponse.json({ message: 'That code is not valid. Check your authenticator app.' }, { status: 401 });
    }

    challenges.delete(challengeId);
    return HttpResponse.json({ token: `mock.${user.id}`, user });
  }),

  http.get(url('/auth/session'), ({ request }) => {
    const user = userFromAuthHeader(request);
    if (!user) return HttpResponse.json({ message: 'Session expired.' }, { status: 401 });
    return HttpResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  }),

  http.post(url('/auth/logout'), () => new HttpResponse(null, { status: 204 })),

  http.post(url('/auth/forgot-password'), async ({ request }) => {
    await delay(400);
    const { email } = (await request.json()) as { email?: string };
    if (!email?.trim()) {
      return HttpResponse.json({ message: 'Enter your work email.' }, { status: 400 });
    }
    // Always 204, whether or not the address has an account — anything else
    // would let a caller enumerate staff accounts.
    return new HttpResponse(null, { status: 204 });
  }),

  /* -------------------------- App chrome -------------------------- */

  http.get(url('/app/context'), async () => {
    await delay(150);
    const open = openQueueItems();
    return HttpResponse.json({
      library: { version: 'v128', pulledAt: '2026-09-09T05:22:00Z' },
      queueDepth: open.length,
      safetyFindingsOpen: open.filter((item) => item.safetyCritical).length,
    });
  }),

  /* -------------------------- Dashboard -------------------------- */

  http.get(url('/dashboard/summary'), async () => {
    await delay(200);
    const open = openQueueItems();

    return HttpResponse.json({
      // The most recent *completed* run — not just `mockRuns[0]`, which can
      // be an in-progress batch sitting at the top of the list. "Last run"
      // on the dashboard means the last one that actually finished.
      lastRun: mockRuns.find((run) => run.status === 'succeeded' || run.status === 'partial' || run.status === 'failed') ?? null,
      findingsThisPeriod: mockFindingsByType.reduce((total, row) => total + row.count, 0),
      periodDays: 7,
      safetyFindingsOpen: open.filter((item) => item.safetyCritical).length,
      queueDepth: open.length,
      queueBreakdown: {
        safety: open.filter((item) => findingTypeMeta[item.findingType].owner === 'safety').length,
        content: open.filter((item) => findingTypeMeta[item.findingType].owner === 'content').length,
        engineering: open.filter((item) => findingTypeMeta[item.findingType].owner === 'engineering').length,
      },
      onboarding: [
        { id: 'invite_team', complete: true, detail: '2 of 3 reviewers active' },
        { id: 'set_configuration', complete: true, detail: 'v4 active · saved 2 days ago' },
        {
          id: 'work_queue',
          complete: open.length === 0,
          detail:
            open.length === 0
              ? 'Queue clear'
              : `${open.length} items waiting, ${open.filter((i) => i.safetyCritical).length} safety-critical`,
        },
      ],
    });
  }),

  http.get(url('/dashboard/findings-by-type'), async () => {
    await delay(200);
    return HttpResponse.json(mockFindingsByType);
  }),

  /* ---------------------------- Queue ---------------------------- */

  http.get(url('/queue'), async ({ request }) => {
    await delay(250);
    const params = new URL(request.url).searchParams;

    const search = params.get('search')?.trim().toLowerCase() ?? '';
    const findingTypes = params.getAll('findingType');
    const severities = params.getAll('severity') as Severity[];
    const safetyOnly = params.get('safetyOnly') === 'true';
    const status = params.get('status');

    let items = buildQueue();

    if (status === 'decided') {
      // "Recently reviewed" tab: everything already acted on, newest
      // decision first — a history view, not a worklist, so it ignores the
      // fixed safety-first ordering.
      items = items
        .filter((item) => item.status !== 'open')
        .sort((a, b) => decisionRank(b.findingId) - decisionRank(a.findingId));
    } else if (status === 'all') {
      // Both open and decided, in the usual fixed priority order.
    } else {
      // Default worklist view: open items only.
      items = items.filter((item) => item.status === 'open');
    }

    if (safetyOnly) items = items.filter((item) => item.safetyCritical);
    if (findingTypes.length > 0) items = items.filter((item) => findingTypes.includes(item.findingType));
    if (severities.length > 0) items = items.filter((item) => severities.includes(item.severity));

    if (search) {
      items = items.filter((item) => {
        const turn = findTurn(item.turnId);
        const haystack = [
          item.turnId,
          item.findingId,
          item.findingLabel,
          item.flowType,
          item.participantHash,
          ...(turn?.matchedIntents.map((intent) => intent.name) ?? []),
          ...(turn?.transcript.map((message) => message.text) ?? []),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(search);
      });
    }

    const open = openQueueItems();
    const decidedTodayCount = decisionLog.filter((entry) => isToday(entry.at)).length;

    return HttpResponse.json({
      items,
      total: items.length,
      // Unfiltered totals, so the screen can say "3 of 8" honestly — and so
      // the stat strip reflects the whole queue, not just the current tab/filter.
      totalOpen: open.length,
      totalSafety: open.filter((item) => item.safetyCritical).length,
      medianOpenAgeMinutes: medianAgeMinutes(open),
      decidedToday: decidedTodayCount,
      asOf: new Date().toISOString(),
    });
  }),

  http.get(url('/queue/:findingId'), async ({ params }) => {
    await delay(150);
    const item = findQueueItem(String(params.findingId));
    if (!item) return HttpResponse.json({ message: 'Queue item not found.' }, { status: 404 });
    return HttpResponse.json(item);
  }),

  http.post(url('/queue/:findingId/assign'), async ({ request, params }) => {
    await delay(250);
    const { assignee } = (await request.json()) as { assignee?: string };
    if (!assignee?.trim()) {
      return HttpResponse.json({ message: 'An assignee is required.' }, { status: 400 });
    }

    const findingId = String(params.findingId);
    if (!findFinding(findingId)) return HttpResponse.json({ message: 'Finding not found.' }, { status: 404 });

    assignQueueItem(findingId, assignee.trim());
    return HttpResponse.json({ findingId, assignee: assignee.trim() });
  }),

  /* ---------------------------- Turns ---------------------------- */

  http.get(url('/turns/:turnId'), async ({ params }) => {
    await delay(250);
    const turn = findTurn(String(params.turnId));
    if (!turn) return HttpResponse.json({ message: 'Turn not found.' }, { status: 404 });

    const turnIds = mockTurns.map((candidate) => candidate.id);
    const index = turnIds.indexOf(turn.id);

    return HttpResponse.json({
      ...turn,
      decisions: decisionLog.filter((entry) => turn.findings.some((f) => f.id === entry.findingId)),
      // Lets a reviewer work the queue without returning to the list.
      neighbours: {
        previousTurnId: index > 0 ? turnIds[index - 1] : null,
        nextTurnId: index < turnIds.length - 1 ? turnIds[index + 1] : null,
      },
    });
  }),

  http.get(url('/turns'), async () => {
    await delay(200);
    return HttpResponse.json({ items: mockTurns, total: mockTurns.length });
  }),

  /* ------------------------ Review decisions ------------------------ */

  http.post(url('/findings/:findingId/decision'), async ({ request, params }) => {
    await delay(350);
    const { decision, comment } = (await request.json()) as {
      decision?: RecordedDecision['decision'];
      comment?: string;
    };

    // A comment is mandatory — it feeds the HIPAA/SOC-2 audit log (BRD 11).
    if (!comment?.trim()) {
      return HttpResponse.json({ message: 'A comment is required to record a decision.' }, { status: 400 });
    }
    if (!decision || !(decision in statusForDecision)) {
      return HttpResponse.json({ message: 'Unknown decision.' }, { status: 400 });
    }

    const finding = findFinding(String(params.findingId));
    if (!finding) return HttpResponse.json({ message: 'Finding not found.' }, { status: 404 });

    const actor = userFromAuthHeader(request);
    if (!actor) return HttpResponse.json({ message: 'Session expired.' }, { status: 401 });

    const resultingStatus = statusForDecision[decision];
    // Mutating the fixture is what makes the flow demonstrable: the item leaves
    // the queue and the dashboard counters drop.
    finding.status = resultingStatus;

    decisionLog.unshift({
      findingId: finding.id,
      decision,
      comment: comment.trim(),
      actor: actor.name,
      at: new Date().toISOString(),
      resultingStatus,
    });

    return HttpResponse.json({ findingId: finding.id, status: resultingStatus, routedTo: finding.owner });
  }),

  /* ------------------------ Recommendations ------------------------ */

  http.get(url('/recommendations'), async () => {
    await delay(250);
    return HttpResponse.json({ items: mockRecommendations, total: mockRecommendations.length });
  }),

  http.post(url('/recommendations/:id/decision'), async ({ request, params }) => {
    await delay(300);
    const { decision, comment } = (await request.json()) as {
      decision?: RecordedDecision['decision'];
      comment?: string;
    };

    // A comment is mandatory — it feeds the HIPAA/SOC-2 audit log (BRD 11),
    // same as a finding decision.
    if (!comment?.trim()) {
      return HttpResponse.json({ message: 'A comment is required to record a decision.' }, { status: 400 });
    }
    if (!decision || !(decision in statusForDecision)) {
      return HttpResponse.json({ message: 'Unknown decision.' }, { status: 400 });
    }

    const recommendation = findRecommendation(String(params.id));
    if (!recommendation) return HttpResponse.json({ message: 'Recommendation not found.' }, { status: 404 });

    const resultingStatus = statusForDecision[decision];
    // Mutating the fixture is what makes the flow demonstrable — same pattern
    // as the finding-decision handler above.
    recommendation.status = resultingStatus;
    if (resultingStatus === 'routed') {
      recommendation.routedTo = recommendation.owner === 'engineering' ? 'Engineering backlog' : 'Content workflow / CMS';
      recommendation.routedAt = new Date().toISOString();

      // A content-gap recommendation is the drafted answer behind an
      // unanswered topic — once it's routed, the topic it came from is no
      // longer just "drafted", it's shipped.
      const topic = mockUnanswered.find((candidate) => candidate.recommendationId === recommendation.id);
      if (topic) topic.status = 'routed';
    }

    return HttpResponse.json({
      id: recommendation.id,
      status: resultingStatus,
      routedTo: recommendation.owner,
    });
  }),

  /* ---------------------------- Reports ---------------------------- */

  http.get(url('/reports/summary'), async () => {
    await delay(200);
    return HttpResponse.json(mockReportSummary);
  }),

  http.get(url('/reports/trends'), async () => {
    await delay(200);
    return HttpResponse.json(mockTrends);
  }),

  http.get(url('/reports/unanswered'), async () => {
    await delay(200);
    return HttpResponse.json(mockUnanswered);
  }),

  /* ----------------------------- Admin ----------------------------- */

  http.get(url('/admin/users'), async () => {
    await delay(200);
    return HttpResponse.json(mockUsers);
  }),

  http.post(url('/admin/users'), async ({ request }) => {
    await delay(300);
    const actor = userFromAuthHeader(request);
    if (!actor) return HttpResponse.json({ message: 'Session expired.' }, { status: 401 });

    const { name, email, role } = (await request.json()) as { name?: string; email?: string; role?: Role };
    if (!name?.trim() || !email?.trim() || !role) {
      return HttpResponse.json({ message: 'Name, email, and role are all required.' }, { status: 400 });
    }
    if (mockUsers.some((user) => user.email.toLowerCase() === email.trim().toLowerCase())) {
      return HttpResponse.json({ message: 'A user with that email already exists.' }, { status: 409 });
    }

    const user = inviteUser({ name: name.trim(), email: email.trim(), role });
    logAccessChange(actor.name, `Invited ${user.email} as ${roleLabels[role]}`);
    return HttpResponse.json(user, { status: 201 });
  }),

  http.post(url('/admin/users/:id/deactivate'), async ({ request, params }) => {
    await delay(250);
    const actor = userFromAuthHeader(request);
    if (!actor) return HttpResponse.json({ message: 'Session expired.' }, { status: 401 });
    if (params.id === actor.id) {
      return HttpResponse.json({ message: 'You cannot deactivate your own account.' }, { status: 400 });
    }

    const user = findUser(String(params.id));
    if (!user) return HttpResponse.json({ message: 'User not found.' }, { status: 404 });

    user.status = 'deactivated';
    logAccessChange(actor.name, `Deactivated ${user.email}`);
    return HttpResponse.json(user);
  }),

  http.post(url('/admin/users/:id/reactivate'), async ({ request, params }) => {
    await delay(250);
    const actor = userFromAuthHeader(request);
    if (!actor) return HttpResponse.json({ message: 'Session expired.' }, { status: 401 });

    const user = findUser(String(params.id));
    if (!user) return HttpResponse.json({ message: 'User not found.' }, { status: 404 });

    user.status = 'active';
    logAccessChange(actor.name, `Reactivated ${user.email}`);
    return HttpResponse.json(user);
  }),

  http.post(url('/admin/users/:id/resend-invite'), async ({ request, params }) => {
    await delay(250);
    const actor = userFromAuthHeader(request);
    if (!actor) return HttpResponse.json({ message: 'Session expired.' }, { status: 401 });

    const user = findUser(String(params.id));
    if (!user) return HttpResponse.json({ message: 'User not found.' }, { status: 404 });
    if (user.status !== 'pending') {
      return HttpResponse.json({ message: 'Only a pending invite can be resent.' }, { status: 400 });
    }

    logAccessChange(actor.name, `Resent invite to ${user.email}`);
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch(url('/admin/users/:id/role'), async ({ request, params }) => {
    await delay(250);
    const actor = userFromAuthHeader(request);
    if (!actor) return HttpResponse.json({ message: 'Session expired.' }, { status: 401 });
    if (params.id === actor.id) {
      return HttpResponse.json({ message: 'You cannot change your own role.' }, { status: 400 });
    }

    const { role } = (await request.json()) as { role?: Role };
    if (!role) return HttpResponse.json({ message: 'A role is required.' }, { status: 400 });

    const user = findUser(String(params.id));
    if (!user) return HttpResponse.json({ message: 'User not found.' }, { status: 404 });

    const previousRole = roleLabels[user.role];
    user.role = role;
    logAccessChange(actor.name, `Changed ${user.email}'s role: ${previousRole} → ${roleLabels[role]}`);
    return HttpResponse.json(user);
  }),

  http.get(url('/admin/access-log'), async () => {
    await delay(200);
    return HttpResponse.json(mockAccessLog);
  }),

  http.get(url('/admin/config'), async () => {
    await delay(200);
    return HttpResponse.json(mockConfigVersions.find((version) => version.active));
  }),

  http.get(url('/admin/config/versions'), async () => {
    await delay(200);
    return HttpResponse.json(mockConfigVersions);
  }),

  http.post(url('/admin/config/versions'), async ({ request }) => {
    await delay(350);
    const actor = userFromAuthHeader(request);
    if (!actor) return HttpResponse.json({ message: 'Session expired.' }, { status: 401 });

    const body = (await request.json()) as Partial<
      Pick<AuditConfig, 'safety' | 'batch' | 'models' | 'enabledFindingTypes' | 'note'>
    >;
    if (!body.note?.trim()) {
      return HttpResponse.json({ message: 'A note is required to save a new version.' }, { status: 400 });
    }
    if (!body.safety || !body.batch || !body.models || !body.enabledFindingTypes) {
      return HttpResponse.json({ message: 'The configuration is incomplete.' }, { status: 400 });
    }

    const version = createConfigVersion(
      {
        safety: body.safety,
        batch: body.batch,
        models: body.models,
        enabledFindingTypes: body.enabledFindingTypes,
        note: body.note.trim(),
      },
      actor.name,
    );
    logAccessChange(actor.name, `Saved audit configuration v${version.version}: ${version.note}`);
    return HttpResponse.json(version, { status: 201 });
  }),

  http.get(url('/admin/scheduler'), async () => {
    await delay(200);
    return HttpResponse.json({ job: mockScheduledJob, runs: mockRuns });
  }),

  http.patch(url('/admin/scheduler/job'), async ({ request }) => {
    await delay(200);
    const { active } = (await request.json()) as { active?: boolean };
    if (typeof active === 'boolean') mockScheduledJob.active = active;
    return HttpResponse.json(mockScheduledJob);
  }),

  http.get(url('/runs'), async () => {
    await delay(200);
    return HttpResponse.json({ items: mockRuns, total: mockRuns.length });
  }),

  http.post(url('/runs'), async ({ request }) => {
    await delay(300);
    const actor = userFromAuthHeader(request);
    if (!actor) return HttpResponse.json({ message: 'Session expired.' }, { status: 401 });

    const run = createManualRun({ triggeredBy: actor.name });
    return HttpResponse.json(run, { status: 201 });
  }),

  http.post(url('/runs/:id/pause'), async ({ params }) => {
    await delay(200);
    const run = findRun(String(params.id));
    if (!run) return HttpResponse.json({ message: 'Run not found.' }, { status: 404 });
    if (run.status !== 'running') {
      return HttpResponse.json({ message: 'Only a running batch can be paused.' }, { status: 400 });
    }
    run.status = 'paused';
    return HttpResponse.json(run);
  }),

  http.post(url('/runs/:id/resume'), async ({ params }) => {
    await delay(200);
    const run = findRun(String(params.id));
    if (!run) return HttpResponse.json({ message: 'Run not found.' }, { status: 404 });
    if (run.status !== 'paused') {
      return HttpResponse.json({ message: 'Only a paused batch can be resumed.' }, { status: 400 });
    }
    run.status = 'running';
    return HttpResponse.json(run);
  }),
];
