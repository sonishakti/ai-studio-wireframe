# studio_x_2 — Agent-Creation Redesign · Design Case Study

> **Living doc.** The single source of truth for the studio_x_2 agent-creation redesign: every ask, every decision, why, and where it landed. Update it every round so nothing is dropped or re-litigated. Last updated: 2026-06-24.

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

---

## 3. The two 10-prototype audits (method + winners)

The `/prototype` method: build N variants on one `?param=` route + a floating switcher, deploy, judge, fold the winner in, delete the harness.

- **Homepage (round 5):** 10 lean directions (`/agents/proto`) → 3 judge lenses (minimalism · time-to-deploy · first-run). **V1 "bare hero"** won first-run; V10 won pure minimalism but *framed building first & talked Aria down*, breaking believe-then-scale. Later superseded by the **journey shortcut widget** (round 9) once the user reframed the home as an onboarding hub.
- **Builder (round 7):** 10 layouts (`/agents/builder-lab`), all driven by one shared SPEC so each provably covered every spec line. **V10 "checklist + drawers"** won (whole path at a glance + focused editing + always-visible publish).

Both harnesses were deleted after selection.

---

## 4. Current architecture (as built)

- **Home = onboarding journey widget** (`components/go-live-home.tsx`): Aria identity (sphere · `stackSummary` · `$/min` · latency · Talk · Edit) + **5 journey-step shortcuts** deep-linking to `/agents/agt_default/edit?step=N` + progress bar + `Create new agent` · `Import` · `View all agents` (the `?view=list` table toggle in `app/(dashboard)/agents/page.tsx`).
- **Builder = checklist + drawers** (`components/wizard/agent-wizard.tsx`): 5-row checklist; each row opens a `Sheet` drawer with the step body; "Save & continue" chains; sticky "N of 5 · <publish hint>" bar. **Nothing is locked** — every row opens, every drawer edits, publish always clicks. Step bodies: `step-voice/type/build/configure/publish.tsx` (reused unchanged in the drawers).
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

---

## 6. Open items / next
- Playground bifurcation: a **pipeline-only** playground (LLM/TTS/STT + voice test, no prompt) vs the full voice/persona one + a **"Playground" sidebar item**.
- Composer: only the standalone `/composer` (chat-first) exists; decide whether to add a right-side "✦ Ask" popup reusing `ComposerChat`.
- Deeper `/include` pass on the shell (sidebar/header) + full WCAG contrast verification.
- The step-voice card nests an interactive "Customize" inside a card-button (uses `role=button` to avoid nested `<button>`); a fuller a11y fix would restructure the card.
