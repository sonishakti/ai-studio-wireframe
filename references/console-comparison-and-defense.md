# Two Consoles, One Question: Which Gets a Customer to Paid Usage Fastest?

**A leadership comparison of the Studio_X redesign vs. the China team's next-gen (NG) console**

Prepared 2026-06-17 · Author: Design (Studio_X) · Audience: Product & Design leadership

> **How to read this in 60 seconds.** Two teams have each redesigned the Agora console.
> This document compares them on one yardstick — *how fast and how clearly does a brand-new
> customer get to a working agent that carries real traffic, which is the only thing Agora
> earns money on.* It is written in plain language; every internal term is defined the first
> time it appears. The centerpiece is **Section 2: the divergent-feature list** — the
> side-by-side your team asked for. Sections 3–7 back every claim with evidence and a plan to
> test it. Where the NG console is genuinely better, this document says so — that is what makes
> the rest credible.

---

## A note on fairness (read this before the verdict)

The NG console is an honest **early-stage beta** ("This is the new Console — a private preview,
open to invited workspaces only"). Some of what we observe is *unfinished*, not *mis-designed* —
and we flag which is which throughout. Three things we explicitly credit to the NG team up front,
so the rest of this reads as benchmarking and not a turf war:

1. **The visual craft is good.** Clean dark theme, consistent spacing, modern componentry. The
   "it looks AI-generated" reaction is *not* about the pixels — it's about the information
   architecture and the words, which we evidence below.
2. **It has an in-browser preview call too.** The NG agent editor can place a test call ("Call"
   in its Live Preview). So "talk to it in the browser" is not unique to us — *where* it sits in
   the journey is the difference (their test is buried inside the editor after you build an agent;
   ours is the first thing you do).
3. **Its "Capabilities" catalog is arguably cleaner than ours.** One page lists every Agora
   product as a per-project on/off toggle. That is a tidier pattern than our split between
   "Realtime Services" and "Extensions" — an idea worth borrowing (see §2 gap inventory).

With that established, here is the verdict.

---

## 0. Executive summary

**The frame.** Agora earns money when minutes are consumed on a **live deployment** — an agent
actually answering or making calls. It earns *nothing* when a customer signs up, builds an agent,
or even "publishes" one. So the console that wins is the one that moves a new customer from
*signup* to *an agent carrying real traffic* in the fewest steps, with the path obvious at every
turn. That single test — plus the market bar (Vapi, Retell, ElevenLabs, LiveKit) and design-system
maturity — is how we judge both designs.

**The two designs in one line each.**
- **Studio_X (ours):** A default agent is **already live** the moment you log in. You *talk to it*
  first (free, in-browser), then **put it to work** on a calling campaign, a phone number, or your
  website — all inside the console. The home screen *is* the path to revenue.
- **NG console (theirs):** You land on an **empty workspace** and are told to *"Create or choose an
  agent."* When you finish building one, the only way to make it carry real traffic is to **go to
  Vercel, clone a GitHub starter app, paste in your credentials by hand, and run it yourself** — and
  even then it connects a *demo* agent, not the one you built. Connecting your real agent is marked
  **"Planned."**

**Headline verdict.** Both teams ship a polished surface. But the NG console is organized around
**Agora's internal product taxonomy** (RTC primitives, engine toggles, raw model settings) rather
than around **what the customer is trying to do**. Most importantly, **its path to the one thing
Agora monetizes — live traffic — is incomplete and outsourced to Vercel.** Studio_X is built spine-
first around that exact path. On the yardstick that matters, Studio_X leads decisively; the NG
console's strengths are real but sit on the surface, not on the journey.

**Six-dimension scorecard** (✓ strong · △ partial · ✗ weak/absent):

| Dimension | Studio_X | NG console |
|---|:---:|:---:|
| Time to a working agent (first "it works" moment) | ✓ | △ |
| Clarity of the path to **live traffic** (revenue) | ✓ | ✗ |
| User-centricity (speaks to the user's goal, not Agora's internals) | ✓ | ✗ |
| Information hierarchy (right things first) | ✓ | △ |
| Conversation observability (see what your agent said/did) | ✓ | ✗ |
| Visual design system maturity | ✓ | ✓ |

**What must be true for our approach to win** (the bets we are making):
1. New customers want to *believe before they build* — hearing the agent work earns more activation
   than a blank "create an agent" canvas. *(Testable — §7.)*
2. Customers will pick an in-console "put it on a number / launch a campaign" path over self-hosting
   a starter repo. *(Strongly likely; the NG console makes the opposite bet by necessity.)*
3. Plain-language, goal-framed copy out-activates RTC-engineer language for the self-serve segment.
   *(Testable — §7.)*

---

## 1. The shared yardstick (so this is benchmarking, not advocacy)

Both designs are judged on the **same six axes**. We define each in plain language so a non-designer
can score the screens themselves.

| Axis | The question it answers | Why it matters to Agora |
|---|---|---|
| **Time-to-first-working-agent** | How fast does a new user reach a moment where the agent visibly *works*? | First proof-of-value; predicts whether they continue. |
| **Path-to-live-traffic clarity** | Is the route from "I have an agent" to "it's handling real calls" obvious and in-product? | This is the **only** step that starts revenue. |
| **User-centricity** | Does the UI speak in terms of the *user's goal*, or Agora's internal structure? | Goal-framed products activate self-serve users; system-framed ones filter to experts. |
| **Information hierarchy** | Are the most valuable actions the most prominent? | Determines what a first-time user does in their first 60 seconds. |
| **Market parity** | Does it meet the bar set by Vapi / Retell / ElevenLabs / LiveKit? | These set the customer's expectation of "fast." |
| **Design-system maturity** | Tokens, consistency, theming, accessibility. | Trust, velocity, and reach (incl. assistive tech). |

A definition we use throughout: a **"seam"** is a place where the product makes the *user* carry
something across a gap the product should have carried for them. Agora's historic ~93% drop (below)
sits at a seam. Seams are the enemy of activation.

**Why this yardstick, grounded in our own funnel data** (LEARNINGS §2 — paid-for research, not
opinion):

| Stage transition | Drop | Where it happens |
|---|---|---|
| Signup → account created | **81.7%** (~85,500 lost per cohort) | Console provisioning |
| Login → agent-creation started | **~93%** (only 686 of ~10,113) | **The Console↔Studio seam** |
| Create-agent opened → published | **77.7%** (153 of 686) | Inside the builder |

Two of the three biggest leaks are *seams* — the user is dropped into a gap and abandons. The whole
redesign exists to close them. **The NG console, by routing the final step through Vercel, doesn't
just leave the revenue seam open — it widens it into a chasm and hands the user a GitHub repo.**

---

## 2. Divergent-feature list — UX & Information Hierarchy  ⭐ (the centerpiece)

This is the manager's #1 ask: *how is our console different from theirs, area by area?* For each
area: **Ours | Theirs | Who leads | Why it matters.** All "theirs" rows are from a live walkthrough
of the authenticated NG staging console (evidence in the Appendix).

### 2.1 Top-level navigation & IA model

| | Studio_X (ours) | NG console (theirs) |
|---|---|---|
| **Sidebar groups** | **Build** (Go Live · Agents · Integrations) · **Observe** (Monitor) · **Manage** (Project Settings · Realtime Services · Vendor Credentials) | **Overview** (Home) · **Build** (Agents · Integrations · Playground) · **Channels** (Realtime) · **Operate** (Usage) · **Platform** (Capabilities · Developers) |
| **Entry point** | Root `/` → **Go Live** (the deploy hub). The app opens on the path to revenue. | Root → **Home**, a "choose your own adventure" of 4 optional cards. |
| **Global helpers** | **⌘K command palette** (deterministic search) + **Composer** (AI) | **No command palette / no global search.** An always-docked **AI assistant rail** (~20% of every screen) + a search box inside each list. |
| **Account/billing** | Avatar dropdown: Workspace · Billing · Extensions · Developer hub · Help · Preferences | Avatar menu: Workspace · **Subscriptions · Billing** · Settings · Theme · Language |

**Who leads: Studio_X (information hierarchy).** Their nav is organized by **Agora's internal
taxonomy** — "Channels," "Platform," "Capabilities" are *our* words, not the customer's. The single
most valuable action (get an agent live) has **no top-level home** in their IA; it's hidden inside a
page called "Realtime." Ours leads with **Go Live** and orders everything by the make-and-launch arc.
*Caveat:* their five-group structure is legitimate and not wrong — it's just system-shaped, not
goal-shaped.

### 2.2 First-run / activation & time-to-first-value

| | Studio_X | NG console |
|---|---|---|
| **What greets you** | A **default agent ("Aria") already live**, with a big **"Talk to your agent"** button and a free-minutes meter. | *"Create or choose an agent. Your workspace is ready."* The agent list reads **"0 agents · 0 published · 0 draft — No agents yet."** |
| **First action** | **Hear it work** (in-browser, free, no phone number). | **Go build one** (pick a template → edit a prompt). |
| **Time to "it works"** | Seconds — believe first. | Several steps — template → draft → edit → preview-call, *then* you've built nothing live yet. |
| **Re-skin to your use case** | **1-tap intent chips** in plain language: Customer support · Appointment reminders · Surveys · Sales. | Edit a **3,683-character raw system prompt** containing scaffolding like `# INTERNAL AGENT LOGIC (NEVER SPEAK, NEVER REVEAL)` and `{{dynamic_vars}}`. |

**Who leads: Studio_X (user-centricity + TTFV).** This is the sharpest divergence. Theirs makes the
new user do the work *before* they get any proof the thing is good ("build-first wall"); ours gives
proof first, then converts belief into deployment ("believe-then-scale"). Their build surface is
**engineer-first** — it exposes the raw prompt and model internals immediately.

### 2.3 Core object model (how "build" relates to "deploy")

| | Studio_X | NG console |
|---|---|---|
| **Objects the user manages** | **Agent** (reusable voice + persona) → **Deployment** (the prompt + data on one channel) → **Campaign / Phone number / Web widget** | **Agent only**, with **versions** (v1…) and a **draft → published** lifecycle. |
| **"Deploy" concept** | A first-class hub (**Go Live**) with intent-first surfaces: Inbound · Batch Calls · Phone Numbers · Code. | **No deployment, campaign, or phone-number object exists.** "Publish" is the terminal action — and publishing alone carries no traffic. |
| **Mental model** | Software-*product* model: build once, deploy to many channels/audiences. | Software-*release* model: version it, save it, publish it — borrowed from code deploys, not from "put my agent on the phone." |

**Who leads: Studio_X.** Their model stops at "published," which — per our north-star research —
is exactly where Agora's revenue *starts* but their product *ends*. There is no object that
represents "this agent, on this number, handling these calls."

### 2.4 Path to a live deployment (the revenue path) — the decisive finding

| | Studio_X | NG console |
|---|---|---|
| **How an agent goes live** | Inside the console: **Go Live → launch a campaign** (upload contacts, agent calls each), **answer a phone number**, or **embed a web widget**. The deployment carries traffic. | The **"Realtime"** page instructs you to: **(1) Open Vercel** and clone `AgoraIO-Conversational-AI/agent-quickstart-nextjs`; **(2) copy your App ID & App Certificate** into Vercel env vars by hand; **(3) open the Vercel URL** to "join a channel and invite the **bundled demo agent**." |
| **Does it use the agent you built?** | Yes — your agent, your deployment. | **No.** It connects a *demo* agent. Using "a published Agent ID without changing Vercel env vars" is labeled **"Planned."** The console literally says **"Console does not verify this deployment yet."** |
| **Where the work happens** | In Agora's product. | On **Vercel + GitHub + a code editor** — outside Agora entirely. |

**Who leads: Studio_X, decisively.** This is the heart of the comparison. **The NG console has no
in-product path from "the agent I built" to "carrying real traffic."** That path — the only one that
earns Agora money — is **outsourced to a third-party deploy of a starter repo**, and the handoff to
the user's *actual* agent is an unbuilt "Planned" feature. Our entire strategy is this exact path,
built first. If leadership remembers one row of this document, it is this one.

### 2.5 Observability / monitoring (seeing what your agent did)

| | Studio_X | NG console |
|---|---|---|
| **Conversation history** | **Monitor** hub: Overview · **Call History** · **Sessions** (every agent conversation run), with transcripts. | **None.** There is no Monitor, Call History, Sessions, or transcript surface anywhere in the nav. |
| **What exists instead** | Plus campaign-scoped monitoring tabs. | A **"Usage"** page showing **RTC product metrics** (default product: *Interactive Live Streaming*, with Host/Audience tabs) and a transient "Live Events" panel inside the agent preview. |

**Who leads: Studio_X.** A customer running a campaign on the NG console **cannot review what was
said, which calls failed, or why.** Worse, the usage they *can* see is framed around legacy RTC
streaming products, not around their agent's calls. (Note: per LEARNINGS, RTC *session-quality*
telemetry rightly lives in the separate Agora Analytics product — but *conversation* history is a
core agent-console surface, and it's absent here.)

### 2.6 Billing & usage visibility

| | Studio_X | NG console |
|---|---|---|
| **Free-tier meter** | **Ambient from minute one** — a "X / 300 free minutes used" strip on the home, with "calls and conversations use these minutes." | None on the working surfaces. |
| **Usage framing** | Tied to **agent deployments** and minutes consumed. | **RTC-product framed** (Interactive Live Streaming / Host / Audience); every panel reads **"Unavailable — no usage data."** |
| **Billing location** | Avatar dropdown + `/billing/usage`. | Tucked in the **account menu** (Subscriptions · Billing); the Usage page references a "Bill Detail in Billing" that **isn't in the navigation.** |

**Who leads: Studio_X.** Showing remaining free minutes from the first screen ties the experience to
the value Agora sells. The NG console hides spend in a menu and frames usage around the wrong product.

### 2.7 Search & wayfinding

| | Studio_X | NG console |
|---|---|---|
| **Find anything fast** | **⌘K command palette** (deterministic) **+** Composer (AI) **+** per-surface search. | **No command palette** (⌘K does nothing). The **AI assistant rail** is the primary wayfinding aid, plus a search box per list. |

**Who leads: Studio_X.** Pinning wayfinding entirely to an AI chat means *every* "where is X" requires
composing a sentence and trusting a generated answer. A deterministic ⌘K is faster and predictable for
the things users do repeatedly. (Their assistant is a real asset for *open* questions — see gap
inventory — but it shouldn't be the *only* finder.)

### 2.8 The AI assistant as information architecture

| | Studio_X | NG console |
|---|---|---|
| **Form** | **Composer** (folds into the command palette) + a ✦ Ask affordance. Assistive, summoned. | A **persistent ASSISTANT rail occupying ~20% of every screen**, context-aware per page. |
| **Voice (verbatim, from their screens)** | Task-framed, plain: "Talk to your agent," "Put it to work," "Launch a campaign." | RTC-engineer register: *"Show me the symptom. I'll separate transport from behavior… channel posture, latency guardrails, and drift signals before staging a tuning proposal."* (Realtime). *"Give me the spend question. I'll find the driver."* (Usage). |
| **Pattern** | Varies by surface, written for the task. | **Identical 4-prompt template on every page** — one each tagged BUILD · OBSERVE · CONFIGURE · LEARN — regardless of context. |

**Who leads: Studio_X (user-centricity).** This is the strongest evidence for the "feels
AI-generated" reaction — *not* the visuals, but the **uniform, templated assistant copy in
engineer-to-engineer jargon.** The same four-prompt scaffold appears on Home, Agents, Realtime,
Usage, Capabilities, and Developers. It reads as generated-per-template rather than written-per-user.

### 2.9 Empty & loading states / honesty of system status

| | Studio_X | NG console |
|---|---|---|
| **Loading** | Standard skeletons/spinners. | The project selector showed **"Loading projects…" persistently across many pages**, resolving only when clicked; certificate status stuck on "Checking…"; App ID rendered the placeholder `"select-project"`. |
| **Empty** | Designed empty states with next-step guidance (with honest gaps — see §6). | **Blank rows** (Credentials), **"Unavailable / No usage data"** (Home + Usage), and **"Select a project to configure"** on Capabilities cards *even when a project is selected.* |
| **Unbuilt surfaced to user** | — | **"Console does not verify this deployment yet,"** **"Published Agent ID — Planned."** Placeholder and half-built states are shipped into the primary flow. |

**Who leads: Studio_X — but with humility (see §6).** Their beta status explains *some* of this. But
surfacing "Planned" and "does not verify this deployment yet" *in the activation path itself* tells
the user the most important road isn't finished.

---

### Gap inventory A — **They have, we (could) lack** (adopt candidates)

Honest credit. These are NG-console ideas worth borrowing:

1. **A single "Capabilities" catalog.** One page lists every Agora product (Intelligence · Media ·
   Messaging & Signaling · Collaboration · Infrastructure) as a per-project on/off toggle. Cleaner
   than our Realtime-Services-vs-Extensions split (our own open IA tension #3). **Strong adopt.**
2. **One-click `.env` copy/download** for local SDK setup (their Developers › Overview). A genuinely
   nice developer-experience touch. **Adopt.**
3. **A legitimate "deploy the reference app" power-user path.** Self-hosting the starter on Vercel is
   a *fine option to offer advanced developers* — their mistake is making it the *only* path, not
   offering it. We could add it as one option inside Go Live › Code. **Adopt as a secondary path.**
4. **Persistent, context-aware AI helper.** Their always-available assistant rail (concept, not its
   current copy) is ahead of our summoned Composer for *open* questions. Worth a test of docked vs.
   summoned. **Consider.**
5. **Template categories as filter tabs** (Sales / Operations / Customer Support / Surveys) and
   per-list search boxes everywhere. Small, good. **Adopt.**

### Gap inventory B — **We have, they lack** (our differentiators to defend)

1. **An auto-provisioned, already-live default agent** — no build-first wall.
2. **Talk-to-it-in-browser as the *first* action** (believe-first), on free minutes.
3. **A real in-product path to live traffic** — Go Live → campaign / number / widget (theirs is
   "deploy a repo on Vercel"; the real handoff is "Planned").
4. **Campaign as a first-class, named deployment surface** (outbound batch) with its own monitoring.
5. **Conversation observability** — Call History, Sessions, transcripts (they have none).
6. **An ambient free-minutes meter** from minute one (ties UX to the value Agora sells).
7. **A deployment object** distinct from the reusable agent (build once, deploy many).
8. **1-tap intent re-skin** in plain language vs. editing a 3,600-char raw prompt.
9. **A ⌘K command palette** / deterministic global search.
10. **Plain-language, goal-framed copy** vs. RTC-engineer jargon.

---

## 3. Heuristic evaluation scorecard (both consoles)

Method: Nielsen's 10 usability heuristics + a short list of the Intent anti-patterns, scored for
**severity of problems found** (0 = none, 4 = catastrophic). *Lower is better.* Ours is scored from
the live app and source; theirs from the authenticated walkthrough (black-box — we see their UI, not
their code, so their accessibility score is observational).

| Heuristic | NG console — top finding | Sev. | Studio_X — top finding | Sev. |
|---|---|:--:|---|:--:|
| **1. Visibility of system status** | "Loading projects…" stuck across pages; "Checking certificate…"; placeholder App ID | **3** | Live status (call timer, minute counter, "Ready") shown; standard skeletons | 1 |
| **2. Match to the real world** | "transport vs behavior," "channel posture," "drift signals," "Selective Attention Locking" | **4** | Goal language ("Talk to your agent," "Launch a campaign") | 1 |
| **3. User control & freedom** | Reset/version controls present; OK | 1 | Editable everywhere; reversible | 1 |
| **4. Consistency & standards** | Visually consistent, *but* "Realtime" = "go to Vercel" breaks the model | 2 | Consistent; one minor live-dot color (mirrors existing convention) | 1 |
| **5. Error prevention** | "Console does not verify this deployment yet"; no validation of the Vercel handoff | **3** | Deterministic flows; wireframe (no live backend to error) | 1 |
| **6. Recognition over recall** | Exposes raw prompts, env-var names, certificate IDs, raw JSON ("Raw Properties") | **3** | Intent chips, summarized stack, named channels | 1 |
| **7. Flexibility & efficiency** | Power-user depth is real; **no fast path for novices** | 2 | Fast path (talk → deploy) + depth in editor | 1 |
| **8. Aesthetic & minimalist** | Clean visuals, **but content overloaded with internal jargon** | 2 | Minimal, task-focused | 1 |
| **9. Help users recover from errors** | Minimal recovery guidance; "Unavailable" with no next step | **3** | Empty states route to next step (gaps noted §6) | 2 |
| **10. Help & documentation** | Assistant rail + pricing links | 2 | Composer + Help hub + contextual | 1 |
| **AP: system-shaped IA** (Intent) | Nav mirrors Agora's product taxonomy, not user goals | **3** | Nav mirrors the make-and-launch journey | 1 |
| **AP: build-first wall** (Intent) | Empty workspace; "create an agent" before any value | **3** | Believe-first; agent pre-provisioned | 0 |

**On the user's hypothesis ("AI-generated, zero human-centricity"): substantiated, but be
precise.** The *visual* system is not slop — it's clean and consistent (heuristic 8 scores it
2, not 4). What earns the reaction is concentrated in **heuristics 1, 2, 6 and the two anti-patterns**:
templated assistant copy, RTC-engineer vocabulary, raw internals exposed to first-time users, an IA
shaped like Agora's org chart, and a flagship journey (go-live) that is literally unfinished. The
accurate one-liner for leadership is: **"Polished surface; the architecture and the words are
system-shaped, not user-shaped — and the revenue path isn't built."** That is more defensible and
more damning than "AI slop."

---

## 4. Competitive benchmarking (both designs vs. the market)

The market has already set the customer's expectation for "fast." (Bar from LEARNINGS §8 / public
product positioning.)

| Competitor | Time to first working agent | First-run model | "Live" convention |
|---|---|---|---|
| **ElevenLabs Agents** | ~5 min | Template → test in browser | Embed / phone fast |
| **LiveKit Agents** | <10 min | Code-first, strong docs | SIP / web |
| **Retell AI** | "minutes" | Template → test call → number | Number-first |
| **Vapi** | minutes → (deeper) days | Assistant config → test → number | Number / campaign |

| Where each internal design lands | |
|---|---|
| **Studio_X** | Talk-to-it in **seconds**; live on a number/campaign **in-product**. **At or ahead of the market bar** on speed-to-value and clarity. |
| **NG console** | Build-an-agent is competitive; but **going live routes through a self-hosted Vercel deploy** — **behind every competitor**, all of whom keep "go live" in-product. |

**Positioning map (speed-to-value × clarity-of-path):**

```
              CLEAR PATH TO LIVE
                     ▲
        Studio_X ●   │   ● ElevenLabs
                     │   ● Retell
        Vapi ●       │
   ──────────────────┼──────────────────▶  FAST TO FIRST VALUE
                     │
                     │   ● LiveKit (fast, code-first)
          NG console ●
       (build ok, live = DIY on Vercel)
                     ▼
            LIVE PATH UNCLEAR / EXTERNAL
```

The whole market keeps "go live" *inside the product*. The NG console is the only design here that
sends the user to a third party for the revenue step. **That is a category-level miss, not a nitpick.**

---

## 5. KPI scorecard (plain language)

The funnel, renamed so anyone can follow it: **Land → Believe → Connect → Consume → Convert.**
- **Land:** they sign up and log in.
- **Believe:** they see the agent actually work.
- **Connect:** they put it on real traffic (a number / campaign / site).
- **Consume:** minutes get used. *(Agora's revenue begins here.)*
- **Convert:** they exhaust free minutes and pay.

| Stage | What we measure (plain) | Studio_X target/structure | NG console (as built) |
|---|---|---|---|
| **Believe** | % who reach a working agent; how fast | Talk-to-it on the home; target **first "it works" ≤ 90 sec** | Buried behind build; **no pre-provisioned agent** |
| **Connect** | % who reach a **live deployment** (north-star) | In-product: campaign / number / widget | **Routed to Vercel; real-agent handoff "Planned"** |
| **Consume** | % who reach first paid-relevant minutes | Free-minutes meter from minute one drives toward usage | **No agent-minute framing; usage shows "Unavailable"** |
| **Convert** | % who exhaust free tier → pay | Visible meter → upgrade prompt at the cap | Billing hidden in account menu |

**Structural deltas** (design facts, independent of traffic — from our measurement framework):
clicks-to-first-test **−70%**, clicks-to-deploy **−55%**, **product seams crossed to go live: 4 → 0**.
The NG console's seam count for going live is, in effect, **higher than the old console** because it
adds an external Vercel/GitHub round-trip.

**The prize, quantified** (LEARNINGS §2): recovering just **10% of the ~93% seam leak ≈ 8,500 more
activated accounts per cohort** — and with the agent pre-provisioned, each lands *one step* from
billable usage. The NG console leaves that seam open by design.

---

## 6. Design-system comparison (the secondary level)

Your team's level #2. Ours is code-grounded; theirs is observational (we can't see their tokens).

| Pillar | Studio_X | NG console (observed) |
|---|---|---|
| **Color / tokens** | **OKLCH** model, cyan primary `oklch(0.52 0.105 223)`, full semantic token set (background/foreground/card/popover/muted/accent/destructive + sidebar + 5 chart tokens). **No hardcoded colors** — `buoy` governance blocks drift. | Cohesive dark theme; token system not inspectable. Visually consistent. |
| **Typography** | **DM Sans** (heading + body), defined scale. | Clean sans; appears consistent. |
| **Components** | ~30 shadcn/ui primitives + ~35 composite components, one library. | Consistent componentry (cards, tabs, toggles, sliders); library unknown. |
| **Theming** | Light / Dark / System. | Dark (theme + language switchers present in account menu). |
| **Spacing / rhythm** | Token-based radius scale (sm→4xl from one `--radius`). | Even, modern spacing. |
| **Accessibility** | **Honest gap:** several SVG charts lack `aria-label`s; a couple of dialogs miss descriptions. Remediation tracked. | Not audited (needs axe + screen-reader pass); dense raw-text fields and low-contrast helper text are risks. |
| **Motion** | Restrained (orb pulse, skeletons). | Minimal. |

**Verdict:** **roughly at parity on visual craft.** Our differentiator is *governed* tokens (drift is
mechanically prevented) and a documented system; we **lose points honestly on chart accessibility**,
which we are fixing. Stating our own gap here is deliberate — it's what makes the rest of this
document trustworthy.

---

## 7. Testing strategy (how we prove every claim)

No claim above should ship to leadership as opinion. Each maps to a method, a metric, and a
**numeric success threshold.** Run these on both consoles with the same tasks.

| # | Claim to test | Method | Metric | Success threshold |
|---|---|---|---|---|
| 1 | Believe-first beats build-first | **Moderated usability test**, 5–8 P1 "hustler" developers per console, task: *"get an agent answering a phone number"* | Task success; time-on-task | Studio_X ≥ **90%** success **and** ≥ **40%** faster time-to-live |
| 2 | Our path-to-live is clearer | Same sessions | # of seams / external tools touched to go live | Studio_X = **0** external; NG > 0 (expected: Vercel + GitHub) |
| 3 | Plain copy out-activates jargon | **First-click + 5-second test** on each home | % who correctly identify "how do I make this handle calls?" | Studio_X ≥ **80%** correct; gap vs NG ≥ **25 pts** |
| 4 | Their IA is system-shaped | **Tree test** of both nav models, n≥30 | Findability for "see what my agent said," "put agent on a number," "check spend" | Studio_X ≥ **80%** findability; NG materially lower |
| 5 | Time-to-first-value | **Unmoderated benchmark**, n≥50/console | Time signup → first "it works" | Studio_X p50 ≤ **90 sec** |
| 6 | Time-to-live-deployment | Same | Time signup → agent on real traffic | Studio_X p50 ≤ **10 min**; NG often *not completable in-product* |
| 7 | Heuristic severity | **2–3 evaluator** protocol, this §3 rubric | Mean severity; # of sev-3+ | NG sev-3+ count materially higher (pre-registered) |
| 8 | Accessibility | **axe + screen-reader** pass, both | WCAG AA violations | Fix Studio_X chart-aria gaps to **0**; report NG honestly |
| 9 | Activation in the wild | **Instrumented A/B** using shipped 06-17 events (`deployment_went_live`, `first_minutes_consumed`, `free_tier_exhausted`) | % reaching `deployment_went_live`; % reaching first paid minutes | Pre-register lift target before launch |

**Participants:** P1 persona — "the hustler": a solo or small-team developer/founder who wants a
working voice agent on a number *today*, not a platform to administer. **Tasks (identical, both
consoles):** (a) put an agent on a phone number; (b) launch an outbound calling campaign; (c) find
out why a specific call failed. Tasks (b) and (c) are expected to be **non-completable in-product on
the NG console** — itself a headline result. Capture **SUS** (overall usability) and **SEQ**
(per-task ease) for a comparable number leadership can read.

---

## 8. Recommendations — what needs to be true to win

**Adopt from them** (credibility + real wins): the single **Capabilities catalog** pattern (resolves
our IA tension #3); **one-click `.env`**; offer **self-host-the-starter as one *optional* path** inside
Go Live › Code; **template category filters + per-list search**; run the **docked-vs-summoned assistant**
test before deciding our Composer's resting state.

**Defend & double down** (our moat): the **auto-provisioned live agent**, **talk-first activation**,
the **in-product path to live traffic**, **campaign-as-flagship**, **conversation observability**, and
the **ambient free-minutes meter**. These are precisely the things the NG console lacks, and they map
one-to-one onto the funnel leaks Agora is paying to fix.

**Fix our own gaps** (stay honest): close the **chart-accessibility** `aria-label` gaps before any
leadership demo; finish placeholder empty states flagged in `/fortify`.

**The decision leadership is being asked to make:** adopt **activation-first as the organizing
principle for the unified console** — agent pre-provisioned, value shown before build, and **"go live"
owned in-product** as the spine. The NG console is a capable *administrative* surface for Agora's
product catalog; it is **not** an activation engine, and its revenue path is unfinished and
outsourced. **The evidence plan in §7 de-risks this call**: if the moderated test, tree test, and
benchmark land at the thresholds above, the choice is settled by data, not by which team argued harder.

**One sentence for the room:** *Agora only makes money when minutes flow on a live deployment — ours
is the design built spine-first around that moment; theirs sends the customer to Vercel to find it.*

---

## Appendix — evidence log (NG console walkthrough, authenticated staging)

Captured live from `staging-ng-console.agora.io` on 2026-06-17. Black-box (UI only).

| # | Screen | Key evidence (verbatim where quoted) |
|---|---|---|
| A1 | **Home** | "Create or choose an agent. Your workspace is ready." · This-week usage "Unavailable / No usage data." |
| A2 | **Agents (empty)** | "0 agents · 0 published · 0 draft" · "No agents yet." · status text "NOT LOADED." |
| A3 | **Templates** | Cards expose raw stack (LLM gpt-4.1-mini · ASR nova-3 · TTS Radiant Girl); categories Sales/Operations/Customer Support/Surveys. |
| A4 | **Playground / editor** | 3,683-char system prompt incl. `# INTERNAL AGENT LOGIC (NEVER SPEAK, NEVER REVEAL)`, `{{appointment_date}}`. Tabs: Agent · Tools (MCP) · Advanced. |
| A5 | **Advanced tab** | Turn Detection · Start/End of Speech · Selective Attention Locking · Max History slider · **Raw Properties** (raw JSON). |
| A6 | **Agent detail** | `draft → Create agent → Publish`; versions (v1); Knowledge tab = single KB (RAG). **Save = version-with-description dialog.** |
| A7 | **Realtime (the revenue path)** | "Open Vercel deploy" → clones `AgoraIO-Conversational-AI/agent-quickstart-nextjs`; "Copy env values" (App ID/Certificate); "invite the **bundled demo agent**"; **"Console does not verify this deployment yet"**; **"Published Agent ID — Planned."** |
| A8 | **Realtime assistant copy** | "Show me the symptom. I'll separate transport from behavior… channel posture, latency guardrails, and drift signals before staging a tuning proposal." |
| A9 | **Integrations** | Sub-tabs Credentials · Knowledge Bases · MCP Servers; credentials are BYOK runtime keys; empty = blank rows. |
| A10 | **Usage** | Default product **Interactive Live Streaming** (Host/Audience tabs); all panels "Unavailable"; references a "Bill Detail in Billing" not present in nav. |
| A11 | **Capabilities** | Full Agora catalog as toggles (Intelligence · Media · Messaging & Signaling · Collaboration · Infrastructure); "Conversational AI Engine" is one toggle among 13+; cards say "Select a project to configure" even with a project selected. |
| A12 | **Developers** | `.env` copy/download (App ID/Certificate); API Keys · Webhooks; **Generate Temp Token** UI button (we made temp tokens CLI-only). |
| A13 | **Global** | Persistent **AI assistant rail** (~20% width) on every page with an identical 4-prompt BUILD/OBSERVE/CONFIGURE/LEARN template; **no ⌘K** command palette; "Loading projects…" persisted across pages. |

*Screenshots of A1–A13 were captured during the walkthrough and are available on request for a slide
appendix.*

---

*Sources: live authenticated walkthrough of the NG staging console (2026-06-17); Studio_X source
(`app-sidebar.tsx`, `go-live-home.tsx`, `globals.css`, 69 routes); `LEARNINGS.md` §2/§8/§17/§20;
`references/measurement-framework.md`; `references/event-taxonomy-review.md`. Funnel figures are from
Agora's own cohort data (LEARNINGS §2).*
