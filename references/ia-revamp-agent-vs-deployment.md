# IA Revamp — Agent (Stack + Persona) vs. Deployment (Prompt + Vars)

> **Status:** Proposal for sign-off. Authored 2026-06-11. Blueprint only — no screens
> built yet. Supersedes parts of `CLAUDE.md` (see §9 reversals). Source decisions:
> user direction 2026-06-11 + Fin.ai research + Figma `Agora-Studio-X` hero frames.

---

## 1. Problem & target model

### The problem

Studio_X is a **linear pipeline** — Build Agent → Configure Integrations → Deploy →
Monitor (Figma `02_Build_Agents` → `03_Configure_Integrations` → `04_Deploy`). Three
structural faults:

1. **The agent editor is overloaded.** One surface
   (`agents/[id]/edit/page.tsx`) bundles the model stack (LLM/ASR/TTS), the *system
   prompt*, dynamic `{{variables}}`, Advanced, and Actions. The prompt helper text says
   *"Variable names should match column names in your CSV file"* — but the CSV is only
   uploaded at **deploy** time. Variables are **declared in the builder but valued at
   deploy** → the flow runs backwards.
2. **The template picker is a persistent fork.** Choosing an agent type up front reads
   as a locked-in commitment and a decision-friction point before any value is seen.
3. **Deploy is an afterthought, organized by channel.** It is the *last* pipeline step,
   tabbed by **channel** (Phone Numbers · WhatsApp · Outbound · Web Widget) instead of
   by **intent** (inbound vs. outbound). Deployment channels are a priority, not an
   afterthought — they should be visible up front.

### The target model (Fin.ai-informed)

Intercom's **Fin** is *one agent*: **Knowledge + Persona + Guidance**, all reusable.
Deploying it to channels (chat, email, voice) is a **separate** step, and Guidance cards
even carry a per-channel selector. We adopt the same separation.

