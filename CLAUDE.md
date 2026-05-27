# Studio_X — Project memory

> Auto-loaded each session. Full handoff is in `HANDOFF.md`; this file is the 60-second orientation so a fresh chat doesn't re-derive context.

## Live preview

- **Wireframe (start here):** https://ai-studio-console-redesign.vercel.app/wireframes/app.html
- Root: https://ai-studio-console-redesign.vercel.app
- Source: `wireframes/app.html` — vanilla HTML/CSS/JS, no build step — **29 screens, 3634 lines**
- `git push origin main` → live in ~60s (Vercel auto-deploys from `sonishakti/ai-studio-wireframe` mirror)

## What this is

Studio_X = IA + UX wireframe merging **Agora Console** (ops control plane: projects, credentials, billing, usage, extensions) and **Conv AI Studio** (where developers design and publish voice AI agents) into one surface. **Asymmetric merge** — Studio is the chassis, Console grafts in. RTE (voice/video/streaming/chat/signaling) is preserved but no longer the center of gravity.

This is a **funnel rescue project** that happens to require product consolidation. The ~93% drop at the Console↔Studio seam (LEARNINGS §2) is the reason it exists. North-star: Signup → First Agent Published.

## Read order

1. `HANDOFF.md` — recent state, commits, open work, gap inventory
2. `LEARNINGS.md` — strategic frame, funnel data, personas, hypothesis stack, decision log (paid for in research — **don't re-litigate**)
3. `references/ia-mapping.md` — Console → Studio 56/56 URL coverage
4. `references/sitemap.md` — original Agora Console structure
5. `references/realtime-services-blueprint.md` — 13-service Real-Time map
6. `wireframes/app.html` — the wireframe itself (~5000 lines after Billing rebuild)

## Current sidebar (LiveKit-inspired, 2026-05-27)

```
Home
[flat]    ›  Agents · Realtime Services · Integrations
Telephony ▾  Phone Numbers · Campaigns · Calls        [collapsible]
[flat]    ›  Analytics
Project   ▾  Project Credentials · Vendor Credentials [collapsible]
```

Changes from prior lifecycle shape:
- Section labels (BUILD/DEPLOY/MONITOR) removed — flat + collapsible instead
- Realtime Services moved PROJECT → flat peer of Agents (LEARNINGS §10 v2)
- Call History + Session History → unified "Calls" (All / Telephony / Realtime tabs)
- Route aliases: `/call-history` → Calls Telephony tab; `/session-history` → Calls Realtime tab
- "Credentials" → "Vendor Credentials" (LEARNINGS §9 scope-qualifier rule)

- Footer: Search ⌘K · Project chip · Avatar
- Topbar: Bell · ✦ Ask
- Avatar dropdown (9 items + theme + credits): Workspace · Theme · Free credits · Billing · Extensions Marketplace · Developer hub → · Help hub → · Try Agora Analytics ↗ · Preferences · Log out

## Don't re-litigate

- Strategic frame is locked (LEARNINGS §3). No new `/strategize` without new evidence.
- Studio UI is **frozen** — interventions are additive only. Don't restyle, remove, or rename existing Studio flows.
- Console and Studio share one backend, one Okta cookie, one project record. The seam is **wayfinding**, not auth.
- `Time on page` / session length / DAU are **rejected** as KPIs.
- Bare "Credentials" as a nav item is rejected — must be scoped (LEARNINGS §9).
- "Telemetry" as user-facing label rejected → use "Live activity".
- "Observe" as a section header rejected → use "Monitor".
- "Console" as a toggle label rejected → use "Real-Time".

## Open IA tensions (do litigate)

1. **Realtime Services** is in PROJECT today; LEARNINGS §10 v2 specs it as a BUILD peer of Agents. Misclassified.
2. **Call History + Session History** — same root question ("what happened?") split across two destinations.
3. **Integrations** (agent-scoped: KB · MCP · CRM connectors) vs **Extensions Marketplace** (project-scoped: Cloud Recording, Spatial Audio, ActiveFence) — labels don't make the distinction clear.
4. **Two Credentials items** in PROJECT — "Project Credentials" + bare "Credentials" (vendor keys). Second violates LEARNINGS §9 — should be "Vendor Credentials".
5. **Usage** — Figma 142-7866 shows it as standalone PROJECT item; wireframe has it as an Analytics tab. Decision pending.
6. **Cost in Analytics** — Cost tab was deleted 2026-05-26 after audit (Agora doesn't have per-vendor cost data). Pre-commitment estimates live in Deploy modal; platform spend in Billing › Overview.

## Tech stack

- **Wireframe (current):** vanilla HTML/CSS/JS, CSS variables under shadcn convention, Lucide icons via CDN, Inter via Google Fonts, Light/Dark/System theme. No bundler. Open the HTML, it works.
- **Path A (future React port):** React + Vite + TanStack Router + shadcn + Tailwind + MSW. Blocked on `AGORA_REGISTRY_TOKEN` for the `@agora/*` private registry.
- **Prototype that exists:** `studio-x-prototype/` — TanStack Start + Vite + bun. 8 MVP surfaces functional.

## Where things live

| What | Where |
|---|---|
| Wireframe HTML | `wireframes/app.html` |
| Wireframe CSS | `wireframes/style.css`, `wireframes/app.css` |
| Wireframe JS | `wireframes/app.js` |
| Console reference screenshots | `references/console_map/` |
| Open work checklist | `HANDOFF.md` "What's NOT done" |
| Reference docs | `references/*.md` |
| Recent commits | `git log --oneline -20` |

## Working rules

- Cite `docs.agora.io/en/` URLs for any Agora-primitive design call.
- Commits are the truth — docs cite them. If a doc is stale, fix the doc; don't second-guess the wireframe.
- Keep a decision log entry (LEARNINGS.md §20 pattern) for any non-trivial choice.
- The wireframe is CSS-token compatible with the future React stack — same `--primary` / `--foreground` / `--ring` variables move over unchanged.

## Skills to reach for

| Skill | When |
|---|---|
| `/organize` | Anything navigational, hierarchical, "where should X live" |
| `/journey` | New flow end-to-end — agent create → first campaign, or onboarding flow |
| `/articulate` | Tightening copy — Help hub, Contact Sales, error messages |
| `/fortify` | Edge cases — anywhere you see `class="empty">Wireframe placeholder` |
| `/measure` | Metrics work, paired with `references/event-taxonomy-review.md` |
| `/evaluate` | UX critique of a specific surface before ship |
| `/include` | Accessibility pass on charts (SVGs currently lack aria-labels) |
| `/specify` | Engineering handoff — wireframe → React spec |
| `vercel-plugin:deploy` | Force a manual deploy |

**Not needed (yet):** `/strategize` (frame locked), `/blueprint` (architecture documented).

## Useful one-liners

```bash
# Verify state in 60s
git log --oneline -5
git status --short
ls references/
open https://ai-studio-console-redesign.vercel.app

# Search the wireframe
grep -n "data-route" wireframes/app.html | head -20

# Find a screen by route
grep -n 'id="route-' wireframes/app.html
```
