# Studio v3 · team page

v3 launch mid-Oct 2026. One board, one funnel, one set of words. Full tracker: https://claude.ai/artifact/6YZCRsJvpoBthj4fnm9XAb

## The rule

| Stage | Event | Means | UI word |
|---|---|---|---|
| 7 Integration | `app_connected` | MCP server, tool, knowledge base give the agent context or actions | integration |
| 9 Deployment | `channel_connected` | inbound number, batch run or code session reaches the agent | deployment · Go live |

## v3 funnel

| # | Event | Stage | Group | By | Gate |
|---|---|---|---|---|---|
| 1 | `account_created` | Signed up | Evaluation | server | required |
| 2 | `project_created` | Project ready | Evaluation | server | required |
| 3 | `agent_created` | Agent created | Adoption | server | required |
| 4 | `agent_tested_baseline` · **Aha 1** | First answer, preset untouched | Evaluation | client | optional |
| 5 | `agent_configured` | Agent configured | Configuration | derived | required |
| 6 | `byok_enabled` | BYOK on | Configuration | server | optional |
| 7 | `app_connected` | Integration attached | Integration | server | optional |
| 8 | `agent_tested_configured` · **Aha 2** | First answer, own agent | Configuration | client | required |
| 9 | `channel_connected` | Deployment on | Deployment | server | required |
| 10 | `agent_answered_production` · **Aha 3** | First production answer | Production | derived | required |
| 11 | `agent_proven` · **Proof** | First proven session | Production | derived | required |
| 12 | `session_reviewed` | Production session opened | Operate | client | optional |
| 13 | `card_added` | Card added | Conversion | server | required |
| 14 | `account_suspended` | Suspended | Risk | server | branch |
| 15 | `account_reactivated` | Reactivated | Recovery | server | branch |
| 16 | `first_paid_minute` | First paid minute | Monetization | server | required |
| 17 | `sustained_usage_30d` | Sustained usage | Retention | derived | required |

## KPIs

| KPI | Target | Phase |
|---|---|---|
| Fast-Proven Rate (FPR), north star | ≥ 18 % of console-created saved agents per weekly cohort, read 14 d after the cohort week; validate against a 2-week W0 baseline. 45 % only with the raised inputs in the FPR decision. | P0 |
| TTFA, time to first answer | Median ≤ 3 min, p75 ≤ 6 min | P0 |
| TTFDA, time to first deployed answer | Active part median ≤ 2× TTFA median (≤ 6 min), p75 ≤ 12 min. Wall-clock part median: inbound ≤ 10 min; batch ≤ 15 min; code snippet to first session ≤ 30 min. | P0 |
| Test before Go live | ≥ 85 % absolute floor | P0 |
| Create completion | ≥ 90 % of create sheet opens | P0 |
| Preset keep rate | ≥ 70 % | P0 |
| BYOK key works | ≥ 90 % | P0 |
| Tested integration rate | ≥ 60 % | P0 |
| Integration value (assumption) | Agents with an integration reach agent_proven at ≥ 1.3× (14 d read) and RPA at ≥ 1.5× (60 d read) the rate of agents without; kill below 1.1× at 14 d | P0 |
| Go live rate | ≥ 60 % within 7 d of the first configured test; batch ≥ 70 % | P0 |
| Proven after production answer | ≥ 65 % by day 14 of create (inbound, code) | P1 |
| SAR, second-agent rate | ≥ 25 % of accounts at agent_proven create a second agent ≤ 28 d | P1 |
| Error acknowledgement time | Median ≤ 24 h | P1 |
| Error badge follow-through | ≥ 50 % of agent page visits with an open error group | P1 |
| Talk to agent follow-through | ≥ 40 % of Talk to agent sessions | P1 |
| Card before exhaustion | ≥ 50 % of warned accounts | P1 |
| Suspension recovery | ≥ 60 % reactivated ≤ 24 h | P1 |
| Free to paid | ≥ 25 % of accounts at agent_proven within 30 d (to validate) | P1 |
| Retained Production Agents (RPA) | ≥ 25 % of agents at agent_proven retained within 60 d (to validate) | P1 |
| Sustained usage | ≥ 35 % of paying accounts (to validate); observed, no v3 feature moves it | P1 |
| Time to the session | Median ≤ 60 s | P2 |
| Change after diagnosis | ≥ 30 % within 24 h (to validate) | P2 |
| Honest rows | Listed session minutes = invoiced minutes ± 1 %, monthly | P2 |
| API parity | 100 % of 201 spec leaf fields settable in Console or on the approved API-only list with a reason; renames only Analysis and run | P3 |
| Unassigned numbers | 0 numbers without inbound.agent for > 7 d, excluding numbers used as a run's from number in the last 30 d | P3 |
| Safe secret replace | Agents broken by a secret replace = 0 | P3 |

