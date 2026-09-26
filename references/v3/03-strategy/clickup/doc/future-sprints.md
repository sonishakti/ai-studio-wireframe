# Future Sprints

The 28 roadmap features for after the v3 launch, each as a job for Sam. Board: 2. Future Sprints.

## 01 · Voice picker & recommendations
**Job:** Pick a voice that fits the use case
**Situation:** Sam is setting up an agent and the voice catalog has hundreds of voices.
**Sam wants to:** pick a voice that fits the use case, or clone one
**So that:** Sam does not audition the whole catalog and the agent sounds right for its callers
**What it does:** Compare/recommend voices per use case; voice cloning + more providers + cloned-voice governance; multiple voices per agent.
ClickUp card: https://app.clickup.com/t/868m0medx

## 02 · Turn-taking & listening
**Job:** Make the agent interrupt, wait and listen like a person
**Situation:** Callers talk over the agent or wait too long through silences.
**Sam wants to:** tune when the agent starts, stops and backchannels
**So that:** the conversation feels like talking to a person
**What it does:** Semantic SOS public, Semantic EOS default 240 ms, preemptive response controls, per-agent turn-taking/backchannel, active-listening backchannels, user-first opening, dynamic SIP speaker locking, shared behavior-control contract.
ClickUp card: https://app.clickup.com/t/868m0mef4

## 03 · Recognition & failover
**Job:** Be understood in the caller's language, accent and jargon
**Situation:** Callers speak several languages and use product jargon, and a speech vendor can fail mid-call.
**Sam wants to:** tune recognition, add dictionaries and set a fallback transcriber
**So that:** callers are understood even when a vendor fails
**What it does:** Recognition/pronunciation/denoising controls, STT dictionaries & keyword boosting, transcriber fallback & ASR failover, multilingual agents + runtime language switching, cross-provider failover (Engine half).
ClickUp card: https://app.clickup.com/t/868m0megc

## 04 · Greeting, filler & disclaimer
**Job:** Make the first seconds and the pauses feel natural and compliant
**Situation:** The agent's opening, its silences while tools run and the required disclaimer decide the first impression.
**Sam wants to:** shape the greeting, the fillers and the disclaimer
**So that:** callers stay on the line and the call meets the compliance bar
**What it does:** Filler words with context + persona, continue answers after filler, filler during tool execution, greeting & silence-recovery controls, AI disclaimer before the greeting.
ClickUp card: https://app.clickup.com/t/868m0mejc

## 05 · Call behavior rules
**Job:** Control what happens on idle, silence, voicemail and keypad input
**Situation:** Calls hit silence, voicemail, a maximum duration or an IVR.
**Sam wants to:** set a rule for each of those moments
**So that:** every call ends the way the team intends
**What it does:** Idle / silence / max-duration / call-screening behavior, leave a message after voicemail detection, DTMF input & IVR navigation, runtime guardrails on input/output, validate configuration before join.
ClickUp card: https://app.clickup.com/t/868m0mejx

## 06 · TTS expression & personality
**Job:** Shape how the agent sounds, not just what it says
**Situation:** The agent's words are right but the delivery is flat.
**Sam wants to:** set tone, expression, pronunciation and ambience
**So that:** the agent sounds like the brand
**What it does:** Configurable background ambience, SSML & pronunciation controls, expressive TTS controls + model prompts, personality & tone controls.
ClickUp card: https://app.clickup.com/t/868m0mekq

