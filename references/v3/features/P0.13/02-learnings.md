# P0.13 Try the agent without counting the tries · Learnings

Research order (owner rule, 26 Sep): existing shots first, then vendor docs, then the built-in browser for this row's own before shots; Refero this session for the Figma explorations only. All shots are in `shots/`; `02-research.md` names each source and region. No vendor reaches Done: none keeps a live test out of its own counts or its bill, so learnings 1 to 3 are anti-patterns to avoid and learnings 4 to 6 are original work on the Console's own surfaces.

## 1. A typed label is not a flag

- Retell's Call History shows two rows named "Manual audio music rollout test" with real costs, $0.340 and $0.181, in the same table as production (`retell-01-call-history-channel-type.png`, region 1016,954,1128,166). The name is the only marker, and it changes nothing.
- Vapi's Web type is a real badge on the row, and the row is billed and counted like every other (`vapi-02-logs-web-type-ended-reason.png`, region 2336,741,480,32).
- **The Test tag comes from a system fact, the session id Studio stored at the 201, never from anything Sam types, and the tag is only shown where the count actually excludes it.**

## 2. A default that silently counts is worse than no control

- LiveKit's Console dispatch sheet has a Deployment field, "Leave as production to dispatch to the production deployment" (`livekit-01-console-non-production-deployment.png`, region 2248,1341,901,160): one forgotten dropdown makes a test a production session.
- Sentry hides an environment from the UI and says in its own docs that its events "will still count against your quota" (`sentry-01-hidden-env-still-counts-quota.png`, region 646,408,1914,67): a cosmetic exclusion.
- **No mode, no toggle, no environment picker. Every session Studio starts is a test by construction, and the exclusion happens in the count, not in the view.**

## 3. Type is a first-order facet beside the list, and separation is structural

- Vapi puts Call Types as a top-of-table filter next to Assistants and Phone Numbers (`vapi-01-call-logs-type-column.png`, region 1856,1016,208,72); Retell keeps a Channel Type column (`retell-01`).
- ElevenLabs keeps its Tests in their own navigation item, never in Conversation history (`elevenlabs-02-tests-tab-separate-framework.png`, region 1568,704,576,352); LiveKit separates by deployment and its Sessions table has no test column at all (`livekit-02-sessions-list-no-test-flag.png`, region 501,864,2667,160).
- **Production is the default list; tests sit behind one named door beside it, "Your tests (n)", and carry the tag on the row so the same row reads the same in P2.1's unified list.**

## 4. Our own page says nothing about where a test lands

- The Overview's Test button sits next to a Sessions tile reading 1,284 and a Recent sessions table, and nothing says whether the test will land in either (`before-01-agent-overview.png`, region 2792,131,152,50).
- The idle panel reads "Talk to the agent with your microphone." and nothing else (`before-02-test-panel.png`, region 2472,48,704,144).
- **One sentence where Sam decides, "Tests stay out of the agent's numbers.", and one (i) on the tile that says the same and adds that the minutes still count in Usage, because test minutes are billed (funnel stage 16). Nothing says free.**

## 5. The only proof is the stored id, so the store must outlive the browser

- No vendor stores a test's identity anywhere a developer could lose (research gap 2); the v3 API returns neither `client_reference` nor the transport, and its list row is `start_ts, status, agent_id` only (`references/api/v3/openapi-3.0.0-2026-09-24.json`).
- The Console already keeps Studio objects server side per app (agents with `properties`, versions, credentials, knowledge bases, MCP servers), so a `studio_tests` object beside them is the natural home.
- **The registry is written at the 201, before the channel join, and lives in the Console backend; until that object exists the browser holds it and rainy f is shown honestly, not hidden.**

## 6. What Studio sent must be readable by a developer

- Resend's log inspector shows the request, the response and a status badge for one call (Refero `380e1f12-51ed-44da-b049-6014aa7f77c2`, dark `cf561511-960a-4de5-8eb5-5772d669db1c`); P0.3 already gave the Console the same door, View last save, and P0.7 listed `POST /sessions` in it.
- The Console's sanitiser drops every key it does not know and every array (`src/lib/observability/sanitize.ts`), and its identity gate classifies preview traffic as external unless told otherwise (`identity.ts`).
- **View last save grows two kinds of entry, what Studio kept and what it sent, so rainy b, c, d, e and g are each visible in the one door that already exists, without a new surface.**
