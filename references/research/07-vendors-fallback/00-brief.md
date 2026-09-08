# 07 · Vendors & provider fallback — intake brief (2026-09-08)

Tracker: https://app.clickup.com/t/868m0men7 · status → planning (research already Done)

## Scope (from the roadmap tasks)
- **868kytrkq** Provider-aware voice delivery + fallback controls — *Studio P0.* Configure supported voice
  delivery controls and **fallback voices**; show provider/model support, ranges, conflicts **before publish**;
  hear the fallback in simulation; identical values across Studio / REST / SDK / simulation.
- **868kyqzfy** Cross-provider failover for ASR · LLM · TTS · MLLM — *Engine P1 · Nov.* Builder configures an
  **ordered compatible provider pool per component**; pre-publish compatibility validation (language, voice,
  tools, structured output, data region, latency, safety); health probes / timeouts / circuit breakers decide;
  never silently switch voice, model behavior or data region; every switch = first-class session evidence;
  **Studio simulates the same policy and shows when no eligible fallback exists.**
- **868khnery** Studio vendors = Engine BYOK catalog (in version, Sep). **868ka697w** align models, defaults,
  fallback behavior, provision keys (in version, Sep, TEN-7256).

## What Studio_X has today
Voice & Models section: Model Stack slider (Low cost · Balanced · Fast) with recap line · "Configure models
manually" expander with per-component managed/BYO (`credential_mode` per asr/llm/tts, Wave 2) · Voice +
Spoken language · Advanced Speech Settings. Hosting Region = Deployment row #1 (geofence). Vendor
Credentials page. **No fallback / failover / backup concept anywhere in components or lib** (grep, 2026-09-08).

## Already decided (don't re-litigate)
- Managed mode is **cheaper** than BYO ($0.10/min either way, managed includes vendor usage) → in managed
  mode Agora can own the backup pool; the user pays nothing extra. BYO fallback needs the user's second key.
- Pinning a hosting region **costs failover** (unset = nearest region with failover). A fallback pool must be
  region-eligible; "no eligible backup in <region>" is a real state, not an edge case.
- Copy discipline: one line per control, recap in the folded row, explanations behind InfoHint.
- Builder locks: Test Strip (Talk · Run simulations · verdict line) is where "test the failover" belongs.

## Agora fact-check
`docs.agora.io` exposes no `fallback` / `failover` field on the agent join contract today (checked join,
LLM overview, Studio agents, product overview — 2026-09-08). Failover is the Engine P1 task above.
→ Design against the ticket's contract (ordered pool per component + eligibility validation + evidence),
and mark the whole row **"Requires Engine failover (Nov)"** in the proposal. Studio-side pieces that need
no Engine change: fallback **voice** selection (868kytrkq), pre-publish capability validation, simulation UI.

## Competitor evidence
July PRD row D2 records **✗ / —** (no competitor data captured). LEARNINGS §8 teardown covers labels and
onboarding, not failover. → Screenshots of Vapi / Retell / LiveKit fallback settings still needed (user logins).

## Open question for the owner
Is "backup provider" an **agent** property (Stack+Persona) or a **deployment** property (per region)?
Region eligibility argues deployment; the Engine ticket says "per agent". Default in the proposal: agent
property, validated per deployment region at publish time.
