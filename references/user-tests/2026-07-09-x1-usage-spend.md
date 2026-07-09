# User test — 2026-07-09 · X1 Usage & spend (commit `24ad614`)

> Simulated 3-persona think-aloud session (protocol: `references/user-testing-protocol.md`)
> against the live build. Focus: the new Billing "Usage & spend" card + quota-row fix —
> but personas ran their full standing tasks, so wizard/import/list findings surfaced too.
> **Fixes from this session shipped in `a1387f7`** (rode the A1 train).

## Metrics

| Metric | Value | Target | Read |
|---|---|---|---|
| Task success | 76.7% | — | pass-leaning; S1s dragged D2/D3 |
| TTFA (interaction) | 2 actions median | ≤ 2 | ✅ on target |
| TTFA (live) | 6 actions median | ≤ 12 | ✅ well under |
| Friction | 2×S1 · 9×S2 · 9×S3 | — | both S1s outside X1 scope |
| Sentiment | +0.42 mean | — | positive, trust-fragile |
| SUS-lite | 72 | — | decent, not great |

## Focus verdict (X1 money story)

The X1 surfaces themselves scored well: cost-at-commitment (~$0.10/min at Deploy) earned
explicit respect from D1 and D3; the CSV→{{var}} validation was called "the best part of the
product" (D1) and "a migration argument" (D2). The first-run treatment (then on the harness)
was a **unanimous winner** — "the strongest first-run treatment in the product" — validating
the A1 fold-in direction: named warm-up stages + real elapsed counter, the disabled Talk
button carrying its promise, idempotent retry, the named default stack ("the single most
switcher-credible strip in the app" — D2).

## Ranked frustrations → disposition

| # | Sev | Finding | Disposition |
|---|---|---|---|
| 1 | S1 | List-view Import toasts success but creates nothing | **FIXED `a1387f7`** — same playground handoff as the builder banner |
| 2 | S1 | Code/SDK step has no credential story (API key origin, App ID/token/UID) | **Deferred → A3/Code cycle** (P1 medium; needs credential-block design) |
| 3 | S2 | Talk button opens a sheet with a second Talk button; test shows no evidence (no transcript/mic state/"simulated" label) | **Deferred → F-Eval cycle** (the test surface is F-Eval's author-side home) |
| 4 | S2 | Batch deploy fires with zero pre-flight (248 calls, one click) | **FIXED `a1387f7`** — confirmation with count · caller ID · window · honest estimate + "Talk to it first" |
| 5 | S2 | No off-switch for a live agent (Delete was the only stop) | **FIXED `a1387f7`** — Pause/Resume in the row menu, reversible, consequence copy |
| 6 | S2 | Builder import silently drops validated tools + model | **Deferred → A4 import cycle** (mapped/dropped report is core A4 scope) |
| — | S2 | NAMED_DEFAULT "GPT-4o" chip contradicted gpt-4o-mini preset | **FIXED by construction** — shipped strip renders FROM `STACK_PRESETS.balanced` |
| — | S2 | Harness journey steps self-completed; dead shortcuts; `#status` dead link | **Resolved by fold-in** — harness deleted; real surfaces wire real links (status → status.agora.io) |

Quick-P1s deferred to their owning cycles: batch call-window timezone note (A6/D1 touch
OutboundSettings), type-switch-on-live consequence copy, voice-seeds-prompt disclosure
(wizard Voice step), Monitor "15" badge explanation.

## What we learned (durable)

1. **Honesty compounds.** Every surface that named its numbers (cost-at-commitment,
   CSV validation, elapsed counters) earned explicit persona praise; every surface that
   asserted without evidence (Live badge, success toast without artifact, pulsing sphere)
   drew a trust flag. Same product, same session.
2. **A success signal without a visible artifact is worse than an error.** D2's "I would
   close the tab and tell my team Agora isn't ready" came from a *success* toast.
3. **Irreversible-only controls read as danger.** The Paused filter with no Pause action
   made the safest persona (D3) rate ops the "scariest gap."
4. **The first-run ceremony direction is validated** — port confirmed before it shipped.

## Session verdict on the A1 direction

"Ship variant-2's mechanics, reconcile the model chips with STACK_PRESETS, wire the
journey/shortcuts/status links, port the warm-up promise + named-stack strip to /agents"
— all four done in `a1387f7` (ceremony = V1 skeleton with V2's counter/warming grafts,
per the judge panel; chips derive from the preset; harness deleted).
