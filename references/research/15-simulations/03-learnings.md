# 15 · Simulations — Learnings from four competitor environments

Evidence: `02-research/{vapi,elevenlabs,livekit,retell}/report.md` + shots.
Question asked of every vendor: does the product present **deterministic scripted evals** and
**automated voice simulations** as two surfaces, one, or neither?

## The count, on engineering's exact seam

| Vendor | Shape | Their labels, verbatim | Audio in an automated test? |
|---|---|---|---|
| **Vapi** | **SPLIT** | `Evals` · `Simulations` (two nav items under Observability) | Yes — but as a **mode**: *chat mode* or *voice mode* on one Simulation |
| **LiveKit** | **SPLIT** | `Test framework` · `Agent simulations` (two nav sections, two APIs) | Yes — but as a **mode**: *text mode (default)* or *audio mode* on one scenario |
| **ElevenLabs** | **ONE** | one `Test` object, types `Simulation test` · `Next reply test` · `Tool invocation test` | **No.** No audio anywhere. They *deprecated* their separate simulate API into this object |
| **Retell** | **NEITHER** | `LLM Playground` · `Simulation testing` · `Web call testing` · `Phone call testing` | **No.** Automated tests are text; audio testing is **a human on a mic** |

**2 of 4 split, so the owner's bar is met.** But the seam they split on is not the seam the bar
was about, and that matters more than the count — see learning 1.

## Learnings

1. **Nobody splits text from audio. They split turn-level from whole-conversation.** Both
   splitting vendors draw the same line, and it is not ours. LiveKit: *"Use the test framework for
   turn-level behaviors such as tool usage and error handling. Use simulations to evaluate
   behaviors that span multiple turns."* Vapi: *"did the agent make the right next decision?"* vs
   *"did the agent reach the right outcome?"* In **both**, audio is a **run mode inside the
   simulation object** — Vapi chat/voice, LiveKit text/audio — never its own surface. 0 of 4 give
   audio a surface of its own. (`vapi/report.md` comparison table; `livekit/report.md` nav + modes.)

2. **The deterministic half is a developer artefact everywhere it exists.** LiveKit's is literally
   pytest/Vitest functions in your repo — *"does not make a LiveKit room connection"*. Vapi's is a
   JSON `messages` array plus a `judgePlan`, sold on CI/CD. Neither is a thing a non-developer
   authors in a console. Our console user is not who those surfaces were designed for, so copying
   the split wholesale imports an audience we do not have. (`livekit/report.md` object model.)

3. **"Simulation" already means *text* in this market.** ElevenLabs' "Simulation test" is text-only
   and LLM-graded. Retell's "Simulation testing" is *"a text conversation"*. LiveKit's simulations
   default to text mode. Naming our audio feature "Simulations" would collide with the word three of
   four competitors already use for the thing without audio. The audio-ness has to be said out loud
   wherever it applies, not carried by the section name. (`elevenlabs/report.md` finding 2.)

4. **Automated voice testing is still whitespace.** Only Vapi and LiveKit can run a persona over the
   real audio pipeline, LiveKit's is BETA and Python-only, and LiveKit openly defers heavy audio
   testing to third parties (*"Bluejay, Cekura, Coval, Hamming"*). Retell hands audio to a human;
   ElevenLabs has none. This is consistent with 2026-07-09 (evals = table stakes) and sharpens it:
   **evals are table stakes, automated voice runs are not yet.**

5. **Tool mocking is the part every serious vendor states out loud, and we do not.** ElevenLabs:
   mock none / all / selected, with a fallback of *call the real tool* or *finish with error*.
   LiveKit: `mock_tools()` scoped to a block. Vapi: exact `toolCalls` assertions. Our JTBD rainy 4
   ("my test booked a real appointment") is answered by everyone but us.

6. **Two specialists split on a different axis again — beware the word.** Coval's docs are
   **Simulate** then **Evaluate** (*"turn a conversation into a measurable signal"*), and Hamming
   reuses its judges across simulated and production traffic. For them an "eval" is the **scoring
   layer**, not a test type. Three different meanings of "eval" are in play across six vendors; ours
   must be defined on screen, not assumed.

7. **Save-a-real-call-as-a-test is no longer whitespace.** ElevenLabs ships *"Create test from this
   conversation"* in call history; Retell saves playground scenarios as graded cases. Our 2026-07-09
   whitespace claim is stale and should be dropped from the differentiation story — but kept as a
   feature, because it is the cheapest way to fill an empty suite.
