# 15 · Simulations — five directions, one verdict

Audited against `01-jtbd.md` (11 rainy scenarios), `03-learnings.md` (7 learnings), the
[P0 eval ticket](https://app.clickup.com/t/868kyv3tm) and the
[voice-simulation tickets](https://app.clickup.com/t/868kbyqf8), and the standing builder locks.

---

## A · Two peers — "Evals" and "Voice simulations"

Two sections in the rail, two tables, two empty states, two verdict lines. Mirrors engineering's
tickets one-to-one and mirrors Vapi/LiveKit's nav.

- **For:** zero translation between the plan and the screen. Each surface can state its own
  boundary ("this does not test audio"), which is learning 5's honesty move.
- **Against:** it splits on a seam **no competitor actually splits on** (learning 1) — it puts the
  text/audio difference in the navigation, where 0 of 4 vendors put it. It also asks the user
  "which of these two do I need?" before they have written anything, and doubles the empty state
  in a builder that is already five sections long. Directly contradicts the owner's standing rule
  that things which belong together live together and look the same.
- **Cost:** high. Two of everything, forever.

## B · One suite, typed cases (the ElevenLabs shape)

One **Tests** table. Every row has a **type**, chosen as tabs in the Add-case flow:
**Decision check** (one turn, known history, exact / regex / tool-call assertions, mocked tools)
· **Conversation** (a persona pursuing a goal, graded on the outcome).
Type decides the runner, so engineering's boundary is kept at the object level, not the nav level.

- **For:** one door, one empty state, one verdict line, one place the rail points at. Validated by
  the only vendor that has been through the merge (ElevenLabs deprecated its separate API into this
  exact shape). Keeps the 2026-07-09 "table is the suite" result.
- **Against:** a type dropdown can hide a real difference — a Decision check and a Conversation
  cost different amounts of time and money, and a row that does not say so is dishonest.
- **Cost:** low. Our `EvalCase` already carries assertions; it gains a `type` and loses the
  assumption that every case has a persona.

## C · B, plus audio as a run mode (the Vapi/LiveKit graft) — **recommended**

B's one typed suite, **and** the audio question answered where both splitting vendors actually
answer it: at run time. A Conversation case runs **as text** (seconds, free) or **with audio**
(the real STT→LLM→TTS path, turn-taking, interruptions — and agent minutes). The mode is on the
Run control and stamped on every result row; a text pass never wears the same badge as an audio pass.

- **For:** matches learning 1 exactly — the seam competitors put in the nav (turn-level vs
  whole-conversation) becomes the case **type**; the seam nobody puts in the nav (text vs audio)
  becomes the **mode**. Answers JTBD rainy 3 (a green tick that only proves text is labelled as
  such), rainy 7 (cost is visible at the moment you choose to spend it) and learning 3's naming
  collision, because audio is stated per run instead of carried by a section name.
- **Against:** a single control now carries two consequences (time, money). Needs the run button to
  be honest and unhurried — "Run with audio · ~4 min · ~$2.40" — not a silent toggle.
- **Cost:** low-medium, and it is mostly copy plus one badge.

## D · Split by *when*, not by *what*

Same objects; two homes. **Checks** sit in the builder (author-time, instant, text). **Runs** get a
pre-deploy home in Go Live, where a batch of audio runs can take minutes, show progress, and gate
the deploy.

- **For:** the only direction that answers rainy 10 (nobody is watching a thirty-call run) and
  rainy 5 (gate a deploy) structurally rather than with a spinner. Fits the existing Go Live
  pre-flight, which already blocks on real conditions.
- **Against:** on its own it does not settle the eval/simulation question at all — it is orthogonal.
  Best taken as a graft onto B or C, not as the spine.
- **Cost:** medium.

## E · Suite and Runs as the seam (the Coval/Hamming shape)

Separate **what to test** (the suite) from **what happened** (run history, comparison, and a shared
scoring layer that can later grade real production calls too).

- **For:** the only direction that reaches the comparison ticket
  ([868ka25nz](https://app.clickup.com/t/868ka25nz)) and the production-scoring ticket
  ([868ka25tc](https://app.clickup.com/t/868ka25tc)) without a second redesign, because the scoring
  criteria become an object in their own right.
- **Against:** the heaviest to build, and the run-history half earns its keep only once runs are
  slow and plural — which is exactly the state we are not in yet.
- **Cost:** high. Right shape for later; premature as the first move.

---

## Verdict

**C, with D's second home taken as a graft.**

One suite. Every case carries a **type** — Decision check or Conversation — which is the seam two of
four competitors validated and the one engineering's own tickets describe as "decisions" versus
"outcomes". Every run carries a **mode** — text or audio — which is where both splitting vendors
put it and where the honesty about minutes and money belongs. Long batched runs get a home in
Go Live, next to the pre-flight that already gates deploys.

Why not A, given the owner's two-competitor bar is technically met: the two vendors who split do
**not** split the thing the bar was about. They split turn-level from whole-conversation and then put
text-versus-audio inside one object as a mode. Direction A would copy their *number of surfaces*
while ignoring *where they drew the line* — the shape would look validated and be wrong. C carries
engineering's boundary faithfully (a Decision check can never silently become a voice run, and an
audio pass is never confused with a text pass) at one quarter of the surface area.

Open question for engineering, not designable without an answer: whether
[Send a custom instruction](https://docs.agora.io/en/conversational-ai/rest-api/agent/think) — text
injected into a running agent as user input — returns text or speaks. If it can answer in text, a
Decision check can run against the **real** pipeline rather than a mock of it, which no competitor
currently offers.
