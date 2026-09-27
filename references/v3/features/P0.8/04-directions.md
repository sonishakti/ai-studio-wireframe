# P0.8 Confirm the agent is ready · Directions

Track: **v3**. Constraints: extend the third tab and `DeployArea` that P0.1 named and today's number sheet, runs table and snippet, do not redraw; existing design system only; one door per action; no control for what Agora does by default; empty first, quiet chrome; locked words (deployment, Go live, number, run, session, test, zero retention, expired, suspended, minutes banner; never connect, publish, deploy as a verb, launch, activate, call, not kept, private); the v3 API's `data_policy` on `SessionCreate` only, `inbound.agent` on the number, `POST /campaigns` for a run; the KPI's counter metric (readiness must not slow Go live); P0.9, P0.10 and P0.11 own what is inside each Go live door.

## Three directions

### 1. Three rows before the door (the extension)
Rename the third tab **Deployment** and give it three rows in the Agent tab's own row style: **Readiness** (a heard test on this version, the system prompt, a number or a contact list; gray tick and fact when done, amber triangle, one sentence and one link when open, nothing when pending; never blocking), **Retention** (30 days or Zero retention as two radio rows; the second disabled with the reason on inbound and batch, written into the snippet on code), then the type row **Numbers**, **Runs** or **Code** that holds the deployment and the one Go live door: one sentence and Go live on a draft, the list, table or snippet with its status once live. Go live for inbound is today's number sheet retitled; for batch it is New run; for code it is the snippet's copy. The header's primary reads Go live on a draft agent and lands on the tab at the top. A suspended account gets the minutes banner at the top of the tab; a save on a live agent gets the deployment line and Test in its toast. An untyped agent gets P0.1.c's ask in place of the rows. Nothing new in the design system.
Research: `shots/refero-stripe-01-activation-review.png` (one flagged line, one fix action, no colour when clean), `shots/before-01-numbers-tab-frontdesk-live.png` and `shots/before-03-runs-tab-payments-live.png` (the deployment shown as the deployment), `shots/elevenlabs-01-zero-retention-privacy.png` (retention as two states, the batch conflict surfaced inline instead of in the docs), `competitors/product/livekit/livekit-agents.png` (one sentence, one button).

### 2. A Go live preflight sheet (Studio X 2's DeployPreflight, Stripe's review page)
Keep the tab as it is and put the check behind the button: pressing Go live opens a sheet that runs the readiness rows one by one with a short settle, shows a verdict, then holds the number picker or the run form under it. Stripe's activation review is this shape, and Studio X 2 shipped it as `DeployPreflight` with `preflight_opened` and its cosmetic delay. But the check is read only after the press, so the KPI's test-before-Go-live is nudged at the last second instead of on the way in; the settle is theatre the old event spec itself flagged; the sheet becomes a second surface that P0.9 and P0.10 would have to grow inside; and Stripe's shape is a gate across steps, the half .b refuses.
Research: `shots/refero-stripe-01-activation-review.png` (the gate), `references/telemetry/event-spec.json` `preflight_opened` (the measured theatre), `competitors/product/elevenlabs/elevenlabs-18-agent-channels.png` (Publish as one press with nothing before it, the other extreme).

### 3. A readiness strip under the header, on every tab
Show the three items as chips under the agent header on every tab, the way P1.8's deployment strip will sit on Overview after Go live, and keep Go live where it is today. Everything is visible everywhere, and .h's reopened test item is seen from the Agent tab too. But it is header chrome on every screen for a check that matters at one moment; the fix links then sit far from the button they guard; P1.8 owns the strip after Go live, and two strips would say almost the same thing; and the Console's agent page has no such band under its header today, so it is a new pattern, not an extension.
Research: `shots/before-01-numbers-tab-frontdesk-live.png` (the header as it is: name, type, status, three actions), PRD P1.8 (the strip that exists after Go live).

## Audit

Scored 1 to 5 (5 best).

| Criterion | 1 Three rows before the door | 2 Preflight sheet | 3 Header strip |
|---|---|---|---|
| Extend, do not redraw | 5 | 3 | 2 |
| One door per action (Go live, Test, Write the prompt, Add a number) | 5 | 4 | 3 |
| Readiness read before Go live, without slowing it (KPI and counter) | 5 | 2 | 4 |
| Empty first, quiet chrome | 5 | 3 | 1 |
| Rainy .b to .h in one place | 5 | 3 | 3 |
| API fit (`data_policy` on sessions only; `inbound.agent`; no readiness object) | 5 | 4 | 4 |
| Room for P0.9 to P0.11 to grow inside the doors | 5 | 2 | 4 |
| Touches P0.1 to P0.7 (in review) | 4 (tab name, header primary, save toasts) | 4 | 2 |
| **Total / 40** | **39** | **25** | **23** |

Cut: 2 hides the check until the press and adds a surface with theatre; 3 is new chrome on every tab and overlaps P1.8.

## Pick: direction 1, three rows before the door

1. **One flagged line, one fix, no colour when clean.** Stripe's review is the only real precedent for a pre-launch list (`shots/refero-stripe-01-activation-review.png`) and the live Console's Go live section already renders issues as a triangle, a sentence and a link; Readiness reuses that, with the gray tick for done and nothing for pending, so the row never turns green and never turns red.
2. **Named, never blocked.** No vendor gates Go live (ElevenLabs' lone Publish, `competitors/product/elevenlabs/elevenlabs-18-agent-channels.png`; our own empty Runs tab today, `shots/before-02-runs-tab-survey-draft.png`), and the counter metric forbids slowing it; so the row names the gap (.b, .c), Go live stays on, and `go_live_clicked {testHeard}` measures the KPI instead of forcing it. Only a missing type blocks, by asking for the type (.f).
3. **Retention where the decision applies, told truthfully.** Every vendor keeps retention as a standing setting far from Go live and none scopes it to a number or a run (`shots/elevenlabs-01-zero-retention-privacy.png`, `v3/02-research/monitoring/shots/retell-05-data-storage-settings.png`); the v3 API scopes `data_policy` to the session a deployment starts, so the row sits between Readiness and the door, Zero retention is disabled with the API reason on inbound and batch (.d, requirement 46), and it flows into the snippet on code.
4. **The deployment stays the deployment.** Today's Numbers and Runs tabs already show a live agent's number and runs as they are (`shots/before-01-numbers-tab-frontdesk-live.png`, `shots/before-03-runs-tab-payments-live.png`); the type row keeps them with Remove, Add another number and New run, and Readiness above it is what reopens after an edit (.h), so no empty form ever shows on a live agent (.e).
5. **Nothing new, nothing seeded.** A draft agent's row is one sentence and Go live (`competitors/product/livekit/livekit-agents.png`); a project with no numbers says so in the readiness item and opens the sheet on the SIP form; every control is an `AgentBuilderRow`, a radio row, a link button, `EmptyRow`, `FormSheet`, `Alert` or a toast that ships today.

## Questions for the owner (max 3)

1. **Retention on inbound and batch.** As specified (PRD .d), the row shows on every type with Zero retention disabled and the reason. Until Number and Campaign carry `data_policy`, should the row show only on code agents instead, and does retention become its own step in the builder?
2. **The prompt is named, not blocking.** Readiness names a missing prompt with Write the prompt and Go live stays on (the PRD's block codes have no `no_prompt`); New run still refuses to start without a prompt (P0.10). Keep the prompt soft at Go live, or make it the one soft item that turns Go live off?
3. **The save line on a live agent (.h).** Specified as the save toast's second line with a Test action, since proposed P0.14 owns the line before the save. Is a toast enough, or should the line persist under the row footer until the next test?
