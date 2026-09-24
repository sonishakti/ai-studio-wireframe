# Batch/campaign hierarchy, retention UX, experimentation, and ephemeral sessions

Research for Agora v3 Conversational AI. API entities: Secret, Agent, Session, Number, Campaign. A `camp_…` is one execution (contacts, schedule, pacing, status, `:pause`/`:resume`/`:cancel`) with nothing above it in the API. The team's target UI hierarchy for outbound is Campaign → Run → Session, implying UI "Campaign" may be a wrapper and API `campaign` = UI "Run." This surveys comparable products to ground that naming call.

## 1. Batch/campaign hierarchy and naming

| Product | How | Source |
|---|---|---|
| Vapi | "Outbound Campaigns": one CSV, one execution, no recurrence — docs say to duplicate the campaign to run it again. Campaign-level metrics: audience size, remaining/connected calls, pick-up rate. Nothing groups above a campaign. | [Overview](https://docs.vapi.ai/outbound-campaigns/overview), [Outbound calling](https://docs.vapi.ai/calls/outbound-calling) |
| Retell | "Batch Call," lifecycle Draft → Planned → Ongoing → Sent. CSV rows can override agent id/version and carry metadata. No grouping above a batch; re-run = new batch. | [Batch calls](https://docs.retellai.com/deploy/make-batch-call) |
| ElevenLabs | "Batch calling" (docs avoid "campaign"): pick an agent, upload CSV/XLS, run now or schedule once. Concurrency auto-capped at min(50% workspace, 70% agent limit). Zero Retention Mode is explicitly **incompatible** with batch calling. Flat list of jobs, no parent entity. | [Batch calling](https://elevenlabs.io/docs/conversational-ai/phone-numbers/batch-calls) |
| Bland | "Batches" — one CSV of leads = one batch, queried by `batch_id`. Flat, no parent grouping. | [List Batches](https://docs.bland.ai/api-v2/get/batches) |
| Synthflow | "Campaigns" (Enterprise) run list-based outbound with calling windows/pacing; "Workflows" is a separate, broader trigger layer that can kick off a campaign and run a 3-attempt callback loop — a different kind of object, not a container of same-shaped executions. | [Workflows](https://docs.synthflow.ai/workflows) |
| Five9 / Genesys Cloud (dialers) | "Outbound Campaign" = top-level object containing a Contact List + dialing mode + rules. Runs continuously; wrap-up codes decide re-dial; campaign completes only when every contact is uncallable. Closest analog to a persistent, multi-attempt execution — but still nothing groups above "campaign." | [Five9 dialer rules](https://documentation.five9.com/bundle/campaign-admin/page/campaign-admin/configuring-campaigns/understanding-dialer-outbound/list-order-outbound-campaign.htm), [Genesys outbound](https://help.genesys.cloud/articles/about-outbound-dialing/) |
| Kixie / Aircall (power dialers) | Kixie's unit is a "PowerList" an agent dials through, 1–10 lines at once — no campaign wrapper, no rollup above the list. Aircall has no native auto-dialer at all. | [PowerLists](https://support.kixie.com/hc/en-us/articles/4565589331483-How-to-Set-Up-PowerLists) |
| Mailchimp | "Campaign" = top-level container (audience, content, schedule); "email" = content type inside it; "send" = the firing action. Recurring sends use a different object (RSS-triggered campaigns or Automations), not a re-run of the same campaign. | [Campaigns API](https://mailchimp.com/developer/marketing/api/campaigns/) |
| Customer.io | Three distinct objects: **Campaigns** (multi-step, time-based, re-triggers per qualifying person — ongoing), **Broadcasts** (one-time send, no timeline), **Transactional** (event-triggered). Here "campaign" means recurring and "broadcast" means one-shot — the reverse polarity from how voice-AI tools use "campaign." | [Campaigns and broadcasts](https://docs.customer.io/journeys/types-of-campaigns-and-broadcasts/) |
| HubSpot | "Sequences" = 1:1 human-paced outreach; "Workflows" = system-run automation at scale; "Campaigns" (separate object) ties heterogeneous assets (emails, ads, workflows) to one initiative for reporting — a rare real grouping layer *above* individual sends, but of mixed assets, not repeated executions of one thing. | [Workflows vs. Sequences](https://blog.hubspot.com/customers/workflows-vs-sequences) |

Analytics roll up at the single-execution level everywhere except Five9/Genesys (continuous campaign) and HubSpot Campaigns (mixed-asset grouping). No AI voice-agent competitor (Vapi, Retell, ElevenLabs, Bland, Synthflow) has an entity above one execution — all are duplicate-to-re-run.

### Implications for Agora
- Agora's Campaign → Run → Session hierarchy has **no direct precedent** among voice-AI competitors — all are single-level. "Run" as a grouping/comparison layer is a real product bet, not an industry-standard pattern to lean on.
- Five9/Genesys's continuous, wrap-up-driven campaign is the closest reference for how `attempts`/`backoff`/`call_policy` could read as "keeps working the list," distinct from "Run" (same agent, new list/variables, for comparison).
- Customer.io's Campaign/Broadcast split warns against assuming "campaign" universally means one-shot batch — it doesn't, outside voice-AI and dialer tools.
- No competitor offers a native "re-run" action on the same batch object — if Agora ships Run as first-class re-run/compare, call that out as a genuine differentiator, not table stakes.

## 2. Data retention UX

| Product | How | Source |
|---|---|---|
| ElevenLabs ZRM | Per-agent toggle (workspace override exists) stops all transcript/recording/PII storage; only post-call webhooks can surface data, and even those aren't persisted server-side. Explicitly **cannot combine with Batch Calling**. | [Zero Retention Mode](https://elevenlabs.io/docs/eleven-agents/customization/privacy/zrm) |
| Vapi HIPAA | Account-level mode: structured outputs not stored by default (avoids inadvertent PHI); recordings/transcripts/logs *are* still stored by default in HIPAA-compliant storage. A `forceStoreOnHipaaEnabled` flag opts specific fields back in. Control is account + per-field, not per-call. | [HIPAA Compliance](https://docs.vapi.ai/security-and-privacy/hipaa) |
| Retell storage settings | Per-agent, three tiers: **Everything** / **Everything except PII** (configurable categories) / **Basic attributes only** (no transcript/recording/logs kept; later API reads return empty fields). Org still gets full data once via end-of-call webhook. Separate numeric auto-delete-after-N-days window. | [Data Storage Settings](https://docs.retellai.com/accounts/privacy-disable) |
| OpenAI ZDR | Enterprise/sales-approval only; applies **per endpoint** (chat, Responses, Realtime, etc.), not account-wide — `store` is forced false. Not absolute: legal/abuse-prevention exceptions remain. | [Data controls](https://developers.openai.com/api/docs/guides/your-data) |
| Datadog | Retention is a property of the **index** a log is routed to (3/7/15/30/45/60 days standard, 15 default), with a "Flex" tier bolting on longer cold storage after. Communicated as index config, not a per-row badge. | [Retention periods](https://docs.datadoghq.com/data_security/data_retention_periods/) |
| Sentry | Retention is a **plan property** (30 vs 90 days; custom on Enterprise), fixed at the time the event occurred. Self-hosted exposes a raw config value. No per-row "not retained" indicator. | [Retention FAQ](https://sentry.zendesk.com/hc/en-us/articles/27118913621019-How-Long-Are-Errors-Events-Stored-in-Sentry) |

Retention is set at one of three levels: per-field/per-agent (ElevenLabs, Retell — closest to Agora's per-session model), per-endpoint/per-account (OpenAI, Vapi), or per-plan/per-index (Sentry, Datadog — infra pattern, not applicable here). No product shows a strong per-row "not retained" badge in a list; instead the row survives (call happened, cost known) while detail fields are simply empty.

### Implications for Agora
- Agora's `30_days`/`none` matches Retell's per-agent tiered model in spirit but is coarser (2 states vs. 3, no PII-category granularity). "None" should behave like Retell's "Basic attributes only" — row exists, fields empty — which already matches the brief's own phrasing.
- **Hard constraint**: ElevenLabs disallows zero-retention on batch calls entirely. If Agora allows `none` inside a Campaign/Run, that's a more permissive combination than any competitor ships — needs an explicit product decision, not a default assumption.
- No competitor shows a strong in-list "not retained" badge; use a muted, hover/detail-revealed label rather than a heavier pattern nobody else uses.
- Retention should be settable at Agent (default) and Session (override) levels, mirroring Retell + Vapi — and retention-override sessions should feed the same "must not aggregate with default" filter dimension as agent-overrides.

## 3. Experimentation for prompts/agents

| Product | How | Source |
|---|---|---|
| LaunchDarkly | Percentage rollouts live inside a flag's targeting rule: split down to 0.001%, optionally bucketed by a context attribute. "Guarded rollouts" auto-rollback on metric regression. The split *is* the release mechanism; experiment analysis reads off the same exposure data. | [Percentage rollouts](https://launchdarkly.com/docs/home/releases/percentage-rollouts) |
| Statsig | "Experiment" = control + N variant groups, randomized per-user, scorecard with metric lift + confidence intervals. Variant name/description is a label distinct from the underlying parameter values it serves. | [Experiments Overview](https://docs.statsig.com/experiments/overview) |
| Braintrust / LangSmith | Offline pattern: prompts are versioned, immutable objects; a fixed dataset is run against 2+ versions, tagged as an "experiment," compared side-by-side on cost/latency/correctness. Not live traffic-splitting — a pre-deploy eval harness. | [Braintrust versioning](https://www.braintrust.dev/docs/cookbook/recipes/PromptVersioning), [LangSmith eval concepts](https://docs.langchain.com/langsmith/evaluation-concepts) |
| PromptLayer | Production traffic-splitting via "A/B Releases": a release label (e.g. `prod`) gets multiple prompt versions with percentages summing to 100%, optionally targeted by user-metadata segment. Recommended ramp: 5–10% → 10/20/40/100%. Closest LLM-tooling analog to Agora's "5% traffic, compare metrics" roadmap item. | [A/B Releases](https://docs.promptlayer.com/why-promptlayer/ab-releases) |
| Vapi | Native "traffic splitting" for assistant versions: every publish is an immutable version snapshot; splits route by percentage (0.001% granularity, 5-version cap), follow-latest vs. pinned, new-calls-only vs. repeat-caller affinity, canary/"parking at 0%" patterns. The single closest precedent — a voice-agent competitor doing exactly Agora's future deployment-level A/B test. | [Traffic-splitting docs](https://github.com/VapiAI/docs/pull/1253) |

In every tool, the variant/version is logged as metadata on each unit of work (exposure, eval run, or call), so analytics treats "variant" as just another filterable dimension — structurally identical to what Agora's brief wants for override-vs-default sessions.

### Implications for Agora
- Vapi's traffic-splitting UI (percentage, version-pinned, canary/parking, caller affinity) is the direct precedent to study before designing Agora's own deployment-level split — same domain, same problem.
- Treat "override" as a variant dimension from day one in the session data model: every session should carry a stable pointer to the agent-version/override that served it, so "must not aggregate" is a join key, not a bolted-on filter.
- Offline (Braintrust/LangSmith, dataset-driven) and online (PromptLayer/Vapi, live split) experimentation solve different moments — Agora's roadmap item is the online kind; no need to build dataset-eval tooling for it.

## 4. Ephemeral/anonymous sessions

| Product | How | Source |
|---|---|---|
| Stripe test mode | Not a session mechanism, but the closest UI analog: a persistent Test/Live toggle switches the whole dashboard view, plus a floating "test mode assistant" widget that appears only in test mode and vanishes in live — the "not real" signal is a global mode switch plus a contextual widget, never a per-row badge. | [Test mode assistant](https://docs.stripe.com/sdks/stripejs-test-mode-assistant) |
| OpenAI Realtime ephemeral tokens | Server mints a short-lived (~1 min) `ek_…` client token via `POST /v1/realtime/client_secrets`, safe for a browser to open a WebRTC session without exposing the real key. The session it authorizes can be fully inline/unsaved — the direct API precedent for Agora's ephemeral-session concept. | [Create session](https://developers.openai.com/api/reference/resources/realtime/subresources/sessions/methods/create) |
| Twilio | Short-lived TURN credentials (default 24h, configurable shorter) and Access Tokens authenticate client SDKs without a long-lived secret. Pure auth ephemerality — no demo/anonymous-session UI pattern in the docs. | [Network Traversal Tokens](https://www.twilio.com/docs/stun-turn/api) |
| LiveKit | Rooms are ephemeral by default: created on first join, destroyed shortly after the last participant leaves; no persistent room resource unless explicitly configured. Here the *resource itself*, not just the credential, is transient — matches "leaves no standing config object behind." | [Room management](https://docs.livekit.io/intro/basics/rooms-participants-tracks/rooms/) |

### Implications for Agora
- OpenAI's pattern (short-lived token for inline, unsaved config) is the direct precedent for Agora's ephemeral session: it should never appear to "belong" to a saved Agent in a session list, the way LiveKit rooms aren't tied to a persisted room resource.
- Stripe's global-toggle-plus-contextual-widget is a good model if ephemeral sessions get their own top-level mode rather than a buried attribute — the brief's "meant for demos" framing wants an unmissable indicator, not a small badge.
- No competitor shows how ephemeral sessions should appear in aggregate analytics — reuse the override-session mechanism from Section 3 (tag as a dimension, filter/dice out) rather than inventing a new one.

## Naming recommendation

**Keep the API word "campaign" for the single execution; introduce "Run" only as a UI-level grouping/comparison label. Do not rename the API object.**

1. **API-parity is binding.** The API already ships `camp_…` as the single-execution object (`contacts[]`, `schedule`, `pacing`, `status`, `:pause`/`:resume`/`:cancel`). Renaming its UI label to "batch call" or "run" breaks the required 1:1 word mapping and forces a permanent docs-vs-UI translation table.
2. **"Batch call" is a documentation style choice, not grounds to rename the entity.** Retell and ElevenLabs use it for clarity, but neither has a grouping entity above it the way Agora's Campaign eventually needs. The API-parity constraint says follow the entity's actual name, not the prose style guide.
3. **"Run" stays a UI-only comparison label**, exactly as the brief defines it — no 1:1 API entity, correctly, since the API has nothing above campaign. Customer.io's Campaign/Broadcast split shows two genuinely different *kinds* of objects can coexist under related names; Agora's Run and Campaign should read the same way — related, not synonymous.
4. **"Execution" was considered and rejected**: accurate but infra-flavored (Datadog/workflow-engine register), doesn't read naturally for non-technical operators. "Run" is shorter, comparison-friendly in UI chrome ("Run 1 vs. Run 2"), and matches how Vapi/Statsig use "version"/"variant" as a lightweight label for one of several comparable attempts.
5. **Net structure:** `Campaign` stays the atomic, API-true word (one execution). `Run` is the UI label for "this campaign, as one comparable attempt with a given agent + contact list/variables" — a Run *is* a Campaign in API terms, worded differently only where several Runs sharing an agent are shown side by side for comparison. `Session` is unchanged. No fourth API-shaped noun is needed.

## Sources

- [Vapi — Outbound campaigns overview](https://docs.vapi.ai/outbound-campaigns/overview)
- [Vapi — Outbound calling](https://docs.vapi.ai/calls/outbound-calling)
- [Vapi — HIPAA Compliance](https://docs.vapi.ai/security-and-privacy/hipaa)
- [Vapi — Traffic-splitting docs PR](https://github.com/VapiAI/docs/pull/1253)
- [Retell AI — Create Batch calls](https://docs.retellai.com/deploy/make-batch-call)
- [Retell AI — Data Storage Settings](https://docs.retellai.com/accounts/privacy-disable)
- [ElevenLabs — Batch calling](https://elevenlabs.io/docs/conversational-ai/phone-numbers/batch-calls)
- [ElevenLabs — Zero Retention Mode](https://elevenlabs.io/docs/eleven-agents/customization/privacy/zrm)
- [Bland — List Batches](https://docs.bland.ai/api-v2/get/batches)
- [Synthflow — Workflows](https://docs.synthflow.ai/workflows)
- [Five9 — List Order for Outbound Campaigns](https://documentation.five9.com/bundle/campaign-admin/page/campaign-admin/configuring-campaigns/understanding-dialer-outbound/list-order-outbound-campaign.htm)
- [Genesys Cloud — About outbound dialing](https://help.genesys.cloud/articles/about-outbound-dialing/)
- [Kixie — How to Set Up PowerLists](https://support.kixie.com/hc/en-us/articles/4565589331483-How-to-Set-Up-PowerLists)
- [Mailchimp — Campaigns API](https://mailchimp.com/developer/marketing/api/campaigns/)
- [Customer.io — Types of campaigns and broadcasts](https://docs.customer.io/journeys/types-of-campaigns-and-broadcasts/)
- [HubSpot — Workflows vs. Sequences](https://blog.hubspot.com/customers/workflows-vs-sequences)
- [OpenAI — Data controls in the OpenAI platform (ZDR)](https://developers.openai.com/api/docs/guides/your-data)
- [OpenAI — Realtime API: Create session (ephemeral tokens)](https://developers.openai.com/api/reference/resources/realtime/subresources/sessions/methods/create)
- [Datadog — Data Retention Periods](https://docs.datadoghq.com/data_security/data_retention_periods/)
- [Sentry — Data retention FAQ](https://sentry.zendesk.com/hc/en-us/articles/27118913621019-How-Long-Are-Errors-Events-Stored-in-Sentry)
- [LaunchDarkly — Percentage rollouts](https://launchdarkly.com/docs/home/releases/percentage-rollouts)
- [Statsig — Experiments Overview](https://docs.statsig.com/experiments/overview)
- [Braintrust — Prompt versioning and deployment](https://www.braintrust.dev/docs/cookbook/recipes/PromptVersioning)
- [LangSmith — Evaluation concepts](https://docs.langchain.com/langsmith/evaluation-concepts)
- [PromptLayer — A/B Testing (A/B Releases)](https://docs.promptlayer.com/why-promptlayer/ab-releases)
- [Stripe — Stripe.js test mode assistant](https://docs.stripe.com/sdks/stripejs-test-mode-assistant)
- [Twilio — Network Traversal Service Tokens](https://www.twilio.com/docs/stun-turn/api)
- [LiveKit — Room management](https://docs.livekit.io/intro/basics/rooms-participants-tracks/rooms/)
