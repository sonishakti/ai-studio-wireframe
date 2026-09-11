# Revamp — Phase 0 audit (read only)

Date: 2026-09-11 · App: `studio_x_2/` (deployed as https://ai-studio-console-redesign.vercel.app) · Branch audited: `main` @ HEAD.
Nothing in the app was changed for this audit. Added: the audit tooling under `scripts/revamp/` and two pinned dev
dependencies (`@playwright/test`, `@axe-core/playwright`) so the accessibility scan can run in CI later.

**Design input.** No `DESIGN.md` was provided (the path in the brief was a placeholder). The owner's direction on
2026-09-11 is to **adopt and improve the NG console's look and feel** (the live Console, `ng-console/src/styles.css`)
and drop the Studio X styling. Phase 1 therefore proposes `docs/revamp/DESIGN.md` derived from NG's tokens
(inventoried in §7 below) rather than inventing a brand.

## 1 · Stack and versions found

| Piece | Found | Brief expects | Verdict |
|---|---|---|---|
| Framework | Next.js **16.1.7** (App Router, `next dev --turbopack`) | Next.js | ✓ |
| React | **19.2.6** (react, react-dom) | React 19 | ✓ |
| Tailwind | **4.3.0** (`@tailwindcss/postcss` 4.2.x, `@theme inline` in `app/globals.css`) | Tailwind 4 | ✓ |
| shadcn | CLI **4.8.1**; `components.json`: style `radix-vega`, `cssVariables: true`, base `neutral`, icons lucide, `registries: {}` | shadcn/ui, CSS variables mode | ✓ |
| UI libraries | `radix-ui` 1.4.3 (+ `@radix-ui/react-radio-group`), `cmdk` 1.1.1, `sonner` 2.0.7, `lucide-react` 1.16.0, `next-themes` 0.4.6, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` | — | all shadcn-standard |
| Forms | `react-hook-form` 7.76.1, `@hookform/resolvers`, `zod` 3.25.76 | — | keep |
| Type / lint | TypeScript 5.9.3, ESLint 9.39.4 (`eslint-config-next`), Prettier 3.8.3 | — | lint has **102 pre-existing errors** (React-compiler rules: setState in effects, refs during render) — see §9 |
| Design system bundle | `ds-bundle/` — "studio-x" DS (React 19 + Tailwind 4 + shadcn, oklch tokens, cyan primary, DM Sans). Compiled bundle + guidelines; **not imported by the app at runtime** (the app uses `components/ui/*` + `app/globals.css`). | — | superseded by the NG direction |
| Fonts | `Instrument Sans` (sans) + `Space Mono` (mono) via `next/font/google` in `app/layout.tsx` | — | NG uses MiSans |
| Banned packages | **none** — no `@elevenlabs/*` or `@livekit/*` in `package.json` or `pnpm-lock.yaml` | none | ✓ |
| Agora packages | none yet (`agora-agent-uikit`, `agora-agent-client-toolkit` are not installed; voice today is a scripted mock) | required in Phase 3 | add in Phase 3 |

Ports: the dev server for this audit runs on **3020** (`.claude/launch.json` → `studio-x-2`).

## 2 · Routes and screens → the six areas

74 `page.tsx` routes. Mapping uses the product structure as given (names kept exactly). Dynamic routes were audited with one
representative id (mock data).

**Agent** — `/agents` (list + Start landing), `/agents/agents` (legacy list redirect), `/agents/[id]/edit` (the builder —
one route, "new" or an agent id; five sections Voice & Models · Deployment · Prompt & knowledge · Test · Go Live), `/agents/[id]/test`,
`/extensions`, `/extensions/[name]`, `/integrations`.

**Environment** — `/projects`, `/project/settings`, `/project/vendor-credentials`, `/project/notifications`, `/realtime-services`,
`/developer`, `/developer/aa-credentials`, `/developer/audit-logs`, `/developer/licensing`, `/developer/restful-api`, `/developer/toolkit`,
`/developer/webhooks`, `/preferences`.

**Channels and Deployment** — `/deploy` (+ `/api`, `/code`, `/embed`, `/embed/api`, `/embed/widget`, `/web-widget`, `/widget`, `/slack`,
`/sms`, `/whatsapp`, `/telephony`), `/deploy/inbound` (+ `/[id]`, `/new`), `/deploy/batch-calls` (+ `/[id]`, `/new`), `/deploy/phone-numbers`
(+ `/[id]`), `/phone-numbers` (+ `/[id]`), `/telephony/campaigns`, `/telephony/campaigns/create`, `/telephony/phone-numbers`, `/campaigns`,
`/campaigns/calls`, `/campaigns/phone-numbers` (+ `/[id]`). **Three parallel trees say the same thing** (`/deploy/*`, `/telephony/*`,
`/campaigns/*`, `/phone-numbers/*`) — legacy IAs kept alive; the revamp must pick one and redirect the rest (routing change → needs approval,
see open questions).

**Session** — `/sessions`, `/sessions/[id]`, `/session-history`, `/calls`, `/monitor`, `/monitor/diagnostics`.

**Playground** — `/agents/playground`.

**Agent Studio** — no canvas screen exists today. The closest is `/composer` (chat-driven agent building) and the web-widget studio
(`components/widget-studio.tsx` under `/deploy/embed/widget`). Phase 3 adds the `@xyflow/react` canvas here.

**Fits none of the six** — `/billing` (+ `/invoices`, `/payment-methods`, `/plans`, `/subscriptions`, `/transactions`, `/upgrade`, `/usage`),
`/usage`, `/help` (+ `/contact`, `/contact-sales`, `/tickets`, `/whats-new`), `/notifications`, `/defect` (defector flow demo), `/` (redirect).
These stay as they are unless you say otherwise.

## 3 · Hardcoded values outside tokens

Counted by `node scripts/revamp/hardcoded.mjs` over `app/`, `components/`, `lib/`, `hooks/` (`ds-bundle/` excluded).

| Kind | Count | Files | Where it concentrates |
|---|---|---|---|
| Raw hex colours | 93 | 4 | `app/globals.css` 77 (token definitions — fine), `lib/widget-config.ts` 9, `components/widget-studio.tsx` 5, `components/ui/input.tsx` 2 |
| Arbitrary px classes (`w-[240px]` …) | 76 | 44 | `components/wizard/step-call-settings.tsx` 7, `components/widget-studio.tsx` 6, `components/ui/switch.tsx` 4, `wizard/channel-configs.tsx` 4, `wizard/section-prompt.tsx` 4 |
| Arbitrary text sizes (`text-[..]`) | 1 | 1 | `components/widget-studio.tsx` |
| Arbitrary radii (`rounded-[..]`) | 10 | 5 | `components/ui/button.tsx` 4, `ui/input-group.tsx` 3, `ui/checkbox.tsx`, `ui/scroll-area.tsx`, `ui/tooltip.tsx` |
| Arbitrary shadows (`shadow-[..]`) | 3 | 2 | `components/ui/sidebar.tsx` 2, `components/agent-test-panel.tsx` 1 |
| Arbitrary colour classes (`bg-[#…]`) | 0 | 0 | — |
| Tailwind palette colours (`text-emerald-500` …) | 22 | 4 | `app/(dashboard)/billing/usage/page.tsx` 10, `components/import-agent-sheet.tsx` 5, `components/defector-flow.tsx` 4, `components/code-block.tsx` 3 |

Reading: the token discipline is already good outside `widget-studio` (which builds a customer-facing widget and legitimately
carries its own colours) and the billing usage page. The 76 arbitrary px values are mostly layout widths in the builder;
Phase 3 replaces them with the spacing scale.

## 4 · Component inventory — duplicates doing the same job

| Job | What exists | Evidence |
|---|---|---|
| Buttons | shadcn `<Button>` (348 uses, 96 files) **and** 78 raw `<button>` elements in 39 files (`sip-quick-connect.tsx` 7, `widget-studio.tsx` 7, `composer-voice-call.tsx` 5, `wizard/agent-wizard.tsx` 4, `agent-identity-card.tsx` 3) | two button styles; raw buttons carry ad-hoc focus styles |
| Status pills | shadcn `<Badge>` (109 uses) **and** 15 hand-rolled `rounded-full … px-` pills (9 files) **and** three bespoke components: `severity-badge.tsx`, `health-dot.tsx`, `campaign-channel-badges.tsx` | four ways to say "status" |
| Cards | shadcn `<Card>` (105 uses, 46 files) **and** 35 hand-rolled `rounded-* border … bg-card` boxes (22 files: `integrations/page.tsx` 5, `composer-chat.tsx` 4, `widget-studio.tsx` 4) plus five card components (`agent-identity-card`, `billing-future-cards`, `catalog-card`, `concurrency-card`, `usage-spend-card`) | same shell, six implementations |
| Section navigation | five near-identical secondary navs: `billing-nav.tsx`, `developer-nav.tsx`, `help-nav.tsx`, `monitor-nav.tsx`, `realtime-nav.tsx` | one `SectionNav` with items would do |
| Sidebars / headers | `app-sidebar.tsx`, `dashboard-sidebar.tsx`, `account-sidebar.tsx`; `dashboard-header.tsx`, `page-header.tsx` | two app sidebars, two headers |
| Wizard rows | `wizard/section-row.tsx` (label | control) is the good pattern; `step-advanced.tsx`, `step-call-settings.tsx` re-implement label+control stacks inline | one row primitive should own it |
| Screen states | 74 pages: empty-state copy in 34 files, an **error state in 1 file**, loading/skeleton in **2 files** | error and loading states are missing almost everywhere |

## 5 · Banned packages present

None. `package.json` and `pnpm-lock.yaml` contain no `@elevenlabs/*` or `@livekit/*`. Voice today is a scripted mock
(`components/sim-transcript.tsx`, `wizard/test-panel.tsx`), so nothing needs removing before Agora's `agora-agent-uikit` arrives in Phase 3.

## 7 · Design input inventory — the NG console (what Phase 1 will translate)

Source: `ng-console/src/styles.css` (live Console, Vite + Tailwind 4 + shadcn, dark-first). Owner direction 2026-09-11:
adopt and improve NG; drop Studio X (Instrument Sans, cyan primary, oklch palette, `ds-bundle/`).

| Token family | NG value | Note for Phase 1 |
|---|---|---|
| Sans | `MiSans`, `MiSans Latin` (variable 200–900, 470 KB TTF), fallbacks Geist · Inter · PingFang SC · Noto Sans SC | keep MiSans Latin VF; CJK fallbacks stay for zh locales |
| Mono | `--font-mono` (Geist Mono in NG) | pick one, used for ids, transcripts, "Callers hear" |
| Type scale | xs 11 px / 1.375 · sm 13 px / 1.375 · base 14 px / 1.45 · lg 17 px / 1.5; body = sm, titles = base, meta = xs | small by design; the review must check AA at 11 px |
| Radius | `--radius` 8 px; sm 4.8 · md 6.4 · lg 8 · xl 11.2 · 2xl 14.4 | one base, scaled — becomes the per-level radius in DESIGN.md |
| Dark surfaces | page `#0a0a0a` · card `#121212` · sunken `#060606` · elevated `#1a1a1a` · gray-200 `#1f1f1f` · gray-400 `#2c2c2c` | |
| Dark text | primary `#ededed` · secondary `#9a9a9a` · tertiary `#6a6a6a` | tertiary on card = 3.6:1 → **fails AA for text**, fix in Phase 1 |
| Dark lines | alpha-100 `#ffffff0d` · 200 `#ffffff14` · 300 `#ffffff1f` (border) · 400 `#ffffff2e` (input) · 600 `#ffffff5c` | |
| Primary | monochrome `#e8e8e8` on `#0a0a0a` (brand-accent) | white primary; the only chroma is the nav accent |
| Accents | nav accent `#7dd3fc` (sky) · ring `#1b79e6` (light) / sky (dark) · success `#4ade80` · warning `#fbbf24` · danger `#f87171` | |
| Light surfaces | page `#fafafa` · card `#ffffff`; text `#171717` / `#4d4d4d` / `#8f8f8f` | light mode exists in NG |
| Shadows | sm `0 1px 2px rgb(0 0 0 / .3)` (dark) / `0 2px 2px rgb(0 0 0 / .04)` (light), md, lg | elevation levels 0–3 in DESIGN.md |
| Motion | none defined | add durations + `prefers-reduced-motion` in DESIGN.md |
| Missing in NG | voice-state tokens, canvas tokens, focus ring on dark (ring = sky), elevation scale, motion | Phase 1 adds them |

## 8 · Accessibility scan — method

`scripts/revamp/scan.mjs` opens every route in `scripts/revamp/routes.json` with Playwright Chromium at 1440×900 and 390×844
(`reducedMotion: reduce`, light scheme), saves full-page screenshots to `docs/revamp/before/<slug>-1440.png` / `-390.png`, then runs
axe-core (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `best-practice`) on the 1440 render, counts controls without an accessible
name, and counts `outline: none` vs `:focus-visible` rules in the loaded CSS. Results: `docs/revamp/axe.json`. Focus traps are
not machine-detectable here and are listed from code reading (labelled as such).

## 6 · Usability issues per screen (Nielsen's 10), ranked by how badly they block a task

Evidence = code (file:line) or the rendered UI at 1440 / 390 / the 800-px pane. "Guess" marks inference.
Severity: **S1** blocks finishing a task · **S2** slows or misleads · **S3** polish.

### Navigation and information architecture (all areas)
| # | Sev | Heuristic | Finding | Evidence |
|---|---|---|---|---|
| N1 | S1 | Match between system and real world / Consistency | The sidebar speaks a different language from the agreed product structure: **BUILD** (Agents, Composer) · **OBSERVE** (Monitor) · **MANAGE** (Resources, Realtime Services, Project Settings). None of Environment, Channels and Deployment, Session, Playground or Agent Studio appears as a navigation item. Deployment lives as a *tab under Resources* ("Deployment Channels", next to Knowledge Base · MCP · Connectors · Vendor Credentials); Sessions live as a *tab under Monitor*. A developer looking for "where do I deploy" has to know it is a resource. | rendered `/sessions`, `/deploy` (pane); `components/app-sidebar.tsx` |
| N2 | S2 | Consistency | Three route trees cover the same objects: `/deploy/*`, `/telephony/*`, `/campaigns/*`, `/phone-numbers/*` (29 routes for one area). Deep links from older docs land on different screens for the same thing. | §2 route list |
| N3 | S2 | Recognition over recall | The breadcrumb ("Agents › New › Edit Agent", "Monitor › Sessions") is the only place the section name is shown; page titles are missing an `<h1>` on 12 pages (`/sessions`, `/monitor`, `/deploy`, `/composer`, `/calls`, `/usage`, `/phone-numbers`, …). Screen readers and the browser tab get "Studio_X · Agora" everywhere. | `grep` §9; `app/layout.tsx` metadata |
| N4 | S3 | Flexibility | "Future scope" toggle sits in the global top bar on every screen and reveals unbuilt features; it is a demo device, not a user control. Guess: it confuses product teams reviewing the app. | `components/dashboard-header.tsx`, `lib/future-scope.ts` |
| N5 | S2 | Aesthetic and minimalist design | At 800 px the breadcrumb wraps behind the sticky top bar ("Age… / Play…", "Project / Project S…") and tables overflow horizontally with a scrollbar (`/sessions`). Guess: 390-px screenshots will show the same. | pane renders of `/agents/playground`, `/project/settings`, `/sessions` |

### Agent — `/agents`, `/agents/[id]/edit`, `/agents/[id]/test`
| # | Sev | Heuristic | Finding | Evidence |
|---|---|---|---|---|
| A1 | S1 | Visibility of system status / Consistency | The deploy control reads **"Live — no changes"** and is rendered **twice** (header button + sticky strip button) as if it were an action, while the same words are also the status. A user cannot tell whether it is a button or a state; when there are changes it turns into "Redeploy". The same action changes its name across the flow (Deploy · Redeploy · Go Live). | rendered `/agents/agt_default/edit`; `wizard/agent-wizard.tsx` (`deployCta` 5 branches) |
| A2 | S1 | Error prevention / Help users recognise errors | The builder has **no error state**: a failed deploy, a failed import or an invalid config surfaces only as a `toast()` (131 toast calls across 54 files; inline `role="alert"`/`aria-invalid` in 54 places, mostly forms). Toasts vanish; the section that caused the error is not marked. | `grep` §9 |
| A3 | S2 | Recognition over recall | Five sections are numbered 1–5 in the sticky strip but named in the rail; the number chips carry no label for screen readers or for a first-time user ("what is 4?"). | rendered builder strip; `agent-wizard.tsx` sticky strip |
| A4 | S2 | Consistency and standards | Labels mix Title Case and sentence case: "Silence Timeout", "Max Call", "Transfer Destination", "Transfer Criteria", "Evaluation Criteria", "Greeting Message", "Failure Message" vs "System prompt", "Choose an Agent Template". | `grep` Title Case (§9); `wizard/section-prompt.tsx`, `step-call-settings.tsx` |
| A5 | S2 | Visibility of system status | Voice state in the Test rail is a scripted mock (`SimTranscript`, `RAIL_TALK`): the states listening / thinking / speaking / interrupted are icons + a label ("Thinking" uses the **Brain** icon); there is no `aria-live` on the state line (9 `aria-live` uses app-wide, none on the talk state). | `components/sim-transcript.tsx:23`, `wizard/test-panel.tsx` |
| A6 | S2 | User control and freedom | "Start over" is hidden in a kebab menu (`?blank=1`); the Start landing reappears for `id="new"` whenever no draft exists, so a review link to the builder lands on a template gallery instead. | `agents/[id]/edit/editor-client.tsx`, `agent-wizard.tsx` landing branch |
| A7 | S3 | Aesthetic and minimalist design | The agent header stacks orb · name · status pill · copyable id · kebab · code · waveform · deploy — eight controls in one row; the waveform button ("Test agent — voice panel") is icon-only. | rendered builder header |
| A8 | S3 | Flexibility and efficiency | The Prompt step shows Greeting as a bare textarea; who speaks first, interruptibility and the AI disclosure are absent (the ng-console prototype from design 04 covers this — parked on `explore/ng-look-spectrum`). | `wizard/section-prompt.tsx` |

### Environment — `/project/settings`, `/project/vendor-credentials`, `/developer/*`, `/realtime-services`, `/projects`
| # | Sev | Heuristic | Finding | Evidence |
|---|---|---|---|---|
| E1 | S2 | Consistency | The area is split across three sidebar items (Project Settings, Realtime Services, Resources › Vendor Credentials) plus a `/developer` tree with its own secondary nav (`developer-nav.tsx`); five secondary-nav components exist for five areas. | `components/*-nav.tsx` |
| E2 | S2 | Error prevention | Credentials and App ID are copyable, but there is no confirmation on destructive settings (guess: `destructive-action-dialog.tsx` exists but is used in 2 places only). | `grep DestructiveActionDialog` |
| E3 | S3 | Help and documentation | "Secured mode active" badge explains itself in a paragraph; good. Other settings cards have no help link. | rendered `/project/settings` |

### Channels and Deployment — `/deploy/*`, `/phone-numbers/*`, `/telephony/*`, `/campaigns/*`
| # | Sev | Heuristic | Finding | Evidence |
|---|---|---|---|---|
| C1 | S1 | Match / Recognition | Deployment is a **tab under Resources** ("Deployment Channels"); the primary action "Connect a number (SIP)" sits above a filter row (All 7 · Phone numbers 3 · WhatsApp 1 · Web 1 · Batch 1 · Code 1). The area name the user was told ("Channels and Deployment") appears nowhere. | rendered `/deploy` |
| C2 | S2 | Consistency | Same objects under four URL prefixes (N2); "Batch calls" vs "Campaigns" vs "Outbound" name the same thing. | §2; `deploy/batch-calls`, `telephony/campaigns`, `campaigns/*` |
| C3 | S2 | Error prevention | SIP quick connect has 7 raw `<button>`s with ad-hoc focus styles; failure scenarios were designed but "mock-wiring deferred" (no error state renders). | `components/sip-quick-connect.tsx`; LEARNINGS 2026-07-09 |

### Session — `/sessions`, `/sessions/[id]`, `/monitor`, `/monitor/diagnostics`, `/calls`, `/session-history`
| # | Sev | Heuristic | Finding | Evidence |
|---|---|---|---|---|
| S1 | S1 | Visibility of system status | Sessions is a tab inside Monitor (Overview · Call History · Sessions · Diagnostics); `/calls`, `/session-history` and `/campaigns/calls` are further copies of the same list. No loading state on the list (2 files app-wide use skeletons), no error state. | rendered `/sessions`; §4 states row |
| S2 | S2 | Recognition | The Agent Session ID column shows raw ids (`HU7K-01ER-V8LY-2FS5I`) first; the agent name and outcome come after. Guess: developers scan by agent and outcome, not id. | rendered `/sessions` |
| S3 | S2 | Consistency | Channel pills ("Web", "Phone") are a bespoke badge; status pills elsewhere use `severity-badge` / `health-dot` / hand-rolled pills (§4). | §4 |

### Playground — `/agents/playground`
| # | Sev | Heuristic | Finding | Evidence |
|---|---|---|---|---|
| P1 | S2 | Match / Consistency | It is a **voice** playground (name · tagline · personality · model), reached by "Back to your agent"; there is no conversation playground for text, and the shared tool name "Playground" is not in the sidebar. | rendered `/agents/playground` |
| P2 | S2 | Visibility of status | Voice preview is a mock sphere with no state text and no `aria-live`. | `components/agent-playground.tsx`, `agent-test-panel.tsx` |

### Agent Studio — no screen today; closest `/composer`
| # | Sev | Heuristic | Finding | Evidence |
|---|---|---|---|---|
| T1 | S2 | Match | Composer's empty state is the best in the app ("What are we building?" · one primary action "Talk to Composer" · "or type"), but it is a chat/voice assistant, not a canvas; the agreed "Agent Studio" (canvas) does not exist. | rendered `/composer` |

### Screens outside the six areas
Billing (8 routes) and Help (5) carry their own secondary navs and the app's only Tailwind palette colours (`billing/usage/page.tsx`, 10). Left as is unless you say otherwise.

## 9 · Quality baseline (what "zero new errors" is measured against)

| Gate | Today | Note |
|---|---|---|
| `pnpm typecheck` (`tsc --noEmit`) | **passes** | |
| `pnpm lint` (ESLint 9 + eslint-config-next, React compiler rules) | **102 errors, 1491 warnings** pre-existing | top rules: `react-hooks/set-state-in-effect` 45 · `react-hooks/refs` 20 · `react-hooks/rules-of-hooks` 19 · `react-hooks/immutability` 8 · `react/no-unescaped-entities` 4 |
| `pnpm build` | not run in Phase 0 (read only) | run at the first Phase 1 commit; the app deploys today, so it builds on Vercel |
| Tests | **none** — no test script, no `*.test.*` files | "existing tests pass" is vacuous; Phase 1 adds the axe scan as the first automated gate |
| axe (serious/critical) | see §8 results below | |
| Fonts | Instrument Sans + Space Mono via `next/font/google` | NG uses MiSans; the switch happens in Phase 1 |

Naming evidence for rule 8: "Brain" appears only as a lucide icon import for the *Thinking* state (`components/sim-transcript.tsx:23`) — the
label is "Thinking", fine. "Submit" as a button label: 0. The deploy action has five label branches (`deployCta`) — "Deploy", "Redeploy",
"Live — no changes", "Go Live", and the section title "Go Live · Batch" — one action, several names (A1).

## 8 · Accessibility scan — results (75 screens, light scheme, 1440 px)

Totals: **2 026 serious/critical axe nodes** across all 75 screens (every screen has at least one); 0 page errors; 95 of 3 517
interactive controls have no accessible name (own check, stricter than axe). Full data: `docs/revamp/axe.json`.

| Rule | Impact | Screens | Nodes | What it is |
|---|---|---|---|---|
| `color-contrast` | serious | 75 | 1 806 | **One token.** `--muted-foreground` renders as `#757575` on `#fdfcfc` = **4.49:1** (needs 4.5) for the 12 px helper text used everywhere; also placeholders `#b9b8b8` (1.93), `#919191` (3.15), success `#308d2c` (4.22), destructive-on-tint `#de2134/#fae6e8` (4.01). **Dark mode is nearly clean** (1 node on the builder: `#5c5c5c` on `#050505` = 3.04). Fix = Phase 1 tokens. |
| `button-name` | critical | 29 | 93 | Icon-only controls without a name: shadcn `Switch` rows in lists (`group/switch` on `/realtime-services`, `/extensions/[name]`, `/projects`), tab triggers on `/agents/[id]/test` |
| `nested-interactive` | serious | 2 | 50 | Clickable table rows `tr[aria-label="Open call …"]` containing buttons (`/calls`, `/campaigns/calls`) |
| `label` | critical | 8 | 40 | Inputs without a label: masked secret on `/project/settings`, widget-config inputs (`/deploy/widget`, `/deploy/embed/widget`, `/deploy/web-widget`), phone-number fields (`/deploy/phone-numbers/[id]`, 16 unlabeled) |
| `aria-progressbar-name` | serious | 8 | 20 | Progress bars in the deployment lists (`/deploy/batch-calls`, `/deploy/inbound`) |
| `aria-input-field-name` | serious | 10 | 10 | One ARIA input per builder/deploy form without a name |
| `scrollable-region-focusable` | serious | 5 | 5 | Code `<pre>` blocks on `/deploy/api`, `/deploy/code`, `/deploy/embed*` not keyboard-scrollable |
| `aria-valid-attr-value` | critical | 2 | 2 | Radix accordion trigger id mismatch on the widget pages |

Worst screens (serious/critical nodes): `/monitor/diagnostics` 136 · `/sessions/[id]` 109 · `/deploy/widget` 82 · `/deploy/api`,
`/deploy/code`, `/deploy/embed`, `/deploy/embed/api` 77 each · builder (`/agents/[id]/edit`) 75 · `/deploy/inbound/new` 75 · `/deploy/batch-calls/new` 71.

Focus: the loaded CSS carries 13 `outline: none` rules against 52 `:focus-visible` rules; the 54 `outline-none` utilities in components
(hotspots `composer-voice-call.tsx` 5, `agent-identity-card.tsx` 4, `wizard/voice-section.tsx` 3, `wizard/agent-wizard.tsx` 3) are the places to check
by keyboard in Phase 2. Focus traps: none found by code reading (Radix dialogs/sheets manage focus); label as unverified until the keyboard pass.

Missing `<h1>` at render time: the builder (`/agents/new/edit`, `/agents/[id]/edit`) and every deploy form (`/deploy/api`, `/deploy/code`,
`/deploy/embed*`, `/deploy/widget`, `/deploy/web-widget`, `/deploy/inbound/new`, `/deploy/batch-calls/new`, `/telephony/campaigns/create`).

390 px (confirmed from `docs/revamp/before/*-390.png`, e.g. `sessions-390.png`): the breadcrumb wraps behind the top bar ("M… / S…"),
the page description is squeezed into a 90 px column beside "Looking for usage?" and "Export", tables show two columns and cut the rest,
filters stack full-width. The builder at 390 renders as one 5 000 px column with the test rail pushed below (`agents-agt_default-edit-390.png`).

## 10 · Screenshots

150 files in `docs/revamp/before/` — `<slug>-1440.png` and `<slug>-390.png` for every route in `scripts/revamp/routes.json`
(slug = path with `/` → `-`; dynamic routes use `agt_default`, `dp_ib_01`, `dp_ob_01`, `pn_01`, `face-ar`, and the first session id from `/sessions`).
Re-run: `EXEC=<chromium> BASE=http://localhost:3020 node scripts/revamp/scan.mjs`.

## 11 · Phase 0 verdict

- Stack matches the brief; no banned packages; token discipline is good except one contrast-failing token, `widget-studio`, and billing.
- The blocking problems are structural, not cosmetic: the navigation does not speak the six areas; deployment is a tab under Resources and exists
  under four URL prefixes; the deploy action has five names; error and loading states are missing on nearly every screen; mobile layouts break at the header.
- Accessibility is one token plus a handful of component fixes away from clean on desktop; keyboard reachability of code blocks, table rows and
  icon-only switches is real work.

## 12 · Re-audit — 2026-09-11 (after the chrome fixes and the six research features)

Owner direction the same day: *"Remove toggle for future scope etc. We are now moving into building out the features from the
research."* The phase gates below were not waited for; this section records what moved. Live build:
https://ai-studio-console-redesign.vercel.app (deploy `ai-studio-console-redesign-nfviuxrko`, main @ `f3664d0`). After
screenshots: `docs/revamp/after/agent/` and `docs/revamp/after/session/` (red-marked, 1600 px). Axe after-scan (same method as §8,
same four screens, working tree = the deployed commit): `docs/revamp/axe-after-2026-09-11.json`.

### Findings that moved

| # | Before (Phase 0) | After | How |
|---|---|---|---|
| N4 | "Future scope" toggle in the global top bar on every screen | **Resolved.** Switch and `lib/future-scope.ts` deleted; the four features it gated (A1 ceremony, A3 quick connect, D1 batch detail, X1/A6 billing cards) are always on. | `components/dashboard-header.tsx`, four call sites |
| A7 | Agent header stacks eight controls; waveform and `</>` are icon-only ghosts | **Resolved.** Every header action is a bordered button with a word: More · Custom config · Voice call · Live — no changes; Reset to live on dirty sections. Top bar: Help · Notifications · Composer, bordered. | `wizard/agent-wizard.tsx`, `custom-config-drawer.tsx`, `dashboard-header.tsx` |
| A3 | Numbered section chips carry no label | **Unchanged** (mobile strip) — the desktop rail already names sections. Section bodies are now indented 44 px to the title (`lg:pl-11`), so each accordion reads as nested content. | `wizard/agent-wizard.tsx` |
| A8 | Greeting is a bare textarea; who speaks first / interruptibility / disclosure absent | **Resolved (design 04).** Opening section: who speaks first · greeting · callers can interrupt · tell the caller it's an AI (composed into the greeting, shown as "Callers hear") · silence recap · Hear the opening. Filler row relabelled "While thinking" with three Requires-Engine rows. | `wizard/section-opening.tsx`, `section-prompt.tsx`, `step-advanced.tsx` |
| A5 | Talk state mock has no `aria-live`, nothing to try | **Partly.** "Try interrupting" chip + `aria-live` verdict line on the Talk tab (design 02). The state chips themselves are unchanged. | `wizard/test-panel.tsx` |
| S1 | No error/loading state on the sessions list; failed sessions bare | **Partly.** Session page and call sheet state missing artifacts explicitly (No recording · Not retained · No timestamps · Cause could not be determined). List loading/error states still missing. | `session-detail.tsx`, `call-detail-sheet.tsx`, `sip-verdict.tsx` |
| S2 | Rows lead with raw ids; outcome after | **Partly.** Call History gains All · With issues and an "Attributed to" strip with counts (design 11); Sessions list column order unchanged. | `app/(dashboard)/calls/page.tsx` |
| §4 states | Error state in 1 file, loading in 2 | Missing-artifact states added on the two detail surfaces; still no list-level loading/error. | — |
| §7 contrast | `--muted-foreground` #757575 = 4.49:1 on the page ground → 1 806 of 2 026 axe nodes | **Resolved at the token.** `--muted-foreground` → #6b6b6b (5.0:1 on #fdfcfc and on the #f8f3f1 well). | `app/globals.css` |

### Axe, same four screens (serious + critical nodes)

| Screen | Before | After | What remains |
|---|---|---|---|
| `/agents/agt_default/edit` | 75 | **5** | 1 `aria-input-field-name` (pre-existing agent-name input), 4 `color-contrast` on `.opacity-50` disabled controls (WCAG exempts disabled controls; axe still counts them) |
| `/calls` | 51 | **39** | 25 `nested-interactive` (the row is a button and contains links/buttons — pre-existing), 13 contrast on `.opacity-*` / badge text, 1 `button-name` |
| `/sessions` | 32 | **19** | 16 contrast on secondary badge text, 3 `button-name` (pagination icons, pre-existing) |
| `/sessions/[id]` | 109 | **6** | 6 contrast on chart legend text |

Net on these four screens: 267 → 69. The remaining nodes are pre-existing patterns (`nested-interactive` rows, disabled-control
contrast, badge text on tinted fills) — fix them in the Session grayscale pass, not per feature.

### New surfaces added (design tracker) — heuristics applied while building

- **01** Recommended strip + Compare tray + Add your own voice inside Select voice — recognition over recall (three ranked voices before a
  fourteen-row table), every audio control has a stop state, consent is unchecked by default.
- **02** Turn-taking row with a recap in milliseconds, Listening group (SAL renamed to what it does), inert Requires-Engine rows —
  visibility of system status, match with the caller's words.
- **07** Backup providers row — a stated state per component; "Test failover" disabled with the Engine dependency named, never a
  dead button.
- **10 / 11** One clock, end-type badges, Copy link, Download menu, verdict-driven SIP with per-leg time, collapsed repeats, deciding
  message, issues-first list — error recognition and recovery in the same block, honest empty states.

Copy introduced on these surfaces is listed in `references/agent-builder-features-implementation-log-2026-09-11.html` for sign-off.
The NG token pass (Phase 1) is still ahead: these screens carry the Studio X look.
