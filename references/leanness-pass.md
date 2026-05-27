# Leanness Pass — what lives in Console vs Studio

**Date:** 2026-05-27
**Source state:** wireframe sidebar after `1cb1264` (Project Credentials CLI-callout)
**Goal:** Make the merged IA leaner by surfacing residual mismatches between Console's mental model and Studio's mental model.

The lean shape locked in 2026-05-22 already absorbed 56 Console URLs into 10 sidebar items. This pass looks specifically at what hasn't been re-classified — surfaces still sitting where Console put them, even though Studio is the chassis.

---

## Inventory recap

### Console (origin) — top-level items

```
Overview · Projects · Usage · Billing · Extension Marketplace ·
Subscriptions ▾ · Analytics ↗ · Developer Toolkit ▾ ·
Build Agents ↗ · Notifications
```

Plus 18 per-project configure pages — Chat, Signaling (×4), Whiteboard (×2), Cloud Recording, Media Push/Pull/Gateway, Notifications, Flexible Classroom, Cloud Proxy, Co-Host Auth, Real-Time STT, Video Screenshot Upload.

### Studio (origin) — top-level items

```
Agents · Integration ▾ (Credentials · Knowledge Bases · MCPs) ·
Campaign · Analytics
```

Plus 3 reserved routes that redirect to Agents today: `mobile-numbers`, `call-history`, `session-history`.

### Current merged sidebar

```
Home
BUILD     ›  Agents · Integrations
DEPLOY    ›  Phone Numbers · Campaign
MONITOR   ›  Analytics · Call History · Session History
PROJECT   ›  Project Credentials · Realtime Services · Credentials
```

**10 items, 4 groups.** Already pretty lean. The opportunities below shave 2 more items and resolve 3 labeling violations.

---

## Three lean moves backed by existing docs

### Move 1 — Realtime Services: PROJECT → BUILD

**Why it's misclassified today.** PROJECT is for chassis-level config (App ID, App Cert, networking, security). Realtime Services is *what you build with* — 13 services (Chat, Cloud Recording, Whiteboard, Media Push/Pull/Gateway, Signaling, RT-STT, Video Screenshot Upload, etc.) that are peers of Agents in capability terms. They live in PROJECT because Console scattered them across the project sidebar; we collapsed them into one parent but kept the Console placement.

**What the docs already say.** LEARNINGS.md §10 v2 (locked 2026-05-21):

> "Real-Time products sit as peers of Agents in BUILD — not as a separate Console-mode toggle."

The current wireframe diverges from this lock. Moving it back is reverting an undocumented drift, not a new decision.

**Net effect.** PROJECT shrinks to 2 items (chassis only). BUILD gains its proper third peer.

### Move 2 — Activity: merge Call History + Session History

**Why it's redundant today.** Both surfaces answer the same root question — *"what happened?"* — at different granularities. A user debugging "why did Tuesday's interaction drop?" doesn't think *"was that a call or a session?"* They think Tuesday + agent X. Forcing them to know the channel before they search is the IA leaking implementation through to UX.

**Both are placeholders.** Per HANDOFF.md, both are still labelled "Studio-core surfaces" not yet built. There's no implementation cost to combining them now — only a labelling decision.

**What replaces it.** One **Activity** item in MONITOR, with a channel filter at the top (Telephony / Realtime / All) and standard date/agent/status filters. Channel filter pre-fills based on entry point (clicking from Phone Numbers route filters to Telephony by default).

**Net effect.** MONITOR shrinks from 3 to 2 items. Search converges to one surface.

### Move 3 — "Credentials" → "Vendor Credentials" (relabel only)

**Why it's broken today.** The wireframe currently has both:

- `Project Credentials` (formerly Project Settings — App ID, App Cert)
- `Credentials` (bare — vendor keys for OpenAI/ElevenLabs/Deepgram)

LEARNINGS.md §9 calls bare "Credentials" out by name as the #1 source of nav confusion:

> "The word *credentials* means three different things across the surface area. Conflating them is the #1 source of nav confusion. Never use bare 'Credentials' in a nav item, page H1, or empty state without a scope qualifier."

Two adjacent items both saying "Credentials" with no scope qualifier directly violates the §9 rule. The fix is a label change — no IA change.

**Net effect.** Zero items added or removed. Cognitive load on PROJECT drops because the two items are now scannably distinct.

---

## Proposed sidebar (after the 3 moves)

