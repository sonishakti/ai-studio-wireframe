---
marp: true
theme: default
paginate: true
title: Two Consoles, One Question
description: Studio_X redesign vs. the NG console — a leadership decision deck
---

<!--
SPEAKER NOTE (deck-wide): This is a Marp deck. Open in VS Code "Marp for VS Code" or run
`marp console-comparison-deck.md --pptx` (or `--pdf`) to export to PowerPoint / Google Slides / PDF.
Every "❝ … ❞" box is a verbatim quote captured live from the NG staging console on 2026-06-17.
[SCREENSHOT] markers show where to slot the captured images for a fully-imaged version.
Backing detail + full matrix: references/console-comparison-and-defense.md
-->

# Two Consoles, One Question

### Which design gets a new customer to **paid usage** fastest?

**Studio_X redesign**  vs.  **the NG console**
A design & information-architecture comparison · 2026-06-17

<!-- Note: Keep the framing neutral out loud — "two teams each redesigned the console; here's how they compare on the metric that pays the bills." Not "us vs them." -->

---

## The 30-second version

- Agora earns money **only when minutes run on a live deployment** — not on signups, builds, or "published" agents.
- So the console that wins is the one that gets a customer from **signup → an agent carrying real traffic** fastest and clearest.
- **Studio_X is built spine-first around that path.** A live agent greets you; you put it on a campaign, a number, or your site — all in-product.
- **The NG console has no in-product path to live traffic.** To go live it sends you to **Vercel to self-host a starter repo**, and connecting your real agent is marked **"Planned."**
- We even asked **its own AI assistant** how to go live. It described a phone-number flow **that doesn't exist in the product** (the page 404s).

> **Recommendation:** adopt **activation-first** as the organizing principle for the unified console — and borrow the few things the NG team genuinely does better.

<!-- Note: This is the BLUF slide. If someone has to leave after one slide, this is the one. -->

---

## Why this is the only fair yardstick

**Agora's own cohort funnel — where customers are lost today:**

| Stage | Drop | Where |
|---|---|---|
| Signup → account created | **81.7%** | Console provisioning |
| Login → started building an agent | **~93%** | The Console↔Studio **seam** |
| Started → "published" | **77.7%** | Inside the builder |

- Two of the three biggest leaks are **seams** — gaps where the product makes the *user* carry the load and they give up.
- Recovering **10% of the ~93% seam ≈ 8,500 more activated accounts per cohort.**
- **The money problem is activation.** The console that doesn't solve activation is optimizing the wrong thing.

<!-- Note: "Seam" = a place the product drops the user into a gap it should have bridged. This funnel is paid-for research, not opinion. -->

---

## We judged both on the same six axes

So this reads as benchmarking, not advocacy:

1. **Time to a working agent** — how fast to the first "it works" moment
2. **Clarity of the path to live traffic** — the only step that earns revenue
3. **User-centricity** — speaks to the user's goal vs. Agora's internal structure
4. **Information hierarchy** — are the valuable actions the prominent ones
5. **Market parity** — vs. Vapi / Retell / ElevenLabs / LiveKit
6. **Design-system maturity** — tokens, consistency, theming, accessibility

<!-- Note: Read these out. They're the rubric every later slide scores against. -->

---

## Meet the two designs

| | **Studio_X (ours)** | **NG console (theirs)** |
|---|---|---|
| **You land on…** | A default agent **already live** + a big **"Talk to your agent"** | An **empty workspace**: *"Create or choose an agent"* |
| **First action** | **Hear it work** (free, in-browser) | **Go build one** (template → edit prompt) |
| **To go live** | **In-product**: campaign · number · web widget | **Go to Vercel**, self-host a starter repo |
| **See what it said** | **Monitor**: call history · transcripts | **No conversation history anywhere** |

[SCREENSHOT: Studio_X Go-Live home  ‖  NG console Home "Create or choose an agent"]

<!-- Note: Both are polished. The difference isn't craft — it's what the design points the user at. -->

---

## Divergence 1 — First run

**Theirs: build-first.** You must build before you get any proof of value.

> ❝ Create or choose an agent. Your workspace is ready. ❞
> ❝ 0 agents · 0 published · 0 draft — No agents yet ❞

**Ours: believe-first.** A live agent greets you; you talk to it in seconds, then put it to work.

- Their re-skin = edit a **3,683-character raw system prompt** (`# INTERNAL AGENT LOGIC (NEVER SPEAK, NEVER REVEAL)`).
- Our re-skin = **1-tap intent chips**: Customer support · Appointment reminders · Surveys · Sales.

**Who leads: Studio_X** — value before work; plain language before raw prompts.

<!-- Note: Their build surface is engineer-first. Ours earns belief, then converts it. -->

---

## Divergence 2 — The revenue path  ⭐

**The one slide that matters.** How does an agent start carrying real calls?

