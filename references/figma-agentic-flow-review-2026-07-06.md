# Figma review — Draft Updated Agentic flow (2026-07-06)

> Source: Figma `Agora-Studio-X` (xaAgeioGlZosBsRquDXLvI) · section node 1941-64098 (Final Designs).
> Multi-agent review (5 lenses → dedup → adversarial verify): 56 raw → 29 confirmed findings.
> App-side slices 1–6 SHIPPED in studio_x_2 the same day (see git log). The Figma Fix List
> below (§4) is the designer's to-do — the design file itself still contains these defects.


## 1. Executive Summary

The design gets the journey shape right — a single checklist-driven landing, a competitor-import hook, and intent-first deploy cards that are actually *ahead* of the app on batch-first ordering — but it repeatedly contradicts both itself and the locked product model. The single biggest risk is the P0 status regression: Aria is badged "Ready to deploy" until all five checklist steps complete, which silently reverses the locked 2026-06-17 live-on-signup realignment and rebuilds the exact build-an-agent-first wall the north star (signup → live traffic → paid usage) was redesigned to remove. Close behind, the flow's credibility numbers are broken at the deploy-decision moment (800ms vs 500 ms on one screen, an implausible 23 ms LLM TTFT), and the agent has three competing editor surfaces with three different navigation grammars, so a user never forms a stable answer to "where do I change my agent?". The copy layer (vendor misspellings, grammar errors, a raw `voice_name` token) compounds this for a developer audience. Roughly a third of the findings are app-side, headlined by one genuine product gap the design exposes: a stack configurator (STT/LLM/TTS + MLLM) that is fully designed but has no editing UI anywhere in studio_x_2.

## 2. Findings (P0 → P3, one-line fix each)

### P0
- **[1] Aria badged "Ready to deploy" until checklist completes** (agent-card, figma) — Badge Aria "● Live" from frame 1; put progress on the checklist ("2 of 5 configured"), never on the agent's status word.
- **[2] Latency contradicts on one screen (800ms vs 500 ms) + implausible 23 ms LLM TTFT** (stack-panel, figma) — Adopt the app's reconciled numbers (end-to-end ~800ms, TTFT ~360ms, best case ~620ms) as the single latency source, or label differing measures explicitly.

### P1
- **[4] Frame 7 resurrects the retired Stack>KB>MCP>Connectors>Deploy subnav** (deploy-hub, figma) — Restate frame 7 as the wizard's Deploy step, delete the chevron subnav, keep exactly one Deploy affordance (the button).
- **[5] Three near-identical surfaces for one agent; "Edit Aria" circles back** (edit-agent, figma) — Collapse frames 1–5 into one surface with state variants (first-run numbered vs returning icons), matching the app's landing/isEdit modes.
- **[6] Web Widget chip filed under "Answer a phone number"; web has no step-2 intent** (deploy-hub, figma) — Move Web Widget to the Code/embed card (or retitle inbound to "Answer inbound — phone or web") and make step-2 intents map 1:1 onto deploy cards.
- **[7] Step 1 "Choose your voice" actually configures the whole model stack** (landing-checklist, figma) — Keep step 1 as the persona picker; move STT/LLM/TTS + MLLM under an honestly named "Voice & models" / "Model stack" surface.
- **[8] Step 5 "Test & Deploy — Select channels" reverses the shipped rename** (landing-checklist, figma) — Retitle step 5 "Deploy" with a "Review & go live" sub; testing lives only on the agent card (locked, commit 17fd266).
- **[9] Raw `voice_name` placeholder + chips never match the drawer's configured models** (agent-card, figma) — Bind card/step-1 chips to the configured stack and render the real voice name ("Blake").
- **[10] Stack configurator designed but no editing UI in the app** (stack-panel, app, GAP) — Build the stack drawer (presets + per-provider dropdowns + pipeline mode) and persist a `stack` field on AgentDraft (Slice 5 below).
- **[11] "Appointment Reminder" chip reads as a second identity** (agent-card, figma) — Drop the floating chip; render the role as a subtitle under "Aria" (app pattern, commit 8970022).
- **[12] Post-deploy state is a dead end** (landing-checklist, figma) — Design the success moment: confirmation → handoff to Monitor, then convert the checklist into a live-deployment summary card.
- **[13] Channel/intent chosen in three places with no source of truth** (landing-checklist, figma) — One choice at step 2; make step-4/5 sublabels reactive; pre-select the intent wherever it reappears; route switches through the undo-stash pattern.

