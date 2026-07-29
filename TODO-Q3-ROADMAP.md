# TODO — Convo AI Q3 Roadmap (future work backlog)

> Source: ClickUp [Q3 Roadmap — Month × Module](https://agora.clickup.com/8556478/v/l/6-901114080734-1) (Product / Convo AI), read in full 2026-07-29.
> Execution mapping: `references/prd-q3-roadmap-execution-2026-07-29.html` — 7 epics (A–G), 4 waves (Jul→Oct 2026).
> Legend: `P0/P1/P2` priority · `YYYY-MM` due month · `→A..G` PRD epic (console-facing) · `[infra]` = backend/internal, no Studio_X surface · `(+N)` unexpanded subtasks in ClickUp.
> Check off items as their **console surface ships in studio_x_2** (infra items: check when Engine/SIP delivers).

## Engine (45)

- [ ] Build capacity monitoring, alerting, and an operator console for allocation and key rotation [infra]
- [ ] Support registering MCP services over the RTM protocol →E
- [ ] Let no-code users configure GET and POST HTTP tools inside voice agents →A
- [ ] Add STT custom dictionaries and keyword boosting for domain vocabulary →A
- [ ] Add configurable retention and automatic PII redaction for agent data →C
- [ ] Add VCR video content understanding module (continuous visual understanding via video frame extraction) [infra]
- [ ] Build end-to-end call observability and recording delivery →C
- [ ] Define Convo AI engine recording behavior [infra]
- [ ] Add recording lifecycle webhooks for NCS recordings →C
- [ ] Keep Studio and Engine vendor support aligned →E
- [ ] Improve availability, capacity, latency, and regional scale [infra]
- [ ] Add append mode to the Think API without interrupting current context [infra]
- [ ] Stabilize public APIs, SDKs, and provider controls [infra]
- [ ] Add active-listening backchannels to agents →A
- [ ] Ship dynamic filler words for production use →A
- [ ] Add configurable background sound to agents →A
- [ ] Run AI-selected traffic replay regression across Engine APIs, regions, and call scenarios [infra]
- [ ] After-session Recover and Rehearsal →B
- [ ] Deliver timestamp-aligned recordings and transcripts in session UI →C
- [ ] Deliver recordings reliably to customer OSS buckets [infra]
- [ ] Expose STT, LLM, and TTS payloads in session logs →C
- [ ] Infer /join feature flags from provided configuration — P1 · 2026-09 [infra]
- [ ] Make RTC token and UID optional in the /join API — P1 · 2026-09 [infra]
- [ ] Define normalized provider and integration controls (+3) →E
- [ ] Prototype a live-call overseer that detects flow drift and nudges the agent back on track — P1 · 2026-10 →B
- [ ] Map each STT, LLM, and TTS provider's last-mile controls and gaps →E
- [ ] Deliver Entel inbound call recordings to NICE — P2 · 2026-10 · Entel [infra]
- [x] Expose component-level latency metrics to developers — P0 · 2026-07 · **DELIVERED (Production-GA)** — console render still open →C
- [ ] Define the TTS pronunciation and voice control schema — P1 · 2026-09 →A
- [ ] [POC] Define the normalized RAG provider contract — P1 · 2026-09 · Hilton →E
- [ ] Show Studio Engine session details and logs beyond telephony — P1 · 2026-07 →C
- [ ] Launch Tier-3 Supernode (owned algorithms, SIP direct connection, regional GPU planning) — P0 · 2026-09 [infra]
- [ ] Decide how the /join API should support string UIDs — P1 · 2026-09 [infra]
- [ ] Decide whether Convo AI should support dynamic code-defined pipelines — P2 · Cresta →F
- [ ] Import agents from Vapi, Bland, Retell, and other competitor platforms →G (import-agent-sheet.tsx exists)
- [ ] Validate the fix for agent creation and update propagation delay — P0 · 2026-07 · IN VERSION [infra]
- [ ] [Engine] Warm Transfer w/ LLM-based in-call summary — P1 · 2026-08 →A
- [ ] Auto-detect errors and failures — P1 · 2026-10 →C
- [ ] Self-service agent concurrency — P1 · 2026-09 →D
- [ ] Let user speak first option — P1 →A
- [ ] Explain undocumented Voice AI fields and concepts — 2026-07 [docs]
- [ ] Tool-based Filler Words — P1 · 2026-09 →A
- [ ] List private features we designed for GK — P0 · 2026-07 [internal]
- [ ] Add text-only agents that use the same Studio pipeline without the voice leg — P2 →F
- [ ] SIP direct connection metering — P0 · 2026-08 · Taiwan Survey →D

## Studio (38)

- [ ] Define the v1 Physical AI builder scope and integrate it into Studio planning — P2 [parking lot]
- [ ] Compare and recommend voices for each use case — P2 →A
- [ ] Route handoffs by skill, condition, and context — P1 · Entel, Concentrix (+2) →A
- [ ] Accelerate Studio agent setup and tuning (+14 — expand in ClickUp) →G
- [ ] Build a closed-loop agent quality system (+4) →B
- [ ] Build simulation and regression testing for voice agents (+4) →B
- [ ] Ship the inbound call-center MVP — P2 (+3) →G
- [ ] Productize agent integrations, knowledge, and channels (+6) →E
- [ ] Release stable Studio APIs aligned with Engine — P1 · 2026-09 →C (developer surface)
- [ ] Build a native and MCP connector marketplace — P2 →E
- [ ] Instrument Studio onboarding and optimize conversion — P1 →G
- [ ] Add MLLM vendors to the managed reseller catalog — P1 (+1) →E
- [ ] Add web crawling and retrieval tuning to knowledge bases — P2 →E
- [ ] Add voice cloning to Studio — P1 →A
- [ ] Detect recurring agent failures and propose or apply fixes — P2 (+1) →B
- [ ] Run agent-to-agent voice simulations at scale — P1 · 2026-08 →B
- [ ] Build a conversational AI Composer for agent configuration — P1 →F (/composer exists)
- [ ] Build a visual graph editor for multi-agent workflows — P1 →F
- [ ] Add agent personality and tone controls — P2 →A
- [ ] Implement Studio managed mode using Engine reseller mode — P0 · 2026-08 →E
- [ ] Let developers purchase and assign phone numbers in Studio — P0 · 2026-09 (+1) →D ⚠️ reverses BYO-SIP-only lock
- [ ] Show live sentiment trends and let operators monitor active calls →C ⚠️ reverses no-live-monitoring lock
- [ ] Define inbound pilot metrics (FCR, answer speed, handle time, escalation, sentiment) →C
- [ ] Sell and allocate concurrency self-serve with capacity-aware safeguards →D
- [ ] Score simulated calls on pronunciation, flow, handoffs, interruptions, and regressions →B
- [ ] Reduce Studio project creation time →G
- [ ] Let humans join simulated voice calls to test edge cases and tone →B
- [ ] Write an observability support-model recommendation (self-serve / white-glove / tiered) [internal]
- [ ] Agent to review production recordings and suggest improvements (e.g. IPA) →B
- [ ] Score production calls on resolution, sentiment, quality, and business outcomes →B
- [ ] Improve default agent templates and model selection — P0 · 2026-07 →G
- [ ] Remove the first-agent Convo AI provisioning delay — P0 · 2026-08 →G
- [ ] [UI] Integrate Couchbase as a RAG provider — P1 · 2026-07 (+2) →E
- [ ] Ability to add AI disclaimer in front of the greeting — P1 →A
- [ ] Studio API Webhook — P0 →C (/developer/webhooks)
- [ ] Replace LLM in structured output to save cost — P1 · 2026-07 · Taiwan Survey [infra]
- [ ] Productize WhatsApp voice — P0 · Moveo →G ⚠️ reverses no-WhatsApp lock
- [ ] Allow voice agents to leave a message after voicemail detection — P1 →A

## SIP (16)

- [ ] Implement SIP-layer transfer, hangup, and transfer-leg tracing for voice-agent calls (+1) →C
- [ ] Standardize SIP architecture and telco operations — P1 (+7) [infra]
- [ ] Define and phase the global SIP architecture migration — P1 [infra]
- [ ] Surface SIP error codes and CPS-limit failures in Studio — P0 · 2026-08 →C
- [ ] Throttle outbound dialing by SIP trunk capacity; queue retries instead of dropping calls — P1 →D
- [ ] Automate SIP trunk and provider onboarding for customer ITSPs and regional telcos — P1 [infra]
- [ ] Build a telco operations dashboard (ASR, NER, PDD; dynamic routing) — P1 [internal]
- [ ] Support DTMF menu entry and inbound queue handling before AI triage — P2 →D
- [ ] [POC] Define a separate SIP video optimization path for AMN — P1 · AMN [infra]
- [ ] Add SIP signaling visual ladder diagrams — P0 · 2026-08 →C
- [ ] [SIP] Warm Transfer w/ LLM-based in-call summary — P1 · 2026-08 →A
- [ ] Phone Number Resell — P0 · 2026-09 →D ⚠️ reverses "Agora sells no numbers"
- [ ] Self-service phone number CPS — P0 · 2026-09 →D
- [ ] Internal tool to support SIP tracing details in logs — P1 [internal]
- [ ] SIP Direct Connect — Audio Quality Optimization — P0 · 2026-08 [infra]
- [ ] Telnyx support from SIP manager — P0 · 2026-07 · Entel [infra]

## Cross-cutting (12)

- [ ] Define Agora Q3 voice-agent strategy (+2) [internal]
- [ ] Define measurable last-mile quality criteria for production voice agents →B
- [ ] Benchmark and reduce end-to-end latency across Engine, audio, SIP, and Supernode placement — P0 · 2026-09 [infra]
- [ ] Package and sell capacity-based SKUs — P0 · 2026-08 (+3) →D
- [ ] Scope all REST APIs to project app IDs [infra]
- [ ] Improve Voice AI docs and developer help (+3) [docs]
- [ ] Remove deprecated fields from Voice AI docs [docs]
- [ ] Add an AI assistant to the documentation center [docs]
- [ ] Build deterministic multi-agent workflows (+2) →F
- [ ] Metering and SKU for MLLM — P1 · 2026-10 →D
- [ ] Couchbase-powered experience with "concierge" text & voice — P1 →E
- [ ] Enable Couchbase for Couchbase POC customers (use Engine & integrate) — P1 →E