## Journeys

| ID | Type | Journey | KPI |
|---|---|---|---|
| IN | hero | Inbound: a number reaches the agent | TTFDA inbound: active part (builder_opened to go_live_clicked) median ≤ 6 min, ≤ 2× TTFA; wall clock channel_connected to agent_answered_production median ≤ 10 min |
| ST | rainy | Inbound rainy: no number at Go live, then silence | Stalled deployments: stage 9 with no stage 10 within 3 d ≤ 20 % (counter: unassigned numbers for > 7 d = 0) |
| BA | hero | Batch: a run dials a contact list | Go live rate, batch ≥ 70 % within 7 d of the first configured test; TTFDA batch wall clock Campaign.started_at to first answer median ≤ 15 min |
| RK | rainy | Batch rainy: free minutes run out mid-run | Suspension recovery ≥ 60 % reactivated ≤ 24 h (counter: no production session in 30 d after reactivation ≤ 10 %) |
| CO | hero | Code: the customer's software starts sessions | Snippet to first session: code_snippet_copied to channel_connected {code} median ≤ 30 min wall clock |
| CO-R | rainy | Code rainy: the first session fails | Recovered first session: ≥ 70 % of agents whose first POST /sessions failed reach agent_answered_production {code} ≤ 24 h (to validate) |
| EP | hero | Ephemeral: API-only, no saved agent | Honest rows: listed session minutes = invoiced minutes ± 1 %, monthly |
| EP-R | rainy | Ephemeral rainy: failed session, nowhere to look | Time to the session: history_opened to session_opened then acted on ≤ 2 min, median ≤ 60 s (counter: misses ≤ 20 %) |
| FX | hero | Fix loop: error, diagnose, fix, confirm | Change after diagnosis ≥ 30 % of session_reviewed on a failed session lead to agent_updated ≤ 24 h (to validate; counter: reverted ≤ 24 h ≤ 10 %) |
| FX-R | rainy | Fix rainy: stream down, content not stored, BYOK key revoked | Safe secret replace: agents broken by a secret replace = 0; error acknowledgement median ≤ 24 h |
| INT | hero | Integration: attach an MCP server or tool | Tested integration rate ≥ 60 %: integration_added then agent_audio_heard on the same agent within 24 h |
| INT-R | rainy | Integration rainy: saved, not working | Production sessions with an integration error ≤ 2 % (blocked on the RTM stream); counter: integrations removed ≤ 24 h ≤ 15 % |

## Features

