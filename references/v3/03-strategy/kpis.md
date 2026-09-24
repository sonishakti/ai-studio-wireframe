# v3 KPIs · one north star, four pillars, counter-metrics

Builds on `docs/strategy/agent-builder-kpis.md` (15 Sep): the north star **Fast Proven Agents** and its build-side
inputs (TTFA, VTR, SBDR, SAR) stay. v3 adds the two things that file could not see: what happens after go-live
(Operate) and how fast a person can find and explain one bad call (Observe). Every number is a target to validate,
not a measurement. **Nothing here is instrumented yet**; section 5 lists what must exist first.

## 1. Why the frame changes in v3

Vineet, 24 Sep: "An agent is not just a configuration. An agent is also what is happening in the real world." And:
"benchmarks are moving from latency to how efficiently this solves the task at hand." Agora is "becoming an
inference company" billed per minute, so revenue follows **agents that stay in production and keep taking calls**,
not agents created. The design job is to shorten three loops:

1. **Build loop**: idea → hearing the agent answer (TTFA, owned by the builder).
2. **Trust loop**: live agent → knowing it works, from its own numbers (owned by the agent page).
3. **Fix loop**: a bad call → the reason → a change → proof the change helped (owned by session history + agent page).

## 2. North star (unchanged)

**Fast-Proven Rate (FPR)**: share of agents created in week W that reach a verified first answer within 15 active
minutes **and** hold a proven conversation within 14 days. Target ≥ 45 %. Read at W−2.

Companion for v3, reported next to it, no target yet:

**Retained Production Agents (RPA)**: agents with ≥ 20 non-test sessions in each of the last 4 weeks. This is the
line the per-minute business actually earns on; FPR predicts it.

## 3. Inputs by pillar

| Pillar | Metric | Definition | Target (to validate) | Counter-metric |
|---|---|---|---|---|
| Build | TTFA | Active time from builder open to first heard answer, median / p75 | ≤ 3 min / ≤ 6 min | VTR must not fall |
| Build | Preset keep rate | Share of new agents that go live on a preset without opening Custom | ≥ 70 % | Custom abandoned-unsaved rate ≤ 10 % |
| Build | Inline secret success | Keys pasted in the builder that save without leaving the page | ≥ 95 % | Secrets page visits per new agent |
| Operate | Agent page return rate | Accounts with a live agent that open its page on ≥ 3 distinct days in 14 | ≥ 40 % | Time on page without an action (vanity dwell) |
| Operate | Analysis coverage | Live agents with ≥ 1 analysis field defined | ≥ 60 % | Fields defined but never viewed |
| Operate | Error acknowledgement time | Median time from the first error on an agent to its first view in Logs | ≤ 24 h | Errors still open at 7 days |
| Observe | Time to the call | Median time from opening session history to opening the session the user came for (session opened, then shared, downloaded, or talked-to within 2 min) | ≤ 60 s | Sessions opened then abandoned in < 5 s (misses) |
| Observe | Filter-to-metric use | Share of agent-page visits where a filter changes the metrics | ≥ 30 % | Filters reset within 10 s |
| Observe | Deep-link shares | Sessions or runs shared by link per 100 active accounts per week | tracked | Support tickets without a session link |
| Fix loop | Change-after-diagnosis | Share of error or low-score investigations followed by an agent edit within 24 h, and the edited agent's next-7-day analysis score vs previous 7 | tracked, then target | Edits reverted within 24 h |

## 4. Guardrails the design must keep

- **No vanity tiles.** Every number on the agent page answers "should I change something?" and opens the sessions
  behind it. A tile that cannot drill down does not ship.
- **Session history never aggregates** (owner rule). Totals and averages live on the agent.
- **Zero-retention sessions are counted, never hidden**: count and cost always, content never.
- **Ephemeral sessions** are listed but excluded from every agent aggregate.
- **Override-aware** (future): sessions with overrides are a separate series, never silently averaged in.

## 5. What must exist before any of this is measurable

| Need | Owner | Blocks |
|---|---|---|
| A session list with agent filter, time range, status and pagination beyond 2 h | API | Observe metrics, agent page lists |
| Session summary (latency legs, billable minutes, turn count) and analysis results | API (deferred past launch) | Agent page analytics, trust loop |
| Error stream from RTM exposed to the Console per session | Engine / Vineet | Logs tab, badge, error ack time |
| Browser events for page opens, filters, shares, talk-to-agent | Design + FE (PostHog schema 2.1.0) | All Operate and Observe inputs |
| Server-side first-turn event | Backend | FPR moves from provisional to real |
