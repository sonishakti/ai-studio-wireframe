# User-test session #2 — 2026-07-09 · depth collapse (Step 1 inline models + voice editor)

**Build tested:** live prod at `b595e6e` (+ `db669e2`, `8827694`).
**Focus:** models inline in Step 1 · pipeline toggle lifted out of the disclosure · VoiceEditorSheet
on-page · import selects in place. Plus regression-check of session #1's six fixes.
**Method:** simulated think-aloud, 3 developer personas, per `references/user-testing-protocol.md`.

## Metrics (vs session #1)

| Metric | #1 | #2 | Δ |
|---|---|---|---|
| Task success | 80% | **76.7%** | ▼ 3.3 |
| TTFA — first interaction | 2 | **1** | ▲ better |
| TTFA — live deployment | 7 | **2** | ▲ much better |
| Friction S1 / S2 / S3 | 0 / 9 / 10 | **1 / 5 / 11** | S2 halved; **1 new S1** |
| Sentiment | +0.37 | **+0.34** | ~flat |
| SUS-lite | 76 | **66.7** | ▼ 9.3 |

**Reading the dip honestly:** TTFA collapsed (7→2 actions to live) and S2s halved — the depth fix
worked. Success-rate and SUS fell because the panel probed *deeper surfaces* this round (import
schema fidelity, SDK auth, voice catalog) and because **pulling controls into the light made
pre-existing shallowness impossible to miss**. The S1 is not a regression from this commit.

## Verdict on the focus commit (moderator, verbatim)

> "A genuine, unanimous win across all three personas and does exactly what it set out to do…
> the hustler never gets bounced, the switcher can judge stack parity in one screen, and the RTE
> veteran can wire a pipeline-only agent without leaving the page. **The commit did not create the
> session's real problems — it exposed and relocated them.**"

All six of session #1's fixes verified live (baseline "Live on …", Redeploy CTA, outbound toast,
Step-2 consequence line, 576px panels, badge tooltip). The badge tooltip became an **aha moment**:
*"answers 'why is this live and who pays?' in one hover."*

## Top frustrations (ranked)

1. **S1 · D2** — Import promises Retell/Vapi/ElevenLabs "map automatically" but parses a generic
   shape, not Retell's real schema (`general_prompt`, `begin_message`, `voice_id`). Silently
   re-homes the user's stack. → **P0 backlog (large)**
2. **S2 · D1+D2** — Talk surface: silent orb, no audio/transcript/state, **no "simulated" label**.
   *"I clicked twice and I'm staring at a glowing ball."* → **partly FIXED (disclosure)**; the real
   transcript exists but is gated behind the future-scope flag (owner-controlled).
3. **S2 · D2** — "Import as draft" yields a *voice artifact* + playground bounce, no agent in the list. → P0 backlog
4. **S2 · D2** — "Create a custom voice" edits a persona blurb over a stock voice; no cloning. Label oversells. → P2
5. **S2 · D3** — No Developer/SDK home outside the wizard. → P2
6. **S2 · D3** — Snippet auths with `AGORA_API_KEY`; no App ID / token / uid. App ID renders `prj_123456`. → P1
7. **S3 · D1** — Pipeline toggle is raw jargon at the top of the funnel. → **FIXED (re-framed, not re-hidden)**
8. **S3 · D1** — "Redeploy" is the loudest button before any change; "Talk to Aria" is a whisper. → **FIXED**
9. **S3 · D2+D3** — Barge-in tuning buried in Optional › Advanced, never called "barge-in"; multimodal
   silently removes the VAD knobs. → **partly FIXED** (toggle now explains it); label rename pending.

## Aha moments (protect these)

- Live-badge tooltip: *"answers why-is-this-live and who-pays in one hover"* (new this session)
- Batch pre-flight manifest with a **stack-derived** cost estimate + "Talk to it first" / "Not yet"
- `{{variable}}` ↔ CSV-column mapping with a deploy-blocking red flag
- System prompt vs Greeting separation ("this is its only greeting")
- Live-vs-draft honesty — *"clearer than Vapi's published-vs-draft"*
- **The focus commit itself**: *"one click to switch cascade↔realtime without a route change — exactly
  the altitude Retell/Vapi put it at."*

## Changes shipped from this synthesis

The panel's P1 was *"defer the pipeline toggle behind an Advanced disclosure."* **Rejected** — that
reverts the owner's explicit directive. Depth was the disease; jargon was the symptom. Fixed the symptom:

- **Pipeline toggle stays visible, now legible**: framed as *"How it listens and speaks / Most people
  keep the default"*; options renamed **"Separate models (default)"** and **"One realtime model"** with
  plain-language sublabels.
- **Multimodal now explains itself**: "The model owns turn-taking, so the interruption and end-of-speech
  controls in Advanced don't apply" — closing the silent-knob-disappearance trust flag.
- **Hero button swap**: with a live agent and no pending edits, **Talk is primary and Redeploy is
  secondary**; they swap the moment there's an unsaved change.
- **Talk panel discloses the simulation**: "Simulated preview. No live audio in this wireframe, and
  testing in-browser is free." (Also surfaces the free-to-test reassurance at the click, a latent need.)

## Deliberately NOT changed

- Import fidelity (S1) + import-creates-an-agent — large; needs real competitor schemas. Top of backlog.
- Un-gating the F-Eval transcript — it sits behind the owner's future-scope flag by design.
- Voice-catalog breadth / real audio / cloning — wireframe has no audio.
- Developer/SDK nav home, SDK credential rewrite, App-ID shape — P1/P2, touches Project Settings.

## Open questions for REAL users

Does an audio+transcript Talk surface actually convert the believe moment? Will a genuine Retell export
round-trip, and which dropped fields do migrators mourn? Do real first-timers ignore the (now re-framed)
pipeline toggle, or does it cause top-of-funnel drop-off? Does BYO-SIP kill activation for number-less
accounts? Is "Redeploy loudest" a real misread or a skim artifact of simulated personas?
