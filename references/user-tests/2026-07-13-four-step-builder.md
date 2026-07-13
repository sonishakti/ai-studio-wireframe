# User test — 2026-07-13 · Four-step builder (commit `6bdaf0a`)

> Session #7 (protocol: `references/user-testing-protocol.md`), 3 personas, live build.
> Focus: the 4-step restructure — Deploy absorbs the channel ("Choose how callers
> reach your agent": Phone · Web widget · Widget UI) + review + go-live; Call
> settings joins Advanced · Analysis as the third optional section.
> Fixes shipped in the follow-up commit (see below).

## Metrics (trend across sessions)

| Metric | #7 | #6 | #5 | #3 (A1) | Read |
|---|---|---|---|---|---|
| Task success | **86.7%** | 76.7% | 76.7% | 76.7% | ✅ best yet — first move off the 76.7 plateau |
| TTFA (interaction) | **1** | 1 | 1 | 3 | holding at best |
| TTFA (live) | 11 | 7 | 9 | 7 | ↑ but personas ran heavier tasks (batch repoint, code path) |
| Friction | **0×S1** · 5×S2 · 12×S3 | 2×S1 · 8×S2 | 1×S1 · 6×S2 | 1×S1 · 9×S2 | ✅ first zero-S1 session |
| Sentiment | **+0.83** | +0.60 | +0.56 | +0.51 | ✅ best yet |
| SUS-lite | **81.3** | 74.7 | 77.3 | 74.7 | ✅ best yet, first 80+ |

## Focus verdict (the 4-step merge)

All three personas: **the merge holds; remaining issues are "copy-or-crosslink
sized, not structural."** D1: caller-ID, CSV, review, and go-live in one scroll —
13 actions landing-to-live-batch. D2: "Deploy reading as channel + review + go
live in one place matches how I think about a campaign"; the `202f45c` import
underneath is "the most credible competitor-import I've seen from any voice
platform." D3: the `?step=5` clamp and 4-dot sweep "held up everywhere I looked";
Call settings' batch-only note is "the correct kind of explorable honesty."

## Fix disposition

| Sev | Finding | Disposition |
|---|---|---|
| S2 (D1) | Deploy's "Choose how callers reach your agent" reads as THE channel menu, but only forks the inbound family — outbound builders hunt here first | **FIXED** — "Dialing a contact list instead? Switch to Batch calls" cross-link under the chooser, routed through the selectType stash/undo (StepConfigure's update now rides the same wrapper as Step 2, closing a latent silent-config-drop on the no-type buttons too) |
| S2 (D3) | Code-type contradiction: snippet card says "deploy first, then copy" while Deploy teleports to Monitor away from the snippets | **FIXED** — `publishDeployment({stay})`: Code deploys stay in the step, the minted agent ID lands in the visible snippets (placeholder warning clears), Monitor rides the toast as an action |
| S2 (D2) | Import drop-reasons allegedly point at dead surfaces ("voicemail → Step 4") | **VERIFIED CURRENT, no change** — the shipped `DROP_REASONS` strings already say "isn't supported yet" / point at real surfaces (fixed in `202f45c`); the persona miscited a past-tense code comment |
| S3 (D1) | Contacts preview shows 3 of 5 claimed columns — the green "all covered" check outruns visible evidence | **FIXED** — preview table renders all five (adds Balance · Due date) |
| S3 (D1, latent) | Batch pre-flight omits the channel handover (inbound number goes dark) | **FIXED** — "{Agent} stops answering {number} while on Batch calls" line in the pre-flight manifest when repointing a live inbound agent |
| S3 (D1) | "Redeploy" ambiguous when a live agent is being repointed to a first batch | **FIXED** — context CTA: "Launch batch calls" / "Deploy {type}" when the type changed vs the live baseline; "Redeploy" only for same-type edits (one label across rail · strip · review block) |
| S3 (D3) | BYO-SIP link label "Resources › Channels" ≠ destination tab "Deployment Channels" | **FIXED** — labels aligned (×2) |
| S3 (D2) | Call settings demotion miscasts the batch operator's core controls; capacity note future-scope-gated | **Owner call stands** (four steps, three in advanced; A6 gate is deliberate) — logged as the tension to watch; pre-flight still surfaces window/concurrency at commitment |
| S3 (D3) | "Choose a voice." publish-block on a code-only agent; RTC-minutes cost absent; docs deep-link depth | Backlog — code-path polish bundle (register) |
| S3 (D1) | Talk sheet still transcript-less; Live badge answer hover-only | Recurring (pre-dates this commit) — candidates for the next Talk-surface slice |

## Durable learnings

1. **A chooser's copy claims its scope.** "Choose how callers reach your agent"
   promised the full channel menu while only forking one family — when a merged
   step inherits a sub-chooser, cross-link the siblings or scope the copy.
2. **A step must be able to keep its own promises.** Merging review+go-live into
   the snippet step made "deploy first, then copy" physically impossible until
   the redirect was suppressed for that type — every merge needs a pass over the
   promises each merged block makes about the other.
3. **Assertions need visible evidence.** The coverage check was true and still
   distrusted because the preview hid two columns — render what the green check
   claims.
