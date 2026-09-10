# 05 · JTBD + success metric

**JTBD.** When my agent is on a call and the other side goes quiet, drops off, hits voicemail or presses a key
*(situation)*, I want it to do what I'd tell a new hire to do — speak up, hang up, leave the message, take the
digits *(motivation)* — so no call runs long, hangs dead, or ends in a way I can't explain *(outcome)*.

**Personas.**
- P1 hustler (outbound campaign owner) — wants defaults that don't burn minutes: "don't talk to a voicemail for
  five minutes, don't sit on a dead line." Reads sentences, never field names.
- P2 platform engineer — wants the effective timers and the same values through Console, REST and SDK, and wants the
  hang-up reason in the session record to name the rule that fired.
- P3 contact-centre ops (the customers tagged on telephony roadmap tasks) — wants compliance-shaped rules (max
  duration, leave-a-message text) set once per agent and proven before a campaign runs.

**Success event (activation-linked).**
- `call_rules_saved` `{rule: silence | idle | farewell, source: agent}` — fired when a real Engine field changes from
  the Call rules section. (Deployment-level fields already save through their own surfaces; not double-counted.)
- `preflight_passed` / `preflight_blocked` `{blocker}` — fired when the Deploy-tab list evaluates on Publish.
  `preflight_blocked` must precede `agent_published` for a previously blocked draft — the same counter-metric shape as
  X1 (`spend_alert_fired` precedes `spend_cap_hit`).
- Downstream chain: `agent_published` → `agent_deployed` (`references/event-taxonomy-review.md`) →
  `deployment_active_d7` (`roadmap-activation-strategy-2026-07-09.md` §Retain). Counter-metric: `calls_dropped`
  (§Consume). Evidence: the share of calls ending in `silence_hangup` / `max_duration` / `voicemail_hangup` in call
  history — a rule firing is the system working (D1 "paced ≠ failed"), so the call record must name the rule, not
  "Agent-initiated hang-up" (today's collapse in `call-formatters.ts:49–84`).
- Rejected KPIs: time on page, DAU, rows expanded.

**Agora primitives.** `properties.idle_timeout` (0–259 200 s, default 30; counts after the last remote user leaves;
72 h hard cap) · `parameters.silence_config.{timeout_ms (0, 60000], action speak | think, content}` (not for MLLM) ·
`parameters.farewell_config.{graceful_enabled, graceful_timeout_seconds}` · `interruption.*` (shipped, #1443) ·
`labels{}` for evidence · telephony `call` / `hangup` / `list` / `get` (`reason` request | hangup | failed; `state`
answered | hangup) · Console telephony backend `end_call_config.*`, `transfer_config.*`, campaign
`switch_configuration.enable_voicemail`.
Not in the contract → **Requires Engine**: agent-level max call duration and silence hang-up (868kytrua), reminder
count (868kytrua), call-screening identity (868kytrua), voicemail leave-a-message (868kgy2n3), DTMF send/receive
(868kykbfw), guardrails (868kykbft), join-time validation (868keazr7).
