# Builder composition round: scroll-spy one-pager (2026-07-07)

## The 9 directives (owner, verbatim intent)

1. Fix meta/AI-slop microcopy ("Edit any step — changes go out when you redeploy"), no em dashes anywhere.
2. The selected-step area must scroll on its own while the steps list stays in fold.
3. The agent presentation (Aria strip) felt odd; compose it better.
4. Full-width responsive: design from small screens but scale to a 27" 4K, no centered ribbon.
5. Voice picker: what differentiates Aria/Nova/Sage/Max? A dropdown beats a grid.
6. Preset-first models: pick Fast vs Balanced vs Cheap first, vendors suggested to match.
7. Undo as a proper icon + text button.
8. Compact UX, minimum clicks, fast time to first action.
9. (Process) 5 concepts, audit and test wearing a user's hat, pick the best.

## Process

5 concepts built in parallel (`components/proto/concept-c1..5.tsx`, harness `/agents/proto?c=N`, recoverable at `40a1ca1`):
C1 Cockpit rail · C2 Command strip · C3 Split canvas · C4 Inspector · C5 Scroll-spy one-pager.

Judged by 15 user-hat journey walkthroughs (3 lenses x 5 concepts: first-run
creator in draft, returning operator on live Aria, big-monitor power user) +
a 3-judge panel (minimalist / funnel-owner / responsive-systems) + an
adversarial skeptic on the winner.

**Result: C5 wins (12 pts) > C3 (10) > C4 (9) > C1 (8) > C2 (6).** Skeptic
upheld with required fixes. Evidence: every element of C5 does double duty
(spy list = breadcrumb = progress = nav), 11 first-run clicks vs 13+ for the
wizard-gated concepts, zero navigation clicks for operators, and stacked
sections are the only density that survives 4K.

## What shipped (commits `40a1ca1` + cleanup `1a98555` + chrome `9492c66`)

- **AgentWizard = one-pager**: all 5 steps render open as sections; sticky
  rail = agent lockup (orb + editable name + status + role + Talk button) +
  scroll-spy step list with value recaps (C3 steal) + deploy block. `?step=N`
  scrolls to a section; spy highlight is muted during programmatic scrolls;
  clicks still give feedback when nothing can scroll (the 4K one-fold case).
- **Pending-edits truth** (top audit finding): live agents diff against the
  deployed baseline; edited sections get an "Edited" chip in rail + header,
  the deploy block says "Edits are not live yet. Redeploy to apply.", and
  each section has an icon+text "Reset to live" (drafts: "Reset"), disabled
  when clean.
- **Fluid width**: `[data-fluid]` opt-out added to the dashboard layout cap
  (`has-[[data-fluid]]:max-w-none`); the builder uses the whole viewport with
  xl two-column internals (step 1: voice | models; step 3: prompt | greeting
  + tools + quick test) and max-w caps on single-column sections.
- **Voice = Select dropdown** with tagline per option, sample line + fork/edit
  playground doors for the selection (was a 5-card grid).
- **Preset-first StackConfig**: Fastest/Balanced/Cheapest cards (hint +
  per-preset ~ms/~$) lead; "Runs on {vendors}" suggestion line; language
  visible; pipeline switch + vendor dropdowns behind a "Customize models"
  Collapsible (auto-open when diverged/realtime).
- **Sub-lg sticky strip** (C2 steal): progress + next hint + Deploy stay in
  fold below lg where the rail stacks away.
- **Microcopy sweep, ~95 strings**: zero user-visible em dashes repo-visible
  on /agents (incl. mock data greetings, preset hints, template strings, the
  tab title "Studio_X · Agora", sidebar badge tooltip); meta narration and
  slop phrases removed; blockReason verbs unified ("Choose a voice.").
- **Race fix**: "New agent" blank intent now travels as a prop; the mount
  effect can't read a stale URL and resurrect an old draft over a blank.

## Verified

tsc + build green; browser-walked live Aria (spy, rail recaps, edit greeting →
Edited chips + honest deploy copy + Saved chip, Reset to live reverts +
disables), fresh blank draft (0 of 5, manifests, "Choose a voice."), preset
cards, dropdown voice picker. Deployed + prod-verified (one-pager markers
live, em-dash count on /agents = 0).

## Residual-audit round (same day, commit `faaafaf`)

Fresh-eyes audit (3 lenses x 6 findings, adversarially verified; 17 confirmed,
one reproduced in jsdom) + live walkthrough. All high/medium findings fixed:
deep-link scroll self-cancellation, resetStep(2) orphaning channel config,
typeStash single-slot overwrite, edit-mode ?dc= clobbering restored edits via
a stale ref, ghost "Resuming unsaved edits" after Reset to live, template
seeds lost to an immediate wizard remount on the standalone route (seeds now
persist synchronously), xl two-column crush at 1280-1440 (moved to 2xl + capped
at 4K), sub-lg strip alignment + tappable step dots, one progress fraction,
honest rail Talk button, Estimate row on the Deploy review, import-sheet
em dashes. Dynamic client routes (/agents/[id]/edit·test, /deploy/
phone-numbers/[id], /extensions/[name]) now pre-generate mock ids and build
static. Skipped consciously: touch tooltips for rail recaps, hugging section
card width (uniform edge kept).

⚠️ Verification gotcha discovered: Chrome (via the MCP automation) DEFERS
React hydration in background tabs and in occluded windows — pages serve SSR
HTML but never become interactive until visible. This mimics "the route is
broken" perfectly (no console errors, chunks load). Always verify hydration
in the FOCUSED tab of a VISIBLE window, and wait for an interactivity signal,
not a fixed delay.
