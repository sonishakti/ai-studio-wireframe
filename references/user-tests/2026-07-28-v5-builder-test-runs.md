# 2026-07-28 — v5 builder · Test section · runs model (graph-loop, 3 rounds)

> Graph-loop session per `references/user-testing-protocol.md`. Three rounds of the simulated
> 3-persona think-aloud panel (D1 Hustler · D2 Switcher · D3 RTE Veteran) against the live
> build. **Exit reason: stalled** — round-3 metrics did not improve over round 1's baseline
> (S1 recurred, SUS-lite dipped), and the remaining P0s were fixed but new debts kept surfacing
> at platform-floor depth, not builder depth.

**Focus (commit 3069933):** v5 builder — five sections (Voice · Channel · Context · Test · Go
Live): Test section with live contextual test + auto-generated contextual simulations (judge
structured output; failures name real config gaps) + A/B prompt compare; inbound XOR outbound
with announced swaps; runs model in Go Live (Rerun = locked config + new CSV vs Duplicate;
version history table); agents list nests runs per agent; Context has compact
add-additional-context door + custom-config override flags (yellow, disabled, Unlock); AI-only
create dialog (describe box + channel chips, no template list); + Add phone number accelerator
links the new number in place.

## Metrics by round

| Metric | Target | R1 (HEAD 3069933) | R2 (9fa2eca) | R3 (0857899) |
|---|---|---|---|---|
| Task success | — | 90% | 83.3% | 90% |
| TTFA (interaction) median | ≤ 2 | 3 | **2** | 3 |
| TTFA (live) median | ≤ 12 | 10 | **9** | 10 |
| S1 blockers | 0 | 1 | **0** | 1 |
| S2 major | ↓ | 5 | 4 | 5 |
| S3 minor | ↓ | 14 | 14 | **11** |
| Sentiment (−2…+2) | ↑ | +0.79 | **+0.98** | +0.85 |
| SUS-lite | ↑ | 81.3 | 81.3 | 78.3 |

Reading: round 2 was the peak (zero S1s, both TTFA targets hit, best sentiment). Round 3's
fixes cleared R2's P0s but exposed a *new* S1 class (create-dialog inference conflicts) and
platform-floor gaps (webhooks, bulk import, campaign API) that builder iteration cannot fix —
hence **stalled**, not clean.

## What we learnt

