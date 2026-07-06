# Heuristic evaluation — studio_x_2 agents journey (2026-07-06)

> Trigger: user report — "I need to remember which feature lives in which panel; recall over recognition."
> Method: 4-lens multi-agent evaluation (H6 deep-dive · Nielsen H1-H10 · 6 cognitive walkthroughs · findability), 46 raw → 23 confirmed findings (adversarially verified, 2 lenses each). Fix implementation started same day — see git log.

## UX Health Score

**54 / 100** — Sound architecture undermined by systematic invisibility. The checklist+drawer model is coherent and the deep-link substrate already exists, but the app's only feature map withholds all scent (P0 #1), and the default landing states false facts about the live agent (P0 #2).

| Component | Score | Basis |
|---|---|---|
| Heuristic compliance | 22 / 40 | H6 catastrophic (4); H1, H3, H5, H7 major (3s); 23 confirmed violations |
| Task success | 14 / 30 | 4 of 6 walkthrough tasks fail; 1 hesitation; 1 pass. Template path is a hard dead end (#5) |
| Anti-pattern hygiene | 12 / 20 | No deceptive patterns; but mystery-meat rows, silent failures, orphan pages, dead-end deep links present |
| Foundation quality | 6 / 10 | Locked believe-then-scale flow, undo pattern, deep-link grammar, token discipline are genuinely strong |

Scope: `/agents` builder landing + 5 step drawers + list view + identity card + ⌘K + Monitor badge, evaluated from component source (studio_x_2). Not assessed: Monitor internals, Resources, Composer, Realtime Services, mobile beyond drawer occlusion.

---

## Anti-Pattern Verdict

**Minor Issues — no deceptive patterns; five "common UX failure" anti-patterns confirmed.**

- **Mystery-meat navigation** (Medium): checklist rows say only "Tap to open" — the map of ~30 features is blank (#1); latency breakdown hides behind an unlabeled chevron (#24).
- **Silent failure** (High): template "Start from this" silently discards the template and may restore an unrelated stale draft (#5); edit-mode autosave is promised in copy but disabled in code (#6).
- **False system state** (High): live agent Aria rendered as "3 of 5 complete · Attach a phone number" while badged Live (#2). Not deceptive by intent, but it is the system asserting a falsehood.
- **Mislabeled affordance** (Medium): "Custom config" is a read-only JSON viewer (#17); "Save & close" implies staging that doesn't exist (#18).
- **Dead-end deep link** (Medium): list-row "Deploy" → unhandled `#deployment` anchor (#14).

No confirmshaming, fake urgency, prechecked consent, or roach-motel patterns anywhere in scope.

---

## Priority Issues

### P0 — Critical

**#1 — Checklist rows hide the content map ("Tap to open" everywhere)** → `/organize`
*Where:* `agent-wizard.tsx:137-140` (rowDetail), `:232-246` (stepSummary gated on completion). *Why:* The landing checklist is the app's only index of ~30 drawer-hidden features (Configure alone hides 7+), yet every incomplete row shows zero scent. This is the literal mechanism of the user's complaint — recall over recognition. The Figma spec had content keywords per row; the build dropped them. *Fix:* persistent, state-independent manifest line per row (chips/dot-line), branching on agent type, sharing a slot with the value summary once done.

**#2 — Editing a live agent fabricates its channel** → `/fortify`
*Where:* `lib/wizard-draft.ts:112-128` (agentToDraft hardcodes `inbound`, no numberId), `lib/campaign-data.ts:135-153` (Agent has no channel field). *Why:* Aria is badged Live yet the checklist demands "Attach a phone number"; batch/WhatsApp agents open as "Inbound". Two panels contradict each other about the same agent, destroying trust in every summary — and a redeploy from this draft would go live on the wrong channel. *Fix:* persist channelType/numberId/csvName on Agent, hydrate in agentToDraft, render live agents in a fully-summarized "deployed" state.

### P1 — Major

**#3 — Step titles don't announce scope** → `/articulate` — `types.ts:10-18`; "System prompt" secretly holds greeting/knowledge/MCP/quick-test; "Configure" is zero-scent; Step 4's own copy apologizes for the misplacement. Rename row 3 "Prompt & tools", make row 4 channel-dynamic via `channelLabel`.

**#4 — Templates undiscoverable from the default surface** → `/organize` — `page.tsx:230-237, 440-450`; the best activation accelerator lives two low-scent hops away behind "View all agents"; absent from builder landing and ⌘K. Add "Start from a template" beside the import banner + a ⌘K command.

**#5 — "Start from this" silently discards the template** → `/journey` — `page.tsx:153-158` links to `/agents/{tpl.id}/edit`; `getAgent()` misses, wizard falls back to stale/empty draft (`agent-wizard.tsx:59,164-174`). Route via `?template=` seeding + confirming toast.

**#6 — Autosave promised, silently disabled in edit mode** → `/fortify` — `agent-wizard.tsx:187` gates save on `!isEdit` while `:283` and `step-build.tsx:30` promise autosave; refresh discards all edits on the canonical (Aria) path; no save-status indicator exists in either mode.

**#7 — Batch-call settings invisible outside their drawer and reset on close** → `/fortify` — `step-configure.tsx:212-215` local useState; drawer unmounts at `agent-wizard.tsx:449-461`; absent from summaries, review, and Custom-config JSON. Purest "no visible current value" case in the flow.

**#8 — Builder↔list is an unlabeled mode trap** → `/organize` — `page.tsx:397-413`; `replaceState` kills Back, list has no builder affordance, sidebar Agents link is inert same-route; Aria landing unreachable without hard refresh. Segmented control + `useSearchParams`-derived view.

**#9 — Voice Playground is an orphan route** → `/organize` — only entry is per-voice text links inside the Step-1 drawer (`step-voice.tsx:98-140`); no sidebar, ⌘K, or breadcrumb; clicking exits the wizard mid-drawer.

**#10 — ⌘K indexes pages only** → `/organize` — `command-palette.tsx:34-74`; searching "language", "widget", "CSV", "template" recovers nothing, though `?step=N` deep links already exist. The recall-failure escape hatch fails exactly when needed.

**#11 — Deployment target absent from the identity card** → `/journey` — `agent-identity-card.tsx:21-60`; card shows $/min and latency but never WHERE the agent is live. Add a channel line via `channelTarget()`.

**#12 — Reading the embed snippet requires mutating the channel** → `/journey` — `step-configure.tsx:50-52` renders one channel's config only; a read intent forces a type switch that changes what deploys (`agent-wizard.tsx:92-124`). Expose snippets read-only (config drawer / "Get code").

### P2 — Minor

**#13 — Progress can never reach 5/5** → `/fortify` — `isDone` hardcodes false for step 5 (`agent-wizard.tsx:132-134`); "4 of 5 complete" beside "Everything's set"; Deploy row reuses untouched-step copy and never earns a ✓ post-deploy.
**#14 — List "Deploy" deep-links to unhandled `#deployment`** → `/journey` — `page.tsx:328` vs mount handling that reads only `?step/?dc/?artifact`; switch to `?step=5`.
**#15 — Step-3 summary is a boolean ("Prompt set")** → `/articulate` — `agent-wizard.tsx:237-243`; counts hidden when zero; the one row that reports a flag, not values.
**#16 — Language/preset/pipeline have no visible current value; Language buried under "Models behind the voice"** → `/articulate` — `campaign-data.ts:299-302`, `stack-config.tsx:101-111`, `step-publish.tsx:44-61`.
**#17 — "Custom config" mislabels a read-only viewer; edit-mode only** → `/articulate` — `custom-config-drawer.tsx:22-67`; ironically the only whole-agent recognition surface, framed as an escape hatch.
**#18 — Drawer footers: "Save & close" implies staging; Step 5 has no footer** → `/fortify` — `agent-wizard.tsx:464-476, 76-79`; no revert path after mangling a live agent's prompt.
**#19 — "Code" vs "Embed" vs "Code / SDK"** → `/articulate` — `agent-wizard.tsx:531-536` vs `step-type.tsx:34-38` vs `page.tsx:93`; three names, one concept; "Embed" collides with Web widget.
**#20 — Open drawers never write the URL** → `/journey` — `agent-wizard.tsx:190-193`; refresh drops you to the checklist; deep-link grammar exists inbound only.
**#21 — Stale voice-test signposts; Step-5 drawer occludes the promised "panel on the left" on mobile** → `/articulate` — `step-build.tsx:115`, `step-publish.tsx:37-39`, sheet `w-full` below sm.
**#23 — Monitor badge: bare unlabeled number, lands on Overview not Diagnostics** → `/include` — `app-sidebar.tsx:96-103`, `monitor-nav.tsx:15-20`.

### P3 — Cosmetic

**#24 — Zero tooltips; latency breakdown behind unlabeled chevron; "Preset" lock and "TTFT" unexplained** → `/articulate` — `agent-identity-card.tsx:114-141`, `step-voice.tsx:83-87`.

---

## Heuristic Scores

| Heuristic | Score | Justification |
|---|---|---|
| H1 Visibility of system status | **3** | Live agent misreported (#2), autosave unverifiable (#6), deploy target invisible (#11), 5/5 unreachable (#13), unlabeled badge (#23) — status lies or stays silent across the core surface. |
| H2 Match system ↔ real world | **2** | "Configure" and "Custom config" are system-speak (#3, #17); "Embed" and "TTFT" are insider terms (#19, #24). |
| H3 User control & freedom | **3** | Back-button trap on the view switch (#8), no revert after live-prompt edits (#18), read intent forces a state mutation (#12), drawers invisible to browser wayfinding (#20). |
| H4 Consistency & standards | **2** | Three names for one channel (#19), Step 5 breaks the footer pattern the first four drawers teach (#18), contradictory progress signals (#13). |
| H5 Error prevention | **3** | Fabricated channel invites "fixing" a working deployment and wrong-channel redeploys (#2); stale test signpost misroutes at the deploy moment (#21). |
| H6 Recognition rather than recall | **4** | The catastrophic axis and the user's complaint: blank row map (#1), scope-blind titles (#3), settings with no visible value (#7, #16), boolean summaries (#15), orphan route (#9), hidden affordances (#24). |
| H7 Flexibility & efficiency | **3** | ⌘K can't reach any in-drawer feature (#10), templates two hops deep (#4), dead-end Deploy shortcut (#14), unshareable drawer state (#20). |
| H8 Aesthetic & minimalist design | **2** | Over-minimalism: rows stripped of scent (#1) — minimalism that deletes information users need is a violation, not a virtue. |
| H9 Error recovery | **2** | Template handoff fails silently with a misleading "Draft restored" toast and no diagnosis path (#5). |
| H10 Help & documentation | **2** | Zero tooltips in the wizard; preset-fork behavior documented only in a code comment (#24). |

---

## Cognitive Walkthrough Results

| # | Task | Breakdown step | Q1 Motivation | Q2 Visibility | Q3 Understanding | Q4 Feedback | Rating | Findings |
|---|---|---|---|---|---|---|---|---|
| T1 | Change the agent's spoken language | Locate the setting from the checklist | Yes | **No** — no row mentions Language; field buried under "Models behind the voice" | Yes (once found) | **No** — no summary/card confirms the new language | **Failure** | #1, #10, #16 |
| T2 | Verify which number the live agent answers | Read landing for Aria | Yes | **No** — card omits channel; checklist claims no number attached | Yes | **No** — panels contradict each other | **Failure** | #2, #11 |
| T3 | Attach a CRM/knowledge connector | Pick the right row | Yes | **No** — no row names connectors; "System prompt" gives no scent; user bounces to Resources | **No** — Resources looks like the answer but doesn't attach | Yes (in-drawer) | **Failure** | #1, #3, #10 |
| T4 | Copy the web-widget/SDK snippet (phone agent) | Find + read the snippet | Yes | **No** — nothing says snippets live under "Configure" | **No** — requires switching channel; stash toast implies destruction | Yes | **Failure** | #1, #12, #10 |
| T5 | Test the agent, then deploy | Follow Step-3 pointer into Step 5 | Yes | Yes | **No** — promised test isn't there; "panel on the left" occluded on mobile | Yes | **Hesitation** | #21 |
| T6 | Start a new agent from a template | Find templates, then seed | Yes | **No** — hidden behind "View all agents" ghost button | Yes | **No** — CTA silently discards the template; stale-draft toast misleads | **Failure** | #4, #5, #8 |

Estimated task-completion rate across the six core tasks: ~40–50% without prior product knowledge (estimates from walkthrough; route to `/measure` for instrumentation post-fix).

---

## Positive Findings — protect these

1. **The checklist+drawer architecture itself** (locked). One landing, five progressive-disclosure drawers, sticky progress bar — the chassis is right; every fix below is additive visibility, not structural reversal.
2. **Believe-then-scale first-run.** Live Aria + in-browser Talk test on the card is the strongest activation pattern in the app (locked; keep the card's Talk affordance central — #21 leans on it).
3. **Deep-link grammar already exists.** `?step= / ?dc= / ?artifact=` handling in `agent-wizard.tsx:143-185` is the ready-made substrate for fixes #10, #14, #20 — cheap wins.
4. **Step-2 type-switch stash + undo toast** (`agent-wizard.tsx:92-124`) — "set aside, not deleted" is a genuinely good H3 pattern; replicate it for drawer-level revert (#18).
5. **`channelLabel()` / `channelTarget()` helpers** — single source of truth for channel rendering; reusing them (fixes #11, #19) guarantees summaries can't drift.
6. **Completed rows for Steps 1/2/4 show real values** (voice · stack, type, number · CSV) — the right summary model; Step 3 is the outlier to bring up to standard, not a reason to change the pattern.
7. **New-draft persistence with "Draft restored" toast** — the mechanism is solid; it just needs to also cover edit mode (#6) and not fire on template misses (#5).
8. **Per-provider latency breakdown** (commit 9408c8d) — differentiating, honest engineering transparency; it only needs a discoverable handle (#24).
9. **List-view Channel column** shows the true deployment target — proof the data model can support fixes #2 and #11.
10. **Design-token discipline + ⌘K palette existing at all** — the escape hatch is built; it needs indexing, not construction.

---

## Recommended Actions (by skill)

- **Engage `/organize` for #1, #4, #8, #9, #10** — all findability/wayfinding: the row manifest map, template entry points, the builder↔list mode switch, playground reachability, and the ⌘K feature index. This group is the direct answer to the P0 complaint; do it first as one coherent pass.
- **Engage `/fortify` for #2, #6, #7, #13, #18** — all state-integrity: truthful edit-mode hydration, edit-mode autosave + save status, outbound settings in the draft, the step-5 completion model, and drawer revert/footer semantics.
- **Engage `/articulate` for #3, #15, #16, #17, #19, #21, #24** — all words: scope-honest titles, substantive summaries, language/preset surfacing, honest "View config (JSON)", one channel vocabulary, corrected test signposts, tooltips/jargon.
- **Engage `/journey` for #5, #11, #12, #14, #20** — all flow plumbing: template seeding, card channel line into Step 4, read-only code path, `?step=5` deep link, drawer↔URL mirroring.
- **Engage `/include` for #23** — badge semantics, accessible name, destructive styling, Diagnostics scent trail (also closes the a11y gaps flagged inside #24 while `/articulate` writes the copy).
- **Afterwards, engage `/measure`** to instrument the six walkthrough tasks (find-language, verify-number, attach-connector, copy-snippet, test-then-deploy, template-start) so the fixes are verifiable against the funnel north star.

---

## Ordered Implementation Plan

Recognition-over-recall first; each slice is independently shippable and buildable (`pnpm tsc --noEmit` + `pnpm next build` green per slice). All paths relative to `/Users/shaktisoni/Documents/Agora Design & FE/ai-studio-console-redesign/studio_x_2/`.

**Slice 1 — Row content manifests (fixes #1, P0)**
Files: `components/wizard/agent-wizard.tsx`, `components/wizard/types.ts`.
Change: add a `STEP_MANIFEST: Record<number, (draft) => string[]>` (in types.ts or beside rowDetail) returning type-aware feature keywords — 1: `["Persona","STT/LLM/TTS","Language"]`; 2: `["Batch calls","Inbound","Code / SDK"]`; 3: `["Prompt","Greeting","Knowledge","Connectors","Quick test"]`; 4 outbound: `["Number","Contacts CSV","Call window"]` / inbound-phone: `["Number","Routing"]` / web: `["Widget embed"]` / code: `["SDK install","Join snippet"]`; 5: `["Review","Deploy"]`. Rewrite `rowDetail()` (lines 137-140) to always render the manifest as a muted dot-separated line; keep the "Start here — about a minute" nudge as a small chip beside it on `firstIncomplete` only; when `isDone(n)`, render `stepSummary(n)` in the same slot. Delete the "Tap to open" string.
Acceptance: on a fresh empty draft, all 5 rows show feature keywords; `grep -r "Tap to open" components/` returns nothing; choosing type=outbound changes row 4's manifest.

**Slice 2 — Scope-honest step titles (fixes #3)**
Files: `components/wizard/types.ts` (STEP_TITLES, lines 10-18), `components/wizard/agent-wizard.tsx` (drawer H2), Resources page (Knowledge/MCP tabs).
Change: row 3 → "Prompt & tools"; row 4 → default "Connect a channel", dynamic post-type via `channelLabel` ("Set up batch calls" / "Connect a phone number" / "Add web widget" / "Add to your app"); sync the Sheet header title to the same function. On Resources' Knowledge and MCP tabs add a muted line + link: "Attach to an agent from its Prompt & tools step" → `/agents/[id]/edit?step=3`.
Acceptance: no row is titled bare "Configure"; drawer H2 always equals its row title; Resources KB tab links into step 3.

**Slice 3 — Truthful edit-mode channel hydration (fixes #2, P0)**
Files: `lib/campaign-data.ts` (Agent interface, lines 135-153 + AGENTS mock), `lib/wizard-draft.ts` (`agentToDraft`, lines 112-128), `components/wizard/agent-wizard.tsx` (sticky bar, lines 425-426).
Change: add `channelType`, `numberId?`, `csvName?` to Agent (list mock already carries channelType — promote it into the record); `agentToDraft` maps batch→outbound (+csvName), phone/web→inbound with mode (+numberId), code→code; unknown → `type: null` leaving Step 2 honestly incomplete. When `agent.status === "live"`, render all rows via `stepSummary`, suppress `blockReason`, and show footer "Live on {channelTarget()} — edit any step".
Acceptance: opening Aria shows no "Attach a phone number", Step-4 summary reads "Inbound · +1 (628) 555-0188", sticky bar never says "3 of 5" for a live agent; Collections Outreach opens as Batch calls, Appointment Setter as WhatsApp/web — matching the list's Channel column exactly.

**Slice 4 — Channel line on the identity card (fixes #11)**
Files: `components/agent-identity-card.tsx` (props, lines 21-60), `components/wizard/agent-wizard.tsx` (call site, lines 326-341; `channelTarget()` helper).
Change: add optional `channel?: { label: string; onClick(): void }` prop rendered as an icon + "Answers +1 (628) 555-0188" (or "Web widget · …" / "SDK / API") line in the stats block; wire onClick to `openRow(4)`; pass `channelTarget()` from the wizard so it cannot drift from Step 4's summary.
Acceptance: deployed agent's card shows its number/channel; clicking it opens the Configure drawer; draft with no channel shows no line (no fake value).

**Slice 5 — Step-5 completion model (fixes #13)**
Files: `components/wizard/agent-wizard.tsx` (`isDone` lines 132-134, `rowDetail` fallback 137-140, sticky bar 425-426).
Change: treat step 5 as a tri-state: blocks present → normal incomplete; blocks empty → "Ready to deploy" row style (distinct accent + rocket icon), counter reads "4 of 4 setup steps set — ready to deploy"; edit-mode live agent → done ✓ with "Deployed · live on {target}". Never route `rowDetail(5)` through the firstIncomplete "about a minute" fallback.
Acceptance: a fully configured draft shows no "4 of 5" next to "Everything's set"; Aria's row 5 shows Deployed ✓; Deploy row never shows "Start here — about a minute".

**Slice 6 — ⌘K feature index (fixes #10; palette halves of #4, #9)**
Files: `components/command-palette.tsx` (COMMANDS, lines 34-74).
Change: add an "Agent settings" group with keyword-rich entries → wizard deep links: "Change language / voice / models" → `/agents?step=1`; "Edit system prompt / greeting / knowledge / connectors" → `?step=3`; "Phone number / contacts CSV / web widget / embed snippet" → `?step=4`; "Test agent / deploy" → `?step=5`; plus "Browse agent templates" (keywords: template, IVR, survey, reminder) → `/agents?view=list&templates=1` and "Voice playground — design a custom voice" (keywords: voice, tts, clone, persona) → `/agents/playground`.
Acceptance: typing "language", "csv", "widget", "template", or "playground" each returns a command that lands with the correct drawer/sheet open.

**Slice 7 — Template seeding path (fixes #5, #4)**
Files: `app/(dashboard)/agents/page.tsx` (CTA line 153-158; landing banner 440-450; ListView templates trigger honoring `?templates=1`), `components/wizard/agent-wizard.tsx` (mount effect, lines 143-185), `lib/wizard-draft.ts` (template→draft hydrator).
Change: CTA → `/agents/new/edit?template={tpl.id}`; wizard mount reads `?template`, hydrates name/prompt/greeting/type/voice from the template and skips `restoreDraft()`; toast "Started from Appointment Reminder". Landing: add "Start from a template" button at equal weight inside the existing dashed "Import your agent" banner, opening the same templates Sheet.
Acceptance: picking any template opens a builder pre-filled with its prompt and name; no "Draft restored" toast fires on that path; the template Sheet is reachable in one click from the builder landing.

**Slice 8 — Builder↔list segmented control + URL-derived view (fixes #8)**
Files: `app/(dashboard)/agents/page.tsx` (view state, lines 397-413; ListView header).
Change: derive `view` from `useSearchParams()` on every render (drop the mount-only effect and local state); switch via `router.push("/agents?view=list")` / `router.push("/agents")`; render a persistent two-option segmented control "Builder | All agents" at the top of both modes; keep "View all agents"/"Create new agent" as shortcuts setting the same param.
Acceptance: browser Back from list returns to the builder; clicking sidebar "Agents" from `?view=list` shows the builder; the Aria landing is reachable from the list without a hard refresh; the control shows the active mode in both views.

**Slice 9 — Outbound settings into the draft (fixes #7)**
Files: `components/wizard/step-configure.tsx` (lines 212-215), `lib/wizard-draft.ts` (AgentDraft `config.outbound` shape), `components/wizard/agent-wizard.tsx` (Step-4 stepSummary), `components/wizard/step-publish.tsx` (review), `components/custom-config-drawer.tsx` (JSON assembly, lines 30-45).
Change: move callWindow/maxConcurrent/retries from local useState into `draft.config.outbound` via the shared `update()`; render them in the Step-4 summary ("Batch calls · +1… · contacts.csv · 9–5 · 10 lines · retry ×1"), the Step-5 review, and the config JSON.
Acceptance: set retries to 3, close and reopen the drawer — value persists; the Step-4 row and Custom-config JSON both show it.

**Slice 10 — Edit-mode autosave + visible save status (fixes #6)**
Files: `components/wizard/agent-wizard.tsx` (save gate line 187; header/progress area), `lib/wizard-draft.ts` (per-agent slot `sx:agent_draft:<id>` + restore).
Change: remove the `!isEdit` gate; write edit drafts to the per-agent key and restore on mount (with a "Resuming unsaved edits" toast + discard option); add a small live status chip near the progress bar ("Saving… / Saved just now") driven by the debounced save, shown in both modes.
Acceptance: edit Aria's prompt, refresh — the edit survives with a resume toast; the chip flips Saving→Saved on every change; header copy and behavior now agree.

**Slice 11 — Drawer↔URL mirroring + fix the dead anchor (fixes #20, #14)**
Files: `components/wizard/agent-wizard.tsx` (`openRow`/`closeDrawer`, lines 190-193), `app/(dashboard)/agents/page.tsx` (line 328).
Change: `openRow(n)` → `history.replaceState(…, "?step="+n)`; `closeDrawer` strips the param (replaceState, not pushState, so Back still exits the page predictably — the mount parser already restores). Change the list-row Deploy href to `/agents/[id]/edit?step=5`; `grep -rn "#deployment" studio_x_2/` and migrate every hit.
Acceptance: refresh with Step 4 open restores Step 4; copying the URL reproduces the state in a new tab; list "Deploy" lands with the Deploy drawer open; grep for `#deployment` returns nothing.

**Slice 12 — Honest, universal config viewer + read-only code path (fixes #17, #12)**
Files: `components/custom-config-drawer.tsx` (lines 22-67), `components/wizard/agent-wizard.tsx` (line 289-290), `components/wizard/channel-configs.tsx` (snippet components for reuse).
Change: rename trigger to "View config (JSON)" with subtitle "Read-only — edit via the steps or the API"; render in new-draft mode too (JSON assembles from the draft). Add a "Get code" section inside the drawer with the SDK + widget snippets parameterized by the real agentId, labeled "For reference — your agent stays on {channelLabel}"; make each JSON section header an "Edit in Step N" link using the Slice-11 deep links.
Acceptance: a phone-channel agent's user copies the SDK snippet without touching Step 2 (no stash toast fires); the button exists during new-agent creation; nothing in the drawer is editable or implies it is.

**Slice 13 — Honest drawer footers + revert (fixes #18)**
Files: `components/wizard/agent-wizard.tsx` (footer, lines 464-476; snapshot on `openRow`).
Change: relabel "Save & close" → "Done", "Save & continue" → "Next step"; snapshot the draft on drawer open and add a per-drawer "Undo changes" text button restoring it (same pattern as the Step-2 stash toast); render the footer for Step 5 too (Back + Done) by dropping the `openStep < 5` condition.
Acceptance: mangle the prompt, hit Undo changes — the on-open value returns; Step 5's footer matches steps 1–4; no label promises a save distinct from what Esc/X does.

**Slice 14 — One channel vocabulary (fixes #19)**
Files: `components/wizard/agent-wizard.tsx` (`channelLabel`, lines 531-536), `components/wizard/step-type.tsx` (34-38), `components/wizard/channel-configs.tsx` (49), `app/(dashboard)/agents/page.tsx` (93).
Change: standardize on "Code / SDK" in typeLabel/channelLabel/CHANNEL_META/type card/toast; reserve "embed" strictly for web-widget copy.
Acceptance: `grep -rn "Embed" studio_x_2/components studio_x_2/app` shows hits only in web-widget context; Step-2 card, Step-4/5 summaries, deploy toast, and the list column all read "Code / SDK".

**Slice 15 — Substantive summaries + Language surfacing (fixes #15, #16)**
Files: `components/wizard/agent-wizard.tsx` (stepSummary(3), lines 237-243; stepSummary(1) 233-235), `lib/campaign-data.ts` (`stackLine`, lines 299-302), `components/wizard/step-publish.tsx` (review, 44-61), `components/wizard/stack-config.tsx` (Language select, 101-111).
Change: stepSummary(3) → first ~50 prompt chars (or "Prompt · 214 chars") + "Greeting set"/"No greeting" + always-rendered "{k} knowledge · {m} connectors" (including zeros). Append language + preset to `stackLine` and the Step-1 summary ("Aria · Balanced · gpt-4o-mini · nova-2 · turbo · Spanish"); add a Stack/Language row to the Step-5 review. Move the Language select above the model grid with its own label "Spoken language".
Acceptance: set Spanish + Cheapest preset — both visible on the row summary, identity card stack line, and Step-5 review without opening any drawer; Step-3 row with zero attachments still names knowledge/connectors.

**Slice 16 — Corrected voice-test signposts (fixes #21)**
Files: `components/wizard/step-build.tsx` (line 115), `components/wizard/step-publish.tsx` (37-39), `components/wizard/agent-wizard.tsx` (pass `toggleTest` into StepPublish).
Change: Step-3 footer → "Full voice test: use 'Talk to {name}' on the agent card at any time." Step 5: render an inline secondary "Talk to {name}" button wired to the same `toggleTest`, copy → "Talk to it any time — here or from the agent card." Step 5 stays Deploy (locked).
Acceptance: at 375px with the Step-5 drawer open, a working test affordance is visible inside the drawer; no copy references a test "in the last step" or an occluded "panel on the left".

**Slice 17 — Playground round-trip (fixes #9, with Slice 6's ⌘K entry)**
Files: `components/wizard/step-voice.tsx` (drawer header), `app/(dashboard)/agents/playground/page.tsx` (breadcrumb), `components/agent-identity-card.tsx` / Step-1 summary (voice-name link for custom voices).
Change: add a "Voice playground →" link in the Step-1 drawer header; on the playground page, a "← Back to your agent" breadcrumb (preserving the source agent id via `?from=`); make custom-voice names on the card/Step-1 summary link into the playground.
Acceptance: playground reachable via ⌘K, the Step-1 header link, and a custom voice's name; from the playground one click returns to the originating builder.

**Slice 18 — Monitor badge semantics (fixes #23)**
Files: `components/app-sidebar.tsx` (96-103, 131-139), `components/monitor-nav.tsx` (15-20) or /monitor overview page.
Change: badge → `variant="destructive"`, `aria-label`/tooltip "15 open critical issues — Diagnostics"; either deep-link the badged Monitor item to `/monitor/diagnostics` or add a top-of-Overview banner "15 critical issues → Diagnostics".
Acceptance: screen reader announces the count with context; clicking through from the badge reaches the issues in ≤1 additional obvious click; badge reads as severity, not notifications.

**Slice 19 — Tooltips and jargon (fixes #24)**
Files: `components/agent-identity-card.tsx` (114-141), `components/wizard/step-voice.tsx` (83-87).
Change: latency chip gets `aria-label` + shadcn Tooltip ("Estimated response latency — click for the per-stage breakdown") and a visible muted "breakdown" suffix; "LLM (TTFT)" → "LLM (time to first token)" or tooltip; Preset lock badge tooltip "Ready-made voice — Customize to make an editable copy".
Acceptance: every interactive icon-only affordance on the card has an accessible name; a hover reveals what the chevron does before clicking; no unexplained acronym remains in the breakdown panel.

Coverage check: #1(S1) #2(S3) #3(S2) #4(S6+S7) #5(S7) #6(S10) #7(S9) #8(S8) #9(S6+S17) #10(S6) #11(S4) #12(S12) #13(S5) #14(S11) #15(S15) #16(S15) #17(S12) #18(S13) #19(S14) #20(S11) #21(S16) #23(S18) #24(S19) — all 23 confirmed findings mapped. Slices 1–8 are the recognition-over-recall core; ship them first as they directly resolve the P0 complaint and all four failed walkthrough tasks. Per project rules: commit + push each slice and run `vercel deploy --prod --yes` manually (git auto-deploy is broken).
---

# Post-fix addendum (2026-07-06, end of day)

**Loop closed after three rounds.** Status of the original complaint ("recall over
recognition — I must remember which panel holds which feature"): **resolved**.

| Round | Commit(s) | What happened |
|---|---|---|
| 1 — Fix all 23 | `25a3994` | 19 slices: row content manifests, scope-honest titles, truthful live-agent hydration (Agent.channel), card channel line, step-5 tri-state, ⌘K feature index, template seeding, Builder\|All-agents switch, edit-mode autosave + save chip, ?step URL mirroring, View config (JSON) + Get code, Done/Next-step footers + Undo, one channel vocabulary, substantive summaries, corrected signposts, playground links, Monitor badge semantics, tooltips |
| 1.5 — Walkthrough residuals | `54764b8`, `d617628` | Step-4 drawer never empty (inline type chooser; headings mirror stepTitle); minimalist pass (banner → one line, chevron rows, single view switch) |
| 2 — Re-evaluation | `c2c2224` | 24-agent verification pass confirmed **18 residuals (4 P1 · 4 P2 · 10 P3)** — all fixed same day. Highlights: number pickers now include the agent's current (active) number; ⌘K drawer commands work in place via a cancelable window event (and no longer retarget the wrong agent); the playground round-trip returns to the originating agent; template seeding can no longer clobber saved work and "blank" is blank; the two AGENTS mocks were re-aligned (WhatsApp claim removed); Undo works on deep-linked drawers and preserves behind-sheet edits; Resources tabs link back to Prompt & tools. |

**Exit check:** no P0/P1 findings remain open; all 41 defect items across both
evaluations are closed and deployed. The six cognitive-walkthrough tasks that
failed (T1–T4, T6) now pass by code trace: language is named on row 1 and in ⌘K;
the live number is on the card, row 4, sticky bar, AND selectable in the drawer;
connectors are named on row 3 with a reciprocal link from Resources; snippets are
copyable read-only via View config → Get code (⌘K: "Get code"); templates are one
click from the landing and actually seed the builder.

Remaining known limitations (accepted, not defects): channel truth lives in two
mock arrays kept aligned by convention (full derivation deferred); the one-frame
builder flash on a hard load of `?view=list` (side-effect-free now); WhatsApp is
not representable as a channel by design (one agent ↔ one channel, phone/web/
batch/code).
