# 24 Sep 2026 · two calls with Vineet · digest with deciding quotes

Sources: Granola notes (both calls, saved beside this file) and the raw transcripts the owner pasted into the
design session on 24 Sep. The raw transcripts are not stored in the repo; quotes below are verbatim and short.

- **Call B** (morning, ~10:45 IST, hard stop 11:00): "Studio redesign, API v3, and super node launch". Builder
  feedback, v3 API walkthrough, SuperNode, secrets, agent page, session history, ephemeral sessions, Refero setup.
- **Call A** (afternoon): "Real time agent preview and A/B testing configuration". Agent real-time page, session
  history as drill-down, modality cards, logs tab, overrides, data retention, Transports, secrets rationale, API
  parity, pricing, SOW ask.

---

## 1. Voice and model

- Slider out, radio in. "Why have a slider? It's harder to use." Three shown up front beats a dropdown.
- Trade-off is two axes: "Axis A is intelligence. Axis B is latency. It's not cost. Cost is something you just show."
- **Lowest latency is the default**: Deepgram Nova 3 + Gemma 4 on SuperNode + Cartesia Sonic 3.5.
- Balanced: same stack, LLM = "GPT 5.1 or 5.5 mini". "Already at the tail end of how long a model can take to
  respond... any bigger won't feel like real-time conversation." So a third *preset* is doubtful.
- **Third option = Custom.** "You have preset one, preset two, and then custom. If people choose custom, they have to
  configure it." ("Let me not give you solutions. Figure it out.")
- Voice is a dropdown beside the presets. Whole section in **3–4 lines**.
- **One settings page**: Voice & models + Advanced settings + Advanced speech settings clubbed into "Voice and
  pipeline settings / advanced pipeline settings". "We are literally optimizing the hot path... when people do hit
  advanced settings, all of the default values will make the most sense already."
- Delight: "People really liked Vapi... they put the icon and logo... that spice in the UI." "I'm not saying copy
  this. Why do people appreciate this? That's the reasoning I want to copy." Call A: "once you're done with the
  design, have AI do a delightful pass at it... the UI is a bit plain right now."
- Benchmarks are moving from latency to task success: "latency is going to be a non-problem in a year... GPT live is
  1.2 s end to end... the problem is how efficiently this solves the task at hand." Vineet asked for the old Agora
  benchmarking site URL (logos, stack, speed, cost breakdown).

## 2. Creation flow and layout

- Deployment type decides everything below it: "it's not obvious... that things below this are going to change."
  Suggested tabs, progressive reveal, animation, next/back. Shakti proposed choosing the type in a modal at
  creation; Vineet was open to it. "Batch calling will never do inbound. I can guarantee that." **Make several
  versions: "I don't know what will click... a fairly difficult problem."**
- **Order**: Voice & model (3–4 lines) → Prompt & knowledge (stable across types) → simulations/test →
  **Deploy + Go live together** ("in one section you can have three tabs").
- **Contact list** leaves Deployment; it is a Go live action "which is where it creates runs from".
- Inbound deployment "all good"; code "also fine".

## 3. Prompt and knowledge

- "It's way too big." System prompt is "pretty much the only real thing". Opening and failure message collapsed or
  behind a button ("greeting configuration").
- Knowledge base, MCP servers, tools: one unified list, an icon per type, tooltip instead of inline description.

## 4. v3 API, entities, SuperNode

- Launch mid-October at an event in China: new Studio + v3 API + SuperNode. **US East only.**
- SuperNode = Agora-owned servers with GPUs, ASR+LLM+TTS on one inference layer. "We are becoming an inference
  company. We are changing our business model."
- Entities: **Secret, Agent, Session** ("top three entities"). Agent is "completely detached from where it's going to be
  deployed"; deployment lives in the session's `transport` (rtc, telephony, WhatsApp later).
- "We looked at the UI and used that as a north star to come up with the API." **Consistency over prettier copy**: "if
  we call the same thing pipeline in both places... that is extremely good."
