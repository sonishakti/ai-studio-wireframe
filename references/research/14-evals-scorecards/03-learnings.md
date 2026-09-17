# 14 · Evals & scorecards · learnings

Five vendors read on 2026-09-17: Vapi, Retell, ElevenLabs, LiveKit, plus Coval because LiveKit's own
testing page sends the scoring work to it by name. Teardown and every URL:
`02-research/_docs.md`.

1. **Vapi has already migrated off the exact control we ship, telling new users to replace
   `successEvaluationPrompt` with a reusable object plus a scorecard because structured outputs
   "are where new development happens" (https://docs.vapi.ai/assistants/call-analysis), which settles open
   question 1 in the brief for shape (b).**
   **Changes:** the 2000-character "Evaluation Criteria" textarea at
   `studio_x_2/components/wizard/step-analysis.tsx` :88-103 becomes named criteria rows on an object that an
   agent, a deployment and a test case can each point at, and the duplicate at
   `studio_x_2/app/(dashboard)/deploy/phone-numbers/[id]/number-client.tsx` :205-219 is deleted rather than
   reconciled.

2. **The two vendors who score real calls both report a result and a reason per criterion, and Retell writes
   the contrast into its own docs ("AI QA evaluates each metric separately and reports which ones passed and
   which failed, with a reason for each", https://docs.retellai.com/test/llm-simulation-testing) while
   ElevenLabs returns `success`, `failure` or `unknown` with a rationale for each of up to 30 criteria
   (https://elevenlabs.io/docs/eleven-agents/customization/agent-analysis/success-evaluation).**
   **Changes:** the fabricated "Call Outcome" badge at `studio_x_2/app/(dashboard)/calls/page.tsx` :65
   becomes a criteria-met count backed by rows in `call-detail-sheet.tsx` :305, and `unknown` gets a third
   state with a printed reason, which is also where an Agora call started with `opt_out: true` has to land
   instead of a blank.

3. **ElevenLabs runs one test 2 to 20 times and reports "4/5 passed" with a badge at 100 / ≥80 / <80 and the
   failures bucketed by reason, on the stated grounds that "A single pass shows the agent can succeed;
   probabilistic testing shows how often it will"
   (https://elevenlabs.io/docs/eleven-agents/customization/agent-testing), while Retell tells you to judge a
   scenario "on its pass rate across runs, not one run" and Vapi tells you to compare iterations "instead of
   averaging them away".**
   **Changes:** the status cell at `studio_x_2/components/eval-tests.tsx` :319-339 carries a pass rate beside
   the mode it ran in, the run buttons :226 and :236-238 gain a repeat count, and the pre-flight line at
   `deploy-preflight.tsx` :146-170 stops reading "{n}/{m} passed as text" as though one run were proof.

4. **Retell prices the grading itself, at "$0.10 per minute of analyzed call time" after 100 free minutes
   for AI QA (https://docs.retellai.com/ai-qa/overview) and at "one analysis unit per case" inside a batch,
   on a page that opens "There's no separate test tier and no free testing sandbox"
   (https://docs.retellai.com/test/testing-pricing).**
   **Changes:** the money sentence at `eval-tests.tsx` :247-251 can keep saying an Agora agent minute is not
   billed when no agent starts, but it must stop saying "Text runs are free" without qualification, and a
   CI suite that scores every commit needs the same honest estimate the Run button already carries, since
   `runEstimate()` :204-213 currently returns zero for text by construction.

5. **A self-improving agent ships at exactly one vendor and it never writes on its own: Conductor puts every
   edit in a **Review changes** panel with the node previewed in context, a text diff, a JSON diff behind the
   change description, **Accept change** and **Reject change** per edit, and "Any changes you have not
   accepted are rejected when you submit" (https://docs.retellai.com/conductor/build-and-refine).**
   **Changes:** 868kbyqf6 and 868kyj9w2 are one surface, a review panel on the Composer
   (`studio_x_2/components/composer-chat.tsx`) that proposes a prompt or config diff per failing criterion
   and applies nothing until a person accepts it, which resolves open question 5 to (a) and keeps the
   evidence-before-live floor intact.
