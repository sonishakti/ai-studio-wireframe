# User-test report — v8 Test Strip + industry-label rename (graph-loop, 3 rounds)

**Date:** 2026-07-30 · **Protocol:** `references/user-testing-protocol.md` (3 developer personas, think-aloud, simulated) · **Exit reason: max** (3 fix rounds completed; loop hit its iteration cap, not a clean exit and not stalled)

## Focus

TWO stacked changes to the builder, both untested until this session (yesterday's run died on session limits — this is the first real test of both):

- **(A) v8 "Test Strip" layout** — sticky strip under the header with filled **"Talk to {agent}"** (expands+scrolls §4 and starts the live test), ghost **"Run simulations"** (docked panel), verdict line (`Last run: N/M passed · simulated` / `No test runs yet · simulated preview`); **collapsible multi-open sections** (all open by default, whole heading row toggles, folded rows show value recaps, per-agent persistence, rail Expand/Collapse all, deep links expand-then-scroll).
- **(B) Section rename to industry vocabulary** (owner mock): **Voice & Models · Deployment · Prompt & knowledge · Test · Go Live**, rail grouped **CUSTOMIZE (1–3) / SHIP (4–5)** with icons.

Probes: do the labels match developer expectations (Vapi/Retell/ElevenLabs-fluent personas); is "Deployment" (§2, the where-it-runs radio) confusable with "Go Live" (§5, the deploy action); strip comprehension; collapse discoverability/persistence; verdict-line honesty; import-report pointers still naming real controls; no deploy-flow regressions.

**Veto guardrail** (fixes must NOT reintroduce): Pause in the builder header · A/B prompt testing · top-level multi-channel select (channel/deployment = ONE radio) · banded/tinted accordion chrome or cards-inside-cards · a duplicate talk surface in the strip · the deleted header Test button · reverting the owner's label/grouping mock (labels + CUSTOMIZE/SHIP + icons are owner-locked).

## Metrics by round

| Metric | Round 1 | Round 2 | Round 3 | Trend |
|---|---|---|---|---|
| Commit | `2421080` rename + grouped rail | `55bfbf0` graph-loop r1 | `b115ab8` graph-loop r2 | — |
| Task success % | 86.7 | 93.3 | 93.3 | ↑ then hold |
| TTFA — first interaction (median actions) | 1 | 1 | 2 | flat |
| TTFA — live (median actions) | 7 | 9 | 9 | slight ↑ |
| S1 (blockers) | 0 | 0 | 0 | clean throughout |
| S2 | 2 | 4 | 2 | net flat (r2 surfaced pre-existing product gaps) |
| S3 | 12 | 12 | 9 | ↓ |
| Sentiment mean | +1.06 | +0.89 | +1.03 | stable positive |
| SUS-lite | 76.7 | 78.3 | **81.3** | ↑ +4.6 |

Read: success jumped after r1's P0 fixes and held; SUS-lite climbed every round; S3 friction dropped by a quarter by r3. The r2 S2 bump was discovery of pre-existing product gaps (fleet import, inbound per-call vars, BYO voices, uid semantics), not regressions from this release.

## What we learnt

1. **Both stacked changes PASS their first real test.** Strip comprehension was 3/3 instant in every round: filled "Talk to {agent}" read as a remote to the ONE inline test surface (never a duplicate talk widget), and the expand-scroll-and-start behavior was explicitly praised ("I arrive mid-conversation instead of on a dead form").
2. **The `· simulated` verdict-line honesty was the session's biggest repeated trust win** — one persona called it "the most honest test affordance on any of these consoles." Splitting the pre-run state (`No sim runs yet`) from the results state (r2 fix) removed the double-duty wart.
3. **The rename lands.** "Prompt & knowledge" and "Voice & Models" parse natively for Vapi/Retell/ElevenLabs users ("I don't have to translate"); "Voice & Models" rescued the section from reading as persona fluff for the RTE veteran; "Deployment" is literally the word the SDK veteran greps for — it routed the code persona to the Code/SDK radio in two clicks.
4. **The feared Deployment(§2) vs Go Live(§5) collision is REAL but shallow.** It materialized for all 3 personas in all 3 rounds — but capped at a one-beat-to-five-second S3 stall, self-healed on-screen by the CUSTOMIZE/SHIP grouping, the rocket icon, the "launch it in Go Live" helper line (added r2), and the "Go Live · {type}" rail echo. Verdict: **no structural change; labels/grouping stand (owner-locked); watch item for real-user testing.**
5. **Vocabulary hygiene matters more than layout.** The real bugs were rename casualties: the import report naming the dead "Channel section," "channel" used in §2 copy while code snippets use it in the RTC sense, and "No deployment yet" describing a config gap in deploy-state vocabulary. All fixed as copy, not design.
6. **Collapse works without instruction.** Whole-row chevron discovered by all personas; folded recaps trusted ("collapsing hides nothing"), `· edited` survives folds, per-agent persistence survived reload; zero cost to skimmers since all sections start open.
7. **No veto violations and no deploy-flow regressions in any round** — single preflight with Fix→jump, cost manifest, truthful batch "Start run" CTA, code deploys stay on-page to mint the real agent ID. No proposed fix reintroduces a vetoed pattern.
8. **The remaining S2s are product-track, not wireframe-track:** caller-ID/BYO-SIP contradiction (fixed as copy), inbound per-call dynamic variables (D2's stated migration blocker), fleet/bulk import, uid semantics documentation.

## What changed each round

### Round 1 → r1 fixes (`55bfbf0`)
Baseline verdict: both changes pass (86.7%, zero S1s, zero veto violations); the collision defused by grouping+icon every time. Shipped:
- **P0** Import-report rename casualty: `DROP_REASONS.channel` in `studio_x_2/lib/import-agent.ts` (~325) "Channel section" → "Deployment section" + sweep for survivors.
- **P0** Not-found handling for `/agents/[id]/edit` with unknown id (was silently mounting a phantom new-agent wizard — the only S2 product defect on-focus).
- **P1 (quick)** §2 folded recap "No deployment yet" → "No channel picked yet"; sandbox-number provenance line on /agents; voice publish-block sentence for code-path agents; sim verdict echoed in deploy preflight; SDK scent line on /agents landing; join.ts uid comment (docs-cited).
- Deferred to backlog: P2s (duplicate-for-other-direction, latency-figure provenance, voice search, in-builder stop [owner decision required], roadmap capability items).

### Round 2 → r2 fixes (`b115ab8`)
93.3% success; sharper finding = "channel" vocabulary collision inside §2 vs RTC-sense in snippets. Shipped:
- **P0** §2 batch pointer parity ("Contacts, caller ID & schedule live in Go Live ↓" when Batch selected).
- **P0** §2 vocabulary sweep: "channel" → "deployment type" in hint/recap/toast; "channel" reserved for the RTC sense in code.
- **P0** Verdict-line state split: pre-run "No sim runs yet"; `· simulated` only on actual results; wireframe disclosure moved to a standing note.
- **P1 (quick)** §2 helper subtitle ("Where your agent takes calls — launch it in Go Live") + "Go Live · {type}" echo in §5/rail; Expand/Collapse-all promoted to ghost button; version-history mock rows seeded relative to creation time.
- Deferred: code-snippet trust pack (medium), import pre-paste disclosure, failing-case deep link, mapping-report export, landing "est." captions.

### Round 3 → exit (max)
93.3% success, SUS-lite 81.3, S3s down to 9. Verdict confirms the r2 self-healing works (collision now a one-beat stall). Two S2s remain, both outside the layout: the caller-ID/BYO-SIP contradiction (P0 copy fix, applied at exit alongside quick P1s) and the inbound per-call dynamic-variables product gap. Round-3 quick fixes applied before exit: caller-ID relabel ("Sandbox caller ID — shared test numbers" + "Production: connect your carrier's number via SIP →"), §2 outbound-neutral row copy, "No sim runs yet" → "No simulation runs yet", Pause discoverability copy (toast + kebab tooltip + status-chip popover text pointer — NOT a header button), landing-estimate source footnote.

## Exit reason: max

The loop hit its 3-round cap. Not clean (backlog below remains), not stalled (SUS-lite rose every round and S3s fell). The two shipped changes are validated as-is; nothing in the backlog blocks keeping them.

## Remaining backlog

### P1
- **Pre-flight sim-failure escalation** (medium): when the last simulation run has failures, escalate the sim summary from a passive line to a warning row ("3 of 8 checks failed — review before starting a run that dials N contacts") on the Batch "Start run" confirm.

### P2
- **CSV row-1 greeting preview** (medium): after CSV attach, render row 1's personalized greeting under the coverage line ("Row 1 will hear: 'Hi Maria, …'").
- **Folded Voice & Models deviation marker** (quick): append "· tuned" to the recap when Advanced speech tuning differs from defaults so folds don't hide customization.
- **Fleet-migration acknowledgement** (quick): one line in the import sheet ("Migrating a fleet? Bulk import is coming — talk to us →"); log bulk/API import + inbound per-call variables API as roadmap/PRD items (product gaps, not wireframe work).
- **Stale code comment** (quick): clean the pre-rename comment at `studio_x_2/lib/import-agent.ts:317` (no user-facing impact).
- **Deployment vs Go Live** (quick / no-action): take NO action — labels + CUSTOMIZE/SHIP grouping are owner-locked and the helper line + rail echo self-heal the stall; hold the deploy-vocabulary budget at four words and re-test the stall with real users.
