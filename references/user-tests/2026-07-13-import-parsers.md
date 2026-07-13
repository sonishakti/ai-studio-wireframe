# User test — 2026-07-13 · Real vendor imports + explicit import landing (commit `202f45c`)

> Session #7 (protocol: `references/user-testing-protocol.md`), 3 personas, live build.
> Focus: the import flow end-to-end — per-vendor parsers (Retell/Vapi/ElevenLabs/Bland) with
> the field-mapping report; the destination fork (Create as new agent · Apply to this agent)
> and prompt-conflict choice; both entry points landing in the same inline builder flow.
> This session closes user-test #6's two import S1s. Fixes shipped in the follow-up commit
> (see disposition).

## Metrics (trend across sessions)

| Metric | #7 | #6 | #5 | #3 (A1) | Read |
|---|---|---|---|---|---|
| Task success | **83.3%** | 76.7% | 76.7% | 76.7% | first move off the plateau — the failures WERE import |
| TTFA (interaction) | 1 | 1 | 1 | 3 | holding at best (D1 hit 2 via the talk-sheet double click) |
| TTFA (live) | **12** | 7 | 9 | 7 | median dragged by D1's batch spine (13); D3 code path = 6 |
| Friction | **0×S1** · 5×S2 · 12×S3 | 2×S1 · 8×S2 · 11×S3 | 1×S1 · 6×S2 | 1×S1 · 9×S2 | **zero S1s for the first time** |
| Sentiment | **+1.11** | +0.60 | +0.56 | +0.51 | biggest jump on record |
| SUS-lite | **78.3** | 74.7 | 77.3 | 74.7 | new high |

## Focus verdict (the import slice)

Moderator: "**Passes with all three personas — the strongest commit yet on its own terms.**"
The banner's "field-by-field report of what carried" claim was independently stress-tested
with realistic Retell (llm_id prompt-by-reference + noise keys), Vapi, and ElevenLabs export
shapes and **every one parsed**; shape detection overrides a wrong vendor chip; the pair-paste
guidance names Retell's actual agent/LLM split; and the destination fork + prompt-conflict
previews with Undo **structurally close test #6's silent-overwrite S1**. D2 (40-line Retell
operator): "the first import claim I've believed on any voice platform."

Two residues, both named by the moderator:
1. **A self-inflicted wound inside the honesty contract** — several curated drop-reasons
   forwarded to controls that don't exist (voicemail/call-caps → "Step 4", end-call →
   "Advanced", keyword boosting → wake words), and Vapi's speaking plans got a generic shrug
   while Retell/Bland equivalents were routed correctly. "They dent precisely the trust the
   report earns."
2. **Throughput** — single-agent paste-only (disabled Upload/URL tabs, no vendor-API pull,
   ElevenLabs-assumed voice provider): "the feature courts the 40-agent switcher and then
   hands them a cat flap."

## Aha moments (what converted skeptics)

- The **llm_id warning knows Retell's architecture** — "the prompt lives on the Retell-LLM
  object. Paste that JSON too (both objects together works)" — and the pair paste genuinely
  folds and maps `general_prompt → Prompt · Step 3`. All three personas independently called
  this the trust-converting moment.