## 07 · Vendors & provider fallback
**Job:** Keep the models running across vendors and regions
**Situation:** A model vendor or a region degrades during live calls.
**Sam wants to:** set provider fallbacks and see vendor parity
**So that:** calls keep going without Sam watching
**What it does:** Provider-aware voice delivery & fallback, Studio vendor parity with Engine, vendor keys ([Murf.ai](http://Murf.ai) resell), managed testing credentials, customer-hosted STT/TTS endpoints, regional model access matrix, model-stack recommendations, pipeline template across surfaces.
ClickUp card: https://app.clickup.com/t/868m0men7

## 08 · Versioning & release ⚠ lock
**Job:** Change a live agent safely and undo the change
**Situation:** An agent is live and Sam needs to ship a change.
**Sam wants to:** version the agent, release to an environment, roll back and A/B test
**So that:** a bad change never reaches every caller
**What it does:** Agent versions, release environments, rollback; production A/B tests across versions; simulate a pending change before release.
ClickUp card: https://app.clickup.com/t/868m0menv

## 09 · First run, templates & import
**Job:** Get a working agent in minutes
**Situation:** Sam starts from scratch or moves from Vapi or Retell.
**Sam wants to:** start from defaults, a template or an import
**So that:** the first working agent takes minutes, not a day
**What it does:** First-run agent defaults, migrate obsolete ASR/turn-detection config, reusable recipes & templates, import from Vapi/Retell, conversational Composer, onboarding conversion instrumentation.
ClickUp card: https://app.clickup.com/t/868m0meqf

## 10 · Session & call logs
**Job:** Replay exactly what happened on a call
**Situation:** A caller reports a problem and Sam has only the session id.
**Sam wants to:** hear the audio and read the aligned transcript and provider payloads
**So that:** Sam sees exactly what happened
**What it does:** Complete call & session logs (audio + transcript for Engine sessions), aligned recordings and transcripts, redacted provider payloads, multi-speaker diarization, non-telephony session details.
ClickUp card: https://app.clickup.com/t/868m0meta

## 11 · SIP & latency diagnostics
**Job:** Know whose fault a failed or slow call was
**Situation:** A call failed or lagged, and the carrier, the network and the models are all suspects.
**Sam wants to:** see SIP errors, signaling ladders and latency by stage
**So that:** Sam blames the right party and fixes the right thing
**What it does:** SIP error codes + CPS-limit failures surfaced in Studio, SIP signaling ladder diagrams, Web/Native latency alignment, MLLM latency restored.
ClickUp card: https://app.clickup.com/t/868m0mety

## 12 · Live monitoring & operator controls ⚠ lock
**Job:** Watch live calls and step in when one goes wrong
**Situation:** Calls are happening now and one is going badly.
**Sam wants to:** watch live calls, nudge quality, take over or end a call
**So that:** a bad call is cut short before it costs a customer
**What it does:** Live sentiment trends + active-call monitor, live quality nudges, take over / end active calls, live monitoring for outbound campaigns, live-call overseer prototype.
ClickUp card: https://app.clickup.com/t/868m0mevm

## 13 · Dashboards & alerts
**Job:** See agent health without asking an engineer
**Situation:** Sam needs numbers for the pilot and has no analyst.
**Sam wants to:** self-serve dashboards, monitors and alerts
**So that:** Sam reports agent health and hears about trouble first
**What it does:** Self-serve analytics dashboards, monitors and alerts; inbound pilot metrics (FCR, answer speed, handle time, escalation, sentiment); export traces to customer observability platforms.
ClickUp card: https://app.clickup.com/t/868m0mewr

## 14 · Evals & scorecards
**Job:** Prove an agent is good before and after shipping
**Situation:** The team asks whether the agent is good enough to ship, or better after a change.
**Sam wants to:** run evals in Studio and CI and score production calls
**So that:** quality is proven with numbers, not opinions
**What it does:** Deterministic conversational evals in Studio + CI, rubric-based scorecards for production calls, recording review → targeted fixes, self-improving agents (+ Concierge integration).
ClickUp card: https://app.clickup.com/t/868m0mexd

## 15 · Simulations
**Job:** Stress-test an agent without real callers
**Situation:** Sam wants to break the agent before customers do.
**Sam wants to:** run and compare simulated calls at scale, with humans joining
**So that:** failures show up in a simulation first
**What it does:** Score & compare simulated calls, agent-to-agent simulations at scale, humans join simulated calls, advanced human-simulation controls, replay production traffic as regression scenarios, live latency in agent preview.
ClickUp card: https://app.clickup.com/t/868m0meyb

## 16 · Phone number purchase ⚠ lock
**Job:** Buy a number and take a call without leaving Studio
**Situation:** Sam has an agent and no number.
**Sam wants to:** buy and assign a number inside Studio
**So that:** the first call happens today
**What it does:** Purchase & assign phone numbers in Studio (US launch → beyond US), Bandwidth PoC, console billing APIs, compliance/legal, self-service CPS, verified/branded calling.
ClickUp card: https://app.clickup.com/t/868m0mf09

## 17 · SIP trunk setup
**Job:** Connect the team's own carrier once
**Situation:** The team has a carrier contract and a SIP trunk.
**Sam wants to:** connect the trunk once, with the right gateway location
**So that:** Sam never touches the trunk again
**What it does:** Telnyx from SIP manager, automated trunk/provider onboarding (ITSPs, regional telcos), SIP gateway location per number, SIP Direct Connect integration with Studio, SIP header customization, media IP allowlist, SIP transfer to direct-link, outbound throttle by trunk capacity.
ClickUp card: https://app.clickup.com/t/868m0mf18

## 18 · Channels ⚠ lock
**Job:** Put one agent on WhatsApp, SMS, web and text
**Situation:** Customers reach the team on more than the phone.
**Sam wants to:** run the same agent on WhatsApp, SMS, a browser widget and text
**So that:** one agent serves every channel
**What it does:** WhatsApp voice, SMS channel, text-only agents, browser SDK + embeddable widget, complete outbound campaign lifecycle.
ClickUp card: https://app.clickup.com/t/868m0mf2u

## 19 · Tools & connectors
**Job:** Let the agent act on other systems without code
**Situation:** The agent must look things up and act in other systems.
**Sam wants to:** add tools and connectors without writing code
**So that:** the agent acts, not just talks
**What it does:** Native + MCP connector marketplace, no-code HTTP tools (GET/POST), structured outputs as reusable resources, hosted code tools.
ClickUp card: https://app.clickup.com/t/868m0mf40

## 20 · Knowledge sources
**Job:** Keep the agent's knowledge current from real sources
**Situation:** The answers live on sites and in documents that change.
**Sam wants to:** crawl sources, including authenticated ones, on a schedule
**So that:** the agent answers from current facts
**What it does:** Crawl authenticated sources, crawl complete sites, scheduled refresh, web crawling + retrieval tuning, Couchbase as a knowledge provider.
ClickUp card: https://app.clickup.com/t/868m0mf4k

## 21 · CRM & contacts
**Job:** Greet callers with context and write back what happened
**Situation:** Callers are known customers in the CRM.
**Sam wants to:** give the agent CRM context and let the agent write back
**So that:** callers feel known and the CRM stays current
**What it does:** Agent context from CRM records, CRM actions + controlled write-back, contacts/audiences/cross-session context.
ClickUp card: https://app.clickup.com/t/868m0mf5e

## 22 · Usage, credits & concurrency
**Job:** Understand the bill and buy more capacity
**Situation:** Usage grows and the team asks what costs what.
**Sam wants to:** see usage and credits by model and raise concurrency
**So that:** Sam controls spend and capacity without a ticket
**What it does:** Model-level usage/credits/pricing breakdowns, concurrency self-serve with capacity safeguards, self-service concurrency controls, meter Studio usage on Engine, managed mode remainders (API use cases, separate usage key), MLLM managed catalog + SKU, Archer integration.
ClickUp card: https://app.clickup.com/t/868m0mf7b

## 23 · Handoffs & routing
**Job:** Hand a caller to the right human or agent, with context
**Situation:** The agent reaches the limit of what the agent should handle.
**Sam wants to:** route by skill or condition and transfer with a summary
**So that:** callers never repeat themselves
**What it does:** AI triage for inbound calls, warm + agentic human transfers with LLM summary, route by skill/condition/context, handoff graph → workflow canvas, queue-based routing, cross-channel routing, handoff graph + runtime contract.
ClickUp card: https://app.clickup.com/t/868m0mf8y

## 24 · Retention, PII & compliance
**Job:** Meet the compliance bar without filing a ticket
**Situation:** Legal sets retention and PII rules for call artifacts.
**Sam wants to:** set retention, redaction and storage policies
**So that:** the team passes review without engineering work
**What it does:** Data-retention policies across call artifacts, retention + PII redaction controls, customer-owned artifact storage, recordings delivered to customer storage, HIPAA-ready mode, workspace access control + client-key governance.
ClickUp card: https://app.clickup.com/t/868m0mfae

## 25 · Developer platform
**Job:** Build by API and still see everything in the UI
**Situation:** The team builds agents from code.
**Sam wants to:** see API-created agents, manage webhooks and use a CLI
**So that:** code and Console show the same truth
**What it does:** API-created agents visible in Studio, webhook management + delivery diagnostics, Studio CLI + MCP server, legacy credential leak fix.
ClickUp card: https://app.clickup.com/t/868m0mfbx

## 26 · Unified login
**Job:** Sign in once for Console and Studio
**Situation:** Sam signs in twice for two apps.
**Sam wants to:** one session across both apps
**So that:** Sam never signs in twice
**What it does:** One session across both apps. First step: find out what "unify" means to the PM who filed it — one Okta cookie already exists; the seam is wayfinding, not auth (LEARNINGS).
ClickUp card: https://app.clickup.com/t/868m0mfcy

## 27 · Responsiveness audit
**Job:** Use Studio on any screen
**Situation:** Sam opens Studio on a laptop, a tablet and a phone.
**Sam wants to:** every screen to work at every size
**So that:** Studio never fights the screen
**What it does:** End-to-end responsiveness audit and fixes across Studio and Console.
ClickUp card: https://app.clickup.com/t/868m0mfdn

## 28 · DevX & docs
**Job:** Ship a front end fast
**Situation:** A developer starts a front end for the agent.
**Sam wants to:** a UI kit, docs help and benchmarks
**So that:** the front end ships in days
**What it does:** UI Kit mobile, UI Kit polish, generative UI, benchmarking tool, docs AI assistant, Physical AI builder scope.
ClickUp card: https://app.clickup.com/t/868m0mfea
