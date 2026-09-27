# P0.8 Confirm the agent is ready · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.8]. No ClickUp comments on the task, so there are no change notes. Concept A is the surface: the third tab of the agent page (`tab=deploy`, named Numbers, Runs or Code since P0.1) and the `DeployArea` it renders (`parts/deploy.tsx`), plus the header's primary action. Scope is the area where Sam confirms the agent is ready and goes live; what each Go live door holds inside (the number's call policy and transfer, the run's list and windows, the snippet's transports) is P0.9, P0.10 and P0.11. Reproducing a production surprise is P1.2; proving people reach the agent is P1.8.

## Job step

Before people outside the team reach the agent, Sam confirms nothing the agent needs is missing.

**Job statement.** When I am about to put the agent in front of people, I want to see in one place whether it was heard on this version, has its prompt, and has a number or a list to go live with, and to decide what is kept of what people say, so the first outside caller meets a finished agent and I go live without surprises.

**Why now.** Today the third tab shows only the deployment: a draft batch agent can start a real run with no test and no check (`shots/before-02-runs-tab-survey-draft.png`), a live inbound agent shows a number and nothing about the version callers hear, and nothing anywhere says how long what people say is kept. The KPI, 85 in 100 go lives tested on that exact version, has no surface to stand on. No vendor ships a readiness step (research gap 1), so this is original work; Stripe's review page is the nearest shape.

## Happy path · P0.8.a

Story: Sam wants to go live without surprises, so the first outside caller meets a finished agent.

1. Sam opens **Deployment**, the third tab, after Test in the header and apart from Integrations on the Agent tab. It opens on the agent's type: for the inbound Clinic reception agent the rows are Readiness, Retention and Numbers; a batch agent gets Runs, a code agent gets Code; no other type's rows render. `readiness_opened {deploymentType, rowCount, openCount, untestedItems, allGo}`
2. **Readiness** lists three items: a test heard on this version, the system prompt, and a number (batch: a contact list). A done item carries the gray tick and its fact; an open item carries the amber triangle, one sentence and one link (Test, Write the prompt, Add a number). Sam presses **Test** on the first item, hears the agent (P0.7), and the item ticks with the time. `go_live_blocked {codes, blockCount, deploymentType}` once per open when a gap is named; `test_panel_opened {trigger: readiness}`; `agent_audio_heard {agentVersion}` (P0.7)
3. **Retention**: Sam decides how long what people say to the agent is kept, **30 days** or **Zero retention**. On the inbound agent Zero retention is disabled with the reason (the API has no retention setting on a number yet), so 30 days stands; on a code agent the pick writes at once and the snippet carries `data_policy`. This may become its own step; the owner decides. `data_policy_selected {retention, deploymentType, writable}`
4. In the **Numbers** row Sam presses **Go live**. The sheet titled Go live lists the project's numbers with the agent each answers with; Sam picks one and presses **Go live**. The number points at the agent, the header badge reads Live, the toast names the number, Readiness shows every item done. `go_live_clicked {deploymentType, hasNumber, testHeard, agentVersion}`, `operation_succeeded {operation: telephony_phone_number_bind}`, `channel_connected` (server)

For batch the same row is **Runs** and Go live opens New run (P0.10); for code the row is **Code** and Go live is copying the snippet from the row (`code_snippet_copied`, the vocabulary's third Go live).

Done when: `channel_connected` for the agent, with a heard test whose `agentVersion` equals the agent's `updated_at` at Go live, in at least 85 of 100 go lives from the Console.

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.8.b | No test was heard since the last change | Readiness names it, "Not heard in a test since the last change.", with **Test**. Go live, New run and Add another number stay on; nothing blocks | `go_live_blocked {codes: no_test}` (a named gap, the old preflight-warns case), `go_live_clicked {testHeard: false}` if Sam goes live anyway |
| P0.8.c | Sam has no number (the project has none) or no contact list | Readiness shows the code's item with one link: "No number in the project yet." and **Add a number**, which opens the Go live sheet on the SIP trunk form; for batch the list item reads "A contact list is uploaded in New run." and Go live opens New run at Contact list (P0.10 owns the upload) | `go_live_blocked {codes: no_number}`; `no_list` is reserved for P0.10 |
| P0.8.d | Sam wants zero retention on inbound or batch | Number and Campaign have no `data_policy`. The Zero retention option shows disabled with the reason under it; 30 days stands. Code agents can pick it | none (the pick never happens) |
| P0.8.e | The agent already has a deployment | The type row shows the deployment and its status, not an empty form: the numbers that answer with the agent with **Remove** and **Add another number**; the runs table with New run in the header; the snippet with the first session from software. Readiness and Retention stay above it | `readiness_opened {allGo: true}` |
| P0.8.f | The agent has no deployment type (made through the API) | The Deployment tab shows P0.1.c's alert in place of the rows, "This agent was made through the API and has no deployment type…", with Use inbound and Pick another; the rows render once a type is set | `go_live_blocked {codes: no_deployment_type}` once per open |
| P0.8.g | The account is suspended at Go live | The minutes banner sits at the top of the Deployment tab: the account is suspended, new sessions are refused, production agents are silent, with **Add card** in place. Go live stays on for inbound (pointing a number is accepted); a batch Start run is refused and New run shows the same line with Add card (P0.7's copy) | `cta_viewed {cta: add_card}`, `external_link_opened {surface: billing}`; `test_refused` stays P0.7's |
| P0.8.h | Sam edits an agent that already has a deployment | There is no publish step, so every save reaches callers at once. The save toast carries one more line naming the number or run using the agent, "+1 415 555 0142 answers with this agent, so the change reaches callers on their next session.", with **Test** as its action; Readiness's test item opens again until a test is heard on the new version (see proposed P0.14 for the line before the save) | `agent_updated` (the row's), `test_panel_opened {trigger: save_line}` |

Empty first: a brand-new account has no agent, so no Deployment tab; the first agent's Deployment tab shows three real gaps (no test, no prompt, no number in the project), one link each, and the empty Numbers row with one sentence and Go live. Nothing is seeded, no run, no number, no session.

## Measures

- KPI: Test before Go live, at least 85 % as an absolute floor: `channel_connected` with a heard test answer (`agent_audio_heard`, baseline or configured) on the agent version at Go live (`agentVersion = updated_at` after the last `agent_updated`), as a share of `channel_connected` from the Console.
- Counter metric: TTFDA active median within +10 % of the readiness-off arm. Method: a flag A/B, readiness on against off, for two weeks; kill if the active part of TTFDA grows by more than 10 %. This is why readiness names gaps and never blocks (only a missing type blocks).
- Events: `readiness_opened` (renames `preflight_opened`), `go_live_clicked {deploymentType, hasNumber}` (renames `deploy_clicked`), `go_live_blocked {code: no_deployment_type | no_number | no_list | no_test}` (renames `deploy_blocked`; one event per open carrying every code, as the old spec asked), `data_policy_selected`, `agent_audio_heard` (P0.7, with `agentVersion`; needs an allowlist key), `channel_connected` (server, stage 9; Console fallback `operation_succeeded`).
- API: Partial. `PATCH /numbers/{id}` with `inbound.agent`, `POST /campaigns` and `POST /sessions` are ready. `data_policy` exists only on `SessionCreate`, missing on `Number.inbound` and `Campaign` (requirement 46, decision open by 28 Sep). No readiness, publish, version or test record on the server: the heard-test-on-this-version fact is Studio state until notif 112 ships. Billing state is outside the API (G9); only the refusals are visible.
