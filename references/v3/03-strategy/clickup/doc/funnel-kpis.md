# Funnel and KPIs

## v3 funnel

| # | Event | Stage | Group | Fired by | Definition |
| --- | --- | --- | --- | --- | --- |
| 1 | `account_created` | Signed up | Evaluation | server | Agora account exists. Out of v3 scope: no v3 feature moves it. |
| 2 | `project_created` | Project ready | Evaluation | server | First project (App ID) exists. Auto-provisioned at signup, not a user decision. Greyed: excluded from step conversion. Out of v3 scope. |
| 3 | `agent_created` | Agent created | Adoption | server | First saved agent. Deployment type and preset are recorded as intent, never as a deployment. |
| 4 | `agent_tested_baseline` | First answer, preset untouched | Evaluation | client | First answer heard in a test session on an agent unchanged since create. Voice only; simulation never counts. First only. |
| 5 | `agent_configured` | Agent configured | Configuration | derived | First saved change to instructions, greeting or a model versus the preset. First-only milestone; every later save is agent_updated. Voice alone, Advanced tuning and any deployment never count. |
| 6 | `byok_enabled` | BYOK on | Configuration | server | First module (ASR, LLM, TTS, MLLM or avatar) switched to BYOK. |
| 7 | `app_connected` | Integration attached | Integration | server | First MCP server or tool attached to the agent: it gives the agent context or actions. First only; attached means saved, not proven working. Never a deployment, never web SDK. |
| 8 | `agent_tested_configured` | First answer, own agent | Configuration | client | First answer heard in a test session after stage 5. TTFA stop. First only; every later heard answer is agent_audio_heard. Talk to agent counts here, never as production. |
| 9 | `channel_connected` | Deployment on | Deployment | server | First deployment for the agent, any type: a number points at it, a run is created, or its first code session starts. Never an integration. |
| 10 | `agent_answered_production` | First production answer | Production | derived | First production session on the agent where it answered a person. The creator's own session counts. TTFDA stop. |
| 11 | `agent_proven` | First proven session | Production | derived | First production session with ≥ 2 turns whose caller is not the creator: inbound caller number not the creator's; code subscriber not a Studio test uid. Saved agents only. Batch unfired until turn count ships. |
| 12 | `session_reviewed` | Production session opened | Operate | client | Owner opens a production session from the agent page, Logs, history or a deep link. Starts the fix loop. |
| 13 | `card_added` | Card added | Conversion | server | Payment method on file. plan_selected returns as a prop only if plans ship. |
| 14 | `account_suspended` | Suspended | Risk | server | Free minutes exhausted with no card, or payment failed: new sessions refused, production agents silent. Exhaustion with a card rolls into billing and is not risk. |
| 15 | `account_reactivated` | Reactivated | Recovery | server | Suspended account accepts sessions again. |
| 16 | `first_paid_minute` | First paid minute | Monetization | server | First billed minute past free minutes, from a production or ephemeral session. |
| 17 | `sustained_usage_30d` | Sustained usage | Retention | derived | Account has production sessions on ≥ 7 distinct days in the 30 days after first_paid_minute. Observed, not moved by any v3 feature. RPA is the agent-level KPI. |

## KPIs

