# 14 · Evals & scorecards · JTBD, all types

ClickUp: [14 · Evals & scorecards](https://app.clickup.com/t/868m0mexd) (Design Tracker, P0, undated).
Roadmap rows: [Run deterministic conversational evals in Studio and CI](https://app.clickup.com/t/868kyv3tm) ·
[Score production calls with rubrics and reusable scorecards](https://app.clickup.com/t/868ka25tc) ·
[Review production recordings and recommend targeted fixes](https://app.clickup.com/t/868ka24am) ·
[Build self-improving agents](https://app.clickup.com/t/868kbyqf6) ·
[Integrate self-improving agents into Concierge](https://app.clickup.com/t/868kyj9w2).
Intake and the full Agora fact-check: `00-brief.md`. Vendor teardown: `02-research/_docs.md`. Learnings: `03-learnings.md`.

## Headline JTBD

**When I change the agent that answers my customers, I want the same named checks to give me a number
before I publish and again on the calls it actually took, so I can say it got better instead of saying I
tested it.**

The two halves of that sentence are two shipped surfaces today and they do not share a word. The check that
runs before is an `EvalCase` with `assertions[]` (`studio_x_2/lib/campaign-data.ts` :173-191). The check that
runs after is a 2000-character textarea called Evaluation Criteria
(`studio_x_2/components/wizard/step-analysis.tsx` :88-103), written in two places and read by nothing. The
job is done when one sentence scores both.

## The success event

**`scorecard_reviewed`**, proposed. Nothing in `references/telemetry/event-spec.json` fits: `suite_run_completed`
ends at the draft, `call_reviewed` starts at the live call, and neither carries a criterion.

The spec's allowed verbs (`conventions[0]`) do not include `compared`, so the name uses `reviewed` and the
comparison lives in the properties.

```
name        scorecard_reviewed
when        Two scored sides of the same scorecard are on screen together: this draft's runs and the live
            version's production calls, on the same criteria. Fires once per scorecard per builder session.
properties  agentId · scorecardId · criteriaCount · draftVersionId · liveVersionId ·
            draftCriteriaMet · liveCriteriaMet · criteriaUnknown ·
            draftSampleSize (runs) · liveSampleSize (scored calls) ·
            outcome (promoted | held | rolled_back | none) · source (preflight | version_row | monitor)
feeds       Evidence-before-live rate (the KPI this feature owns) · Trusted Change Rate ·
            "is it better than what is live", which suite_run_completed alone cannot answer
priority    P0
hookPoint   components/wizard/deploy-section.tsx :145-160 (the version table this hangs on) and
            components/wizard/deploy-preflight.tsx :146-170 (the gate row that warns today)
```

`outcome` is on the event because a comparison nobody acts on is a page view, and a page view is not proof.
`draftSampleSize` and `liveSampleSize` are on it because a 5-of-5 from one run and a 5-of-5 from thirty calls
are not the same claim (`03-learnings.md` §3).

Two existing events gain properties rather than becoming new events: `suite_run_completed` gains `scorecardId`
and `criteriaMet`; `call_reviewed` gains `scorecardId`, `criteriaMet` and `criteriaUnknown`.

**Before any of this ships:** `scorecardId`, `criteriaCount`, `criteriaMet`, `criteriaUnknown` and
`sampleSize` are not on the 48-key allowlist in `ng-console/src/lib/observability/sanitize.ts` nor on the
additions list in `event-spec.json` `conventions[2]`, so the event would arrive in PostHog with no properties.
`agentId`, `versionId`, `verdict`, `passCount`, `failCount` and `trigger` are already on that additions list.

**The KPI this feature owns** (`docs/strategy/agent-builder-kpis.md` :178): **Evidence-before-live rate**, first
publishes preceded by at least one verified test for that agent, absolute floor 85 %. Its cost counter-metric
is **minutes consumed per verified test**, because a win that multiplies test volume is a direct bill at
$0.10 per agent-minute and nothing else in the system can see it.

Time on page, session length and DAU stay rejected (CLAUDE.md, Don't re-litigate).

**Agora primitives.** `00-brief.md` §Agora fact-check has the full pass. The consequence for stop 1: every
scoring primitive is Studio-side, and the Engine dependency is narrow and nameable. `agents.getTurns` returns
the shape of a finished conversation (turn start type, end type, `caused_by`, `reason`, segmented latency) and
is queryable after the call. The words arrive only as webhook events 103 and 112, and storing them is its own
roadmap row (`references/clickup-q3-roadmap-export-2026-09-03.tsv` line 152). Recording is not in this contract
at all.

## Happy scenario

1. "I changed the prompt so the agent stops promising refunds, and I need to know it is better than the one my customers are on right now."
2. "I open Test and my five checks are there, with the same criteria names I see on the calls list."
3. "I press Run, four go green in a few seconds, and the fifth is red with the line where it promised a refund."
4. "I fix the prompt, run it three times, and this time all five pass on all three runs."
5. "Go Live tells me this draft is 5 of 5 and the version my callers are on is 3 of 5 on the same five checks."
6. "I publish."
7. "A week later the calls list scores real calls against those same five, and 'Never promises a refund' is met on 96 of 100."
8. "I send my boss that line."

## Rainy scenarios

Each one is a state the design has to have an answer for. Proof in parentheses.

1. **Nothing to score with.** "I have never written a criterion, so there is nothing for a check to measure against." (`studio_x_2/lib/wizard-draft.ts` :171-181 ships `successEval: false` and one seeded data point.)
2. **There is already a score and I did not make it.** "The calls list has told me Successful or Failed for months, so which of the two numbers is the real one?" (`studio_x_2/app/(dashboard)/calls/page.tsx` :65 derives the outcome with `OUTCOMES[(n + i) % 3]`; sentiment :118 is derived from that.)
3. **I wrote it in the wrong place.** "I typed my criteria on the phone number page and the Monitor sheet still says I have none." (Two Success Evaluation controls, two stores: `deploy/phone-numbers/[id]/number-client.tsx` :205-219 and `components/call-capture-sheet.tsx` :22-59.)
4. **I am writing the same sentence twice.** "The sentence I grade real calls with will not go into a test, so I keep two copies and they have already drifted." (No vendor lets one criterion do both where a user can see it: `02-research/_docs.md` §What nobody does.)
5. **The limit is hit.** "I have a criterion for every case my team argued about and it will not take another one." (ElevenLabs caps criteria at 30 per agent; a Vapi scorecard's metric points must sum to 100.)
6. **Regenerate ate my work.** "I wrote four checks by hand and Regenerate deleted all of them." (`components/wizard/test-section.tsx` :241 mounts the table with `key={generation}`.)
7. **It passed once.** "It went green. Is that proof or luck?" (ElevenLabs runs one test 2 to 20 times and badges the pass rate: "A single pass shows the agent can succeed; probabilistic testing shows how often it will.")
8. **The green is old.** "I have changed the voice and the models three times since that run and the pre-flight still shows it." (`components/wizard/deploy-preflight.tsx` :146-170 reads "{n}/{m} passed as text"; `event-spec.json` already puts `staleVsConfig` on `suite_run_completed`.)
9. **It neither passed nor failed.** "It did not grade, it just stopped." (Retell ends a run in Error past 10 minutes, past 400 utterances, on a repeating simulated user or a silent agent, and "the explanation is the error, not a grade".)
10. **My test called the customer's system.** "It booked a real appointment, because the one tool I cared about was not on the mocked list." (`mock-selected` is typed at `lib/campaign-data.ts` :163 with no UI; Retell honours mocks for custom functions but "MCP tools also ignore mocks", and a blank mock runs the real function.)
11. **I closed the tab.** "I ran the whole suite, went to lunch, and the results are gone." (The suite and both run maps are React state: `components/eval-tests.tsx` :107, :144-148. `EVAL_RUN` is a constant.)
12. **The screen contradicts itself about money.** "It says no minutes billed, under a button that just quoted me a price." (`components/sim-transcript.tsx` :62 is rendered unconditionally at `eval-tests.tsx` :440, above the $0.10/min sentence :247-251.)
13. **CI is a bill.** "My suite runs on every commit and I have just found out each run is agent minutes." ($0.10 per agent-minute, the same with BYO keys, https://docs.agora.io/en/conversational-ai/overview/pricing; a run driven through `think` still needs a running agent, a channel and a transcript reader.)
14. **The free minutes went on tests.** "I spent the 300 free minutes proving it works and my first real caller is billed." (300 min/month free, shared with STT and Translation: LEARNINGS 2026-07-09 fact-check (1).)
15. **The account cannot pay.** "Billing is past due, the scoring stopped, and nobody told me which calls it skipped." (Postpaid $0.10/min with spend caps: LEARNINGS 2026-07-09 (4). `event-spec.json` `testRefusedCodes` already names `payment_required` and `quota_exhausted`.)
16. **The data has not arrived yet.** "The call ended a while ago and there is still nothing to score." (The words arrive as webhook events 103 and 112 after the session ends; storing them is roadmap line 152, Requires Engine.)
17. **This call can never be scored.** "One call in the list has no score and no reason." (`properties.parameters.opt_out: true` disables retention, and the doc says the content "cannot be used for troubleshooting, effectiveness review, or agent optimization".)
18. **The permission is off.** "Scoring wants a transcript and this agent has transcription switched off." (Transcript and recording are separate switches at `components/wizard/step-analysis.tsx` :67-76, and data extraction is already gated on transcription :119-123.)
19. **I want to hear it.** "The transcript reads fine, I still want the audio, and the download is greyed out." (`components/call-detail-sheet.tsx` :258-261 disables Recording with a reason; https://docs.agora.io/en/conversational-ai/develop/recording is a 404 and recording is four Engine rows.)
20. **The region forbids it.** "Legal will not let EU call content reach a judge model outside the region." (`geofence` is a typed field on the join body; 03's fallback eligibility already validates data region and compliance mode.)
21. **The judge is wrong and I cannot say so.** "It failed a call I am happy with and there is nowhere to disagree." (Retell's Calibrate flips one call's verdict with a note and "doesn't change the criteria for future calls"; Coval refuses to count a review row complete when a reviewer disagrees and leaves no note.)
22. **The judge does not know.** "Three criteria came back unknown on a call that looks fine to me." (ElevenLabs returns `success`, `failure` or `unknown` with a rationale and says to monitor unknowns as a sign the criteria prompt needs work.)
23. **Two of us edit at once.** "Someone renamed a criterion while my suite was running, and now the two scores do not mean the same thing." (A shared scorecard is the object `03-learnings.md` §1 picks; Coval's Collaborative mode locks each conversation and metric pair to one reviewer.)
24. **Short calls sink the number.** "Half my low scores are callers who hung up after four seconds." (`getTurns` types a turn end as `interrupted | ignored | error` and a start as `silence_timeout`; Retell's AI QA scores a cohort chosen by filters and a sample size, not everything.)
25. **The vendor cannot be tested this way.** "I run my own model and the runner says it cannot simulate my agent." (Retell: "Agents using a custom LLM are not supported" by simulation testing. Agora's `getHistory` is typed `status: "RUNNING"` with the note "Only supports querying the running agent".)
26. **Nothing changes after the fix is named.** "It told me which criterion failed and what to change, and I still have to go and do it by hand." (`lib/diagnostics.ts` :51-95 carries `rootCause`, `suggestedFix` and `fixHref` and writes nothing; Retell publishes its per-metric fixes as a documentation page.)
27. **The loop edited the live agent.** "Something rewrote the prompt my callers are hearing and I cannot see what it said before." (`update` accepts `llm.system_messages` on a running agent and warns that it overwrites the field; version history is a read-only table at `components/wizard/deploy-section.tsx` :145-160.)

## What this is not

- **The runner.** 15 · Simulations owns the one Tests table, the case type that decides the runner, and audio as a run mode. 14 adds a column to `components/eval-tests.tsx` and never builds a second table.
- **Versioning.** 08 · Versioning & release (owner lock) owns environments, promotion and rollback. 14 puts two numbers on the version row that already exists at `components/wizard/deploy-section.tsx` :145-160.
- **Watching a call live and taking it over.** 12 · Live monitoring & operator controls (owner lock).
- **A score charted over time, with an alert when it drops.** 13 · Dashboards & alerts.
- **Storing the transcript and the recording.** Engine: roadmap line 152 for the stored transcript, `[O4.3-T1.b/c/d/e]` for recording. 14 names the dependency and renders the missing state.
- **What may be kept, and for how long.** 24 · Retention, PII & compliance owns `opt_out` and the region rules. 14 only renders "not scoreable" and says why.
- **The call list and the transcript viewer.** 10 · Session & call logs.