| ID | Feature | KPI | Funnel | Days |
|---|---|---|---|---|
| P0.1 | Create agent with deployment type | Create completion ≥ 90 % of create_sheet_opened | 3 | 0.125 |
| P0.2 | Presets: Lowest latency, Balanced, Custom | Preset keep rate ≥ 70 % of channel_connected {source console} | 3, 4, 5 | 0.5 |
| P0.3 | One Advanced panel | Advanced change followed by a heard test answer in the same builder session ≥ 60 % | 5 | 0.25 |
| P0.4 | Prompt first, greeting behind one door | Stage 5 reach ≥ 80 % of agent_created {source console} within 14 d | 5 | 0.125 |
| P0.5 | Integrations: MCP servers, tools, knowledge base | Tested integration rate ≥ 60 % (integration_added, then agent_audio_heard on the same agent ≤ 24 h) | 7 | 0.375 |
| P0.6 | Inline secrets (BYOK) | BYOK key works ≥ 90 % (secret_saved {entryPoint: builder}, then the next test with no byok_key_failed for that module) | 6 | 0.125 |
| P0.7 | Test panel: save and test | TTFA median ≤ 3 min, p75 ≤ 6 min (source console) | 4, 8 | 0.125 |
| P0.8 | Deployment area: readiness and data policy | Test before Go live ≥ 85 % of channel_connected {source console} | 9 | 0.125 |
| P0.9 | Go live, inbound | TTFDA inbound: active part median ≤ 6 min (≤ 2× TTFA); wall clock to first answer median ≤ 10 min | 9, 10, 11 | 0.25 |
| P0.10 | Go live, batch: runs | Go live rate, batch ≥ 70 % within 7 d of the first configured test | 9, 10 | 0.25 |
| P0.11 | Go live, code: session snippet | Snippet to first session: code_snippet_copied to channel_connected {code} median ≤ 30 min wall clock | 9, 10 | 0.125 |
| P0.12 | Delight pass | Go live confidence ≥ 4.0 / 5 mean (one question after the first channel_connected) | 8, 9 | 0.125 |
| P0.13 | Builder telemetry and test tag | Event completeness ≥ 98 % (Studio agent_created with a builder_opened; Studio tests with a stored id) | 3 | 0.25 |
| P1.1 | Agent header and error badge | Error badge follow-through ≥ 50 % of agent page visits with an open error group reach error_group_opened in that visit | 12 | 0.25 |
| P1.2 | Running now and Talk to agent | Talk to agent follow-through ≥ 40 % (agent_updated or error_group_quiet on that agent ≤ 24 h) | 8, 12 | 0.5 |
| P1.3 | Analytics tab (day-one counts) | Tile to session ≥ 40 % of tile_clicked followed by session_opened in the same visit | 12 | 0.25 |
| P1.4 | Logs and diagnostics tab | Error acknowledgement time median ≤ 24 h | 12 | 0.5 |
| P1.5 | Agents list cues | Rows with errors opened within 24 h ≥ 50 % | 3, 9 | 0.25 |
| P1.6 | Runs panel for batch agents | Bad runs (≥ 20 % contacts failed) paused or canceled before half the list ≥ 60 % | 10 | 0.25 |
| P1.7 | Free minutes, suspension and reactivation | Card before exhaustion ≥ 50 % of warned accounts; suspension recovery ≥ 60 % within 24 h | 13, 14, 15, 16, 17 | 0.25 |
| P1.8 | Deployment status and first-week states | Proven after production answer ≥ 65 % by day 14 of create (inbound, code) | 9, 10, 11, 17 | 0.25 |
| P1.9 | Analysis definition | Analysis coverage: tracked, no target until results ship (agents at channel_connected with ≥ 1 field) | — | 0.25 |
| P2.1 | One session history | Time to the session median ≤ 60 s (history_opened to session_opened, then acted on ≤ 2 min) | 12 | 0.5 |
| P2.2 | Search, facets, time range and saved views | Filtered find rate ≥ 60 % of history visits with a search or filter reach session_opened within 2 min (to validate) | 12 | 0.75 |
| P2.3 | Session detail by transport | Change after diagnosis ≥ 30 % of session_reviewed on a failed session lead to agent_updated within 24 h (to validate) | 8, 12 | 1 |
| P2.4 | Full screen, share link, download, export | Session tickets carrying a session link ≥ 60 % within 4 weeks of launch | 12 | 0.25 |
| P2.5 | Run page with its sessions | Runs with ≥ 1 failed contact opened within 24 h ≥ 70 % (to validate) | 10, 12 | 0.25 |
| P2.6 | Zero-retention and ephemeral rows | Honest rows: listed session minutes = invoiced minutes ± 1 %, monthly | 9, 16 | 0.5 |
| P2.7 | First-run, no-deployment and suspended states | ≥ 30 % of first-run history views click Talk to agent or Go live in the same visit (to validate) | 8, 9, 14 | 0.25 |
| P3.1 | Secrets page | Safe secret replace: agents broken by a secret replace = 0 (provider-auth failures ≤ 24 h after PUT on agents in labels.studio_secret_sets); API-created agents reported as unknown coverage | — | 0.5 |
| P3.2 | Numbers page | Unassigned numbers: 0 numbers without inbound.agent for > 7 d, excluding run from numbers used in 30 d | 9 | 0.5 |
| P3.3 | Number call policy | Cut-off inbound sessions (duration within 2 s of max_call_duration_seconds) ≤ 5 % (needs session_ended with number id, G2) | 10 | 0.25 |
| P3.4 | Integrations page (derived inventory) | Reuse rate ≥ 30 % of accounts with ≥ 2 agents attach the same MCP endpoint or tool URL to 2+ agents in 30 d | 7 | 0.25 |
| P3.5 | API parity: Create an agent, Start a session, Go live | API parity: 100 % of 201 spec leaf fields settable in Console or on the approved API-only list with a reason; renames only Analysis and run, API word in a tooltip | 5, 6, 7, 9 | 0.75 |
| P3.6 | Terminology sweep | Banned words in Console UI strings = 0 (CI lint with a compound allowlist, tested on current i18n files first) | 7, 9 | 0.25 |

