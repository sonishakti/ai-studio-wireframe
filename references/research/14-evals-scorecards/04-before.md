# 14 · Evals & scorecards · Before, and what is wrong with it

**Before:** `references/research/_before10-2026-09-17/before-14-tests.png`
Live: <https://ai-studio-console-redesign.vercel.app/agents/agt_default/test>

Sources, with the last commit that touched each:

| Surface | File | Last changed |
|---|---|---|
| Test Playground (the shot) | `studio_x_2/app/(dashboard)/agents/[id]/test/page.tsx` :39 mounting `studio_x_2/components/agent-playground.tsx` | `0ac8422`, 2026-09-12 |
| The Tests table | `studio_x_2/components/eval-tests.tsx` (`TestsSection` :81, `AddCaseSheet` :523, `RunSheet` :404, `ResultSheet` :475) | `3e901b5`, 2026-09-16 |
| The generator and the builder mount | `studio_x_2/components/wizard/test-section.tsx` | `3e901b5`, 2026-09-16 |
| The eval data model | `studio_x_2/lib/campaign-data.ts` :140-345 | `fb6f7e3`, 2026-09-16 |
| The criteria box | `studio_x_2/components/wizard/step-analysis.tsx` :78-104 | `19255b2`, 2026-08-10 |
| The second criteria box | `studio_x_2/app/(dashboard)/deploy/phone-numbers/[id]/number-client.tsx` :205-219 | `0ac8422`, 2026-09-12 |
| The scored call | `studio_x_2/app/(dashboard)/calls/page.tsx`, `studio_x_2/components/call-detail-sheet.tsx` | `0ac8422`, 2026-09-12 |
| The gate and the version table | `studio_x_2/components/wizard/deploy-preflight.tsx` :146-196, `studio_x_2/components/wizard/deploy-section.tsx` :145-160 | `3e901b5`, 2026-09-16 |
| The fix engine | `studio_x_2/lib/diagnostics.ts` | `0ac8422`, 2026-09-12 |

A design exists for the half that runs before shipping and for a text box that grades after it. Nothing
has been drawn for a scorecard as an object, a stored run, a CI door, or a recording review: those four
are a blank page, not a redraw.

## What is wrong

