# studio_x_2 — Agent-Creation Redesign · Design Case Study

> **Living doc.** The single source of truth for the studio_x_2 agent-creation redesign: every ask, every decision, why, and where it landed. Update it every round so nothing is dropped or re-litigated. Last updated: 2026-07-01.

---

## 1. Problem & north star

The Agora console's Console↔Studio seam dropped ~93% of users (LEARNINGS §2). The studio_x_2 fork rebuilds **agent creation** as the fastest possible path from a signed-up user to a **live deployment carrying traffic** (the revenue north star — publishing an agent earns $0; minutes on a live deployment earn money). Every decision below optimizes **time-to-live** and **first-time-user clarity**.

- **Live app:** https://ai-studio-console-redesign.vercel.app (the `ai-studio-console-redesign` Vercel project, Root Directory repointed `studio-x` → `studio_x_2`).
- **Source:** `studio_x_2/` (fork of `studio-x/`, which is untouched). `@/*` is root-relative → structurally isolated.

---

## 2. Ask + decision log (chronological)

| # | Ask (user's words, paraphrased) | Decision | Rationale | Status |
|---|---|---|---|---|
| 1 | Fix the whole product as a flow; fork **studio_x_2** without touching studio-x; rebuild agent creation as one unified wizard (Import accelerator + 5 steps + branches). | Forked; built the 5-step creation surface at `/agents/[id]/edit` powering new/edit/onboarding/empty. | One surface, four modes = no divergent code; fastest path. | ✅ shipped |
| 2 | New users land on the believe-then-scale home; clear "Create new agent"; make it responsive. | `/agents` = home; Aria auto-provisioned; responsive. | Believe (talk to Aria) → scale (deploy). | ✅ shipped |
| 3 | Deploy studio_x_2 as the **main** Vercel version. | Repointed the prod project's Root Directory to `studio_x_2`; deploy from repo root via `vercel deploy --prod`. | One canonical URL; reversible (flip Root Directory back). | ✅ shipped |
| 4 | Make it clear Aria deploys **to** the channels; the builder should be an **upfront widget** (all steps visible); fix Figma reading. | Aria-above-channels + "Deploy Aria to a channel" heading; builder → upfront stacked stepper; Figma via Dev-Mode MCP (`get_screenshot`/`get_metadata` + node-id, desktop app open). | All steps visible = obvious path. | ✅ shipped (locking later fully rejected — see #6, #9) |
| 5 | "Homepage looks so complex" → simplify; 10 prototypes → audit best. | 10 prototypes on a throwaway `/agents/proto` harness → 3-lens judge panel → **V1 "bare hero"**. | Simplicity + first-run fit. | ✅ shipped — later **reversed** to the journey widget (#9) |
| 6 | Don't lock the edit page; let users explore. | Soft-lock: locked steps still open, view-only + "finish previous first". | Transparency over hard locks. | ✅ shipped — later hardened to **no lock** (#9) |
| 7 | One widget that visually solves the whole spec; 10 options → audit. | 10 builder layouts on `/agents/builder-lab` → **V10 "checklist + drawers"**. | Whole path at a glance; edit-in-drawer; sticky publish. | ✅ shipped |
| 8 | Build V10 for real; `/journey` + `/fortify`; fix the 3 spec gaps. | Checklist + Sheet drawers; closed gaps: **edit-a-preset → custom artifact** (`?from=`), **Step-3 quick test**, **outbound other-settings**. | Every spec line accounted for. | ✅ shipped |
| 9 | **NO locking anywhere** (full visibility); **legibility overhaul** ("illegibly terrible"); homepage = **onboarding shortcut widget** ("finish-your-agent journey", doubles as create-list, links to respective pages); **this case-study doc**. | Removed all locks (rows always Edit/Open, drawers always editable, publish = hint); ~30-finding legibility pass; rebuilt home as the journey widget (Aria + 5 deep-link step shortcuts + create/import/view-all); created this doc. | Users need visibility; legibility is table-stakes; the home should orient a first-timer to "fix their agent." | ✅ shipped |
| 10 | Home should be **LEFT/RIGHT** (Aria left, "Get Aria live" right), not top/bottom; the **right drawers were "crumped up in tiny space"**; **screenshot-verify** everything before calling it done. | Home → 2-col grid (`lg:grid-cols-[340px_minmax(0,1fr)]`): sticky Aria card left, journey steps right. Drawer widened past the shadcn 384px cap (`data-[side=right]:sm:max-w-3xl`). `?step=N` deep-link now actually opens the drawer via `modal={false}` (a **modal** Radix dialog opened on mount trips its focus guard and silently stays closed; non-modal opens reliably + keeps the checklist visible behind). Removed a duplicate "View all agents" (chrome + widget). Verified via live Chrome screenshots (home L/R, roomy drawer on both click + deep-link, tsc+build green). | Two-pane reads as "here's your agent → here's how to ship it"; a full-width drawer is the actual editing surface, not a cramped rail; a deep-link that doesn't open its target isn't a shortcut. | ✅ shipped |
| 11 | **Builder top-of-page + step IA cleanup** (multi-round, 2026-07-08): unify the rail + step content into one card; fix the heading hierarchy; drop RHS ticks; de-grab-bag the Voice step; one greeting; move dynamic-var guidance to deployment; full-width type cards; icon-only reset; **and the layout rule** — system prompt & greeting must be top-to-bottom, not LHS/RHS ("columns = options; stacked = steps to follow"). | (a) One bordered **unified card** (rail ∣ content split by a full-height divider), borderless step sections; H1 page title > **H2 = the agent** > step titles H3; "start differently" → alert-style banner; edit-state → **"Unsaved changes" badge** (never in the name/CTA). (b) Section headers show the **section icon, not a completion tick** (the rail owns done-state); **reset-to-live is icon-only** + tooltip. (c) **Voice step regrouped** — pick + Preview together, language, then an **Advanced footer** for the optional Playground trips ("Tune this voice's models" / "Create a custom voice"); the greeting-like "Says: …" line removed. (d) **One greeting** (Prompt & tools); **dynamic-var → CSV mapping moved to Batch calls**; prompt keeps the "Variables detected" chips only. (e) **Type cards span full width** (4K cap now only on text-heavy steps). (f) **Prompt & tools stacks top-to-bottom** (`max-w-3xl`): prompt → greeting → knowledge & tools → quick test, reversing the prompt-left / greeting-right grid. Re-audited "(edited)" → no code appends it (test polluted a saved draft; cleared). | Each step should own exactly its job with no state shown twice; optional actions don't belong in the required sequence; guidance sits where the action happens; **layout communicates task shape** — columns imply parallel choices, a stack implies a sequence. | ✅ shipped |

---

## 3. The two 10-prototype audits (method + winners)

The `/prototype` method: build N variants on one `?param=` route + a floating switcher, deploy, judge, fold the winner in, delete the harness.

- **Homepage (round 5):** 10 lean directions (`/agents/proto`) → 3 judge lenses (minimalism · time-to-deploy · first-run). **V1 "bare hero"** won first-run; V10 won pure minimalism but *framed building first & talked Aria down*, breaking believe-then-scale. Later superseded by the **journey shortcut widget** (round 9) once the user reframed the home as an onboarding hub.
- **Builder (round 7):** 10 layouts (`/agents/builder-lab`), all driven by one shared SPEC so each provably covered every spec line. **V10 "checklist + drawers"** won (whole path at a glance + focused editing + always-visible publish).

Both harnesses were deleted after selection.

---

## 4. Current architecture (as built)

- **Home = onboarding journey widget** (`components/go-live-home.tsx`), **LEFT/RIGHT** (2026-07-01): a 2-col grid (`lg:grid-cols-[340px_minmax(0,1fr)]`) — LEFT a sticky Aria card (sphere · badge · `stackSummary` · `$/min` · latency · Talk · Edit); RIGHT "Get Aria live" (progress bar + the **5 journey-step shortcuts** deep-linking to `/agents/agt_default/edit?step=N`). Footer below the grid: `Create new agent` · `Import` · `View all agents` (the `?view=list` table toggle in `app/(dashboard)/agents/page.tsx`). On first-run the `PageHeader` collapses to `null` so the widget owns its own chrome (no duplicate "View all agents"). Stacks to one column on small screens.
- **Builder = checklist + drawers** (`components/wizard/agent-wizard.tsx`): 5-row checklist; each row opens a `Sheet` drawer with the step body; "Save & continue" chains; sticky "N of 5 · <publish hint>" bar. **Nothing is locked** — every row opens, every drawer edits, publish always clicks. Step bodies: `step-voice/type/build/configure/publish.tsx` (reused unchanged in the drawers). The drawer is **roomy** (`data-[side=right]:sm:max-w-3xl`, overriding shadcn's 384px cap) and **`modal={false}`** — so a `?step=N` deep-link reliably opens it on mount (a modal Radix dialog opened programmatically on mount trips its focus guard and stays closed) and the checklist stays visible behind for context.
- **Deep-links** into the builder (all handled in the mount effect): `?step=N` (open a step), `?dc=inbound|batch|code|web` (preset channel + open Configure), `?artifact=<id>` (select a custom voice on return from the playground).
- **Playground** (`app/(dashboard)/agents/playground/page.tsx`): custom-voice builder. `?artifact=` edits in place; **`?from=<preset>` forks a preset into a new custom** (the "Edit Aria → custom artifact" spec item); returns with the artifact selected.
- **Draft model** (`lib/wizard-draft.ts`): single `AgentDraft` autosaved to `sx:agent_draft` (debounced), restored on mount (toast names the resumed step), cleared on publish. `publishBlockReason` + `channelTarget` + CSV `outboundMissingVars` live here. Voice artifacts in `lib/voice-artifacts.ts` (`sx:voice_artifacts` + preset catalog).
- **Publish** = `publishDeployment()` (`components/wizard/channel-configs.tsx`) → fires `deployment_went_live` + `time_to_live_ms`, routes to Monitor.

---

## 5. Standing design decisions (do not re-litigate without new input)

- **No hard locks in the builder.** Completion only drives the ✓, the progress count, and a "Start here" nudge. Publish shows its blocker as an inline hint + toast — the button is never `disabled`.
- **Home is the journey shortcut widget**, not the lean hero and not the old 6-widget wall. It's the first-run landing and doubles as create/list.
- **Legibility floor:** no `text-[≤13px]` for content; primary content is never `text-muted-foreground`/`opacity-60`; hidden content uses `line-clamp`, not `truncate`; icon-only/`role=button` controls carry `aria-label` + focus rings; decorative icons are `aria-hidden`.
- **Believe-then-scale:** Aria is auto-provisioned & live; the first move is *talk to it*, the second is *finish/deploy it*.
- **Layout by task, not by fit (2026-07-08):** side-by-side columns (LHS/RHS) are for **parallel choices** — things the user picks between or compares. **Top-to-bottom stacking** is for a **sequence** the user follows and completes in order. Columns visually say "these are alternatives"; a stack says "do this, then this." So sequential fields are never column-split — **Prompt & tools** stacks system prompt → greeting → knowledge & tools → quick test in one `max-w-3xl` column, reversing the earlier prompt-left / greeting+tools-right grid. Before reaching for a 2-col grid, ask: *parallel choices, or steps to complete?*
- **A step owns exactly its job; no duplicated state (2026-07-08):** a section header shows the section's own icon, not a completion tick the rail already carries; edit-state is a single "Unsaved changes" badge, not text baked into the name/CTA; one concept (the greeting) has one home; guidance sits where the action happens (dynamic-variable → CSV mapping lives in Batch calls, not the prompt); optional/advanced actions are demoted out of the required sequence (e.g. the Voice step's "Tune models / Create custom voice" footer).

---

## 6. Open items / next
- Playground bifurcation: a **pipeline-only** playground (LLM/TTS/STT + voice test, no prompt) vs the full voice/persona one + a **"Playground" sidebar item**.
- Composer: only the standalone `/composer` (chat-first) exists; decide whether to add a right-side "✦ Ask" popup reusing `ComposerChat`.
- Deeper `/include` pass on the shell (sidebar/header) + full WCAG contrast verification.
- The step-voice card nests an interactive "Customize" inside a card-button (uses `role=button` to avoid nested `<button>`); a fuller a11y fix would restructure the card.