Sources: [Fin AI Agent explained](https://www.intercom.com/help/en/articles/7120684-fin-ai-agent-explained) ·
[Provide Fin with guidance](https://www.intercom.com/help/en/articles/10210126-provide-fin-ai-agent-with-specific-guidance) ·
[Choose channels to deploy Fin](https://www.intercom.com/help/en/articles/13377077-choose-channels-to-deploy-fin-ai-agent).

The agent splits into **two parts**:

| | **Part 1 — Agent (the Stack)** | **Part 2 — Deployment** |
|---|---|---|
| **Owns** | Personality/tone, language, brand, model stack (LLM/ASR/TTS/modality), knowledge base, integrations/actions | The **whole prompt**, custom code, dynamic variables |
| **Nature** | Reusable, duplicable, "universal Agora agent" | Per-environment / per-customer |
| **Configured** | **Speed-vs-cost preset first**, then drill into individual vendors | Authored at the deployment surface, at launch |
| **Variables** | none | **auto-detected from the uploaded CSV** columns, substituted per row |

One default **Agora agent** is usable instantly; "change personality" is a light tweak,
never a template gate. **No prompt and no variables live on the agent.**

**Create flow is agent-first with the deploy target chosen up front:** open the agent
builder → pick **Inbound / Outbound** at the top → tune Stack + Persona → continue into
the matching deployment surface to author prompt/code/vars → launch.

**One agent ↔ one channel.** Multichannel orchestration is dropped as impractical.

---

## 2. New sitemap / route tree

```
Composer                         /composer

BUILD
  Agents                         /agents                     (list — instant-start, not a gate)
    Agent builder                /agents/[id]/edit           (tabs: Persona · Stack · Knowledge · Actions
                                                              + Deploy-target picker in header)
    Test                         /agents/[id]/test
  Integrations                   /integrations               (Knowledge · MCP · Connectors)
  Deploy                         /deploy                     (Overview)
    Inbound                      /deploy/inbound             (answer; 1 agent ↔ 1 number/channel)  ◀ NEW
      Inbound deployment         /deploy/inbound/[id]
    Batch Calls                  /deploy/batch-calls         (outbound CSV dialing)               ◀ RENAME of Campaigns
      Batch deployment           /deploy/batch-calls/[id]    (tabs: Overview · Prompt · Variables · Monitor · Calls)
      New batch                  /deploy/batch-calls/new
    Phone Numbers                /deploy/phone-numbers       (first-class; was /phone-numbers)
      Number detail              /deploy/phone-numbers/[id]
    Embed / Code                 /deploy/embed               (folds Web Widget + API & SDK)

OBSERVE
  Monitor                        /monitor                    (Overview · Call History · Chat History · Sessions)
    Call History                 /calls
    Chat History                 /chats
    Sessions                     /sessions

MANAGE
  Project Settings               /project/settings
  Realtime Services              /realtime-services
  Vendor Credentials             /project/vendor-credentials
```

### Old → new mapping (every current route resolved)

| Current route | New destination | Note |
|---|---|---|
| `/agents` | `/agents` | gallery softened to instant-start |
| `/agents/[id]/edit` | `/agents/[id]/edit` | retab Persona·Stack·Knowledge·Actions; prompt/vars removed |
| `/agents/[id]/test` | `/agents/[id]/test` | unchanged |
| `/integrations` | `/integrations` | unchanged |
| `/deploy` | `/deploy` | Overview |
| — | `/deploy/inbound` (+`/[id]`) | **NEW** inbound surface |
| `/campaigns` | `/deploy/batch-calls` | **rename** |
| `/campaigns/[id]` | `/deploy/batch-calls/[id]` | prompt/vars authoring added here |
| `/campaigns/new` | `/deploy/batch-calls/new` | reached via create flow |
| `/campaigns/calls` | `/deploy/batch-calls/[id]` › Calls tab | fold |
| `/campaigns/phone-numbers`, `/campaigns/phone-numbers/[id]` | `/deploy/phone-numbers` | legacy dup → redirect |
| `/phone-numbers`, `/phone-numbers/[id]` | `/deploy/phone-numbers` (+`/[id]`) | moved under Deploy |
| `/deploy/widget` | `/deploy/embed` › Widget | fold |
| `/deploy/api` | `/deploy/embed` › API & SDK | fold |
| `/deploy/telephony` `/deploy/sms` `/deploy/whatsapp` `/deploy/slack` | create flow (channel chosen inside Inbound/Batch) | redirect |
| `/telephony/campaigns`, `/telephony/campaigns/create` | `/deploy/batch-calls` | legacy dup → redirect |
| `/telephony/phone-numbers` | `/deploy/phone-numbers` | legacy dup → redirect |
| `/session-history` | `/sessions` | legacy dup → redirect |
| `/usage` | `/billing/usage` | legacy dup → redirect |
| `/monitor` `/calls` `/chats` `/sessions` | unchanged | Monitor hub |
| `/project/**`, `/realtime-services`, `/billing/**`, `/extensions/**`, `/developer/**`, `/help/**`, `/composer`, `/projects`, `/preferences`, `/notifications` | unchanged | out of scope |

---

## 3. Sidebar IA

No group changes — BUILD · OBSERVE · MANAGE stay. Only **Deploy** is retabbed from
channel-organized to **intent-organized**, and Phone Numbers folds in as a Deploy tab.

```
BUILD     Agents · Integrations · Deploy
                                  └─ Overview · Inbound · Batch Calls · Phone Numbers · Embed/Code
OBSERVE   Monitor
MANAGE    Project Settings · Realtime Services · Vendor Credentials
```

`app-sidebar.tsx` active-state: `/deploy` lights for `/deploy/*` (now including
`/deploy/inbound`, `/deploy/batch-calls`, `/deploy/phone-numbers`, `/deploy/embed`).

---

## 4. Agent data model (Stack + Persona)

Agent builder tabs become **Persona · Stack · Knowledge · Actions** (Prompt + Variables
tabs removed; greeting/failure move to the deployment since they use `{{vars}}`).

```ts
interface Agent {
  id: string
  name: string
  status: "live" | "draft" | "paused"

  // — Persona (the "change personality" tweak; instant-start default) —
  persona: {
    personality: string          // e.g. "Warm, concise, professional"
    tone: string                 // tone-of-voice preset (Fin-style)
    language: string             // e.g. "en-US"
    brand?: string               // brand voice / company name
  }

  // — Stack: speed-vs-cost FIRST, then per-vendor drill-down —
  stack: {
    preset: "fastest" | "balanced" | "cheapest"   // sets vendor defaults
    modality: "voice" | "voice+video" | "chat"
    llm:  { vendor: string; model: string }        // overridable
    asr:  { vendor: string; model: string }
    tts:  { vendor: string; voice: string }
    // preset picks these; user may override any individually
  }

  knowledge: string[]            // KB ids attached (from Integrations)
  actions:   string[]            // MCP/tool/connector ids attached
}
```

**Speed/cost preset behavior:** picking `fastest`/`balanced`/`cheapest` writes sensible
LLM/ASR/TTS defaults; the per-vendor fields stay editable for users who want to drill in
(language, ASR vendor, LLM vendor, TTS voice). No prompt anywhere on this object.

---

## 5. Deployment data model

A deployment is **one agent on one channel**, and it **owns the prompt + code + vars**.
`channels: CampaignChannel[]` collapses to a single `channel`.

```ts
type DeploymentKind = "inbound" | "batch"      // batch = outbound CSV dialing

interface Deployment {
  id: string
  name: string
  kind: DeploymentKind
  channel: Channel               // ONE channel (telephony | whatsapp | sms | web)
  agentId: string                // the reusable Stack+Persona agent
  status: DeploymentStatus

  // — authored here, per environment —
  prompt: string                 // the WHOLE system prompt (was on the agent)
  greeting?: string              // first message (uses {{vars}})
  failure?: string               // fallback line
  customCode?: string            // per-deployment hooks

  // — batch (outbound) only —
  contacts?: {
    fileName: string
    rowCount: number
    columns: string[]            // CSV headers → become the available {{vars}}
  }
  // inbound only
  number?: string                // the 1:1 number this answers on
}
```

**Dynamic variables, fixed flow:** there is **no build-time declaration**. At the Batch
Calls deployment you upload a CSV → its **column headers become the available `{{vars}}`**
→ reference them in the prompt/greeting → each is **substituted per row** at dial time.
This removes the "declared in builder, valued at deploy" inversion entirely.

---

## 6. Deploy hub

`deploy-nav.tsx` tabs: **Overview · Inbound · Batch Calls · Phone Numbers · Embed/Code.**

- **Overview** — entry; pick an agent + intent, or jump to a recent deployment.
- **Inbound** — answering deployments; **1 agent ↔ 1 number/channel**; owns prompt/code/vars.
- **Batch Calls** — outbound CSV dialing (the renamed Campaigns); CSV → auto `{{vars}}`.
- **Phone Numbers** — first-class number inventory (SIP, routing, lock states) — moved
  under Deploy, behavior unchanged.
- **Embed/Code** — folds today's Web Widget (`/deploy/widget`) + API & SDK
  (`/deploy/api`) into one "put the agent somewhere non-telephony" tab.

---

## 7. Create flow (agent-first, deploy target up front)

```
┌─ New Agent ──────────────────────────────────────────────┐
│  Header:  [ Deploy target: ▾ Inbound | Outbound ]  ◀ chosen FIRST
│                                                          │
│  1. Persona   — personality · tone · language · brand    │  reusable
│  2. Stack     — [Fastest|Balanced|Cheapest] ▸ vendors    │  agent
│  3. Knowledge — attach KB                                 │
│  4. Actions   — attach MCP / tools                        │
│                                                          │
│            [ Continue to deployment → ]                  │
└──────────────────────────────────────────────────────────┘
                         │
        target = Inbound │ target = Outbound
                         ▼
┌─ Deployment (Inbound or Batch Calls) ────────────────────┐
│  • Prompt      — the whole system prompt                 │  per-
│  • Custom code — optional hooks                          │  deployment
│  • Variables   — Inbound: n/a · Batch: upload CSV →      │
│                  columns become {{vars}}                 │
│  • Channel cfg — Inbound: 1 number · Batch: number pool  │
│                                                          │
│                  [ Launch ]                              │
└──────────────────────────────────────────────────────────┘
```

The deploy target is decided at the top of the builder (so channel is never an
afterthought), but the **prompt/code/vars are authored in the deployment surface** the
target points to — keeping the agent purely reusable.

---

## 8. Migration map (file-level — for the build phase, not done here)

- `studio-x/app/(dashboard)/agents/[id]/edit/page.tsx` — drop Prompt + Variables tabs;
  retab to **Persona · Stack · Knowledge · Actions**; add the Deploy-target picker in the
  header; implement the speed/cost preset → vendor drill-down.
- `studio-x/app/(dashboard)/agents/page.tsx` — soften the template gallery into
  "start instantly / tweak persona," not a persistent gate.
- `studio-x/components/deploy-nav.tsx` — retab to **Inbound · Batch Calls · Phone
  Numbers · Embed/Code**.
- `studio-x/app/(dashboard)/campaigns/**` + `components/campaign-wizard.tsx` — move to
  `/deploy/batch-calls`; relocate prompt/code/var authoring here; CSV-driven `{{var}}`
  auto-detection; collapse the 3-step wizard's channel step (one channel).
- New `studio-x/app/(dashboard)/deploy/inbound/**` — inbound deployment surface.
- New `studio-x/app/(dashboard)/deploy/embed/**` — folds `widget` + `api`.
- `studio-x/lib/campaign-data.ts` — `channels: CampaignChannel[]` → single `channel`;
  `Campaign` → `Deployment` (gains prompt/code/vars); add `Agent` with `persona`+`stack`.
- `studio-x/components/app-sidebar.tsx` — Deploy active-state covers new sub-routes;
  remove `/phone-numbers` + `/campaigns` top-level coupling.
- **Redirects:** `/campaigns/*` → `/deploy/batch-calls/*`; `/phone-numbers/*` →
  `/deploy/phone-numbers/*`; `/deploy/{telephony,sms,whatsapp,slack}` → create flow;
  `/telephony/*` → corresponding Deploy routes; `/session-history` → `/sessions`;
  `/usage` → `/billing/usage`.

---

## 9. Decision log — reversals from `CLAUDE.md`

All four per **explicit user direction, 2026-06-11**. Logged in `LEARNINGS.md` §20.

| # | Was locked | Now | Why |
|---|---|---|---|
| 1 | Multichannel is the architecture (`channels[]`) | **One agent ↔ one channel** | Multichannel orchestration proved impractical; one-agent-one-channel is realistic. |
| 2 | "Campaign = the deployment surface" | **Campaigns → Batch Calls** (outbound) | "Campaign" specifically means outgoing batch calls; inbound is a peer surface. |
| 3 | Deploy = one hub organized around channels | **Deploy = intent-first** (Inbound/Outbound), surfaced up front | Channels are a priority, not the last pipeline step. |
| 4 | Prompt lives in the agent editor | **Prompt + vars live in the deployment** | Prompt/vars are per-environment; the agent stays a reusable Stack+Persona. |

---

## 10. Open questions for the build phase

1. **Speed/cost preset specifics** — exact vendor defaults per `fastest`/`balanced`/
   `cheapest`, and which vendors are in the catalog. Needs an Agora-docs-grounded list.
2. **Inbound prompt reuse** — can one prompt be shared across multiple inbound numbers,
   or is it strictly 1 prompt per deployment? (Affects whether Deployment.prompt can be
   templated.)
3. **Agent ↔ Deployment cardinality** — can the same reusable agent back several
   deployments simultaneously (expected yes)? Confirm the backlink UI ("Deployed in").
4. **Greeting/failure ownership** — moved to Deployment here because they use `{{vars}}`;
   confirm no per-agent default greeting is wanted.
5. **Realtime Services placement** (existing open tension #1) — still in MANAGE; not
   touched by this revamp. Flag if it should move to BUILD as a peer of Agents.
6. **Composer's role** — does the agent-first create flow start from Composer, from
   `/agents`, or both?
```
