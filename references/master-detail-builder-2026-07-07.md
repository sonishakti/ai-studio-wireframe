# Master-detail agent builder — decision record (2026-07-07)

## Direction (user, 2026-07-06, with a mail-app reference screenshot)

1. The 5 build steps read as ONE unbroken sequence — **no group headers**
   (reverses the 2026-07-06 V2 "Your agent / How it goes live" chunking).
2. Two **page-level cards** like the reference mail app: left = the step list,
   right = the selected step's configuration **upfront, always visible** — no
   drawer for config. The right-side panel is reserved for testing only.
3. Breadcrumb-style done/pending feedback.

## Process

- 10 throwaway prototypes at `/agents/proto?v=1..10` (`components/proto/master-p*.tsx`),
  same data contract (`components/proto/shared.tsx`), axes = breadcrumb treatment ·
  list density · detail-card structure.
- Round-1 audit + tests (parallel judge panel): unanimous top 3 —
  **P10 "In-card breadcrumb" (27.5/30) > P1 "Mail mirror" (26.5) > P5 "Rich rows + rail" (24)**.
  P4 "Stepper only" unanimously rejected (hides configured values = recall regression).
- Round-2 hardening on the top 3 (success tokens, Live/Draft fixture toggle,
  doneCount bug, lg stacking, up-next teaser harvested from P6) → re-audit +
  re-test → **final: hardened P10**. Synthesis lived in the session scratchpad
  (`master-audit-round1.md`).

## What shipped (commit `070eee1`; harness removed in `b5d1b99`)

`components/wizard/agent-wizard.tsx`:

- **Identity strip** (slim, top): sphere · inline-editable name · status badge ·
  role/voice hint · **"Talk to {agent}"** button.
- **Left card "Build steps · N of 5 done"**: five unbroken rows — ✓/step-icon
  circle, dynamic `stepTitle`, value line (or manifest while pending,
  `rowDetail`), success/pending state dot, selected highlight. No inline type
  ToggleGroup anymore (type editing = Step 2's form, one click away).
- **Right card**: in-card breadcrumb header `{stepTitle} · Step N of 5 · ✓ Done|Pending`
  + prev/next chevrons; the REAL step form renders inline (StepVoice/StepType/
  StepBuild/StepConfigure/StepPublish — no drawer); footer = "Undo changes" ghost +
  "Up next: {title} — {manifest}" teaser + Continue (hidden on step 5, which gets
  deploy-consequence copy instead).
- **?step=N now means selection** (replaceState mirroring, ⌘K `sx:open-wizard-step`
  event, deep links, template/blank/dc/artifact params — all unchanged).
  Default selection is locked on first render (edit → 1, draft → first
  incomplete) so finishing a step inline never yanks the card; restored drafts
  land on their first incomplete step.
- **Talk Sheet**: `AgentIdentityCard` (ID/models/language/channel/cost/latency +
  live-test toggle) moved into an on-demand right Sheet; `onOpenAutoFocus`
  prevented so the name input isn't auto-selected.
- Undo baseline now protects restored drafts (snapshot = what was restored,
  never the pre-restore empty draft).
- `STEP_GROUPS` deleted from `components/wizard/types.ts`.
- Sticky deploy bar unchanged (live = success tint + Redeploy; draft = "N of 4
  set up" + block reason).

Verified: tsc + build green; browser-walked live Aria (5-of-5, row click,
Continue, dynamic step-4 title, number picker "· current"), fresh draft
(0-of-5, manifests, pending), voice-pick seeding + advance, `?step=5` deep
link, Talk sheet. Deployed `dpl_D8JVwDMdLprZs1E1SuYhpdNsJ639` → prod alias.