- `structured_output` naming: "variables" (Vapi's word) or "analysis"; leaning **analysis**, unconfirmed.
- Docs: "batch calling is what I prefer instead of campaigns"; Shakti: batch call is developer-centric, campaign is
  marketing-centric; docs = batch call, UI TBD.
- **Hierarchy**: "you have campaign [batch calling + configuration], then a set of sessions [run], then a session is the
  individual call itself... clearly it's not the same thing as a session." Runs matter for outbound only: "for inbound
  and code agents there are no runs."

## 5. Secrets

- Model: Vercel env vars. Key + value, "once you save this, you can no longer reveal this... You can either delete this
  key and create a new key, but you cannot see this key." Environments via naming the set (`-prod`, test).
- Set = named group of unique keys; retrieving a set returns keys only.
- "It's not fair to ask people: go create a secret and then come back." Studio **auto-creates a set** when the user
  configures an agent; the credentials page then shows "this agent created the secret set".
- Why sets (call A): vendors need different key shapes (Agora = customer ID + customer secret); a fixed credential
  abstraction is "a lot of work for no benefit". Reference form: top-level secret-manager key → set → secret.
- **Pricing (not public)**: 5¢/min managed; BYOK lowers it; partial BYOK "not this month, in a bit".

## 6. Agent page (view, not configure)

- "View my agent... different from editing the configuration." "An agent is not just a configuration. An agent is also
  what is happening in the real world, in real time."
- Shows: calls taken, analytics trending week/month, averaged latency, averaged extracted metrics, sessions ongoing and
  past, runs for outbound.
- Aggregation lives **only** at the agent: "there can't be analytics at agent level if it's not at the agent...
  structured output is going to be the main analytics."
- **Talk to agent** bubble in the real-time panel: "going through session history... surprised by something... I just
  want to talk to it and see if the same scenario is replicating the same output."
- **Two tabs**: analytics, and logs & diagnostics. "I just want the error logs, dude. That's the only product
  requirement." Errors come per call over the RTM channel ("NCS"); Vineet will confirm which logs exist. Example: "I
  couldn't place a call because your TTS didn't work because you ran out of credits after the fourth call, so I
  couldn't complete the next six." Top-level "three warnings, two errors".
- Filters drive the list and the metrics together: "Our average call satisfaction is 4.5/10 over 30 days... switch to
  three months... it could have been 3/5. You made a significant improvement only recently." "Not a vanity metric."
- References: Datadog, Refero ("Referral" in the transcript = Refero MCP, now connected).
- **Overrides** (deferred shape): sessions that override prompt/LLM/ASR/TTS must not be averaged with default ones; "you
  should be able to choose your override and see the metrics for that override" (e.g. French vs Spanish TTS).
- **A/B testing** (future): "I have deployed this to 5% of my user base... is it performing better than the original?"
  "Makes more sense at deployment level rather than agent level."

## 7. Session history (drill-down)

- "Call history is not about aggregation. Call history is about drill down... to see the history of an individual
  session."
- One page replaces call history + session history: "we are not going to have two, three history pages."
- Every session: telephony, RTC, WhatsApp; inbound, outbound; web widget. "Filter through a variety of tags or labels...
  query in a very good way."
- Session detail = latencies, transcript, structured output (analysis), events, everything. **Full-screen option**
  "next to download". **Deep links** for sessions and runs ("agents already have their own URL") so customers can share a
  bad session.
- **Agent column with backlink** is the core requirement; configurable outcome columns ("did the call sell a car") are
  later.
- **Modality cards**: "for every modality I am happy with creating a custom card, but I want to see the card." Common:
  transcript, structured output, events, diagnosis/logs. Different: SIP etc. Cards for RTC, telephony, "maybe
  WhatsApp... you don't even have to design it."
- **Ephemeral sessions**: started with an inline agent via `sessions/ephemeral`. Not in the agents list; in session
  history the agent column reads "Ephemeral"; no backlink; analysis visible only per session; "aggregate on your own
  after downloading a CSV". For "simple coding demos... this is more so code convenience." Docs will carry a
  disclaimer.

## 8. Data policy

- Two values: 30 days or none. "Not compliance at all... purely storage/cost." Granular retention is future.
- Inbound and batch sessions have no API call to carry `data_policy`, so **Studio collects it at Go live** for the agent.
  "An agent already has a mix of session details inside the agent... keep these properties in mind, we need to collect
  them during go live."
- Zero retention rows: "you will only note that a call has happened and it cost you x... quote-unquote incognito."
- Design both states; the no-data state mirrors the first-run empty state.

## 9. Transports and API parity

- Resources gets a second take, named **Transports** internally: "telephony is a transport type, phone number is a
  transport identifier... obviously we can't say that out loud in the UI." WhatsApp credentials etc. need a home.
- **Parity**: "we can't have anything in the UI that is not there in the API... especially start a session and create an
  agent." Dynamic context injection stays API-only.

## 10. Timeline and next steps

- Hope: v1 of all frames by early/mid next week (w/c 28 Sep), wrap end of month, then ~2 weeks of polish before launch.
- Agent page alone ≈ 2–3 days. Monitoring takes longer.
- **Owed tomorrow morning (25 Sep)**: SOW to Vineet and Samyak — every page and update, days per item including review
  calls (e.g. 3 days with 2–3 calls). They prioritise from it.