**What landed — consistently, all three rounds, all three personas:**
- **The Test section is the category differentiator.** Judge failures that name the exact
  config gap and its address ("Transfer to human is OFF — enable it in Go Live › Batch call
  behavior") — and refuse to fabricate failures for controls the agent doesn't have. D2:
  "ahead of my current tooling" (vs Retell/Vapi/ElevenLabs).
- **The runs model is legible.** Rerun-locked-config vs Duplicate self-explained at point of
  use; runs nested under agents made the list a ledger; "at no point did I wonder what was
  live."
- **XOR channel swap = explicable constraint.** Announced rule + kept setup + Undo read as
  trust, not restriction — once the ADD-direction warning gap (R1's heart-skip) was closed.
- **CSV↔{{variable}} coverage check** is the best aha in the product (the box flipping green),
  plus pre-flight cost-at-the-moment-of-spend — the two trust moments that convert.
- **'+ Add phone number' accelerator** linking the number in place drew explicit praise —
  then R3 found its absence on the flagship *outbound* caller-ID picker (S2).

**What underperformed:**
- **The AI-only create dialog is the persistent weak seam** — the only feature with friction
  every round. R1: no Code/SDK expression (the S1). R2: 3/3-persona friction — the describe
  box taxes everyone who already knows what they want; inference explains itself only *after*
  commit. R3: 5-word "enough to build from" validation + a Phone chip overriding an explicitly
  SDK-shaped description (the returning S1).
- **Wireframe-vs-mock trust breaks:** session-created agents not persisting into the list
  (R2's worst moment — "did my deploy persist anywhere?"), fabricated version history on
  fresh agents, Aria's sample data unmarked.
- **Platform floor, honestly exposed by the builder's own candor:** no deployment webhooks
  (D2's outright migration blocker), no bulk/API import, no campaign API, 2-retry dialing,
  thin catalogs — "a superior cockpit bolted to a smaller engine." Roadmap material, not IA
  rework.

## What changed each round

### Round 1 → commit 9fa2eca (graph-loop r1)
- **P0:** Code/SDK chip in the create dialog + SDK phrasing inference (closed the S1);
  ADD-direction warning on live-agent channel swaps; `/agents/agents` → `/agents` redirect +
  runner start-URL fix.
- **Quick P1s:** variable seeding + clickable CSV column chips; Pause/Take-offline colocated
  with Deploy; realtime-architecture note where Speech tuning hides; rename nudge when the
  agent name appears in the greeting; per-run cost projection in pre-flight.

### Round 2 → commit 0857899 (graph-loop r2)
- **P0:** session-created agents persist into the All agents list (nested run visible);
  Pause/Take offline in the builder header, state-synced; "Use template" bypasses the
  describe dialog (template IS the description).
- **Quick P1s:** free-entry Max concurrent + retry-interval; uid in joinChannel snippet +
  Voice hint for SDK agents; Monitor "15" badge labeled and linked; A/B per-case drill-in.

### Round 3 → (fixes pending — session stalled here)
- **P0 trio identified, not yet shipped:** caller-ID '+ Add phone number' parity in the batch
  run editor (campaigns-card.tsx); seed version history with one real "Created" entry (rich
  mock stays on Aria only); reconcile description vs channel chips — inline inference readback
  in the dialog, conflict flag/auto-flip before Create.

## Exit reason: stalled

Round 3 regressed to R1-level metrics (1 S1, SUS 78.3 vs 81.3) despite two fix rounds. The
recurring S1s cluster on the create-dialog inference — a design problem needing a rethink, not
another quick patch — and the biggest remaining frustrations are platform gaps the wireframe
can only acknowledge, not fix. Diminishing returns per loop iteration → exit per the graph-loop
stalled criterion. The R3 P0 trio should ship next session before any new feature work.

## Remaining backlog

### P1
| Fix | Effort |
|---|---|
| Cost decomposition: InfoHint on every ~$/min figure (tier cards + Review & deploy Cost row) — Agora per-minute vs vendor pass-through, "billed per minute", link to Billing/pricing | medium |
| Route the landing "Talk to agent" button into the existing docked Talk panel (template or Aria) instead of the simulated-preview toast dead-end | medium |
| Give the rerun lock its payoff or soften the claim: cross-run comparison table (per-run pickup/completion) or reword "analytics aggregate across runs" until it exists | medium |

### P2
| Fix | Effort |
|---|---|
| Point the "Interrupts mid-sentence" simulation failure at Voice › Advanced tuning › Turn-taking › Speaking interrupt duration — extend the config-gap-pointer pattern to barge-in | quick |
| Own the webhook gap visibly: "Server events — planned" card in Go Live (or roadmap PRD) so the S1 platform gap has a destination | quick |
| Connected/bulk import design: paste a Retell/Vapi API key → list assistants → multi-select import with per-agent mapping reports; promote file upload from "coming soon" | large |
| Advanced retry rules disclosure in Dialing: per-disposition attempts/intervals (busy / no-answer / voicemail-detected), defaulting to the simple picker | medium |
| Programmatic run creation: API snippet card in Go Live › Campaign runs mirroring the Code/SDK pattern + per-session cost actuals after test runs | large |

## Focus verdicts (per round, verbatim synthesis)

**R1:** The v5 five-section builder is the strongest tested version of this surface and
validates the session's focus areas almost across the board: 90% task success, median 10
actions to live, sentiment +0.79, SUS-lite 81. The three features under test each landed —
the Test section's config-gap-naming judge is the cross-persona differentiator; the runs
model produced the strongest live-state story any persona had seen; the XOR swap is a model
of explicable constraint (minus the ADD-direction gap). Structural weaknesses: the AI-only
dialog regresses the SDK persona (the sole S1) and seeded prompts ship variable-free, taxing
the coverage-box aha with a Context↔Go Live round trip.

**R2:** Focus features mostly land — all three personas named the config-grounded simulation
failures as ahead of Retell/Vapi/ElevenLabs; the runs model read as engineered, not marketed;
the swap is a destructive-feeling rule made honest and reversible. Zero S1s, both TTFA
targets hit. Two underperformers: the describe-box is a tax on everyone who already knows
what they want (inference explains itself only after commit), and the agents-list nesting —
the payoff of the whole runs story — was undemonstrable against a static mock (D1: "did my
deploy persist anywhere?", the study's worst trust break).

**R3:** The strongest verdict this project has recorded on headline numbers, with all three
personas crowning the judge failures and the CSV coverage check as category-best, and every
v5 bet holding. But the debts split cleanly: builder-fixable (caller-ID accelerator parity,
fabricated version history, dialog inference conflicts, undecomposed $/min) vs platform floor
(webhooks, bulk import, campaign API, retry depth) — "a superior cockpit bolted to a smaller
engine." Ship the P0 trio and the cockpit story is clean; the engine gaps are roadmap
material, not IA rework.