## One feature, one week

JTBD → research (≥ 4 vendors + internal docs) → learnings → before/after → diverge 3–5 → prototype happy + rainy → review → Figma frozen + FE handoff. Figma is the record; agents never rewrite a reviewed flow.

## Server gaps

| Gap | Missing |
|---|---|
| G1 | the v3 spec has no webhooks or event endpoints. An API gateway to PostHog emitter for POST and PATCH /agents, /numbers, /campaigns, /sessions and /sessions/ephemeral, plus session_create_failed, has no owner. Until it ships Console-originated stages use operation_succeeded twins; API and EP journeys are unmeasured. |
| G2 | session_ended {agent_id, agent_session_id, origin, transport, direction, duration_s, status, end_reason, turn_count, caller_is_creator} has no owner. Until it ships stages 10 and 11 for inbound and code, TTFDA wall clock, error acknowledgement and the P3.3 cut-off KPI are unmeasurable. |
| G3 | notif 112, 201, 202 emitter unbuilt; Aha 1 and Aha 2 stay client-only. |
| G4 | SessionListItem returns start_ts, status, agent_id only; Session has agent_name, not agent_id. Rows cannot open detail, so stage 12 fires only from deep links and Studio-stored ids. |
| G5 | client_reference and data_policy are never returned. Studio stores the ids of sessions it starts; origin, retention and agentSource are sent as unknown otherwise. |
| G6 | no integration health (no MCP handshake field, no tool execution log). app_connected means saved; errors need the RTM stream. $secrets in integration headers is undocumented. |
| G7 | data_policy exists only on session create; zero retention shows disabled with the reason on inbound and batch. |
| G8 | session lifecycle (idle_timeout_ms default 30000, max_duration_ms, graceful_stop) exists on sessions and runs, not on agents or numbers; inbound has no home for it. |
| G9 | billing stages 13 to 17 sit outside the v3 API with no emitter; first_paid_minute must carry agent_session_id. |

## Decisions that block dates

| # | Decision | Owner | By |
|---|---|---|---|
| 1 | Freeze event keys app_connected and channel_connected (UI says integration and deployment), or rename them in the next schema bump? | Vineet | Mon 28 Sep |
| 2 | FPR target: 18 % with the inputs as set, or 45 % (needs fast test ≥ 75 %, Go live ≥ 80 %, answered ≥ 90 %, proven ≥ 85 %)? | Vineet and Samyak | Mon 28 Sep |
| 3 | Is the knowledge base in the v3 spec at launch? Until yes, integration_type kb stays reserved and the P0.5 row stays behind a flag. | Vineet with API team | Mon 28 Sep |
| 4 | Add a purpose field (test, dev, production) to SessionCreate and return it on reads, or capture client_reference server-side? | API team via Vineet | Mon 28 Sep |
| 5 | Confirm the join key: SessionListItem.agent_id (32 lowercase) vs Agent.id (agent_ prefix). | API team via Vineet | Mon 28 Sep |
| 6 | Add data_policy to Number.inbound and Campaign before launch, and is zero retention allowed on batch? Until then the control shows disabled with the reason. | Vineet with API team | Mon 28 Sep |
| 7 | Presets: two (Lowest latency, Balanced) plus Custom, with 'preset' locked over the review's 'tiers'? | Vineet | Mon 28 Sep |
| 8 | Stage 5 counts instructions, greeting or a model only (voice alone, Advanced tuning and deployment never); text simulation never counts toward any Aha. | Vineet | Mon 28 Sep |
| 9 | Stage order: agent_created before the baseline test and app_connected before Aha 2; no ephemeral test of an unsaved preset. | Vineet | Mon 28 Sep |
| 10 | Move Analysis definition from P0 to P1.9 (register row 15 is P1; results API deferred) to fund P0.13 telemetry? | Vineet and Samyak | Mon 28 Sep |
| 11 | Does $secrets.<set>.<key> work in McpServer.headers and FunctionToolServer.headers? | API team via Vineet | Mon 28 Sep |
| 12 | Secrets: per-key PATCH, or one set per module key as designed; does PUT refuse dropping a referenced key; add a structured used_by? | API team via Vineet | Mon 28 Sep |
| 13 | Which RTM or NCS error types exist per session, and their shape? | Vineet | Wed 30 Sep |
| 14 | Add agent_session_id, ended_at, transport, direction, origin, data_policy.retention and billable_seconds to SessionListItem; agent_id to Session; list filters agent_id, campaign_id, origin, transport, retention. | API team via Vineet | Thu 1 Oct |
| 15 | Day-one source per block (transcript, analysis, events, logs, latency): v2 pipeline or 'Arrives with session analytics'? | Vineet | Thu 1 Oct |
| 16 | Free minutes allowance, the 80 % warning, what callers hear when suspended, and run behaviour (proposed: status paused, reason suspended, manual Resume). | Vineet (names billing owner) | Thu 1 Oct |
| 17 | Pricing: flat 10¢/min or 5¢ managed with BYOK lower? Decides price copy and whether plan_selected returns. | Vineet and Samyak | Thu 1 Oct |
| 18 | Campaign level above runs: drop for v3 (rows 8 and 47 stay partial) or UI-only grouping by label? | Vineet | Thu 1 Oct |
| 19 | Label for sessions happening now: Running now (locked word running) instead of live sessions? | Vineet | Thu 1 Oct |
| 20 | Restore SAR (≥ 25 % second agent within 28 d of agent_proven) as a P1 KPI? | Vineet and Samyak | Thu 1 Oct |
| 21 | App integrations (HubSpot) and current Console knowledge bases: migrate, read-only or retire in v3? WhatsApp leaves the Integrations catalog. | Vineet | Thu 1 Oct |
| 22 | Name an engineering owner and ship date for the API gateway emitter (G1) and session_ended (G2). | Vineet | Fri 2 Oct |
| 23 | Name the billing emitter owner for stages 13 to 17; first_paid_minute must carry agent_session_id. | Vineet | Fri 2 Oct |
| 24 | Ephemeral sessions count at account level only, never agent stages, FPR or RPA; default history scope is all origins; share links reach project members only. | Vineet | Tue 6 Oct |
| 25 | Name the support ticket system and tags for ticket-based targets (session links, missing sessions). | Vineet | Tue 6 Oct |
| 26 | Integrations page: keep as a derived inventory with the 30 d reuse test, or retire? | Vineet | Fri 9 Oct |
| 27 | 25 UI-only items cut or raised as API asks; inbound session lifecycle as an API ask; does a call_policy PATCH apply to running sessions? | Vineet with API team | Fri 9 Oct |

