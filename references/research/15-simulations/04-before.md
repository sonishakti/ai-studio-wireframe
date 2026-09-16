# 15 · Simulations — Before, and what is wrong with it

**Before:** `references/research/15-simulations/04-before/before-test-section.png`
Live: <https://ai-studio-console-redesign.vercel.app/agents/agt_default/edit?step=4>
Source: `studio_x_2/components/eval-tests.tsx` (`TestsSection`), shipped 2026-07-09 as F-Eval, last
touched 2026-09-16 (row delete + flask icon).

A design already exists, so this is a Before → After, not a blank page. What is on screen today: one
table, two doors into it (the **Test** section and the **Test scenarios** rail), rows of
`persona → assertions`, a Run per row, Run all, Add case, Generate scenarios, and a verdict badge.

## What is wrong

Each bullet ties to a JTBD scenario or a roadmap ticket.

1. **It is one surface pretending to be one machine, and it is two.** The case is authored as a
   **persona** — identity, goal, personality — which is the shape of a voice simulation. The run is
   **instant, silent and deterministic** — which is the shape of an eval. Neither ticket's promise is
   actually kept: a persona implies the real runtime (audio, timing, interruptions) that never runs, and
   an eval's contract (scripted turns, mocked tools, CI) has no way to be expressed.
   → [868kyv3tm](https://app.clickup.com/t/868kyv3tm), JTBD rainy 3.

2. **Four nouns for one object.** The rail door says **Run test scenarios**, the section says
   **Scenarios**, the table column says **Test Name**, the button says **Add case**, the hint says
   **failing scenarios**. A user cannot tell whether a scenario, a test and a case are three things or
   one. (Evidence: the Before shot.)

3. **Nothing on screen says what a run actually did.** No audio, no minutes, no "simulated" mark on the
   result — while the standing F-Eval rule from 2026-07-09 is that *every* test surface carries a live
   transcript, explicit state, and a loud Simulated banner. The transcript exists in the result sheet;
   the table that summarises it says nothing. → JTBD rainy 3, 7.

4. **The tool story is invisible.** Assertion kind "tool call" exists, but there is no statement anywhere
   that a test does — or does not — hit the customer's real endpoint. The P0 ticket makes deterministic
   mock tool responses a headline promise. Today a user has to assume. → JTBD rainy 4.

5. **No route out of the product.** The P0 ticket requires the same suite to gate a candidate "through
   the API or CLI without changing its meaning". There is no export, no identifier, no mention of CI.
   → JTBD rainy 5.

6. **Regenerate is destructive and silent.** `key={generation}` remounts the table, so Generate
   scenarios discards authored cases and any deletions. Nothing warns. → JTBD rainy 8.

7. **The two mounts do not share state.** The section table and the rail table are separate instances of
   the same component: add or delete in one, the other does not change. The delete added on 2026-09-16
   made this visible for the first time.

8. **A long run has no home.** Everything assumes a run finishes while you watch (1.2 s mock). Thirty
   voice simulations will not. There is no queue, no progress, no "come back later".
   → [868kbyqf8](https://app.clickup.com/t/868kbyqf8), JTBD rainy 10.

9. **No comparison.** "Is this better than what is live?" has its own P0-adjacent ticket
   ([868ka25nz](https://app.clickup.com/t/868ka25nz)) and no expression in the design. → JTBD rainy 11.

## What is right, and must survive any redesign

- The **table is the suite** (F-Eval judge round, 2026-07-09: won author-to-value and fold-fit).
- **Plain-language rubric assertions** — "PASS if the agent declines gracefully".
- A failing case **names the config gap and points at the control that exists for that channel**.
- **Generate from the agent's own context** — the answer to the empty state.
- The failing assertion is **anchored onto the offending transcript turn** (`SimTranscript`).
- **Save a real call as a test** stays whitespace worth taking.
