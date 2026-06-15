# PRD: Session Doctor — diagnosis-to-fix loop for agent sessions

> Status: draft, not yet built. Source: brainstorm on an external prototype
> ("ng-console — Realtime Debugger", 2026-06-15). No issue tracker is configured
> for this project, so this PRD lives here pending a decision on where work is
> tracked. Not yet added to `HANDOFF` §5 open-work checklist.

## Problem Statement

When an agent session fails or degrades, today's path is: open Monitor ›
Sessions, see a row marked **Failed**, and... stop. There's no detail view.
Even if there were a transcript and a timeline, a builder still has to
mentally connect "what went wrong" to "which setting on the agent caused it
and how do I change it." That's the same kind of seam this whole project
exists to close (Console↔Studio wayfinding gap), just recreated *within*
Studio between Observe (Monitor) and Build (Agents).

## Solution

Add a session detail view (`/sessions/[id]`) whose centerpiece is a
**diagnosis-to-fix loop**: for a failed/degraded session, show a plain-English
verdict and narrative, a ranked list of findings (each with a root cause and a
suggested fix), and — where the fix is a config change — a direct link into
the relevant agent's edit screen, pre-scoped to the field that needs to
change. Pair this with a lightweight **config-drift indicator**: did the
agent's config change between when this session ran and now?

This turns a dead-end "Failed" badge into an actionable next step, directly
serving the north-star (Signup → First Agent Published) by reducing the
debug-loop friction that causes builders to abandon after a failed test.

## User Stories

1. As an agent builder, I want to click a failed session row, so that I can
   see what went wrong without leaving Monitor.
2. As an agent builder, I want a one-line verdict (Healthy / Warning / Failed)
   for a session, so that I can triage quickly across many sessions.
3. As an agent builder, I want a plain-English narrative summarizing all
   issues in a session, so that I don't have to read a raw event log to
   understand what happened.
4. As an agent builder, I want each issue ranked by severity (critical before
   warning), so that I address the most damaging problem first.
5. As an agent builder, I want each issue to show its root cause in plain
   language, so that I understand *why* it happened, not just *that* it
   happened.
6. As an agent builder, I want each issue to show a suggested fix, so that I
   know what to change without guessing.
7. As an agent builder, when a suggested fix is a config change, I want a
   button that jumps me directly to the relevant field on the agent's edit
   page, so that I can act immediately.
8. As an agent builder, I want to know if the agent's config has changed since
   this session ran, so that I can tell whether an issue is already fixed.
9. As an agent builder, when config has drifted, I want to see exactly which
   fields changed (old value → new value), so that I can confirm whether my
   fix addressed the diagnosed issue.
10. As an agent builder, when a session is healthy, I want an explicit
    checklist of what went right, so that a clean session isn't an empty page.
11. As an agent builder, I want to click an issue and have the related turn(s)
    highlighted in the session transcript, so that I can see the issue in
    context.
12. As an agent builder, I want to navigate from a session's diagnosis back to
    "Manage agent" for the agent involved, so that the loop closes without
    re-navigation through the sidebar.
13. As a team lead reviewing session history, I want failed sessions to
    visually stand out with their top issue summarized in the list view, so
    that I can spot patterns without opening each one.
14. As an agent builder, I want the diagnosis to cite specific numbers (e.g.
    "tool call exceeded 4.2s timeout") rather than vague language, so that I
    trust the suggested fix.
15. As an agent builder testing a fix, I want to re-run a session and compare
    its report to a prior session, so that I can confirm the issue is
    resolved (stretch — depends on #9).
16. As a new user who just connected their first agent, I want a failed first
    session to point me at the single most likely fix, so that I don't get
    stuck before ever seeing a successful turn.

## Implementation Decisions

### Modules

**1. `lib/session-diagnostics.ts` — diagnosis rule table (deep module)**

A pure, data-driven lookup from *issue type* → human-readable diagnosis. This
is the part of the prototype worth keeping almost verbatim — it's small,
pure, and the highest-leverage piece to get right.

```ts
type IssueType =
  | "barge-in" | "tool-fail" | "escalation" | "join-timeout"
  | "asr-fail" | "llm-spike" | "dead-air" | "asr-low"
  | "off-script" | "network"

interface Diagnosis {
  rootCause: string        // plain-English, cites specifics from the issue detail
  suggestedFix: string
  configLink?: {           // present when the fix is a config change
    agentId: string
    section: "persona" | "stack" | "knowledge" | "tools" | "escalation"
    field?: string         // for deep-linking to a specific input
  }
}

function diagnose(issue: SessionIssue, session: AgentSession): Diagnosis
```

Interface only — `diagnose()` is the single entry point the UI calls per
issue. Internally it's a lookup table (mirroring the prototype's `OBS_RX`)
keyed by issue type, with `rootCause`/`suggestedFix` strings interpolating
values from the specific issue (e.g. timeout duration, region, codec).

Note from the prototype: a hand-written rule table is fine for a mock-data
wireframe but is the long-term risk — if this ever runs against real
telemetry, `diagnose()` is the seam where a model-based diagnosis would
replace the lookup table without changing the UI contract.

**2. `lib/config-drift.ts` — config-drift comparator (deep module)**

```ts
interface ConfigSnapshot {
  version: string          // e.g. "v3.2" — opaque label, mock-only
  values: Record<string, unknown>  // flat key → value, scoped to AgentStack/Persona fields
}

interface ConfigDiffEntry {
  group: string   // e.g. "Stack", "Persona", "Escalation"
  key: string
  from: unknown
  to: unknown
}

function diffConfig(sessionSnapshot: ConfigSnapshot, currentConfig: ConfigSnapshot): ConfigDiffEntry[]
```