## Locked words

| Use | Never |
|---|---|
| **integration** | app (alone), connection, connector, plugin, add-on; 'integrate' for SDK or code work |
| **app integration** | connector, app (alone), connection |
| **MCP server** | MCP connection, MCP app, connector |
| **tool** | function, custom function, action; webhook as a synonym for tool |
| **knowledge base** | KB (in UI), RAG, docs, files |
| **webhook** | tool, callback, integration |
| **deployment** | channel (alone), connection, connect, publish, integration |
| **deployment type** | channel type, agent type, mode, modality |
| **inbound** | receive calls, phone deployment |
| **batch** | outbound (as a type), bulk calling, campaign (as a type) |
| **code** | SDK, web SDK, embed, iframe, widget, app, API channel |
| **direction** | call type, mode |
| **Go live** | publish, deploy (verb), launch, activate, connect |
| **number** | line, DID, connection, transport identifier |
| **run** | campaign (for one execution), batch job, blast |
| **calling window** | schedule window, dialing hours |
| **Run again** | rerun, retry run, redial |
| **transport** | channel, connection, deployment, modality |
| **SIP protocol** | transport (for SIP) |
| **RTC channel** | channel (alone), room |
| **session** | call, conversation, chat, interaction |
| **test** | preview, demo, sandbox, trial, playground |
| **production** | live, real, prod, deployed |
| **running** | live, active, in progress |
| **answer** | response, reply, first audio, TTFAB |
| **proven session** | successful call, real call, verified call |
| **ephemeral session** | temporary agent, inline agent, anonymous session |
| **zero retention** | private, no-log, not kept, incognito |
| **expired** | deleted, gone, not kept |
| **preset** | template, tier, stack, bundle |
| **configured** | edited, customised, personalised |
| **secret** | credential, vault, API key (alone), token |
| **BYOK, managed** | own keys, custom keys, Agora keys, byo |
| **simulation** | test, scenario test |
| **error group** | issue, incident, alert, error dot |
| **free minutes** | credits, trial balance, quota |
| **minutes banner** | meter, alert bar |
| **suspended** | paused, blocked, disabled, locked |
| **Analysis** | structured output (in UI), evaluation, scoring |
| **project** | app, workspace |
| **agent** | assistant, bot, persona |