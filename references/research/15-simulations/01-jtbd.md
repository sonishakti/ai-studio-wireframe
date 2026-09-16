# 15 · Simulations — JTBD, all types

ClickUp: [15 · Simulations](https://app.clickup.com/t/868m0meyb) (Design Tracker, P1, 30 Nov – 22 Dec 2026)
Roadmap parent: [Test, evaluate, and continuously improve agents](https://app.clickup.com/t/868ka25ca) (Module: Studio)

## Headline JTBD

**When I have changed my agent and I am the only thing standing between it and real callers, I want to
know it still behaves — without dialling anyone — so I can ship the change today instead of hoping.**

## The split engineering is planning

Two roadmap tickets describe two different machines, and say so explicitly:

- [Run deterministic conversational evals in Studio and CI](https://app.clickup.com/t/868kyv3tm) — **P0**,
  Module Studio. Scripted mock conversations (user / assistant / system / tool turns), assertions by exact
  match, regex, structured comparison, tool-call shape, or an AI judge. Deterministic mock tool responses so
  customer systems are never called. Runs in Studio, API, CLI and CI/CD.
- [Run agent-to-agent voice simulations at scale](https://app.clickup.com/t/868kbyqf8) +
  [Score and compare simulated calls](https://app.clickup.com/t/868ka25nz) +
  [Let humans join simulated voice calls](https://app.clickup.com/t/868ka25fg) +
  [Replay production traffic as regression scenarios](https://app.clickup.com/t/868kyjbck) — the real voice
  runtime, personas, audio path, timing, provider behaviour.

The eval ticket draws the line itself: *"Evals are fast mock-conversation tests for deterministic behaviour
and tool contracts. Voice simulations exercise the real conversational runtime, audio path, personas, timing,
and provider behaviour. Both may reuse evaluation definitions, but neither silently substitutes for the
other."*

So the design question is not "should we build testing" — it is **whether the user meets one surface or two**,
and if two, what tells them which one they are in.

## Happy scenario, in the user's words

> I changed the prompt so the agent stops promising refunds. I open the agent, run the checks I already
> have, and in a few seconds I see the refund one go green with the line where it declined. I deploy.

## Rainy / unexpected scenarios

Each one is a state the design has to have an answer for.

1. **Nothing to run yet.** "I just made this agent. There are no tests and I don't know what a good one
   looks like." (Empty state — the reason our current design auto-generates from context.)
2. **It fails and I don't know why.** "It says fail. Fine. Which line, which rule, and is it my prompt or my
   config?" (Our existing rule: a failure caused by a config gap must name the setting.)
3. **It passes but the call still sounds wrong.** "The text was right and the agent talked over the caller
   for four seconds." — the case FOR the voice runtime, and the trap of a green tick that only proves text.
4. **The tool fires for real.** "My test booked a real appointment in the customer's calendar." (Eval ticket
   answers this with deterministic mock tool responses; the design must make the mock visible.)
5. **I want the check to run without me.** "I want this suite to gate a deploy from CI, not to be a button a
   human remembers to press."
6. **A real call went badly and I want it as a test.** "This exact conversation must never happen again."
   (Standing whitespace from 2026-07-09: save-a-real-call-as-a-test.)
7. **It costs money and minutes.** "How many minutes did my suite just burn, and does a simulated call bill
   like a real one?" (Agora bills $0.10/agent-minute; a voice simulation is agent minutes, an eval is not.)
8. **I regenerate and lose my work.** "I wrote four of these by hand and Regenerate wiped them."
9. **The judge is wrong.** "The AI judge failed a line I'm happy with." (Needs the judge's reasoning visible
   and the rubric editable.)
10. **Nobody is watching the run.** A suite of 30 voice simulations takes minutes, not seconds — the user
    leaves. What is on screen when they come back?
11. **Two runs, different agents.** "Is this better than what is live right now?" (Compare — its own roadmap
    ticket.)

## What exists today (the Before)

One surface, `TestsSection` in `studio_x_2/components/eval-tests.tsx`, reached from two doors: the **Test**
section in the builder and the **Test scenarios** rail. Its object is
`EvalCase{persona{identity, goal, personality}, assertions[]}` → run → `{verdict, transcript, per-assertion
reasoning}`, with four assertion kinds already modelled (rubric · tool call · data point · exact).

It is a hybrid of the two machines and reads as neither: the **case is defined by a persona** (simulation
shape) but the **run is instant and silent** (eval shape). It is labelled "Test scenarios" in the rail and
"Scenarios" in the section, and nothing on screen says whether audio was involved.