```diff
  Home

  BUILD
  ├ Agents
+ ├ Realtime Services      ← moved from PROJECT
  └ Integrations

  DEPLOY
  ├ Phone Numbers
  └ Campaign

  MONITOR
  ├ Analytics
- ├ Call History           ← removed
- └ Session History        ← removed
+ └ Activity                ← merged, with channel filter

  PROJECT
  ├ Project Credentials
- ├ Realtime Services      ← moved up to BUILD
- └ Credentials            ← relabeled
+ └ Vendor Credentials      ← scope qualifier added
```

**Sidebar item count: 10 → 8. Group count: 4 → 4 (no group disruption).**

---

## Labeling clarification (no nav change, doc-only)

The Integrations / Extensions Marketplace overlap is the other thing developers point at as confusing. It's not a structure problem — both belong where they are — it's a labeling problem.

| Surface | Scope | Contents | Lives in |
|---|---|---|---|
| **Integrations** | **Agent-scoped** | Knowledge Bases · MCPs · CRM connectors (HubSpot, Airtable, Jira, Salesforce, Zapier) | BUILD sidebar |
| **Extensions Marketplace** | **Project-scoped** | RTC capability augmentations: Cloud Recording, Spatial Audio, ActiveFence, DeepAR, Conversation Intelligence, FaceUnity, Banuba, Synervoz, Noise Suppression | Avatar dropdown |

**Rule to write into the IA mapping doc:** *"Extensions extend what the **project** can do. Integrations connect what the **agent** uses."*

Once the rule is stated, the labels stop fighting each other. No relabel needed if the rule is documented; consider relabel to **Agent Integrations** if the rule still bleeds in user testing.

---

## What this pass does NOT recommend

- ❌ **Renaming the groups** (BUILD / DEPLOY / MONITOR / PROJECT). They map to user mental phases and were validated against Retell/LiveKit/ElevenLabs conventions in LEARNINGS §8. Don't churn them.
- ❌ **Promoting Extensions Marketplace to the main sidebar.** It's a browse/discover surface, not a daily destination. Current avatar-dropdown placement is consistent with LEARNINGS §10b (Discover items live in profile dropdown). If `/measure` data shows underuse and that's a problem, revisit then.
- ❌ **Collapsing PROJECT into the project switcher.** Considered — would shave a group — but P1's #1 task is finding App ID/App Cert. Burying them behind a chevron costs more than it saves.
- ❌ **Touching the Usage placement.** Figma 142-7866 shows Usage as a standalone PROJECT item; wireframe has it as an Analytics tab. That's an open question that needs the team's call, not this lean pass.
- ❌ **A `/strategize` reframe.** LEARNINGS §3 locks the strategic frame. This pass is structural only.

---

## What this pass surfaces for team decision

1. **Apply Move 1 (Realtime Services → BUILD)?** Yes/no. If no, update LEARNINGS §10 v2 to reflect the divergence — current state contradicts the locked IA.
2. **Apply Move 2 (Activity merge)?** Yes/no. If yes, decide whether the route is `/activity` with channel filter, or keep `/call-history` and `/session-history` as aliases that auto-set the filter (recommended — preserves muscle memory and inbound links).
3. **Apply Move 3 (Vendor Credentials relabel)?** Recommended unconditionally — it's a documented violation today.
4. **Document the Integrations vs Extensions rule** in `references/ia-mapping.md` so the next person reading the merged IA doesn't have to derive it from the LEARNINGS doc.

---

## Implementation cost

| Move | Files touched | LOC est. | Risk |
|---|---|---|---|
| 1 — Realtime Services to BUILD | `wireframes/app.html` (sidebar nav block + group label), maybe `app.js` if route grouping affects state | ~15 LOC | None — surface stays, just nav position changes |
| 2 — Activity merge | `wireframes/app.html` (new `route-activity` block consolidating the two placeholders + channel filter UI), `app.js` (route alias for `/call-history` and `/session-history` → activate Activity with prefilter) | ~80 LOC for a stub; full implementation later | Low — both are placeholders today |
| 3 — Vendor Credentials relabel | `wireframes/app.html` (one nav item label string) | 1 LOC | None |

All three are surgical edits — no group restructure, no new top-level items, no Studio-frozen surfaces touched.

---

## Open question worth flagging

Move 2 (Activity merge) interacts with the **event taxonomy** in `references/event-taxonomy-review.md`. If `call_started`, `session_started`, and similar events are emitted with separate channel-bound names, merging the UI surface without aligning the events later creates a coverage gap in Monitor. Recommend `/measure` pass on the taxonomy in the same sprint that ships Move 2.
