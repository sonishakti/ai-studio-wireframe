# User-test session #1 — 2026-07-09 · builder cleanup batch

**Build tested:** live prod at 333ba5b (+ ea322ca, 43b2bb5, 88906ee).
**Focus:** batch-calls two-pane split · sticky banded headers · unified card + icon rail ·
"Unsaved changes" badge in deploy block · 576px side panels · Quick test removed · honest step-2 copy.
**Method:** simulated think-aloud, 3 developer personas (D1 Hustler / D2 Switcher / D3 RTE Veteran),
per `references/user-testing-protocol.md`. Personas verified HEAD markers in the live SSR HTML before testing.

## Metrics

| Metric | Result | Target |
|---|---|---|
| Task success | **80%** (pass+partial across 15 persona-tasks) | — |
| TTFA — first agent interaction | **2 actions** (median) | ≤ 2 ✅ |
| TTFA — live deployment | **7 actions** (median; D1 full batch flow = 10) | ≤ 12 ✅ |
| Friction | **0 × S1 · 9 × S2 · 10 × S3** | S1 = 0 ✅ |
| Sentiment (mean, −2…+2) | **+0.37** | > 0 |
| SUS-lite | **76 / 100** | ≥ 68 (industry "good") ✅ |

## Verdict on the focus commits (moderator)

All three of 333ba5b's calls judged **correct**: Quick-test removal cost nothing (the rail's
"Talk to Aria" held as the single test home for all three personas); deleting "change this any
time" was right (the stash+Undo toast makes a truer promise); 576px panels rescue the forms.
But the commit was **incomplete on both of its own axes**: it fixed a CLASS of width bug in 5
places and left 4 sheets losing to the base 384px cap (incl. the Import sheet's JSON editor);
and honesty-by-deletion left Step 2 with no pre-click consequence for switching a live agent.

## Top frustrations (ranked, deduped)

1. **S2 · all personas** — Talk test is a feedback void that never says it's simulated (no mic prompt/connecting/transcript). *"I'm saying hello to my laptop like an idiot."* → P1 backlog
2. **S2 · D1** — `Live on No contacts yet` mid-reconfiguration: the production-truth string read the draft. → **FIXED**
3. **S2 · D2** — Import path is "a costume": hidden entry, generic key-guesser, drops tools+model silently, lands as a voice not an agent. → P1 backlog
4. **S2 · D2** — Width fix was whack-a-mole: 4 sheets still at 384px. → **FIXED**
5. **S2 · D3** — No Stop/Pause for a live agent anywhere (list offers Edit/Duplicate/Delete; "Paused" exists in the status filter). → P1 backlog
6. **S2 · D3** — Code-branch credential trail broken: snippet uses `AGORA_API_KEY` the console never issues; tokenless join contradicts secured-mode teaching. → P1 backlog
7. **S3 · D1** — Deploy verb split ("Redeploy" rail vs "Deploy agent" step 5) + outbound toast said "answering". → **FIXED (both)**
8. **S3 · D1/D3** — No pre-click consequence when switching a live agent's channel. → **FIXED**
9. **S3 · D2** — Batch operator gaps: no custom concurrency/account cap, no retry interval, timezone-less call window. → P2 backlog
10. **S3 · D3** — Barge-in tuning buried 3 layers deep with invisible defaults. → P2 backlog

## Aha moments (what to protect)

- **CSV variable-coverage validation that blocks deploy** — *"genuinely better than Retell's silent call-time failure; the feature I'd quote to my team"* (D1+D2)
- **Honest dirty-state**: "Edits are not live yet" + per-step Reset-to-live + Undo (D1+D2)
- **Auto-provisioned live Aria, talkable in 2 clicks** — *"Retell's cold-start is minutes"* (D1+D2)
- Type-switch **stash + Undo** narration; **cost+latency at the moment of commitment**; rail
  **manifests that predict step contents** (*"the first wizard I haven't immediately distrusted"* — D3);
  live **"Variables detected" chips**; "Stop the agent" card tying leaveChannel() to billing.

## Latent needs (top of 13)

1. **Batch pre-flight**: cost preview (248 × ~2min × $0.10 ≈ $50) + a "call MY number first" dry-run rung (D1+D2)
2. **Persona-vs-prompt precedence** — the one latent need ALL THREE hit: does Luna's persona fight my system prompt? (P2 microcopy)
3. Post-import mapped-vs-dropped **diff report** (D2) · server-side **kill switch semantics** (D3) · **cost decomposition** Agora-vs-vendor (D2+D3) · CSV **cell-level** validation + variable defaults (D2) · rendered-prompt **preview for one row** (D2) · column→var **remapping UI** (D1) · **bulk import** (D2) · read-only snippet browsing without mutating a live draft (D3) · agent's **uid in the channel** (D3) · caller-ID **spam-reputation guidance** (D1) · "why is this here" line on the auto-provisioned agent (D1+D3)

## Changes shipped from this synthesis (same day)

- **P0-1** `Live on …` heading + rail row 5 now read the deployed **baseline**, never the draft.
- **P0-2** Sheet-width sweep finished: import / add-phone-number / templates / Talk sheets → `data-[side=right]` pattern.
- **P0-3** Step 5 CTA is state-aware: **"Redeploy"** when live (matches the rail); helper copy follows.
- **P0-4** Toast verbs per channel: outbound *"now calling your contact list"*, code *"goes live when your app connects"*, inbound keeps *"answering"*.
- **P1-q1** Step 2 pre-click consequence line for live agents: *"Aria is live on +1 (628) 555-0188. Switching sets that aside (undoable) and applies on redeploy."*
- **P1-q2** Header subcopy is state-aware: live default agent reads *"already live — talk to it, then make it yours"* (no longer contradicts the Live badge).

## Deliberately NOT changed (and why)

- Talk-test simulated-preview states — medium effort, next slice (P1 backlog, top item).
- Import integrity (real adapters, agent-not-voice, diff report) — medium; needs design.
- Stop/Pause for live agents, Code-branch credential rewrite — medium; touch data model + Project Settings.
- Batch operator controls, remapping UI, pre-flight cost — P2, scheduled behind the P1s.

## Open questions only REAL users can answer

Does live-Aria-on-a-number read as magic or as mock billing risk? Does 2-click TTFA survive a real
mic-permission prompt? What do real Retell/Vapi exports contain and is a partial import with a diff
trusted? Would an operator press Redeploy on 248 contacts without a dollar figure? Where do RTE
veterans look for the agent credential? Is voice-carries-the-engine learnable in one session?
Which batch gaps are churn-drivers vs grow-into? How often do runaway agents make Stop critical?