1. **The page this feature was shot on contains no eval.** `/agents/agt_default/test` renders
   `AgentPlayground` (`app/(dashboard)/agents/[id]/test/page.tsx` :39): one microphone, one live call, a
   transcript and a metrics rail. The suite is somewhere else entirely, inside the builder at
   `/agents/agt_default/edit?step=4` (`components/wizard/test-section.tsx` :234-259). Two surfaces are
   called Test, neither links to the other, and neither knows the other ran.
   Fails [868kyv3tm](https://app.clickup.com/t/868kyv3tm), JTBD rainy 3.

2. **Running a case you wrote yourself produces nothing.** `TestsSection` reads `EVAL_RUN`, a constant
   (`components/eval-tests.tsx` :104). `resultFor` :154 can only return a result whose `caseId` is already
   in that constant, so for any authored case it is `undefined`. `RunSheet` is handed that undefined at
   :392 and renders `result?.transcript ?? []` :423, an empty sheet. The row then falls to the `Not Run`
   badge :337. Add a case, press Run, watch an empty sheet, close it, and the status is unchanged.
   Fails [868kyv3tm](https://app.clickup.com/t/868kyv3tm), JTBD rainy 11.

3. **The Call Outcome column is a score the product did not compute.** `app/(dashboard)/calls/page.tsx`
   :65 derives it from the call status and, for the three statuses that do not map, from
   `OUTCOMES[(n + i) % 3]`. Sentiment :118 is then derived from that derived outcome, and
   `components/call-detail-sheet.tsx` :305 prints it as the "Call Outcome" badge with no criterion, no
   score and no judge named. 868ka25tc asks us to produce a number the calls list has been showing for
   months. Fails [868ka25tc](https://app.clickup.com/t/868ka25tc), JTBD rainy 2.

4. **The verdict vocabulary has two words and the job needs five.** `lib/campaign-data.ts` :221 is
   `AssertionVerdict = "pass" | "fail"`. There is no word for a run that stopped instead of grading
   (Retell ends one in Error past 10 minutes or 400 utterances), no word for a criterion the judge could
   not decide (ElevenLabs returns `unknown` with a rationale and tells you to watch it), and no word for a
   call started with `opt_out: true`, whose content the Agora docs say cannot be used for effectiveness
   review at all. The call side has a third word and it is `Cannot Predict`
   (`app/(dashboard)/calls/page.tsx` :33), which names neither a judgment nor a reason.
   Fails JTBD rainy 9, 17, 22.

5. **The sentence that grades a real call exists twice, with opposite defaults, and nothing reads either
   copy.** `components/wizard/step-analysis.tsx` :86 is a Success Evaluation switch over a 2000-character
   Evaluation Criteria textarea :95, shipping off (`lib/wizard-draft.ts` :174 `successEval: false`).
   `app/(dashboard)/deploy/phone-numbers/[id]/number-client.tsx` :207 is a second Success Evaluation with
   its own `useState` pair :49-50, shipping **on**. Type criteria in one and the other still reports none.
   Neither string reaches a test assertion, and neither reaches the badge in defect 3.
   Fails [868ka25tc](https://app.clickup.com/t/868ka25tc), JTBD rainy 3, 4.

6. **The run sheet denies the bill the button beside it just quoted.** `SimulatedBanner`
   (`components/sim-transcript.tsx` :62) reads "no minutes billed, no real number dialed" and
   `components/eval-tests.tsx` :440 renders it unconditionally, including when `mode === "audio"`. The
   button that opened the sheet is labelled with `~$${audioRun.cost.toFixed(2)}` :238 and the line above
   the table :249 states $0.10 per minute. Three pieces of copy, one screen, two answers.
   Fails JTBD rainy 12.

7. **"Text runs are free" is a claim about the runner, printed as a claim about the bill.**
   `components/eval-tests.tsx` :248 says it and `lib/campaign-data.ts` :211 makes it true by construction,
   returning `cost: 0` for text. Retell prices the judge on its own page: grading bills, batches multiply,
   and AI QA costs $0.10 per analyzed minute after 100 free. The judge model in our own InfoHint :213
   costs something every time it reads a transcript, and the suite says it is free.
   Fails [868kyv3tm](https://app.clickup.com/t/868kyv3tm), JTBD rainy 13, 14.

8. **The playground invents the price of a test call.** `components/agent-playground.tsx` :324 prints
   `Estimated cost` as `transcript.length * 0.0023`, so five transcript rows read $0.0115. "Tokens used"
   :323 is `transcript.length * 28`. Neither number has a source, and the real fact is $0.10 per
   agent-minute, charged the same with a customer's own keys. Nothing anywhere on the page says a test
   call spends agent minutes. Fails JTBD rainy 13, 14.

9. **The only explanation of scoring in the product promises a field the model does not carry.** The
   InfoHint at `components/eval-tests.tsx` :213 says a judge returns "{verdict, score, reason} per
   assertion". `EvalCaseResult.assertions` (`lib/campaign-data.ts` :235) is `{id, verdict, reasoning}`.
   The generator writes a score and then throws it away, pasting it into a prose string:
   `components/wizard/test-section.tsx` :199. So a user is told to expect a number, and every surface
   shows a word. Fails [868ka25tc](https://app.clickup.com/t/868ka25tc), JTBD rainy 7.

10. **The judge switch is not gated on the transcript it reads.** In the same block, Post-Call Data
    Extraction is disabled without transcription (`components/wizard/step-analysis.tsx` :114) and states
    what happens to saved points while it is off :119-123. Success Evaluation :86 has no such gate. Turn
    "Store call transcripts" off and the criteria box stays live, offering to judge words nobody kept.
    Fails JTBD rainy 18.

11. **The pre-flight counts a switch as evidence.** `components/wizard/deploy-preflight.tsx` :192 adds
    "success eval" to the Outputs row whenever `an.successEval` is true, with no check that
    `an.evalCriteria` holds a single character. Turn the switch on, type nothing, and the gate before
    publishing reports an output that cannot be produced. Fails JTBD rainy 1.

12. **One run is read as proof.** `components/wizard/deploy-preflight.tsx` :157 reads
    "{n}/{m} passed as text. Not yet heard with audio", and there is no repeat count anywhere to make that
    sentence mean anything: both run buttons :226 and :238 run each case once, and `runEstimate`
    (`lib/campaign-data.ts` :204) prices one pass. ElevenLabs repeats a test 2 to 20 times and badges the
    rate on the stated grounds that a single pass shows the agent can succeed and a pass rate shows how
    often it will. The KPI this feature owns is an evidence floor of 85 %, and the evidence is one roll of
    the dice. Fails JTBD rainy 7.

13. **Nothing puts this draft's number beside the number the callers are on.** The headline JTBD is two
    scored sides of one scorecard, and `components/wizard/deploy-section.tsx` :145-160 is a read-only
    version table of property · when · old · new · who. No competitor does this either, which is where the
    whitespace is. Fails [868ka25tc](https://app.clickup.com/t/868ka25tc), JTBD happy 5.

14. **Save a real call as a test is fully built and has no door.** `AddCaseSheet` types `prefill`
    (`components/eval-tests.tsx` :533), fills the persona from it :547-549, renders the real transcript
    :655-660, fires `save_call_as_test` :568 and labels its button "Save as test" :704. The one mount of
    that sheet, :380-387, passes no `prefill` at all, so every branch is dead. The call that would feed it
    offers a download menu of Recording, Transcript .txt and Transcript .json
    (`components/call-detail-sheet.tsx` :256-275) and no test.
    Fails [868ka24am](https://app.clickup.com/t/868ka24am), JTBD rainy 4.

15. **Mock selected is typed and unreachable.** `lib/campaign-data.ts` :163 declares
    `mock-all | mock-selected | call-real` and :189 carries `mockedTools`. The control offers two of the
    three (`components/eval-tests.tsx` :673-674), so the only choices are mock everything or call the
    customer's systems for real, under a warning that the test "will book, charge and write for real,
    every time it runs" :680. Selective mocking is what ElevenLabs ships and what the P0 eval ticket
    implies. Fails [868kyv3tm](https://app.clickup.com/t/868kyv3tm), JTBD rainy 10.

16. **The fix engine reads signals, and its one behavioural rule fabricates them.**
    `lib/diagnostics.ts` carries the exact shape 868ka24am needs, `{rootCause, suggestedFix, fixTarget}`
    :51-64 with a deep link :88-95, and feeds it nothing but latency, confidence, loss and dead air
    (`CallSignals` :67-79). The single rule about what the agent said, off-script response, reads a
    pre-seeded array that :169 fills with `rnd()`, stamping "answered a different question than the caller
    asked" on a random turn. No rule reads a transcript against a criterion.
    Fails [868ka24am](https://app.clickup.com/t/868ka24am), JTBD rainy 26.

17. **The work does not survive the tab, and Regenerate deletes it first.** The suite and both run maps
    are React state (`components/eval-tests.tsx` :107, :144, :148), and
    `components/wizard/test-section.tsx` :241 mounts the table with `key={generation}`, so pressing
    Regenerate scenarios remounts it and discards every authored case with no warning. There is no run
    record to compare, and nothing to reopen after lunch. Fails JTBD rainy 6, 11.

18. **There is no route out of the product, and the one install line we ship names a package that does not
    exist.** No export, no suite identifier in any URL, and no mention of CLI or CI under `studio_x_2/`,
    while 868kyv3tm requires the same suite to run through the API or CLI without changing its meaning.
    The nearest thing the product has is `npm install @agora/agent-sdk`
    (`components/wizard/channel-section.tsx` :495, `components/wizard/channel-configs.tsx` :306). The npm
    registry returns 404 for that name; the published SDK is `agora-agents`, version 2.4.0.
    Fails [868kyv3tm](https://app.clickup.com/t/868kyv3tm), JTBD rainy 5.

19. **The one link we give for getting a transcript out is a dead page.** `app/(dashboard)/help/page.tsx`
    :49 offers "Exporting call transcripts" pointing at
    `https://docs.agora.io/en/conversational-ai/develop/transcript`, which returns HTTP 404. The words
    actually arrive as webhook events 103 and 112 after the session ends, documented at
    `develop/short-term-memory`, and storing them is an Engine row
    (`references/clickup-q3-roadmap-export-2026-09-03.tsv` line 152). A scorecard cannot read a transcript
    nobody stored, and today the product does not even point at the right page.
    Fails JTBD rainy 16.

20. **Stray commas sit where em dashes were deleted, and they are on screen in the Before shot.**
    `components/agent-playground.tsx` :40 sets the idle latency value to `", "` and :302-304 do the same
    for LLM, STT and TTS, so the Live metrics panel reads a lone comma under four labels before a call
    starts. `components/eval-tests.tsx` :316 renders "Caller wants to ," when a persona carries no goal.
    Fails the copy rules.

21. **Nothing records that any of this happened.** `lib/analytics.ts` :106-111 is the whole event set for
    this area: `test_authored`, `test_run_started`, `test_run_completed {verdict}`, `suite_run_all`,
    `assertion_failed_viewed`, `save_call_as_test`. There is no event for a production score, a scorecard,
    a recording review, an applied fix, or the comparison the JTBD's success event `scorecard_reviewed`
    names, and its properties are not on the sanitizer allowlist either.
    Fails the Evidence-before-live KPI.

## What is right, and must survive any redesign

- **One Tests table, the case type decides the runner, audio is a run mode** (`lib/campaign-data.ts` :195,
  :199, feature 15's lock). A second table is a failed design.
- **A result states the mode it ran in** (`components/eval-tests.tsx` :330-333), so a text pass can never
  pass for proof that the call sounds right.
- **An audio run merges instead of replacing** :182-187, so a skipped decision check keeps the verdict it
  had, and the toast names the skip :194.
- **Plain-language assertions**: "PASS if the agent offers a specific time and confirms the caller's
  email." :692.
- **A failure names the config gap and links the control that exists for that channel**
  (`components/wizard/test-section.tsx` :70-93).
- **The failing assertion is anchored onto the offending turn** (`flaggedTurnIndex` :75-79,
  `SimTranscript` :135-143).
- **Failing tests warn and never block deploy** :214.
- **The tool warning is written for the fear, not the feature**: "This test will book, charge and write
  for real, every time it runs." :680.
