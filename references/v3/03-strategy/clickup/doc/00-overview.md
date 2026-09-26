# Studio v3 PRD

Launch **Fri 16 Oct 2026**. Sam is a developer. Every row is a job Sam does; the goal is the number that proves it. Boards: [1. V3](https://app.clickup.com/8556478/v/l/li/901115453665) · [2. Future Sprints](https://app.clickup.com/8556478/v/l/li/901115453666) · live sheet: https://claude.ai/artifact/6YZCRsJvpoBthj4fnm9XAb

## Features, for tech and backend

What each feature builds, the API it touches, and when its design is ready (the last lock ETA of its job steps).

| Feature | Builds | API surface | Blocked by, asks | Design ready |
| --- | --- | --- | --- | --- |
| **F1 · Create an agent and choose the deployment type** | P0.1 · P0.14 · P0.15 | POST, PATCH, DELETE /agents; labels studio_deployment, studio_preset, studio_source | Agent versions are missing (P0.14); whether DELETE is refused while a number or run references the agent is unconfirmed (P0.15) | **Tue 29 Sep** |
| **F2 · Presets, voice and models** | P0.2 · P0.3 | Agent asr, llm, tts, mllm, avatar; turn_detection, silence_config, filler_words, failure_message | Region, price and model lists come from Studio, not from the spec | **Tue 29 Sep** |
| **F3 · Prompt, greeting and failure messages** | P0.4 | Agent instructions, greeting {mode, on, delay_ms, text}, llm.failure_message, variables | — | **Tue 29 Sep** |
| **F4 · Integrations: MCP servers, tools, knowledge base** | P0.5 · P3.4 | llm.mcp_servers[], llm.tools[], mllm.mcp_servers[]; headers write-only | Knowledge base not in the spec (decision 3); no project-level integration object | **Fri 9 Oct** |
| **F5 · BYOK and secrets** | P0.6 · P3.1 | POST, GET, PUT, DELETE /secrets; credential.mode byok or managed; $secrets.<set>.<key> | PUT replaces the whole set; no used_by (decision 12); no key check | **Thu 8 Oct** |
| **F6 · Test panel, readiness and telemetry hygiene** | P0.7 · P0.8 · P0.12 · P0.13 | POST /sessions (rtc test) with client_reference; data_policy on SessionCreate | purpose field (decision 4); client_reference never returned; data_policy missing on Number and Campaign (decision 6); gateway emitter G1 | **Thu 1 Oct** |
| **F7 · Go live: inbound numbers** | P0.9 · P3.2 · P3.3 | POST, GET, PATCH, DELETE /numbers; inbound {agent, call_policy, transfer}; sip_trunk | No number purchase, status or trunk health; data_policy missing on inbound | **Fri 9 Oct** |
| **F8 · Go live: batch runs** | P0.10 · P2.5 | POST, GET /campaigns; :pause, :resume, :cancel; contacts, schedule.days, pacing, voicemail | Sessions by run (G4, G12); contacts endpoint; pause reason (decision 16) | **Tue 6 Oct** |
| **F9 · Go live: code sessions and API parity** | P0.11 · P3.5 | POST /sessions {agent_id, transport rtc or telephony, lifecycle, data_policy}; /sessions/ephemeral; 201 leaf fields | purpose field; 25 UI-only items to cut or raise (decision 27) | **Mon 12 Oct** |
| **F10 · Agent monitoring: agent page, errors and logs** | P1.1 · P1.2 · P1.3 · P1.4 · P1.5 · P1.6 · P1.8 · P1.10 · P1.11 | GET /agents, /agents/{id}; GET /sessions with a saved agent id and filter; error stream; turns and logs | G1 gateway emitter, G2 session_ended, G4 and G12 saved agent id and filter, G11 error stream, G13 turns and logs | **Mon 5 Oct** |
| **F11 · Analysis: what a good session is** | P1.9 | Agent structured_output | Results deferred (G13) | **Mon 5 Oct** |
| **F12 · Billing, free minutes and honest rows** | P1.7 · P2.6 | Billing service outside the v3 API; billable_seconds, cost and data_policy on session rows | G9 billing emitter; G5 origin and retention on list rows | **Wed 7 Oct** |
| **F13 · Session history and detail** | P2.1 · P2.2 · P2.3 · P2.4 · P2.7 · P2.8 · P2.9 · P2.10 | GET /sessions with filters, GET /sessions/{id}; turns, logs, recording | G4, G5, G12 list fields and filters; G13 turns and logs; G14 contact | **Thu 8 Oct** |
| **F14 · One vocabulary in Console and docs** | P3.6 | Every endpoint name and field label | Two UI names differ by choice: Analysis, run | **Mon 12 Oct** |

## The four jobs

### P0 Agent config
**Job:** Create an agent people outside the team can talk to
**Situation:** The team needs a voice agent for a real use case; Sam has an Agora project and no agent yet.
**Sam wants to:** create an agent that people outside the team can talk to, in one sitting
**So that:** the agent answers outside people and Sam feels sure enough to put the agent in front of them
**Done looks like:** An agent Sam heard answer in a test is answering people outside the team, set up in one sitting, and Sam feels sure enough of it to put it in front of them. P1.8 is the step that proves this.
**Goal:** Median time to first heard answer under 3 minutes.

### P1 Monitoring · Agents
**Job:** Keep every agent working for people outside the team
**Situation:** Agents are live and people outside the team talk to them every day.
**Sam wants to:** know how each agent is doing and fix what fails
**So that:** customers never notice a failure first
**Done looks like:** Sam spots the agent in trouble, reaches the cause in under a minute, removes it and sees the error stop, without losing place.
**Goal:** Median path from a new error to its cause is at most 4 steps and under a minute.

### P2 Monitoring · Sessions
**Job:** Find out what happened in a session and why
**Situation:** A ticket, a number, a time or a hunch points at one session or a set of sessions.
**Sam wants to:** get to the right session and see what happened and why
**So that:** the cause is fixed once and the proof can be shared
**Done looks like:** Sam gets from any clue to the right session or run, explains what happened, and knows what to change.
**Goal:** Median time to the right session under 60 seconds.

### P3 v3 mapping
**Job:** Look after what all the team's agents share
**Situation:** Several agents share provider keys, numbers and integrations, set up by hand or from code.
**Sam wants to:** manage what the agents share, by hand or from code
**So that:** a change lands the same way everywhere and nothing breaks silently
**Done looks like:** Every agent, number, secret and integration Sam makes by API opens, changes and saves the same in the Console, under the same names.
**Goal:** All 201 API settings have a Console home or a reason, and 20 of 20 agents save unchanged.

## How to read the rows

Each job step page lists: job, situation, what Sam wants and why; the happy path (what Sam does) and the rainy paths (what happens when it goes wrong); the goal and how it is measured; the telemetry to configure; the research; the deliverables. Status on the board: To-do, In progress, Pending Review, Delivered (locked: Figma frozen, commit recorded). Start date = design ETA, due date = lock ETA.