### P2
- **[3] Breadcrumb claims "Edit Agent" on the landing, flips between states, trailing chevron** (breadcrumb, figma) — Crumb landing frames "My First Project > Agents" (no trailing chevron); reserve "Edit Agent" for the edit route.
- **[14] Import banner sits above the H1** (import-banner, figma) — Move the banner below H1 + subhead (shipped app layout) or make it a dismissible strip.
- **[15] Outbound intent has three names** (landing-checklist, figma) — Use the locked term "Batch calls" everywhere (step-2 control, deploy card, chips); "outbound" only as body-copy descriptor.
- **[16] Three nav encodings of the same sections, incl. an unlabeled icon rail** (edit-agent, figma) — One canonical inventory (the wizard's five steps) and one encoding; any surviving rail maps 1:1 with visible labels/tooltips.
- **[17] "Test Agent" vs "Talk to Aria" + unexplained grey orb** (agent-card, figma) — Use "Talk to Aria" everywhere the live agent is invokable; define the grey-orb state or drop it.
- **[18] "ASR" and "STT" name the same thing on one screen** (stack-panel, BOTH) — Standardize on "STT" in design stats tables and in the app's latency breakdown + credential categories (Slice 1 below).
- **[19] "MLLM / Configure your MLLM" is circular** (stack-panel, figma) — Explain the tradeoff: "Multimodal LLM — one model handles speech in and out. Lower latency, fewer knobs."
- **[20] Vendor names misspelled (Open AI, DeepGram, Eleven Labs)** (stack-panel, BOTH) — Official casing everywhere: OpenAI, Deepgram, ElevenLabs — Figma tables/drawer + app TEMPLATES array (Slice 1 below).
- **[22] No frames for blank new agent, Talk-to-Aria loading/error, post-import** (landing-checklist, figma, GAP) — Add three frames matching what the app already builds: blank builder (Draft, "Pick a voice to start"), talk-connecting/mic-denied, post-import playground.
- **[23] Agent meta row (copyable id · $/min · latency) missing; drafts show no stats** (agent-card, app, GAP) — Add an `agentId` copy chip to AgentIdentityCard and derive draft stats from the balanced default stack (Slice 3 below).
- **[24] "Add Custom Config" escape hatch absent from the app** (edit-agent, app, GAP) — Add a "</> Custom config" JSON drawer on the builder in edit mode (Slice 6 below).
- **[25] Inline Inbound|Outbound|Code segmented control not built** (landing-checklist, app, GAP) — Render the segmented type control inline on checklist row 2, routed through the existing selectType stash/undo (Slice 4 below).
- **[27] Deploy intent order: Figma leads batch (on-strategy), app leads inbound** (deploy-hub, app) — Reorder ChannelHero to Batch → Inbound → Code per the campaign-first lock (Slice 2 below); align the Figma step-2 default.

### P3
- **[21] Grammar: "How your agent connect", "and agent calls each one"** (landing-checklist, figma) — "How your agent connects" / "Upload a contact list — the agent calls each one."
- **[26] "Create New Agent" is the lone header CTA, competing with Talk to Aria** (landing-header, figma) — Demote to ghost/outline + add "View all agents"; the card's "Talk to Aria" stays the only primary.
- **[28] App import banner omits Bland though import supports it** (import-banner, app) — Name all four sources (Vapi, Retell, Bland, ElevenLabs) in the wizard banner copy (Slice 1 below).
- **[29] Formatting sweep: "$ 0.10/min", "800ms" vs "500 ms", "24x7", title-case drift, project-name casing, dropped "Knowledge Base"** (landing-checklist, figma) — Normalize: "$0.10/min", "800 ms", "24/7", sentence case, one project-name casing, full row-3 sub on all frames.

## 3. Build Plan — studio_x_2 (ordered slices; covers every kind=gap + where=app finding)

**Slice 1 — Copy & terminology sweep** *(findings 28, 20-app, 18-app; ~30 min)*
- Files: `studio_x_2/components/wizard/agent-wizard.tsx` (banner copy ~:292-295), `studio_x_2/app/(dashboard)/agents/page.tsx` (TEMPLATES :64-69), `studio_x_2/components/agent-identity-card.tsx` (:113 "ASR" → "STT"), `studio_x_2/lib/campaign-data.ts` (`stackLatencyBreakdown` labels ~:307-311; credential categories already "STT" at :798).
- Build: banner names all four import sources (Vapi, Retell, Bland, ElevenLabs); TEMPLATES casing → OpenAI/Deepgram; unify on "STT" across latency breakdown, card, and stats.
- Accept: `grep -rn "Open AI\|DeepGram\|Eleven Labs" studio_x_2/{app,components,lib}` → 0 hits; `grep -rn "\bASR\b" studio_x_2/components` → 0 user-facing hits; banner text lists Bland; `pnpm tsc --noEmit` clean.

**Slice 2 — ChannelHero reorder to campaign-first** *(finding 27; ~20 min)*
- Files: `studio_x_2/components/channel-hero.tsx` (:49-85).
- Build: reorder intent cards Batch calls → Inbound → Code (per LEARNINGS §20 2026-06-17 flagship lock); verify step-type card order in `components/wizard/step-type.tsx` matches or is explicitly unselected by default.
- Accept: builder Deploy step renders Batch calls as the first card; no other card content changes; build green.

**Slice 3 — Agent meta row: copyable id + draft stats** *(finding 23; ~1–2 h)*
- Files: `studio_x_2/components/agent-identity-card.tsx` (stats block :85-107), `studio_x_2/components/wizard/agent-wizard.tsx` (:244-247 prop gating), `studio_x_2/lib/campaign-data.ts` (default/balanced stack helpers).
- Build: optional `agentId` prop rendering `# agt_… ⧉` with copy-to-clipboard in the card stats block; ungate stack/cost/latency props from `isEdit` — new drafts derive from the balanced preset so $/min + latency show from first paint.
- Accept: `/agents/[id]/edit` card shows a copyable id; a brand-new draft's card shows $/min and latency before any step is completed; clipboard receives the id on click.

**Slice 4 — Inline intent segmented control on checklist row 2** *(finding 25; ~2 h)*
- Files: `studio_x_2/components/wizard/agent-wizard.tsx` (checklist rows :328-360, `selectType` stash/undo :90-116), `studio_x_2/components/wizard/step-type.tsx`, `studio_x_2/lib/wizard-draft.ts`.
- Build: compact [Inbound | Batch calls | Code] segmented control rendered inline in row 2 (row click still opens the drawer); inline changes route through the existing `selectType` stash so attached CSV/number data gets the undo toast. Label uses "Batch calls" (finding 15's locked term).
- Accept: switching intent inline with a CSV attached fires the undo toast and restores data on undo; drawer and inline control never disagree; keyboard/AX roles on the segmented control.

**Slice 5 — Stack configurator (the big gap)** *(finding 10; ~1–2 days)*
- Files: `studio_x_2/lib/wizard-draft.ts` (add `stack` field to AgentDraft, :25-44), `studio_x_2/components/wizard/step-voice.tsx` (or a new `step-stack` section), new `studio_x_2/components/wizard/stack-config.tsx`, `studio_x_2/lib/campaign-data.ts` (consume STACK_PRESETS/stackSummary/stackEstimate/stackLatencyBreakdown :156-311), `studio_x_2/components/agent-identity-card.tsx`.
- Build: a "Voice & models" surface honoring finding 7's split — persona picker first, then a stack section: preset selector (Fastest / Balanced / Cheapest from STACK_PRESETS), advanced per-slot STT/LLM/TTS provider dropdowns, Voice + Language pickers, and STT-LLM-TTS vs MLLM mode cards (with the finding-19 explainer copy). Persist to `AgentDraft.stack`; feed the identity card so $/min and the expandable latency breakdown update live on change.
- Accept: swapping Balanced → Fastest visibly changes the card's $/min and latency within the same render; draft round-trips the stack through save/reload; the list-page stack badge reflects the edited stack; `pnpm tsc --noEmit` + `pnpm next build` green; `buoy drift check` passes (tokens only).

**Slice 6 — "</> Custom config" escape hatch** *(finding 24; ~half day)*
- Files: `studio_x_2/components/wizard/agent-wizard.tsx` (edit-mode header area), new `studio_x_2/components/custom-config-drawer.tsx`.
- Build: a top-right "</> Custom config" affordance in edit mode opening a drawer with the agent's full JSON config (read-only at wireframe altitude is fine; monospace, copy button), assembled from the draft + stack + deployment fields.
- Accept: visible only in edit mode; JSON reflects current draft state including the Slice-5 stack; copy button works; no hardcoded colors.

*(Finding 22 is a gap where=figma — the app already implements all three states; no app slice needed.)*

## 4. Figma Fix List (frame/node → exact change)

**Shared chrome (all frames)**
1. All landing frames (1941-64179, 1941-64422, 1941-64285, 1941-66029): breadcrumb → `My First Project > Agents` — remove "Edit Agent" and the trailing chevron. Frame 1941-65712 keeps `… > Agents > Edit Agent` (no trailing chevron); 1941-64530 → `… > Agents > Aria > Deploy`. [3]
2. Everywhere: `$ 0.10/min` → `$0.10/min`; `800ms` → `800 ms`; `24x7` → `24/7`; sentence case for `System Prompt`→`System prompt`, `Create New Agent`→`Create new agent`, `Import Agent`→`Import agent`, `Add Custom Config`→`Add custom config`; unify project name casing (breadcrumb vs sidebar footer). [29]
3. Everywhere: `Open AI`→`OpenAI`, `DeepGram`→`Deepgram`, `Eleven Labs`→`ElevenLabs`. [20]

**Frame 1 — 1941-64179 (landing, first-run)**
4. Aria badge: `Ready to deploy` → `● Live`; add checklist progress caption `0 of 5 configured` on the checklist header instead. [1]
5. Move the import banner below the H1 + subhead (keep copy + CTA intact) or make it a dismissible strip. [14]
6. Header CTA `Create New Agent` → ghost/outline `Create new agent` + add ghost `View all agents`; card's `Talk to Aria` stays the only primary. [26]
7. Row 1: retitle to voice-persona picking; chips show the voice (e.g. `Blake`), not model ids; replace `voice_name` token. Move model chips to a "Voice & models"/stack row. [7, 9]
8. Row 2 sub: `How your agent connect` → `How your agent connects`; segmented control `Outbound` → `Batch calls`; make default selection match the batch-first flagship or explicitly unselected. [21, 15, 27]
9. Row 3 sub: add `Knowledge Base` to match frames 4/5 (`Behavior · Connectors · Knowledge Base`). [29]
10. Row 4 sub: make reactive to the step-2 choice (drop `Upload caller list` when Inbound is selected). [13]
11. Row 5: `Test & Deploy / Select channels` → `Deploy / Review & go live`. [8]

**Frame 2 — 1941-64422 (step 1 done)**
12. Restore the breadcrumb dropped in this variant (same trail as fix 1); apply fixes 4, 7, 8, 11. [3, 1]

**Frame 3 — 1941-64285 (stack drawer)**
13. Retitle drawer to `Voice & models` (or split persona vs model stack); card/row chips must bind to these configured values (`OpenAI GPT-5 nano · Deepgram Nova · ElevenLabs eleven_flash_v2_5 · Blake`). [7, 9]
14. Vendor casing per fix 3. [20]

**Frame 4 — 1941-66029 (all steps done)**
15. Design the post-deploy moment: success confirmation + deployed-channel summary (channel, number) + `View in Monitor →`; convert the checklist to a live-deployment summary card instead of persisting five checkmarks. Badge was already Live per fix 4 — the state change here is deployment, not liveness. [12, 1]

**Frame 5 — 1941-65712 (Edit agent)**
16. Merge into the landing surface as its "returning/edit" variant (icon rows) — one surface, two states; on the landing, drop `Edit Aria` or make it focus the checklist in place. [5]
17. Keep the wizard rows as the only section encoding; `Add Custom Config` → `</> Custom config`, anchored consistently. [16, 29]

**Frame 6 — 1941-64099 (Exploration)**
18. Remove the unlabeled 6-icon right rail, or map it 1:1 to the five wizard sections with visible labels/tooltips. [16]
19. Stats table: `AVERAGE END-TO-END LATENCY 500 ms` → `800 ms`; `AVERAGE LLM TIME TO FIRST TOKEN 23 ms` → `360 ms` (or replace with the ASR 130 / LLM 360 / TTS 190 per-provider breakdown, labeled `Best case 620 ms`); rename `ASR` column → `STT`. [2, 18]
20. Replace floating `Appointment Reminder` chip with a role subtitle under `Aria`. [11]
21. `Test Agent` → `Talk to Aria`; restore the purple orb, or explicitly label the grey state (`Preview — test changes before deploying`). [17]
22. MLLM card copy → `Multimodal LLM — one model handles speech in and out. Lower latency, fewer knobs.` [19]

**Frame 7 — 1941-64530 (04_Deploy Agent)**
23. Delete the `Stack > Knowledge Base > MCP > Connectors > Deploy >` subnav; restate the frame as the wizard's Deploy step using the checklist's step names; keep only the `Deploy Agent` button as the commit action. [4]
24. Card 1: `Launch batch calls` → `Batch calls`; chip `Batch Calling` → `Batch calls`; sub → `Upload a contact list — the agent calls each one.` [15, 21]
25. Card 2: move `Web Widget` chip to the Code/embed card, or retitle to `Answer inbound — phone or web`; `24x7` → `24/7`. [6, 29]
26. Pre-select the intent chosen at step 2 rather than re-asking. [13]
27. Apply fixes 19–21 (stats/latency, role chip, Talk to Aria) to this frame's shared panel; meta row `⏱ 800ms` → `⏱ 800 ms` and keep it in agreement with the stats table. [2, 11, 17, 29]

**New frames to add**
28. Blank new-agent builder: Draft badge, empty stack area, `Pick a voice to start`, empty-state $/min–latency treatment. [22]
29. Talk-to-Aria states: connecting, mic-permission-denied, connection-failed. [22]
30. Post-import landing: playground with the imported voice selected. [22]