| KPI | Target | How we measure | Counter-metric | Phase |
| --- | --- | --- | --- | --- |
| **Fast-Proven Rate (FPR), north star** | ≥ 18 % of console-created saved agents per weekly cohort, read 14 d after the cohort week; validate against a 2-week W0 baseline. 45 % only with the raised inputs in the FPR decision. | builder_opened to agent_tested_configured ≤ 15 active min AND agent_proven ≤ 14 d of agent_created, share of agent_created {source console}. Arithmetic: fast test 0.60 × Go live ≤ 7 d 0.60 × answered ≤ 3 d 0.80 × proven by day 14 0.65 = 0.19. Reported per deployment type; batch excluded until turn count ships; provisional while G2 is open. | Test before Go live ≥ 85 %; RPA reported beside it | P0 |
| **TTFA, time to first answer** | Median ≤ 3 min, p75 ≤ 6 min | builder_opened to agent_tested_configured, active time (idle > 120 s removed), winsorised 900 s, source console | VTR (agent_created to agent_tested_configured ≤ 14 d) ≥ 70 % | P0 |
| **TTFDA, time to first deployed answer** | Active part median ≤ 2× TTFA median (≤ 6 min), p75 ≤ 12 min. Wall-clock part median: inbound ≤ 10 min; batch ≤ 15 min; code snippet to first session ≤ 30 min. | Active: builder_opened to go_live_clicked, same active clock, winsorised 1800 s. Wall clock, per deployment_type: inbound channel_connected to agent_answered_production; batch Campaign.started_at to agent_answered_production; code code_snippet_copied to channel_connected {code}. | Test before Go live ≥ 85 %; the active part must not grow when TTFA drops | P0 |
| **Test before Go live** | ≥ 85 % absolute floor | channel_connected with a heard test answer (agent_audio_heard, baseline or configured) on the agent version at Go live (agentVersion = updated_at after the last agent_updated), share of channel_connected {source console} | TTFDA active part | P0 |
| **Create completion** | ≥ 90 % of create sheet opens | create_sheet_opened to agent_created, share | deployment_type_changed before the first deployment ≤ 10 % of agents | P0 |
| **Preset keep rate** | ≥ 70 % | channel_connected with preset unchanged and Custom never opened, share of channel_connected {source console, agent_source saved} | Custom abandoned unsaved ≤ 10 % of Custom opens | P0 |
| **BYOK key works** | ≥ 90 % | secret_saved {entryPoint builder} to the next agent_audio_heard on that agent with no byok_key_failed for that module, share | credential_page_exited per new agent ≤ 0.2 | P0 |
| **Tested integration rate** | ≥ 60 % | integration_added to agent_audio_heard on the same agent ≤ 24 h, share of integration_added | integration_removed ≤ 24 h ≤ 15 % | P0 |
| **Integration value (assumption)** | Agents with an integration reach agent_proven at ≥ 1.3× (14 d read) and RPA at ≥ 1.5× (60 d read) the rate of agents without; kill below 1.1× at 14 d | agent_created cohort split by app_connected present and integration_type, stratified by deployment_type and account size | Production sessions with an integration error ≤ 2 % (blocked on the RTM stream) | P0 |
| **Go live rate** | ≥ 60 % within 7 d of the first configured test; batch ≥ 70 % | agent_tested_configured to channel_connected ≤ 7 d, share by deployment_type, source console | Stalled deployments (stage 9, no stage 10 within 3 d) ≤ 20 %; runs canceled in first 10 min ≤ 10 % | P0 |
| **Proven after production answer** | ≥ 65 % by day 14 of create (inbound, code) | agent_answered_production to agent_proven, both ≤ 14 d of agent_created, share; batch excluded until turn count ships | Production sessions under 45 s ≤ 15 % | P1 |
| **SAR, second-agent rate** | ≥ 25 % of accounts at agent_proven create a second agent ≤ 28 d | agent_proven (account's first) to a second agent_created {source console} ≤ 28 d, share of accounts | Second agents never tested ≤ 20 % | P1 |
| **Error acknowledgement time** | Median ≤ 24 h | first session_ended {status failed} or new error group on an agent to error_group_opened or logs_opened for that agent, median | Errors unopened at 7 d ≤ 10 % | P1 |
| **Error badge follow-through** | ≥ 50 % of agent page visits with an open error group | agent_page_opened {errorState errors} to error_group_opened in the same visit, share | Badge opens leaving Logs in < 5 s ≤ 30 % | P1 |
| **Talk to agent follow-through** | ≥ 40 % of Talk to agent sessions | talk_to_agent_started to agent_updated or error_group_quiet on that agent ≤ 24 h, share | agent_updated reverted ≤ 24 h ≤ 10 % | P1 |
| **Card before exhaustion** | ≥ 50 % of warned accounts | free_minutes_warning to card_added before free_minutes_exhausted, share | minutes_banner_dismissed ≤ 30 % | P1 |
| **Suspension recovery** | ≥ 60 % reactivated ≤ 24 h | account_suspended to account_reactivated ≤ 24 h, share | Accounts with no production session in the 30 d after reactivation ≤ 10 % | P1 |
| **Free to paid** | ≥ 25 % of accounts at agent_proven within 30 d (to validate) | agent_proven to first_paid_minute ≤ 30 d, share of accounts | Accounts suspended before their first paid minute ≤ 20 % | P1 |
| **Retained Production Agents (RPA)** | ≥ 25 % of agents at agent_proven retained within 60 d (to validate) | agent_proven to ≥ 20 production sessions in each of 4 consecutive weeks ≤ 60 d, share | Share of retained agents' sessions from the account's own numbers ≤ 10 % | P1 |
| **Sustained usage** | ≥ 35 % of paying accounts (to validate); observed, no v3 feature moves it | first_paid_minute to sustained_usage_30d, share of accounts | Paid minutes on failed sessions ≤ 2 % | P1 |
| **Time to the session** | Median ≤ 60 s | history_opened to session_opened (any origin), then link_copied, session_downloaded or talk_to_agent_started ≤ 2 min, median | Misses (opened, left in < 5 s) ≤ 20 % | P2 |
| **Change after diagnosis** | ≥ 30 % within 24 h (to validate) | session_reviewed on a failed session or from an error group to agent_updated on that agent ≤ 24 h, share | agent_updated reverted ≤ 24 h ≤ 10 % | P2 |
| **Honest rows** | Listed session minutes = invoiced minutes ± 1 %, monthly | billed minutes by agent_session_id vs history rows (incl. zero retention, ephemeral), monthly ratio; needs billable_seconds on sessions | Billing tickets about missing sessions = 0 (ticket system per decision) | P2 |
| **API parity** | 100 % of 201 spec leaf fields settable in Console or on the approved API-only list with a reason; renames only Analysis and run | Parity script run on each spec version: leaf field to Console control or API-only entry | Advanced panel opened by ≤ 30 % of new agents | P3 |
| **Unassigned numbers** | 0 numbers without inbound.agent for > 7 d, excluding numbers used as a run's from number in the last 30 d | Daily job over GET /numbers joined to GET /campaigns transport.from, count of misses | Numbers re-pointed within 24 h of Go live ≤ 10 % | P3 |
| **Safe secret replace** | Agents broken by a secret replace = 0 | PUT /secrets/{name} to session_ended {status failed, provider-auth error} ≤ 24 h on agents in labels.studio_secret_sets, count; API-created agents reported as unknown coverage | Secrets page visits per new agent ≤ 0.2 | P3 |