**NG console — "Realtime" tells the user to:**

> ❝ Open Vercel deploy → clones AgoraIO-Conversational-AI/agent-quickstart-nextjs ❞
> ❝ Copy the exact Vercel env names and values for App ID and App Certificate ❞
> ❝ …join a channel and invite the **bundled demo agent**. ❞
> ❝ **Console does not verify this deployment yet.** ❞  ·  ❝ Published Agent ID — **Planned** ❞

- The work happens on **Vercel + GitHub + a code editor — outside Agora.**
- It connects a **demo** agent. Using **your** agent is an unbuilt **"Planned"** feature.

**Studio_X:** Go Live → launch a campaign / answer a number / embed a widget. **In-product. Your agent. Carries traffic.**

[SCREENSHOT: NG "Realtime" page — the Vercel steps + "Planned" badge]

<!-- Note: If they remember one slide, this is it. The revenue step is outsourced and unfinished. -->

---

## Divergence 2, continued — we asked their own AI how to go live

We typed the new-user question into the NG console's **built-in assistant**:

> **Us:** ❝ How do I put my agent on a phone number to take real calls? ❞
>
> **Their AI:** ❝ …Configure telephony so the number routes inbound calls… **Assign or buy a phone number in the console**, then connect it to the agent… or look for the project/**telephony setup path** for your current console context. ❞

**That flow does not exist.** We went looking for it:

> ❝ **404 — The requested page could not be found.** ❞  *(staging-ng-console.agora.io/telephony)*

- Their **primary wayfinding tool hallucinates a product that isn't built** — sending users hunting for pages that 404.
- It even hedged ("*look for* the telephony path") and **generated the whole answer twice** (a duplication bug).

[SCREENSHOT: assistant answer  ‖  /telephony 404]

<!-- Note: This is the fusion of both problems — no revenue path AND an ungrounded AI. Concrete, undeniable, captured live. -->

---

## Divergence 3 — Seeing what your agent did

**NG console:** no Monitor, no Call History, no Sessions, **no transcripts** anywhere in the nav.

- The only "usage" view is framed around **legacy RTC products** (default: *Interactive Live Streaming*, Host / Audience) — not your agent's calls.
- Every panel reads: ❝ **Unavailable — No usage data** ❞

**Studio_X:** a **Monitor** hub — Overview · Call History · Sessions — plus per-campaign monitoring and transcripts.

**Who leads: Studio_X.** A customer running calls on the NG console **cannot review what was said or why a call failed.**

<!-- Note: Observability is table stakes for a voice-agent product. It's absent here. -->

---

## Divergence 4 — Whose words is it written in?

The "it feels AI-generated" reaction isn't about the pixels — **the visuals are clean.** It's the **language and the architecture.**

**Their assistant, verbatim (same 4-prompt template on every page):**

> ❝ Show me the symptom. I'll separate **transport from behavior**… **channel posture, latency guardrails, and drift signals** before staging a tuning proposal. ❞ *(Realtime)*

- Nav is shaped like **Agora's product taxonomy** — "Channels," "Platform," "Capabilities" — not the user's goal.
- "Conversational AI Engine" — the headline product — is **one toggle among 13+** on a Capabilities page.
- Build surface exposes raw **LLM / ASR / TTS**, raw prompts, env-var names, **raw JSON** ("Raw Properties").

**Who leads: Studio_X** — task language ("Talk to your agent," "Launch a campaign"); nav shaped like the journey.

<!-- Note: Precise claim: "polished surface; the architecture and the words are system-shaped, not user-shaped." More defensible than "AI slop." -->

---

## Scorecard

✓ strong · △ partial · ✗ weak / absent

| Dimension | Studio_X | NG console |
|---|:---:|:---:|
| Time to a working agent | ✓ | △ |
| **Clarity of path to live traffic** | ✓ | ✗ |
| User-centricity (goal vs. internals) | ✓ | ✗ |
| Information hierarchy | ✓ | △ |
| Conversation observability | ✓ | ✗ |
| Visual design-system maturity | ✓ | ✓ |

**Heuristic eval (severity of problems, lower = better):** NG console scores **3–4** on *match-to-real-world*, *visibility of system status*, *recognition-over-recall*, and the *build-first* / *system-shaped-IA* anti-patterns. Visual minimalism scores well (a **2**, not a 4) — the craft is real.

<!-- Note: We score their visuals fairly. The problems cluster in language, status, and the unbuilt revenue path. -->

---

## Market context

**Every serious competitor keeps "go live" inside the product.**

```
              CLEAR PATH TO LIVE
                     ▲
        Studio_X ●   │   ● ElevenLabs (~5 min)
                     │   ● Retell (number-first)
        Vapi ●       │
   ──────────────────┼──────────────────▶  FAST TO FIRST VALUE
                     │   ● LiveKit (fast, code-first)
          NG console ●
       (build OK, but live = DIY on Vercel)
                     ▼
            LIVE PATH UNCLEAR / EXTERNAL
```

The NG console is the **only** design here that sends the customer to a **third party** for the revenue step. That's a **category-level miss**, not a nitpick.

<!-- Note: Competitor times are from prior research (see limitations slide) — directionally the bar is "minutes, in-product." -->

---

## Credit where it's due — what the NG team does better

This is not a clean sweep. **Adopt these:**

- **One "Capabilities" catalog** — every Agora product as a per-project on/off toggle. Cleaner than our Realtime-Services-vs-Extensions split. **Strong adopt.**
- **One-click `.env` copy/download** for local SDK setup. Nice DX. **Adopt.**
- **"Deploy the reference app on Vercel"** is a legit *power-user option* — their mistake is making it the *only* path. **Offer it as one path in Go Live › Code.**
- **Template category filters + per-list search** everywhere. **Adopt.**
- **A persistent, context-aware AI helper** (the concept, not its current copy) — worth A/B-testing vs. our summoned Composer.

> Stating their wins is what makes the rest of this deck credible.

<!-- Note: Lead the Q&A here if the room feels defensive. We're benchmarking, not turf-warring. -->

---

## Re-audit: what we verified vs. what we didn't

**Strengthened with live evidence (this pass):** assistant tested directly (hallucinated telephony); `/telephony` **404** confirmed; accessibility spot-check found **multiple unlabeled icon buttons** (WCAG 4.1.2).

**Honest limitations — what this comparison does *not* yet prove:**

- We saw their **empty beta**, never a **populated, in-use** state. (Asymmetry: their empty vs. our designed-populated.)
- Neither side's in-browser **test call was actually placed** (latency/quality unverified, both).
- We **read** the Vercel path; we didn't time an end-to-end self-host.
- **Competitor times** are from prior research, not freshly benchmarked.
- **One snapshot** of a fast-moving staging beta; **no mobile/responsive** pass either side.

**The counter-argument we considered:** *maybe the NG console is deliberately an admin tool for existing RTC customers who already have traffic.* Even granting that — a wayfinding AI that invents non-existent pages is still a defect, and **Agora's funnel says the problem is activation**, so an admin-first console optimizes the wrong thing.

<!-- Note: This slide IS the re-audit. Showing the seams in our own analysis is what makes leadership trust the verdict. -->

---

## Recommendation

**The decision:** make **activation-first** the organizing principle for the unified console.
Agent pre-provisioned · value shown before build · **"go live" owned in-product** as the spine.

- **Defend & double down (our moat):** live default agent · talk-first · in-product path to live traffic · campaign-as-flagship · conversation observability · ambient free-minutes meter.
- **Adopt from them:** Capabilities catalog · one-click `.env` · Vercel as a *secondary* path · list search.
- **Fix our own gaps:** chart `aria-label`s; remaining placeholder empty states.

**The NG console is a capable *administrative* surface for Agora's product catalog. It is not an activation engine — and its revenue path is unfinished and outsourced.**

<!-- Note: Frame as "principle + best-of-both," not "kill theirs." The principle is the ask. -->

---

## How we prove it — the test plan

Every claim above maps to a method, a metric, and a number. Run both consoles, same tasks, P1 "hustler" developers.

| Claim | Method | Success threshold |
|---|---|---|
| Believe-first beats build-first | Moderated test (5–8/console) | Studio_X ≥ **90%** task success, **≥40% faster** to live |
| Path-to-live is clearer | Same sessions | Studio_X = **0** external tools; NG > 0 (Vercel/GitHub) |
| Plain copy out-activates jargon | First-click / 5-sec test | Studio_X ≥ **80%** correct; gap ≥ **25 pts** |
| Their IA is system-shaped | Tree test (n≥30) | Studio_X ≥ **80%** findability |
| Time-to-first-value | Unmoderated benchmark (n≥50) | Studio_X **p50 ≤ 90 sec** |
| Activation in the wild | Instrumented A/B (shipped 06-17 events) | Pre-registered lift on `deployment_went_live` |

Tasks: *(a)* put an agent on a number · *(b)* launch an outbound campaign · *(c)* find why a call failed.
**(b) and (c) are expected to be non-completable in-product on the NG console — itself a headline result.**

<!-- Note: This converts the deck from opinion to a falsifiable plan. Offer to run the moderated test within two weeks. -->

---

# One sentence for the room

## *Agora only makes money when minutes flow on a live deployment — ours is built spine-first around that moment; theirs sends the customer to Vercel to find it.*

**Appendix & full evidence matrix:** `references/console-comparison-and-defense.md`
**Walkthrough captured live:** staging-ng-console.agora.io · 2026-06-17

<!-- Note: Close here. Then open Q&A on the "what they do better" slide to stay credible. -->
