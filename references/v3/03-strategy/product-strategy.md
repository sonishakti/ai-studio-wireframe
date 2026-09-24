# v3 Studio · product strategy and information architecture

## 1. What we are building

Studio v3 ships with the v3 API and SuperNode in mid-October (US East). The API collapses the product to three
entities, Secret, Agent and Session, and puts every deployment in the session's transport. The Console has to
become the same shape, so that **anything done through the API shows up in Studio and anything in Studio can be
done through the API.**

Four jobs, one object graph:

| Pillar | User question | Home | Object |
|---|---|---|---|
| **Build** | "Make an agent that answers the way I want." | Agent › Configure | Agent (+ its pipeline, prompt, context, analysis definition) |
| **Operate** | "Is my agent working in the real world right now?" | Agent › Overview (Analytics · Logs) | Agent + its sessions, aggregated |
| **Observe** | "What happened on this one call, and why?" | Session history › Session | Session (and Run for batch) |
| **Connect** | "What does it talk through, with which keys, keeping what data?" | Transports · Secrets · Go live | Number, Campaign, Secret set, data policy |

The loop the four pillars close: **build → go live → watch → find the bad call → change → prove it helped.** Today's
Console breaks the loop in two places: the agent page shows configuration only, and call and session history are two
pages that cannot say which agent took a call. v3 closes both.

## 2. Principles (from the 24 Sep calls, binding)

1. **Aggregate on the agent, drill down in history.** No totals on session history; no single-call detail on the agent.
2. **Optimise the hot path.** Presets and defaults first; everything else in one Advanced panel with good defaults.
3. **UI = API.** Same entities, same words, 1:1 for Create an agent and Start a session.
4. **Every number opens the sessions behind it.** No vanity metrics.
5. **Every object has a URL.** Agent, run, session: deep-linkable and shareable.
6. **Honest about missing data.** Zero-retention and ephemeral sessions are listed with what we know (time, cost) and
   say plainly what we don't keep.
7. **Existing UI, not a new UI.** Everything in the live Console's design system (DESIGN.md), then a delight pass.

## 3. Information architecture

```
Sidebar (existing Console shell)
├── Agents ─────────────── list (+ sessions 7d, error dot, last call)
│    └── Agent
│         ├── Overview      live now · Analytics tab · Logs & diagnostics tab · Talk to agent · runs (batch)
│         ├── Configure     Voice & models · Prompt & context · Test · Deploy & go live (tabs per type) · Analysis
│         └── Sessions      = Session history pre-filtered to this agent (same component)
├── Session history ───── every session; query + facets + time; agent column ↩ backlink
│    ├── Run (batch)       its sessions, progress, pause/resume/cancel
│    └── Session           modality card; full screen; share; download
├── Transports ─────────── phone numbers (inbound agent + call policy); future WhatsApp etc.  [UI label TBD]
├── Secrets ────────────── sets, keys (write-only), used by
└── Existing platform pages (projects, usage, billing, RTC …) unchanged in v3
```

Direction × modality, the two axes Vineet named:

| | RTC | Telephony | WhatsApp (later) |
|---|---|---|---|
| **Inbound** | web widget / app joins | number rings the agent | message or call to the business number |
| **Outbound** | — | batch run, one contact per session | template-initiated |
| **Code** | `POST /sessions` rtc | `POST /sessions` telephony (one call) | via transport when added |

Each filled cell is a session-detail variant: common blocks (timeline, transcript, analysis, events, logs, latency)
plus a modality block (RTC: channel, uid, subscribers, audio scenario; telephony: from/to, SIP legs, ring and call
durations, voicemail, transfer; WhatsApp: intent only).

## 4. The hierarchy for batch

The owner's model is **Campaign › Run › Session**. The API has **Campaign** = one execution and nothing above it. So:

- **Now:** UI shows **Run** for the API campaign (one list, one schedule, one set of counts). A rerun = a new API
  campaign with the same agent and a new list.
- **Grouping:** runs of the same agent are grouped on the agent page and filterable in history. A named Campaign above
  runs needs an API field (`batch_id` or labels) to stay 1:1; raise it as a parity ask before we draw it.
- **Monitoring at every level:** agent (all sessions), run (its sessions), session (one call). Campaign-level rollups
  arrive with the grouping entity.

## 5. Build: Concept A, productised

Concept A (three tabs: Overview · Agent · Deploy) was recommended and accepted as the base. What it lost and must
regain, and what it adds:

- **Keep:** fewest controls on the hot path; type fixed at creation; prompt-first; one context list; Deploy = Go live.
- **Regain:** every advanced setting. A's Advanced sheet holds four switches; the live builder had full ASR, LLM, TTS,
  turn-taking and silence configuration. They return in **one Advanced panel**, grouped, with spec defaults.
- **Add:** Custom as the third option; vendor logos on presets and in Custom; voice dropdown with preview; data policy,
  calling windows, inbound call policy, end-call and transfer in Go live; inline secrets; Analysis naming; delight pass.

## 6. Operate: the agent page

Two tabs under one header and one time range:

- **Analytics**: sessions, success (from the agent's analysis definition), duration, latency by leg, analysis results
  over time, the agent's runs. Filters (time, direction, modality, run, analysis value) recompute every tile.
- **Logs & diagnostics**: error-level events from the RTM stream grouped by cause ("TTS failed · out of credits · 6
  sessions"), each opening the sessions it hit. Header badge: "2 errors · 3 warnings".
- **Live**: sessions running now and a Talk to agent bubble for replaying a surprising call on the spot.

## 7. Observe: session history

One page for every session. Query by time, agent, direction, modality, status, run, analysis values, errors and free
text; saved views; the list never aggregates. Opening a session shows its modality card in a side panel with a
full-screen button next to Download, and a share link. Ephemeral sessions read "Ephemeral" in the agent column with no
link. Zero-retention sessions show time, duration and cost with a plain "Not kept: this agent keeps no call data" in
place of content.

## 8. Connect

- **Secrets** replace credentials: named sets of write-only keys, "used by" agents, sets auto-created from the builder.
- **Transports** (internal name) hold phone numbers today and scale by type later. UI label to be chosen; "transport
  identifier" never appears in the UI.
- **Data policy**: 30 days or none, chosen at Go live because inbound and batch sessions have no API call to carry it.

## 9. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Session analytics deferred past launch | Agent page and session detail have little to show on day one | Design the no-data state as a first-class state; agree the day-one source (v2 pipeline or empty) now |
| API still moving (two snapshots on one day) | Designs drift from the contract | Re-download the spec before each review; parity diff in the KB |
| Run vs campaign naming | Breaks UI = API | One decision call with the API team this week |
| Four streams, ~13 days, 3 weeks to launch | Late monitoring | Compressed option in the SOW; P2 frames first-pass by 2 Oct |
