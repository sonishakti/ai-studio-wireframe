# P0.13 · Try the agent without counting the tries — Research

## Rule 0, data first
(a) A brand-new Studio account shows none of this: no agents, no sessions, no test history. Sam has to create an agent and press **Test** to produce anything, and today nothing on that path — the agent header, the Sessions KPI tile, the Recent sessions table, or the Test panel itself — marks the resulting session as a test anywhere (`shots/before-01-agent-overview.png`, `before-02-test-panel.png`).
(b) It does not exist, complete, in any signed-in competitor account either. Vapi, Retell and ElevenLabs bill and count a live trial/web call exactly like a production one (Retell's own docs and a billing-complaint thread are direct proof, see below). LiveKit is the only vendor with a real isolation mechanism — a non-production deployment target — but it is opt-in, defaults to production, and still rolls its usage into the same bill. Sentry, researched as the indirect pick for this row's "environments" angle, explicitly documents that hiding a non-production environment does **not** stop its events from counting against quota. No vendor ships the thing this JTBD needs: a durable, client-stored test id that keeps a session out of both the count and the bill.
(c) Our own prototype fixtures need: one agent whose Test flow, once run, produces a session that (i) shows a **Test** tag in the agent's session list, distinct from a status/outcome tick, (ii) is excluded from the Sessions/Success/Response KPI tiles on Overview (or the tiles show a "counted" vs "excluded" split), and (iii) survives a simulated cleared-browser state, i.e. the tag comes from something other than local-only client state. A second fixture should cover the consent-declined fallback (KPI counter still reads stages 3/5/9 from server events) and a third a "preview/local traffic" case for rainy b.

## Vendor status

| Vendor | Status | Sources |
|---|---|---|
| Vapi | Partial | Product (logged-in, `vapi-02`) + docs (`vapi-01`). Call Types filter and a Web type exist; no billing/count exclusion found for any type. |
| Retell | Partial | Docs (`retell-01`) + community support thread. Channel Type column (`web_call` vs `phone_call`); direct evidence a self-labelled "test" call is billed at full per-minute rate, no system test flag. |
| ElevenLabs | Partial | Product (logged-in, `elevenlabs-01`, `elevenlabs-02`) + docs (Agent Testing, Simulate Conversation). Pre-deploy "Tests" are a separate framework from Conversation history; a live trial call is not addressed. |
| LiveKit | Partial | Product (logged-in, `livekit-01`, `livekit-02`) + LiveKit blog (staging deployments). Non-production deployment target exists, defaults to production, usage still bills to the same project. |
| Sentry (indirect) | Done for this row's angle | Docs (`sentry-01`, environments + inbound filters). Environment tag/hide does not exclude from quota; inbound filters drop events pre-quota but ship with no built-in environment rule. |

No vendor reaches "Done": the specific mechanism this JTBD needs (test traffic held out of both the count and the bill, via a durable id) has no full precedent anywhere researched.

## Shots

| File | Source | Happy/Rainy | Finding | Region (x,y,w,h) |
|---|---|---|---|---|
| `shots/before-01-agent-overview.png` | existing (our prototype, captured this session) | happy (P0.13.a) | The agent's Overview already has a **Test** button beside New run, but the Sessions tile (1,284) and Recent sessions table it sits next to carry no hint that a test would, or wouldn't, land in either. | 2792,131,152,50 |
| `shots/before-02-test-panel.png` | existing (our prototype, captured this session) | happy (P0.13.a) / rainy (P0.13.f) | The Test sheet ("Talk to the agent with your microphone" → Start test call) has no consent notice, no mention that a session id is being stored, and no visible link to where that id would live if the browser is cleared. | 2472,48,704,144 |
| `shots/vapi-01-call-logs-type-column.png` | docs | happy | Vapi's Calls tab ships **Call Types** as a first-class filter facet alongside Assistants/Squads/Phone Numbers, proving type is worth surfacing as a top-of-table filter, not just a row badge. | 1856,1016,208,72 |
| `shots/vapi-02-logs-web-type-ended-reason.png` | existing (logged-in product) | happy | A real Web-type call shows a `Web` badge in the Type column and an `Ended Reason` pill, but the row is otherwise a normal billed call — no separate count or cost treatment for the Web/test type. | 2336,741,480,32 |
| `shots/retell-01-call-history-channel-type.png` | docs | rainy (maps to P0.13.b, the "traffic that should be classified as non-production" problem) | Two rows an operator named "Manual audio music rollout test" carry real costs, $0.340 and $0.181 — a human-readable label is the only "test" marker Retell offers, and it does not stop billing. | 1016,954,1128,166 |
| `shots/elevenlabs-01-conversation-history-list.png` | existing (logged-in product) | happy | Conversation history's columns (Agent, Title, Date, Duration, Messages, Evaluation) have no Test column or filter at all. | 653,493,2403,51 |
| `shots/elevenlabs-02-tests-tab-separate-framework.png` | existing (logged-in product) | happy | ElevenLabs' "Tests" (Simulation/Next Reply/Tool Call) live in an entirely separate nav item from Conversations — a test never touches the production list, but only because it never calls the live runtime the same way; a real trial call still would. | 1568,704,576,352 |
| `shots/livekit-01-console-non-production-deployment.png` | existing (logged-in product) | rainy (P0.13.b, direct precedent) | The Console's own dispatch sheet has a **Deployment** field that "Leave[s] as production to dispatch to the production deployment" — production is the default, and picking non-production is one opt-in dropdown a developer can forget. | 2248,1341,901,160 |
| `shots/livekit-02-sessions-list-no-test-flag.png` | existing (logged-in product) | happy | Even LiveKit's own Sessions table (Session ID, Room, Started, Ended, Duration, Participants, Features, Status) has no Test column — separation happens only by which deployment a session was dispatched to, never a flag in the row itself. | 501,864,2667,160 |
| `shots/sentry-01-hidden-env-still-counts-quota.png` | docs | rainy (P0.13.b/c, the anti-pattern to avoid) | Sentry's own docs state plainly: hiding an environment from the UI "will still count against your quota" — the closest mainstream analogue to Console's problem ships as UI-only cosmetics, not real exclusion. | 646,408,1914,67 |

## Copy / avoid, per vendor

**Vapi** — Copy: a named, top-of-table **Call Types** filter (not just a column) makes "what kind of call was this" a first-order query, worth doing for Test alongside Inbound/Batch/Code. Avoid: a Type badge with no consumption distinction lets people believe separation exists when every type, Web included, is billed and counted the same.

**Retell** — Copy: letting an operator name a call/agent freely (so "test" runs are at least greppable) is better than nothing. Avoid: prose is not a system flag — the community thread ("Text Testing Add-on I am being billed for", ~$300/month, no toggle to disable) is the exact failure P0.13 must not repeat: a user testing in good faith gets billed as if it were production, with support's only advice being "stop testing or use a cheaper model."

**ElevenLabs** — Copy: keeping pre-deploy simulation testing (Simulation/Next Reply/Tool Call) in its own nav area, never mixed into the live list, is a clean way to guarantee one class of test never pollutes production data. Avoid: that separation is structural for simulated tests only; it says nothing about a real "talk to the agent" trial call, which is exactly Studio's Test button and exactly what P0.13 must tag.

**LiveKit** — Copy: making "non-production deployment" a first-class, named object a developer dispatches to (not a boolean toggle) is close to the mental model Studio needs for `client_reference: studio_test:`. Avoid: defaulting the dispatch target to production, and leaving the Sessions list with no flag either, means a forgotten dropdown silently produces a production-counted test — precisely rainy P0.13.b.

**Sentry (indirect)** — Copy: Inbound Filters run server-side, at ingest, before an event can consume quota — the right place in a pipeline to keep test traffic out, and the same spirit as P0.13.c's sanitiser/allowlist. Avoid: Sentry ships no built-in environment-based inbound filter; teams hand-roll one via IP-address or release-glob rules, or an SDK `beforeSend` hook. Console should not repeat this gap — build the studio_test exclusion as a first-class filter, not a workaround developers have to invent per project.

## Gaps
- No vendor researched excludes a live test/trial call from billing or from its own production call/session count; this JTBD has no full external precedent to port, only anti-patterns to avoid (Retell's billed "test" calls, Sentry's quota-counted hidden environments).
- No vendor stores a test session's id anywhere durable enough to survive a cleared browser (rainy P0.13.f) — LiveKit's isolation is by infrastructure target, not a stored client id, so it doesn't transfer as a pattern for this specific rainy path.
- The consent-declined fallback (rainy P0.13.g: server events still cover stages 3/5/9, report the measured share) has no vendor UI precedent found; it's an Agora analytics-pipeline design problem, not a portable interface pattern.
- The gateway emitter gap (rainy P0.13.d) and the session/agent id-format mismatch (rainy P0.13.e) are internal to the v3 API and event pipeline; already tracked in `more.api` and `more.req`, no external research applies.
- ElevenLabs' own billing/test-minute treatment (does a Simulation or Next Reply test ever touch the ElevenAgents minute allocation) was not confirmed by docs; flagged Partial rather than Done for that reason.