Returns `[]` when nothing changed (the "Config matches console" state). Pure
function, no UI dependencies — testable in isolation with fixture snapshots.

**3. `SessionDoctor` component (`components/session-doctor.tsx`)**

Renders the verdict header (Healthy/Warning/Failed + narrative), the ranked
findings list (each backed by `diagnose()`), and the config-drift summary
(backed by `diffConfig()`). Takes `session: AgentSession` and
`currentAgentConfig: ConfigSnapshot` as props — no data fetching, no routing
logic. This is the deep module on the UI side: one component, one job, easy
to drop into the new detail page.

**4. `/sessions/[id]/page.tsx` — session detail route (new)**

New dynamic route under the existing `sessions/` directory. Layout:
transcript/timeline (left or top, reusing existing patterns from
`agents/[id]/test`), `SessionDoctor` (right or below). "Manage agent" link
uses the existing `agents/[id]/edit` route; the `configLink.section` /
`configLink.field` from a `Diagnosis` should map to that page's existing tab
structure (confirm tab/anchor names against `agents/[id]/edit/page.tsx`
during implementation).

**5. Mock data extension (`lib/campaign-data.ts` or co-located in
`lib/session-data.ts`)**

The current `sessions/page.tsx` generates `AgentSession[]` with only
list-level fields (id, agent, startTime, duration, status). Extend with:
- `turns: Turn[]` — transcript entries, enough to support story #11
- `issues: SessionIssue[]` — typed per `IssueType` above, with severity and
  enough detail fields for `diagnose()` to interpolate from
- `configSnapshot: ConfigSnapshot` — the agent config *as of* this session,
  for `diffConfig()` against the agent's current config in `AGENTS`

Only failed/degraded sessions need populated `issues`/diffs; completed
sessions render the "all clear" checklist (story #10).

**6. Session list view update (`sessions/page.tsx`)**

Add a "Top issue" column/cell for Failed rows (story #13), sourced from
`diagnose(session.issues[0], session)`. Row click navigates to
`/sessions/[id]`.

### Cross-cutting decisions

- **RTC quality data (MOS, jitter, packet loss) is out of scope for v1's
  diagnosis set.** Per LEARNINGS, RTC session-quality telemetry belongs to
  Agora Analytics, a separate product, deliberately kept out of Monitor. The
  prototype's `network` issue type assumes access to this data. For v1,
  `IssueType` excludes `"network"`; revisit only if/when a decision is made to
  cross that boundary deliberately (flag in HANDOFF, don't default into it).
- **No real backend** — all of the above operates on mock data per project
  convention. `diagnose()` and `diffConfig()` are written as pure functions
  specifically so they have a clean seam if/when real telemetry arrives.
- **Analytics events** — add `session_detail_viewed` and
  `session_doctor_fix_clicked` to `lib/analytics.ts` (`Events`), following the
  existing `sessions_viewed` pattern.

## Testing Decisions

- A good test here verifies *behavior of the pure functions* — given an
  issue/snapshot, does `diagnose()`/`diffConfig()` return the right
  diagnosis/diff — not implementation details of how the UI renders them.
- **`lib/session-diagnostics.ts`** and **`lib/config-drift.ts`** are the
  modules to test: one fixture per `IssueType` for `diagnose()`, and a handful
  of snapshot pairs (no diff, single-field diff, multi-group diff) for
  `diffConfig()`.
- **No test infrastructure currently exists** in `studio-x/` (only
  `tsc --noEmit` and `next build` are run). Introducing tests for these two
  modules means adding a minimal runner (Vitest is the standard pairing with
  Next.js/Turbopack). This is a new addition to the project's verification
  story — confirm with the user before adding the dependency.
- UI components (`SessionDoctor`, the new route) follow existing project
  convention: verified via `pnpm tsc --noEmit` / `pnpm next build` and manual
  preview, not unit-tested.

## Out of Scope

- **Realtime "first-call" activation page** (connect → run session → trace
  report, from the prototype's `RealtimePage`). This duplicates ground already
  covered by Composer and Deploy › Code's existing quickstart flows. Not
  carried forward.
- **Barge-in/interrupt timeline visualizer** (`ObsInterrupt` in the
  prototype) — high build cost, narrow audience (only relevant when
  `barge-in` issues occur). Could be a future addition *inside* a finding's
  detail (e.g. "view interrupt timeline") but not part of v1.
- **STT confidence/ground-truth debugger** (`obsSttFor`) — same reasoning as
  above; niche diagnostic, not part of the core loop.
- **`"network"` issue type / RTC quality fusion** — see cross-cutting
  decisions above; excluded pending an explicit IA decision.
- **Re-run & compare sessions** (story #15) — depends on config-drift
  groundwork landing first; noted as a likely fast-follow, not v1.
- **Model-based diagnosis** (replacing the rule table with an LLM judge over
  session traces) — noted as the natural evolution of `diagnose()`, but no
  real telemetry exists yet to judge, so out of scope until there's a backend.

## Further Notes

- This PRD covers only the highest-value idea identified during the brainstorm
  on the external "ng-console — Realtime Debugger" prototype
  (`~/Downloads/ng-console - Realtime Debugger (standalone).html`). The
  prototype's `OBS_RX` table (10 issue types with root cause/fix copy) is
  useful prior art for writing `session-diagnostics.ts` copy, even though the
  network-dependent ones are excluded for v1.
- Once scoped/approved, add an entry to `HANDOFF-2026-06-02.md` §5 (open work)
  and a decision-log entry in `LEARNINGS.md` §20, per project convention.
- No issue tracker is configured for this repo — if one should be set up,
  that's a separate decision (`/setup-matt-pocock-skills` per the `/to-prd`
  skill, or otherwise).
