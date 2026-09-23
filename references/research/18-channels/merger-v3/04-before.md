# 18 · Agent × Campaign merger · v3 · Before → After (2026-09-23)

Before = the live Console in design mode at c94f9221 (deploy https://ng-console-22w8ftqlp-agoraio.vercel.app), which already carries the two 2026-09-23 slices (Deploy tab lists campaigns; Stop in the row menu; run facts on the banner). Shots in `references/research/_before-merger-2026-09-23/`, marks in red because each names a defect.

| # | Before | What is wrong | After | Rationale |
|---|---|---|---|---|
| m1 | `before-m1-runs-index.png` Outbound Campaigns | The Agent cell is plain text. A run names its agent but cannot open it; the agent's Deploy rail is three clicks and a search away. | `after-m1-runs-index.png` | The Agent cell is a link that resolves the telephony uuid through the deployed-agents index and opens `/agents/<id>?rail=deploy`. Same column, same table, no new control. |
| m2 | `before-m2-agent-deploy.png` Agent page | Every link into the agent lands on Test. The Deploy rail cannot be opened by URL, so the campaigns list shipped on 2026-09-23 is behind a tab the reader must find. | `after-m2-agent-deploy.png` | `?rail=deploy` opens the Deploy tab on arrival. The campaigns section carries `data-design-focus="agent-campaigns"` so a review link lands on it. |
| m3 | `before-m3-agents-list.png` Agents | No sign of runs on the list. Which agent has campaigns, and how many are running, needs one visit per agent. | `after-m3-agents-list.png` | A Campaigns column: "3 campaigns · 1 running", opening Outbound Campaigns filtered to that agent through the `agentUuid` door View all campaigns already uses. Reads the deployed-agents index and the campaign list that exist today. |
| m4 | `before-m4-campaign-detail.png` Campaign detail | The banner names the agent as inert text; Configuration prints a bare telephony uuid under "Agent UUID". | `after-m4-campaign-detail.png` | The facts line starts with the agent as a link; Configuration says "Agent", name as the link, uuid as meta underneath. |
| m5 | `before-m5-campaign-form.png` Create campaign | The agent is a dropdown and the form shows nothing else about it, with no way back to it mid-form. | `after-m5-campaign-form.png` | Open agent beside the field label whenever the picked option resolves to a Studio agent; arriving from the agent the field is preselected (unchanged) and the link leads back. |

Not changed on purpose: the sidebar entry Outbound Campaigns stays under Launch (the audit rejected the merger's IA); no campaigns page is removed; no version, cost or variable check appears (v3.1).

Truth defect seen while shooting, not fixed here: the Create campaign form's Concurrency limit defaults to 15 while the validator allows 1 to 10, so a fresh form opens with an error (design mode fixture `api_telephony_campaigns_$` or the default in `campaign-call-settings-limits.ts`). Logged for the next v3 pass.
