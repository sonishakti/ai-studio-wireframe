# Simulated User-Testing Protocol — Studio_X developer focus group

> **Repetitive protocol (2026-07-09, user-directed).** After EVERY commit that ships user-facing
> change, run a simulated moderated usability session with the three developer personas below
> (LLM agents as test participants, UXAgent-style), think-aloud format, against the LIVE build.
> Deliver: success metrics · learnings · changes made from synthesis. Reports land in
> `references/user-tests/`. Runner: `.claude/workflows/user-test.js` (Workflow tool,
> `{scriptPath, args: {date, commit, focus, url}}`).

## Why simulated (and its limits)

LLM persona agents let us run usability tests at scale BEFORE real users (the UXAgent /
Synthetic Users pattern; commercial analogues: UserTesting, Maze, Lookback). They are a
pre-filter, not a replacement: they catch wayfinding breaks, mental-model mismatches, copy
that doesn't land, and missing states — they cannot feel real latency, real audio quality, or
real organizational pressure. Qualitative emphasis (think-aloud, interviews) is deliberate:
task-success numbers alone miss the "why". Validate high-stakes calls with real developers
before heavy build-out.

## The three developer personas (from LEARNINGS §4)

| Id | Persona | Grounding | Mode | Session tasks |
|---|---|---|---|---|
| **D1** | **The Hustler** — first-time voice-AI builder | P1 (primary): "task-focused, mid-coding, zero patience for friction" | Skims, clicks the biggest affordance, abandons on the 2nd confusion | Land → understand Aria → talk to it → launch a batch campaign end-to-end → deploy |
| **D2** | **The Switcher** — Vapi/Retell/ElevenLabs veteran | P1 breadth: "any hustler who has considered or used LiveKit, ElevenLabs, or Retell.ai" | Compares everything to competitor mental models; hunts for parity (voice stack control, dynamic vars, batch dialing) | Import a Retell config → verify prompt/voice mapped → check model stack control → batch calls with CSV vars → judge trust ("what exactly is live?") |
| **D3** | **The RTE Veteran** — existing Agora SDK developer | Legacy persona: "build video/voice/live-streaming with Agora SDK", low patience for new IA | Thinks in App IDs, channels, tokens, docs; suspicious of wizards | Add conversational AI to an existing RTC app via Code/SDK path → find credentials → join a channel snippet → confirm how to stop/billing |

## Session format (per persona, think-aloud)

1. **Cold open** on the live URL (default `https://ai-studio-console-redesign.vercel.app/agents`).
   The agent narrates in first person, present tense, at every step: what it sees, what it
   expects, what it clicks, what surprises it.
2. Agents "use" the app by fetching the live routes' SSR HTML and resolving interactions
   against the source (`studio_x_2/components/wizard/*`, `app/(dashboard)/**`) — the proxy for
   clicking. They must ground every observation in something actually on screen.
3. **Conversational-AI-specific checks** each session: prompt understanding (does the UI make
   clear what the system prompt controls?), response-quality expectations (does the test
   surface set honest expectations?), conversation-flow config clarity (turn-taking, greeting),
   and **TTFA** — time-to-first-agent proxy: count of user actions from landing to (a) first
   agent interaction and (b) live deployment.
4. Everything is logged as: **needs · frustrations (S1 blocker / S2 major / S3 minor) · latent
   needs · aha moments · trust/explainability flags** ("why did it do that?" moments with no
   answer on screen) + per-phase sentiment (−2…+2) + SUS-lite.

## Metrics rubric (comparable across sessions)

| Metric | Definition |
|---|---|
| Task success | pass / partial / fail per persona-task → % across the panel |
| TTFA (interaction) | actions from landing → first agent interaction (target ≤ 2) |
| TTFA (live) | actions from landing → live deployment (target ≤ 12) |
| Friction events | count by severity S1/S2/S3 |
| Sentiment | mean of per-phase −2…+2 |
| Trust flags | unanswered "why/what happened" moments |
| Aha moments | count + quotes |
| SUS-lite | 5 items, scaled 0–100 (ease, confidence, coherence, recovery, recommend) |

## Report template (`references/user-tests/YYYY-MM-DD-<slug>.md`)

Metrics table → per-persona highlights (quotes) → synthesis (ranked frustrations, latent
needs, aha) → **what we changed** (commits) → what we deliberately did NOT change and why →
open questions for REAL user validation.

## Cadence rule

After every commit+deploy: run the workflow with `focus` = what the commit changed, write the
report, fix what synthesis ranks P0/quick-P1, commit those fixes, and report to the owner:
**success metrics · what we learnt · what changed**.
