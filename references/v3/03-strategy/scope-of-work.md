# v3 Studio · scope of work (draft for Vineet and Samyak, 25 Sep morning)

Four workstreams in the owner's priority order. Every item is designed and built inside the live Console (existing
design system, `ng-console/docs/design/DESIGN.md`), on branch `design/v3`, reviewed on a live link. Days are working
days of design + prototype time, **including** the review calls listed. Calendar assumes a start on Fri 25 Sep.

## Summary

| # | Workstream | What you get | Days | Reviews | Ready for review |
|---|---|---|---|---|---|
| P0 | Agent builder (Concept A, productised) | Create with type · presets + Custom + logos · one Advanced panel with every setting · prompt-first · unified context · Deploy + Go live per type with runs, schedule, calling windows, data policy · inline secrets · delight pass | 3 | 2 | Tue 29 Sep |
| P1 | Agent page | Live view · Analytics tab (time-synced) · Logs & diagnostics tab + error badge · Talk to agent · agents-list cues | 3 | 2 | Fri 2 Oct |
| P2 | Session history | One list for every session · query + facets + time · agent backlink · runs page · session detail cards for RTC, telephony, WhatsApp (intent) · zero-retention and ephemeral rows · full screen · deep links | 4 | 3 | Thu 8 Oct |
| P3 | v3 mapping | Secrets page · Transports page · Numbers inbound routing + call policy · parity fixes from the API diff · terminology sweep | 3 | 2 | Tue 13 Oct |
| | **Total** | | **13** | **9** | |

**Compressed option** (Vineet's hope: v1 of every frame by end of month): P0 as above; P1, P2, P3 as first-pass frames
in parallel by **Fri 2 Oct** (grey, real data shapes, no delight pass), then refine P2 and P3 in the two polish weeks
before launch. Costs: one extra review per stream, and P2's modality cards stay at "intent" until the log stream is
confirmed.

## P0 · Agent builder (3 days, 2 reviews)

| Item | Req # | Days |
|---|---|---|
| Create agent: name + deployment type (inbound, batch, code) in one step | 3, 4 | 0.25 |
| Voice & models in 3–4 lines: Lowest latency (default) · Balanced · Custom, logo stack per preset, voice dropdown with preview | 1, 2, 37, 39 | 0.5 |
| One Advanced panel restoring every pipeline setting (speech recognition, language model, voice, turn-taking, silence, fallback, filler words), spec defaults | 38 | 0.5 |
| Prompt first; greeting + failure message behind one door; one context list (knowledge, MCP, tools) with icons and tooltips | 5, 9, 10, 11 | 0.25 |
| Test section kept between prompt and deploy | 40, 52 | — |
| Deploy + Go live as one tabbed area per type: inbound (number, call policy, end-call, transfer), batch (runs with contact list, schedule + calling windows, pacing, call policy), code (session snippet) · data policy for all | 6, 7, 46, 48 | 0.75 |
| Keys pasted inline create a secret set silently; "saved, hidden" state | 12, 45 | 0.25 |
| Analysis definition (was structured output) on the agent for all types | 15, 44 | 0.25 |
| Delight pass (logos, motion, empty states) + review fixes | 39 | 0.5 |

## P1 · Agent page (3 days, 2 reviews)

| Item | Req # | Days |
|---|---|---|
| Agent header: live status, sessions today, "2 errors · 3 warnings" badge, Edit agent | 16, 29 | 0.25 |
| Live view: sessions running now, talk-to-agent bubble | 19, 49 | 0.5 |
| Analytics tab: one time range + filters driving tiles, trend, latency legs, analysis results; every tile drills to sessions | 17, 27, 30 | 1 |
| Logs & diagnostics tab: error-level log list grouped by cause, severity, affected sessions, empty and no-stream states | 27, 28 | 0.75 |
| Agents list cues: sessions 7 d, error dot, last call | 18 | 0.25 |
| Runs panel for batch agents (status, progress, pause/resume/cancel) | 47 | 0.25 |

## P2 · Session history (4 days, 3 reviews)

| Item | Req # | Days |
|---|---|---|
| One list: every session, agent column with backlink, direction × modality badges, status, duration, cost, analysis columns | 22, 23, 25 | 0.75 |
| Query model: search + facet chips + saved views; time range shared with the agent page | 30, 31 | 0.75 |
| Session detail: common blocks (timeline, transcript, analysis, events, logs, latency) + modality blocks for RTC, telephony (SIP), WhatsApp (intent only) | 24 | 1 |
| Full screen, share link, download; run page with its sessions | 42, 43, 47 | 0.5 |
| Zero-retention rows, ephemeral rows, first-run and no-data states | 32, 41 | 0.5 |
| Review fixes | | 0.5 |

## P3 · v3 mapping (3 days, 2 reviews)

| Item | Req # | Days |
|---|---|---|
| Secrets page: sets, write-only keys, used-by agents, delete rules, created-by-agent sets | 34, 45 | 0.75 |
| Transports page (internal name): phone numbers now, slot for WhatsApp and future transports | 33 | 0.5 |
| Numbers: inbound agent + inbound call policy | 48 | 0.25 |
| Parity fixes from the API diff for Create an agent and Start a session | 36 | 0.75 |
| Terminology sweep against the spec (pipeline, instructions, analysis, run/campaign) | 13, 14 | 0.25 |
| Review fixes | | 0.5 |

## Decisions needed from you to hold these dates

1. **Session analytics at launch.** P1 and P2 show latency, analysis results, transcripts and events. The v3 spec defers
   all of them. Which source feeds the Console on day one (v2 analytics pipeline, RTM stream, or empty with a
   "coming soon" state)?
2. **Error logs.** Which RTM/NCS log types exist per session, and their shape (Vineet took this).
3. **Data policy for inbound and batch.** The API has `data_policy` only on session create. Add it to Number.inbound and
   Campaign, or a project/agent default?
4. **Run vs campaign.** The API Campaign is one run. Is there a grouping above it, and what is each called in the UI?
5. **Secret deletion rule** and **pricing copy** (5¢ managed is not public).
6. **Knowledge base**: in v3 or not? It is not in the spec.
