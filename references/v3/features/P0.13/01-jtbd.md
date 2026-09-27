# P0.13 Try the agent without counting the tries · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.13]. No ClickUp comments on the task, so there are no change notes. Job map: Prepare. Part of P0 Agent config. Three of the five PRD steps are enablers for the team (the events port, the renames, the data-quality checks); the two Sam sees are the stored id and the Test tag that keeps a test out of the numbers.

## Job step

Sam tries the agent as often as needed without those tries counting as production sessions or in the agent's numbers.

**Job statement.** When I test an agent, I want every test to stay out of its production numbers on its own, so I can test as often as I like and still trust what the numbers say.

**Why now.** Today a test is a session like any other: the API has no test flag, no purpose field, and never returns the `client_reference` Studio writes, so the only proof that a session was a test is the id Studio keeps. Nothing on the agent page says where a test lands, and the research found no vendor that keeps tests out of its counts: Retell bills a call named "test" at full rate, LiveKit defaults to production, Sentry hides an environment and still counts it. The P0 KPIs (TTFA, Test before Go live, FPR) all read tests, so an untagged test is both a wrong number for Sam and a broken KPI for the team.

## Happy path · P0.13.a

Story: Sam wants to test freely, so tests never inflate the agent's production numbers.

1. On the agent's Overview Sam reads 2,910 production sessions in 7 days; the Sessions tile's (i) says tests from Studio are left out. `page_viewed`
2. Sam presses **Test**. The panel opens idle with "Talk to the agent with your microphone. Tests stay out of the agent's numbers." `test_panel_opened {trigger: header}`, `builder_opened` (ported, once per builderSessionId)
3. Sam presses Start test. Studio sends `POST /sessions` with `client_reference: studio_test:<agent_id>:<builderSessionId>` and, on the 201, stores the session id in its registry before joining the channel; the first answer plays. `agent_test_started {agentId, builderSessionId, trigger, configuredByUser, preset, deploymentType, transport}`, `agent_audio_heard {turnCount, agentVersion, surface: builder, serverAnchored}`
4. Sam ends the test. The Sessions tile still reads 2,910; Recent sessions is unchanged; the title row now offers **Your tests (1)**. `agent_test_ended {durationMs, turnCount, reason: toggle}`
5. Sam opens Your tests: one row, Today 14:02 · You · Test · 0m 42s · Completed. No event; P1.2 names the list's events
6. Sam opens **View last save** from the header menu and reads the `POST /sessions` body with the reference, the registry entry Studio kept, and the three analytics events with the props that reached PostHog. No event

Enablers (team), no screen of their own: builder and test events port from event-spec 1.0.0 into ng-console with 15 new allowlist keys and pipe-joined arrays; renames ship once in the next schema bump with no aliases; the data-quality checks run green for 7 days before any P0 KPI is reported.

Done when: every session Studio starts carries the reference and an entry in the registry; the tile, the chart and the production list never include a registry id; Your tests lists exactly the registry entries for the agent; and View last save shows the id, the entry and the events for the last test.

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.13.b | Preview and local traffic count as external: the identity gate does not pass `classifyNonProductionAsTest`, so a test from a preview or local Console is external traffic in every KPI | Nothing on the page; in View last save the events read `trafficType: external, environment: preview`. The gate passes the option before any preview deploy; the same events then read `trafficType: test, userClassificationSource: environment` | none (identity, not an event) |
| P0.13.c | The sanitiser drops `agentId`, `turnCount`, `configuredByUser`, `deploymentType`, every new key and every array, so the KPI cannot join a test to its agent or tell a configured agent from a preset | View last save shows what survives today and which keys were dropped; the allowlist grows by 15 keys and arrays go pipe-joined | none |
| P0.13.d | There is no API gateway emitter (G1): no server anchor for the first answer, no `agent_created` or `channel_connected` from the server | Console stages fall back to their `operation_succeeded` twins; `agent_audio_heard` carries `serverAnchored: false`; API-only and ephemeral journeys stay unmeasured and reports say so with the measured share | `operation_succeeded {operation}` |
| P0.13.e | Session and agent ids do not match: a list row's `agent_id` is 32 lowercase characters, the agent's id is `agent_tutor` | Studio joins a test by the session id it stored, never by the list's `agent_id`, so Your tests is unaffected; the tile subtracts the registry count; dropping a test row from the production list waits on decision 5 | none |
| P0.13.f | A stored test id is lost: `client_reference` is never returned, so the stored id is the only proof of a test | The test counts as production: the tile reads one more, the row shows untagged, the Your tests door is absent. The fix is the account-level store (open question 1); until then the browser holds the registry. The server-side check counts sessions whose reference starts `studio_test:` against the registry and must read 0 | none (data-quality check) |
| P0.13.g | Sam blocks analytics or declines consent | Nothing is sent and the page is identical: the test runs, the reference is written, the entry kept, the tag shown. Server events still count stages 3, 5 and 9; every KPI is read over consented users with the measured share beside it | none |

Empty first: a brand-new account has no test, so the door, the tag and the row never render until the first test; the Sessions (i) is the only line that mentions tests before one exists.

## Measures

- KPI: event completeness, at least 98 %, among consented users. `agent_test_started` whose session id is in the Studio registry, share of `agent_test_started`; `agent_created {source: console}` with a prior `builder_opened`, share. Both over consented users only.
- Counter metric: each data-quality check reads 0 for 7 consecutive days before any P0 KPI is reported: untagged Studio tests; ephemeral sessions in agent aggregates; suspensions with no 80 % warning; an error badge showing 0 while the stream is down; events with a dropped prop.
- Assumption: ported client events plus Studio-stored test ids compute TTFA, FPR and Test before Go live from day one, without a server anchor.
- API: Partial. `client_reference` is writable on `SessionCreate` and never returned; no purpose field, no test flag, no transport in any read, no reference filter on the list. The registry is Studio-owned (Console backend object, open question 1). Renames and the allowlist are Console code, not API.
