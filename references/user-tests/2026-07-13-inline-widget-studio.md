# User test — 2026-07-13 · Widget studio moves INTO the builder (commit `4c8d7f7`)

> Session #6 (protocol: `references/user-testing-protocol.md`), 3 personas, live build.
> Focus: builder Step 4 (inbound · web) now embeds the full studio inline — styling,
> live preview, embed snippet, embed-truth — with the `/deploy/web-widget` link-out gone.
> Fixes shipped in the follow-up commit (see below).

## Metrics (trend across sessions)

| Metric | #6 | #5 | #3 (A1) | #2 (X1) | Read |
|---|---|---|---|---|---|
| Task success | 76.7% | 76.7% | 76.7% | 76.7% | flat (failures moved to import) |
| TTFA (interaction) | **1** | 1 | 3 | 2 | holding at best |
| TTFA (live) | **7** | 9 | 7 | 6 | back under 9; D1 batch = 13 actions, zero page hops |
| Friction | 2×S1 · 8×S2 · 11×S3 | 1×S1 · 6×S2 | 1×S1 · 9×S2 | 2×S1 · 9×S2 | both S1s = import (deliberately probed this round) |
| Sentiment | **+0.60** | +0.56 | +0.51 | +0.42 | ↑ five sessions running |
| SUS-lite | 74.7 | 77.3 | 74.7 | 72 | dip carried by import + Code-step trust, not the focus |

## Focus verdict (the inline studio)

Moderator: "**Passes on its own terms across all three personas with zero regressions
found.**" D1: the commit is "invisible in exactly the right way" — the batch spine is
untouched and the heavier Step 4 is opt-in behind the Phone/Web toggle. D2 (Retell
switcher): "delivers what it claims… the embed-truth line is **the most honest
widget-state UX I've seen** across Retell, Vapi, or ElevenLabs." D3 delivered the
sharpest finding: the commit *proves* the team can tell the truth about copied snippets,
then didn't apply it to the Code step — "the only channel whose snippet can lie silently."

## Fix disposition

| Sev | Finding | Disposition |
|---|---|---|
| P0 | Code-step credential is a dead reference (`AGORA_API_KEY` → a key that exists nowhere; Project Settings has App ID + Certificate) | **FIXED** — snippets speak App ID; EmbedConfig line now says "Your App ID lives in Project Settings"; one sentence explains secured-mode joins (platform mints the agent's token from the App Certificate) |
| P1 | Code snippet interpolates placeholder `agentId: "new"` pre-publish, silently copyable | **FIXED** — pre-publish warning line (same truth-line idiom as the widget): ID is minted on deploy; deploy first, then copy |
| P2 | Docs Center button dropped on the docs homepage | **FIXED** — deep-links `docs.agora.io/en/ai` ("Voice Agent overview", URL verified live) |
| P0 | Import rejects real vendor exports (Retell `agent_name`/`response_engine`, Vapi `model.messages`) — banner promise collapses | **Spun off** as its own task (2×S1; import is its own slice, per-vendor parsers + honest banner copy) |
| P0 | Import silently drops the imported prompt into Aria's draft (`seedFromVoice` keep-existing rule) | **Spun off** with the above — needs a create-new vs apply-here fork + conflict prompt |
| P1 | Simulated Talk plays a canned order-lookup script that ignores the configured greeting/prompt | Next slice — recurring since #5; the only pre-deploy verification must be prompt-aware |
| P1 | Concurrency capacity truth gated off by default; caller-ID has no recommended option; pre-flight makes no pause promise; "Redeploy" unexplained for the self-provisioned agent | Backlog (all quick) — logged on the register |
| P2 | Widget restyles require re-pasting the snippet (attributes carry styling; ElevenLabs applies server-side) | Roadmap-scale — server-side styling; embed-truth line stays for structural changes |
| — | Step 4 web mode stacks two adjacent truth systems (wizard "redeploy to apply" vs widget "re-copy the snippet") | **Watch item** — both lines are individually honest; no conflation observed yet, D2 flags the risk |

## Durable learnings

1. **Inline beats hub for build-time surfaces.** The same studio scored better inside the
   builder than it did as a destination page in #5 — a mid-build page hop is an
   abandonment trigger for the first-timer persona; the standalone page's remaining job
   is post-build management.
2. **A truth mechanism shipped for one channel indicts its siblings the same session.**
   D3 measured the Code step against the widget's embed-truth line within minutes of
   meeting it. Copy-state honesty (placeholder/stale/current) is a product-wide contract,
   not a per-surface feature.
3. **Panes beside rails need container queries, not viewport breakpoints.** At 1280px the
   step pane is ~580px; a viewport `lg:` split would have sliced the fixed-width preview
   into a 280px column. `@container`-driven layout (split at 56rem of pane) is the
   pattern for anything living right of the builder rail.
