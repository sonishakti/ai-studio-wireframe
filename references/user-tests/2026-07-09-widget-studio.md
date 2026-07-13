# User test — 2026-07-09 · Web Widget studio (commit `737f1bf`)

> Session #5 (protocol: `references/user-testing-protocol.md`), 3 personas, live build,
> entering at `/deploy/web-widget`. Fixes shipped in the follow-up commit (see below).

## Metrics (trend across sessions)

| Metric | #5 | #4 (A6) | #3 (A1) | #2 (X1) | Read |
|---|---|---|---|---|---|
| Task success | 76.7% | — | 76.7% | 76.7% | flat |
| TTFA (interaction) | **1** | — | 3 | 2 | ✅ best yet (ceremony CTA seam fixed) |
| TTFA (live) | 9 | — | 7 | 6 | under target (≤12) |
| Friction | 1×S1 · 6×S2 · 11×S3 | — | 1×S1 · 9×S2 | 2×S1 · 9×S2 | S2s trending down |
| Sentiment | **+0.56** | +0.51* | +0.51 | +0.42 | ↑ four sessions running |
| SUS-lite | **77.3** | 74.7* | 74.7 | 72 | ↑ four sessions running |

## Focus verdict (the Widget studio)

"The right page at the right depth — all three personas independently rated the configurator
Vapi-competitive… It converts a dead footnote redirect into a real channel surface without
adding any friction to the batch-calls spine." Three gaps defined its grade: no draft/live
embed semantics ("is this live right now?"), reachability (a footnote was the only door), and
a security flag (public `data-agent-id`, no visible domain allowlisting).

## Fix disposition

| Sev | Finding | Disposition |
|---|---|---|
| P0 | The honest talk UI (transcript/banner/chips) was future-scope-gated — default users got the silent orb AGAIN | **FIXED** — ungated; it's a trust repair, not a roadmap feature. Evals stay gated |
| P0 | Widget studio had no embed-state truth ("is this live?") | **FIXED** — last-copied-snapshot tracking → "Not embedded yet / Edits aren't in your embed — re-copy / Up to date"; "Live Preview" → "Preview" |
| P1 | Studio reachable only via a footnote | **FIXED** — visible "Customize in Widget studio" button in the wizard web step |
| P1 | Caller-ID pool hid the obvious outbound pool; "SMS Sender" provenance confusing | **FIXED** — outbound-carrying numbers offered; sandbox number labeled as such |
| P1 | Live-badge rationale hover-only | **NOT changed** — contradicts today's explicit owner call (tooltip on the badge); logged as a tension for the owner |
| P0 | Import chips don't parse real competitor exports | **A4 cycle** (already its core scope) |
| P1 | Code/SDK auth story (API key origin / token / uid) | **A3/code cycle** (recurring; on the register) |
| P2 | Domain allowlist for the embed snippet; batch stop/pause statement; CSV column remap; batch scheduling | Backlog — logged as latent needs |

## Durable learnings

1. **Gating can regress honesty.** A feature gate must never re-open a fixed trust break —
   repairs to the current product ship ungated even when they were built inside a gated cycle.
2. **A styling surface for an embeddable artifact needs embed-state semantics** — the builder's
   "Edits are not live yet" contract has to follow the config wherever it goes.
3. **"Live" is a reserved word** — it means deployed-and-taking-traffic, nowhere else.