- **Wrong-chip immunity**: "Parsed as Retell — that's what the JSON's shape says it is."
- **Drop reasons double as a migration map** ("Dynamic variables move to the deployment's
  CSV columns") — architecture questions answered without opening a doc.
- The **batch pre-flight manifest** with a stack-derived estimate — D2: "none of
  Retell/Vapi/Bland confirm a batch this honestly."
- The **destination fork + prompt-conflict previews + Undo** — #6's failure structurally gone.

## Fix disposition

| Sev | Finding | Disposition |
|---|---|---|
| P0 | Drop-reasons forward to phantom controls (voicemail/call-caps → Step 4 has neither; end-call → Advanced has none; "keyword boosting" maps to wake words); Vapi speaking plans get a generic shrug | **FIXED** — DROP_REASONS honesty audit: every pointer now resolves to a real control (Advanced turn-taking, Analysis, Step-3 Resources, Step-1 engine, CSV columns) or says "isn't supported yet"; `startSpeakingPlan`/`stopSpeakingPlan` → Advanced (turn-taking), matching the Retell/Bland treatment |
| P0 | Import silently brands every voice ElevenLabs — Vapi `voice.provider` never read; a PlayHT voiceId lands mis-vendored (the one field the report doesn't verify) | **FIXED** — parsers read Vapi `voice.provider`, Retell id prefixes (`11labs-`/`openai-`/`deepgram-`), ElevenLabs implied; bundled providers (ElevenLabs/Azure) carry truthfully into the stack + artifact, foreign providers get an honest dropped row ("PlayHT voices aren't in Agora's bundled stack — the default voice is set") |
| P0 | `/defect` (paste-to-live switcher flow) is an orphan route with zero inbound links | **FIXED** — one door added inside the Import sheet ("Try the paste-to-live migration flow →"); banner left unchanged to avoid a third competing action |
| P0 | Dead Upload-file / From-URL tabs ("coming soon" ×2) dent trust in the working parts | **FIXED** — tabs removed; paste is the one honest way in, futures collapsed to a single footnote line |
| P1 | {{variable}} → CSV column matching is name-only; imported `{{appointment_time}}` vs column `due_date` blocks Deploy with prompt-rewrite as the only fix | Next slice — alias mapper in the ContactsPanel coverage check (bind variable → column) |
| P1 | Monitor first impression: unexplained red "15" badge + demo fleet all "Unhealthy while Active" | Backlog — suppress/explain badge pre-traffic; rebalance mock dataset |
| P1 | Field-mapping report dies with the sheet — at 40 imports it's the migration audit trail | Backlog (medium) — persist per-agent import report |
| P1 | Talk CTA double-click; Code-step UID/runtime gaps; ⌘K lacks "barge-in"/"token" vocabulary; voice Preview lacks the "simulated" disclaimer | Backlog (all quick) — logged on the register |
| P2 | Bulk import (multi-export upload → vendor-API-key pull, auto-resolving llm_id refs); BYO-SIP guided recipe; retry ladders + voicemail branch; broader model catalog with nearest-model suggestions; "call MY phone first" pre-flight test | Roadmap-scale — the one-defector → 40-agent-fleet path |
| — | Agent-vs-RTC double-metering question (D3) has no on-screen answer; blocks veteran adoption | Next slice — one billing-truth sentence on Code step + Deploy summary, **wording must be verified against docs.agora.io pricing first** |

## Durable learnings

1. **An honesty mechanism is judged by its weakest row.** The field-mapping report earned
   trust field-by-field, then spent it on drop-reasons that pointed at rooms that don't
   exist. Same lesson as #6's embed-truth ("a truth mechanism shipped for one channel
   indicts its siblings") — one level deeper: every ADDRESS inside a truth surface is
   itself a claim, and testers followed each one.
2. **Vendor-fluency converts, generic parsing doesn't.** The llm_id warning — knowing where
   Retell keeps the prompt and prescribing the pair paste — did more for migration intent
   than the whole mapping table. Speaking the competitor's schema back to the user reads as
   "we've done this migration before."
3. **A migration door invites fleet-sized expectations.** The moment single-paste import
   worked, D2 priced the 40-assistant migration and judged the feature by THAT bar (bulk
   pull, audit trail, per-call vars). Ship an import, inherit a migration roadmap.
4. **Zero S1s ≠ done: the blockers moved off-product.** What's left at the top of the
   stack is real-world capability (BYO-SIP numbers, real audio, billing truth), not
   wayfinding — the wireframe's UX debt is draining while product-reality debt surfaces.

## Open questions for real users (top of the moderator's list)

- Do switchers actually have their export JSON at hand, or does "paste your export" stall in
  the vendor dashboard? (Decides whether API-key pull is P1, not P2.)
- Is BYO-SIP an abandonment point or a speed bump for deadline-driven solo devs?
- Will users start a paid batch without ever hearing the agent's real voice/latency?
- Is the ~$50 stack-derived pre-flight estimate trusted when actuals diverge?
