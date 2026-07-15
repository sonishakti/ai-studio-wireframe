# Builder-shell exploration — plan & running log (started 2026-07-15)

> **Owner mandate (verbatim intent):** current builder UX is good — findability is easy —
> but it *feels* complex: cognitive overload with every option up front, hard to scroll
> top↔bottom, "brain cannot pin a position of a particular feature." Build **10 radically
> different** agent-builder shells (tabs, breadcrumbs, etc. — NOT incremental), in a **new
> worktree**, served **locally only** (never merged to main, never on the prod Vercel).
> Test each generation with the persona focus group; **recurse until one version scores
> 5/5**, even if it takes 50+ prototypes. Quality over quantity, meticulous NN/g-aligned
> UX, plan first. Winner criteria: best usability + fastest time to first DEPLOYED agent.
> Deliverable: show all 10 + the winner.

## Ground rules

- Worktree: `../ai-studio-console-redesign-lab`, branch `exploration/builder-shells`.
  Local server: `cd <worktree>/studio_x_2 && pnpm dev -p 3002`. NEVER `vercel deploy` here.
- Harness: `studio_x_2/app/proto/page.tsx` (?v=1..N, outside the dashboard shell so each
  variant owns its whole chrome) + `components/proto/variant-01.tsx` … one file per
  variant (agents never touch shared files → no conflicts) + `components/proto/shared.tsx`
  (seeded AgentDraft + registry).
- Variants REUSE the real step bodies (`components/wizard/step-*.tsx`, `stack-config`,
  `wizard-draft`) where possible — the SHELL is what varies. Design tokens only.
- Focus group: `.claude/workflows/user-test.js` with `args.url = http://localhost:3002`
  and a focus naming the variant(s); personas score each variant 1–5 on (a) cognitive
  load, (b) position-pinning ("can you say where X lives without looking?"),
  (c) time-to-first-deployed-agent in actions, (d) overall SUS-lite. A variant "wins a
  generation" only at 5/5 verdict from ALL THREE personas; otherwise synthesize → next
  generation (kill weak, refine top 2–3, add 1 wildcard) → retest. Log every generation
  below.

## Generation 1 — the 10 shells

| # | Shell | Concept (the anti-overload bet) |
|---|---|---|
| 1 | **Top tabs** | One tab per step (Voice · Type · Prompt · Deploy), content fits one screen, zero page scroll — position = tab. |
| 2 | **Wizard + breadcrumbs** | One question per screen, typeform pace; breadcrumb trail = position + way back. |
| 3 | **Hub & spoke** | Card-grid home, each card = a config area with its current value; click → focused full-screen editor → back to hub. Hub = the map. |
| 4 | **Master–detail** | Left: settings groups list. Right: ONE active panel. No stacking, no scroll-spy. |
| 5 | **Smart defaults** | Everything pre-filled; a single screen asks the only 3 decisions that matter; one "Advanced" door. Minimal cognition by subtraction. |
| 6 | **Conversation-led** | Composer chat asks; config assembles visibly as chips/summary rail. You never see a form you didn't ask for. |
| 7 | **Pipeline canvas** | Spatial node map (Voice → Brain → Tools → Channel); click a node → popover editor. Literal spatial pinning. |
| 8 | **Single-open accordion** | Vertical, but exactly ONE section open; closed sections = one-line value summaries. Kills scroll length AND overload. |
| 9 | **Preview-first** | Big live agent preview (phone/widget mock) left; compact grouped controls in small tabs right. The agent is the anchor. |
| 10 | **Checklist launcher** | "3 things to go live" to-do home; each opens a focused modal; list stays put = position anchor + progress. |

Per-variant heuristics bar: visibility of status · match to mental model · user control
(back paths everywhere) · consistency · recognition over recall · minimal design ·
flexibility (deep links preserved where sensible).

## Running log

- 2026-07-15: plan committed. Quick fixes shipped separately on main (`3876527`).
- Gen 1: scaffolding + 10 variant builds — IN PROGRESS (workflow).
- (append results per generation here: scores table, verdicts, kills/refinements)

## Status ledger (update every turn that touches the lab)

- Worktree created: YES (`../ai-studio-console-redesign-lab`, branch exploration/builder-shells)
- Gen-1 built: YES — 10/10 shells, tsc+build green, committed on the branch; all render at
  http://localhost:3002/proto?v=1..10 (server: `cd <worktree>/studio_x_2 && pnpm dev -p 3002`)
- Side-find: `components/ui/tabs.tsx` styles actives with `data-active:` but Radix emits
  `data-state="active"` → dead CSS app-wide incl. main's Deploy run-mode tabs (chipped: task_27f48285)
- Gen-1 tested: IN PROGRESS (focus group, 3 personas × 10 shells + moderator)
- Best-so-far: —
- 5/5 achieved: NO
