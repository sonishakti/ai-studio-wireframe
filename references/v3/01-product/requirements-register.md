# v3 requirements register

One row per requirement. Numbers 1–18 are the builder review asks (24 Sep morning), 19–36 the monitoring and
platform asks (24 Sep afternoon notes), 37–52 new from the two raw transcripts and the owner's brief of 24 Sep night.
**Never renumber.** Track: all rows are **v3** unless marked *future*.

**Priority** = the owner's plan: **P0** agent flow (Concept A) · **P1** agent page (analytics + logs) · **P2** session
history (Datadog-grade drill-down) · **P3** 1:1 mapping of every v3 API capability onto the Console.

**Pillar**: Build (customise the agent) · Operate (the agent in the real world) · Observe (sessions and runs) ·
Connect (transports, secrets, data policy).

**API** = can the v3 spec feed it at launch: ✅ yes · ◐ partly · ✗ no (Studio-only or deferred) · — not applicable.

| # | Requirement | Pillar | Surface | P | API | Notes / open question |
|---|---|---|---|---|---|---|
| 1 | Fewer voice/model/pipeline controls | Build | Builder › Voice & models | P0 | ✅ | 3–4 lines: presets + voice |
| 2 | Model control shows choices and consequences, scales past 3 | Build | Builder › presets | P0 | ✅ | Consequence = latency + intelligence, cost shown not traded |
| 3 | Deployment type as an early decision | Build | Create agent | P0 | ✗ | Stored in `labels` (ask) |
| 4 | Several concepts for creation + deployment | Build | — | P0 | — | Done: concepts A–E; A chosen |
| 5 | Stable content (prompt, knowledge) split from deployment-specific | Build | Builder order | P0 | ✅ | See 40 |
| 6 | Deployment + Go live as one area | Build | Builder › Deploy | P0 | ✅ | Tabs per type |
| 7 | Contact list out of config, into launch / rerun | Build | Go live › New run | P0 | ✅ | `Campaign.contacts` |
| 8 | Keep grouping › run › session distinct | Observe | Runs, sessions | P2 | ◐ | No API entity above Campaign; see 47 |
| 9 | System prompt primary; greeting and failure secondary | Build | Builder › Prompt | P0 | ✅ | failure_message lives on `llm` |
| 10 | Knowledge + MCP + tools as one compact list | Build | Builder › Context | P0 | ◐ | KB not in spec |
| 11 | Progressive disclosure, less inline explanation | Build | Builder | P0 | — | Tooltips over helper text |
| 12 | Credentials without secret-set mechanics | Connect | Builder key fields | P0 | ✅ | Auto-create set (45) |
| 13 | Terminology audit against v3 | All | Everywhere | P3 | ✅ | `object-model.md` §5 |
| 14 | Batch call vs campaign naming | Observe | Runs, docs | P3 | ◐ | Decide with API team |
| 15 | Home for Analysis, including code/SDK agents | Operate | Agent › Analysis definition | P1 | ✅ | `structured_output` is agent config, all types |
| 16 | Agent performance view separate from editing | Operate | Agent page | P1 | ✗ | Needs session analytics source |
| 17 | Agent-level vs session-level monitoring boundary | Operate/Observe | IA | P1 | — | Rule: aggregate on agent, drill down in history |
| 18 | Monitoring cues on the agents list | Operate | Agents list | P1 | ✗ | Sessions 7d, errors badge |
| 19 | Talk to agent bubble in the real-time panel | Operate | Agent page | P1 | ✅ | RTC session with saved agent |
| 20 | A/B testing at deployment level | Operate | — | *future* | ✗ | Design so variant can become a filter |
| 21 | Override-aware metrics | Operate | Agent page filters | *future shape* | ◐ | Spec now: variables + ephemeral + mid-session PATCH overrides |
| 22 | One session history (sessions + calls) | Observe | Session history | P2 | ◐ | List fields thin at launch |
| 23 | Backlinks session ↔ agent | Observe | History, agent page | P2 | ✅ | agent_id on session |
| 24 | Modality-aware session cards (RTC, telephony, WhatsApp TBD) | Observe | Session detail | P2 | ◐ | Common + per-modality blocks |
| 25 | Axes: direction × modality | Observe | History filters, badges | P2 | ◐ | Direction derived (number inbound / campaign / API) |
| 26 | Configurable outcome columns | Observe | History | *later* | ✗ | Core now: agent column |
| 27 | Agent page tabs: Analytics · Logs & diagnostics | Operate | Agent page | P1 | ◐ | |
| 28 | Error logs wired from RTM | Operate | Agent › Logs | P1 | ◐ | Vineet confirms the stream; the one hard requirement |
| 29 | "2 errors, 3 warnings" badge | Operate | Agent header, list | P1 | ◐ | From 28 |
| 30 | One time range drives list and metrics | Operate/Observe | Agent, history | P1/P2 | — | Datadog pattern |
| 31 | Datadog / Refero references | — | Research | P2 | — | `02-research/observability-patterns.md` |
| 32 | Retention: 30 days or none, both states designed | Connect/Observe | Go live + history rows | P2 | ◐ | Inbound/batch gap, see 46 |
| 33 | Resources → Transports, scalable | Connect | Transports page | P3 | ✅ | Numbers now; WhatsApp later |
| 34 | Secrets replace credentials | Connect | Secrets page + builder | P3 | ✅ | |
| 35 | Pricing: 5¢/min managed, lower with BYOK | Connect | Preset copy, usage | P3 | — | **Not public.** No price copy until cleared |
| 36 | UI↔API parity for Start a session and Create an agent | All | Builder, Go live | P3 | ✅ | `api-parity.md` |
| 37 | Third option = Custom (reveals full config) | Build | Voice & models | P0 | ✅ | Presets write `pipeline`; Custom exposes it |
| 38 | One settings page for voice + pipeline + speech; restore every advanced setting lost in A | Build | Builder › Advanced | P0 | ✅ | Gap: A's sheet has 4 switches only |
| 39 | Vendor logos + delightful pass | Build | Presets, Custom, voice | P0 | — | Copy Vapi's reasoning, not its look |
| 40 | Builder order: model → prompt → test → deploy + go live | Build | Builder | P0 | — | |
| 41 | Ephemeral sessions listed, agent "Ephemeral", no backlink, CSV for aggregates | Observe | History | P2 | ✅ | New endpoint |
| 42 | Deep links for sessions and runs, shareable | Observe | History, runs | P2 | ✅ | ids exist |
| 43 | Full-screen session detail, beside Download | Observe | Session detail | P2 | — | |
| 44 | Rename structured output to Analysis (or Monitoring) | All | Builder, agent page, history | P0 | ◐ | API field stays `structured_output` unless renamed |
| 45 | Secret set auto-created per agent, "created by agent X", write-only, delete + recreate | Connect | Builder, Secrets | P0/P3 | ✅ | Delete rule conflict: owner recap says never; transcript says delete allowed; spec: delete when unreferenced |
| 46 | Data policy collected at Go live for inbound + batch | Connect | Go live | P0 | ✗ | API gap on Number and Campaign |
| 47 | Hierarchy campaign › run › session; monitor at agent, campaign, run, session | Observe/Operate | Runs, agent page | P2 | ◐ | Campaign grouping UI-only today |
| 48 | Calling windows, dial rate, inbound call policy, end-call, transfer | Build/Connect | Go live | P0 | ✅ | New in spec |
| 49 | Live view: sessions running now | Operate | Agent page | P1 | ◐ | List defaults to running + last 2 h |
| 50 | Benchmarks shift to task success | Operate | Agent analytics | *future* | ✗ | Informs KPI choice (Analysis first, latency second) |
| 51 | US East only at launch; SuperNode in the preset | Connect | Presets, region display | P3 | — | No region picker |
| 52 | Test / simulations section stays | Build | Builder › Test | P0 | ◐ | "For test we are good" |

## Coverage by priority

| P | Rows |
|---|---|
| P0 Agent flow | 1–7, 9–12, 37–40, 44, 45, 46, 48, 52 |
| P1 Agent page | 15–19, 27–30, 49 |
| P2 Session history | 8, 22–26, 30–32, 41–43, 47 |
| P3 v3 mapping | 13, 14, 33–36, 45, 51 |
| Future | 20, 21, 26, 50 |

## Conflicts to settle before build

1. **Secret deletion.** Owner's recap: "users can never see it or delete it." Vineet on the call: delete and recreate is
   allowed. Earlier spec: delete only when unreferenced. Proposed: no reveal; delete allowed only when no agent uses the
   set, with the using agents listed.
2. **Pricing.** Call B said flat 10¢; call A said 5¢ managed, lower with BYOK, not public. Presets show latency and
   intelligence only until pricing is cleared.
3. **Run vs campaign.** Owner hierarchy has a Campaign above Runs; the API's Campaign *is* a run.
4. **Overrides.** The evening spec removed session-start overrides; confirm what "override" means for ask 21 now.
5. **Session analytics source at launch.** Almost everything on P1 and P2 depends on deferred APIs.
