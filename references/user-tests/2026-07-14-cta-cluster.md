# User tests #8 + #9 — 2026-07-14 · Lean builder + the CTA cluster (commits `dd9161c` → `7236893`)

> One diverge→converge cycle, owner-triggered: "Talk in the nav looks odd… not one CTA at
> top, one at bottom — this is not a treasure hunt." NN/g research → 5 placement variants
> (`?cta=1..5` lab, commit `b64b51a`) → 5-lens judge panel → V2 published (`7236893`) →
> validated by test #9. Test #8 covered the preceding lean-LHS/spacious-RHS restyle (`dd9161c`).

## Metrics (trend)

| Metric | #9 (cluster) | #8 (lean rail) | #6 | #5 | Read |
|---|---|---|---|---|---|
| Task success | 86.7% | **90%** | 76.7% | 76.7% | #9 failures = code-path state, not placement |
| TTFA (interaction) | 2 | 2 | 1 | 1 | Talk = sheet-then-test (2 hops, flagged S3) |
| TTFA (live) | 11* | **5** | 7 | 9 | *D1 took the full detour path; lean path = 8 |
| Friction | 0×S1 · 6×S2 | 0×S1 · 6×S2 | 2×S1 · 8×S2 | 1×S1 · 6×S2 | two zero-S1 rounds running |
| Sentiment | **+1.11** | +0.86 | +0.60 | +0.56 | best ever |
| SUS-lite | **84.0** | 81.7 | 74.7 | 77.3 | best ever, two records in one day |

## The judge round (what settled placement)

Five lenses (NN/g conformance · first-timer-with-draft · live operator · interaction cost ·
visual hierarchy) scored six arrangements. **V2 "one rail cluster under the agent" won
41.5/50, first with 4 of 5 lenses** (v3 sticky bar 36 · v5 hybrid 28 · v4 contextual 25.5 ·
v1 header 23 · **control 16** — the treasure hunt, quantified). NN/g grounding:
[action–object proximity](https://www.nngroup.com/articles/closeness-of-actions-and-objects-gui/),
[consistency #4](https://www.nngroup.com/articles/consistency-and-standards/),
[form/wizard button placement](https://www.nngroup.com/articles/web-form-design/),
[sticky-header restraint](https://www.nngroup.com/articles/sticky-headers/).

Shipped with two panel grafts: **state-driven weight** (Deploy fills only when acting means
something — ready draft / dirty live agent; amber tint + "Unsaved changes" when dirty;
semibold "Live on …" when clean) and the **one-primary rule** (rail Deploy demotes to
outline while step 4's own go-live CTA is on screen). Rail scrolls internally on short
viewports so the cluster never leaves reach. Talk sits between Deploy and Discard as the
destructive-slip buffer — do not reorder.

## #9 verdict on the cluster

"Validated on its core promise by all three personas… Two verdicts of three are unqualified
ship-worthy." D1: the amber dirty-flip is "the thing I usually have to guess at in these
tools." D2 (Retell switcher): the single answer Retell/Vapi consoles fumble. "Can I always
tell what is live" passed outright; the one-primary demotion read as intentional, not a glitch.

## Fix disposition (#8 + #9 combined)

| Sev | Finding | Disposition |
|---|---|---|
| P0 | Drafts had no visible deploy state after the lean pass (#8) | **FIXED** by the cluster itself |
| P0 | Code/SDK stay-path: after deploy the cluster still says "go live" + Draft badge while the toast says live — the truth strip contradicts itself (#9, D3) | **Next slice** — code agents need a third state: "Deployed — goes live when your app connects" |
| P0 | Deploy-step footer promises "real traffic"/Monitor hop on the code path (#8+#9) | Next slice (same code-state fix, quick) |
| P0 | Caller-ID dropdown omits the agent's own inbound number with no why (#9 recurrence) | Next slice (quick) — show it disabled with the one-agent-one-channel reason |
| P1 | "Redeploy" label assumes you know Aria self-deployed (#8+#9 S3) | Backlog with the first-run clarity bundle |
| P1 | Talk opens the sheet, not the conversation — a two-hop test (#9 S3) | Backlog — consider talk-directly + details behind it |
| P1 | Batch pre-flight makes no pause/stop promise (recurring #6–#9) | Backlog (quick copy line) |

## Durable learnings

1. **Status truth belongs at the button.** The winning arrangement's margin came from
   status adjacency, not from the buttons moving — every lens scored "what happens if I
   click" readable at the action itself.
2. **A judge panel converges when the constraint is real.** Feeding user-test #8's P0
   ("drafts lost visible deploy state") as a hard constraint made 4 of 5 lenses pick the
   same winner; without it, visual-hierarchy preferred v5.
3. **State-driven emphasis beats static primaries.** Fill-when-meaningful killed three
   findings at once (meaningless-redeploy invite, blank-draft scolding click, duplicate
   primaries) without moving a single control.
