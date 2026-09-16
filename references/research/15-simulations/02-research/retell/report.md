# Retell AI — testing/eval surface research

Session note: the drive server (port 9333) reported "drive server not running" at the start of
this task. Per instructions, it was not started or stopped. **No screenshots were captured** —
this report is built entirely from `docs.retellai.com` (fetched via WebFetch/WebSearch). The
logged-in dashboard (dashboard.retellai.com) was **not reached** for the same reason, so the
"inline test affordance in the agent editor" and any run/result detail views are **not verified
visually** — only documented behavior is reported below.

## Verdict line

**NEITHER** cleanly — Retell is a **third shape**, closer to Vapi's split than to ElevenLabs'
single-object model, but it fragments further: it has FOUR nav items under "Test" (LLM
Playground, Simulation testing, Web call testing, Phone call testing), and only one of the two
things Agora cares about — evals — has a real automated/graded/API-able form ("Simulation
testing"). The other half of Agora's split — an **automated AI-persona caller exercising the
real voice runtime** — **does not exist at Retell**. Their voice-path tests ("Web call testing",
"Phone call testing") are a **human talking into a mic or phone**, ungraded, not a simulated
caller. So: Retell = ONLY EVALS (automated) + human-manual voice QA, not "ONLY SIMULATIONS" and
not a true SPLIT of two automated surfaces the way Vapi has.

## Verbatim nav labels + source URLs

From `https://docs.retellai.com/test/test-overview` ("Testing overview"), section "Testing methods":
- **LLM Playground** — "Chat with your agent in text, by hand or with an AI-simulated user, and inspect tool calls and transitions turn by turn." (`/test/llm-playground`)
- **Simulation testing** — "Save scenarios as graded test cases and run them, one at a time or as a batch, to catch regressions automatically." (`/test/llm-simulation-testing`, list/run UI at `/test/batch-test-simulation`)
- **Web call testing** — "Talk to your agent in the browser to hear real audio, latency, and interruptions, without a phone number." (`/test/test-web`)
- **Phone call testing** — "Place or receive a real phone call to validate telephony: carrier audio, DTMF, and transfers." (`/test/test-phone`)

Also linked from the overview page but a separate section entirely: **AI QA** (`/ai-qa/overview`,
"Automatically evaluate call quality with AI QA") — this is **post-call production monitoring**
(sampled real calls graded against configured rules/metrics: hallucination, KB accuracy, latency,
sentiment, tool usage), not a pre-deploy test surface. Not part of the eval-vs-simulation question,
but worth noting as a third, unrelated surface in their IA.

Per-agent UI: the LLM Playground doc says it lives as a **"Test LLM" tab** in an agent's "Test
panel", implying the agent editor has a **Test panel with multiple tabs** (Test LLM / Test Audio
per `/test/llm-playground`: "The Test LLM tab isn't available for custom LLM agents or
speech-to-speech voice agents" and "Chat agents lack a Test Audio tab" per the overview page) —
this was not visually confirmed (no dashboard access this session).

## Object model

**LLM Playground** = a live, ungraded text chat against the agent, either typed manually ("Manual
Chat") or driven by an AI persona ("AI Simulated Chat" — "an AI plays the user from a prompt").
Every turn shows node transitions, tool invocations, and tool results. No scoring; it's an
interactive debugger, not a test record.

**Simulation testing** = the actual eval object. A saved test case = a **persona prompt**
(Identity / Goal / Personality fields) + **dynamic variables** + **custom-function mocks** + a
choice of **LLM to play the simulated user**, run as a **text conversation** (verbatim: "the
simulated user...runs your scenario in a text conversation") against **success criteria**
(behavioral checks). Grading is **LLM-judge, single-pass, single-verdict-for-the-whole-run**:
"all of its criteria are judged together in a single pass against the transcript: the run passes
only if every criterion is met, and you get one explanation covering the whole run rather than a
verdict per criterion." That is coarser than Agora's per-turn assertion model (exact / regex /
structured / AI-judge) — Retell has no visible exact/regex/structured assertion type, only
LLM-judged criteria evaluated once over the full transcript. Test cases are batchable/runnable via
a **Create Batch Test API** (1–1,000 test case IDs per job, returns pass/fail/error counts + job
status), so there IS a CI/API route for this half.

**Web call testing / Phone call testing** = NOT an automated simulated caller. It is a **human**
clicking "Run Test," granting mic access, and talking to the agent live in the browser (or placing
a real phone call) "to hear how it sounds." Explicitly for hearing "real audio, latency, and
interruptions." No automatic grading — the docs point to asking their "Conductor" assistant to
review the transcript/recording afterward, i.e. human/manual judgment, not a scored test artifact.
Custom-LLM and speech-to-speech agents cannot use Test LLM or Simulation testing at all (voice-only
testing is their only option for those agent types).

## Is audio ever exercised by a test?

Yes, but only in the **human-driven** surfaces (Web call testing, Phone call testing) — never in
Simulation testing, which is explicitly text-only ("runs your scenario in a text conversation").
Evidence:
- Test overview: "Web and phone call methods test real audio, latency, and interruptions."
- Web call test page: "A web call test lets you talk to your agent in the browser, so you hear how
  it sounds" / "Click Run Test and allow microphone access, then talk to your agent."
- Phone call test page (per overview): "carrier audio, DTMF, and transfers."

There is no automated/scripted persona that drives an actual voice call end-to-end the way Vapi's
"Simulations" (voice mode) does — Retell's audio tests require a live human on the mic/phone each
run, so they cannot run unattended in CI.

## Screenshot table

| Screenshot | Shows | URL |
|---|---|---|
| — | not captured this session (drive server down; dashboard not attempted per fallback rule) | — |

## Design implications for Agora

1. **Retell validates Agora's split in spirit but not in Retell's own execution** — they clearly
   distinguish "fast graded text checks" from "hear real audio," which maps to Agora's evals vs.
   voice-simulations distinction. But Retell never automated the voice half: their "voice test" is
   a human on a call, not a simulated caller. If Agora ships an **automated AI-persona voice
   simulation with real audio + interruptions + timing**, that is a differentiator over Retell
   (matches Vapi's more advanced "Simulations," not Retell's manual approach).
2. **Retell's eval grading is coarser than Agora's plan** — one LLM-judge verdict per whole run,
   no per-turn exact/regex/structured assertion types visible in docs. Agora's plan (assertion
   types per turn: exact / regex / structured / AI-judge) is more granular and likely easier to
   debug (know which turn failed, not just "somewhere in this transcript"). Worth keeping our
   per-assertion feedback as an explicit differentiator.
3. **Agent-type gating is a real constraint pattern worth copying/avoiding**: Retell disables
   Test LLM/Simulation entirely for custom-LLM and speech-to-speech agents, forcing those users
   into human voice testing only. If Agora's evals also depend on a scriptable LLM response
   engine, decide up front how agents built on a fully custom/opaque runtime get evaluated (don't
   silently drop the eval surface for them without an explicit message, the way Retell seems to).
4. **A third, adjacent surface exists at Retell worth being aware of but distinct from this
   question**: "AI QA" — automated grading of a *sample of real production calls* (not pre-deploy
   tests). If Agora ever wants a "production quality monitoring" feature, it is a related but
   separate concept from both evals and voice simulations — don't conflate it with either in our
   IA.
5. Not reached / unresolved: exact per-agent UI layout (Test panel tabs, empty states, create-test
   flow visuals, run/result detail screens) — needs a follow-up pass with dashboard access to
   confirm visually.
