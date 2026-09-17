# 18 · Channels ⚠ lock · intake brief (2026-09-17)

Tracker: https://app.clickup.com/t/868m0mf2u · status `added`, set `clarified` when this lands · Tags deploy · P0 · ⚠ lock · size XL, 24 designer-days (8 research · 12 proto · 4 review) · wave **Jan 2027** (paired with 08 · Versioning, `references/design-ops-protocol.md` "Waves").

Design Tracker JTBD (868m0mf2u): "User wants to put one agent on WhatsApp, SMS, web and text."

⚠ This feature is under the owner-call gate (`references/design-ops-protocol.md` rule 3). Stop 0 ends with the owner question in §6. Nothing past stop 0 starts until it is answered.

## Scope

Five roadmap tasks. ClickUp is not readable from this session, so each row is expanded from the Q3 export and the roadmap documents in `references/`. Where no document states acceptance criteria, the row says so.

| Task | What it asks for | Acceptance criteria |
|---|---|---|
| **868ka6ajk** Productize WhatsApp voice | Module Studio, P0, size **XL**, customer **Moveo** (`references/clickup-q3-roadmap-export-2026-09-03.tsv`:175). The one line anyone has written about the shape: "`/deploy/whatsapp` graduates from redirect stub to a real channel surface" (`references/prd-q3-roadmap-execution-2026-07-29.html`:136 and :246). Backlog classes it **new**, "`/deploy/whatsapp` currently redirects into the wizard" (`references/design-backlog-q3-roadmap-2026-09-03.html`:377). Owned on the Engine side by SIP Manager together with call throttling (`references/roadmap-activation-strategy-2026-07-09.md`:312). | **No acceptance criteria written.** `TODO-Q3-ROADMAP.md`:96 carries only the flag "⚠️ reverses no-WhatsApp lock". |
| **868kyjfp2** Add SMS as an agent channel | Module Studio, P0, no due month, no size (TSV:182). New since the 07-29 read (`design-backlog`:204). Backlog note: "`/deploy/sms` currently redirects" (`design-backlog`:378). | **No acceptance criteria written.** No roadmap document describes the SMS conversation model, the sender identity, opt-out handling or the billing unit. |
| **868kyjfnv** Support text-only agents | Module Studio, promoted **P2 to P0** (`design-backlog`:183, TSV:178). The intent sentence: "Add text-only agents that use the same Studio pipeline **without the voice leg**" (`TODO-Q3-ROADMAP.md`:55). Its Engine peer is **[O5.1-T7.a] Scope text-only agents**, still P2 and still at the scoping stage (TSV:37). Backlog note: "Engine scope task is P2" (`design-backlog`:379). | **No acceptance criteria written.** The Engine half is a scoping task, so the contract this Studio task would surface does not exist yet. |
| **868kykbf8** Ship a browser SDK and embeddable agent widget | Type **Dev Experience**, P0, no due month (TSV:180). New since 07-29 (`design-backlog`:203). Backlog classes it **fix**: "widget-studio exists; SDK story is new" (`design-backlog`:374). | **No acceptance criteria written.** Nothing states whether the widget is Agora-hosted, whether it ships as a script tag or an npm package, or who owns the CDN. |
| **868kykbf1** Build the complete outbound campaign lifecycle | Module Studio, **P2** (the only non-P0 in this set, TSV:179). Backlog classes it **fix**, surface "Batch Calls" (`design-backlog`:375). Its sibling "Extend live monitoring and sentiment to outbound campaigns" is P1 (TSV:155). | **No acceptance criteria written.** The word "complete" is unqualified in every document. §4 reconstructs what the lifecycle already is from the shipping Console contract, which is the only place the scope is legible. |

Note the priority split: three channels and the SDK are P0, and the campaign lifecycle, the only one of the five with a real contract behind it, is P2.

## What the product has today

### The builder's Deployment section is an **intent** radio, not a channel picker

`components/wizard/channel-section.tsx` is the whole surface. Three cards, one choice: Batch Calls · Inbound · Code / SDK (`channel-section.tsx`:46-50). The question above them is "How will this agent handle calls?" with the hint "One deployment type per agent: duplicate the agent for the other direction" (:108-109). `setChannel` writes `channels: [c]`, a one-element array (:74), and switching keeps the departing channel's config with an Undo toast (:80-91).

Multi-select exists, but one level down, as **inbound surfaces**: Phone number · Web widget, two `ToggleCard`s under "Inbound channels" with the hint "Pick every way callers reach this agent. It can serve several at once" (:52-55, :158-176). Directly under them, one muted line: **"WhatsApp · Telegram · soon"** (:175). That line is the only place WhatsApp appears in the builder, and it is the door the lock already left open.

Everything the three intents render:

- **Inbound · phone**: `InboundNumbersBlock` (:361-449), several numbers per agent via `numberIds[]`, "Add another inbound line" (:433), and a footer pointing at Resources › Deployment Channels (:440-446).
- **Inbound · web**: `WidgetStyleConfig` inlined under the label "Widget Settings" (:183-187).
- **Batch**: `BatchCallerIdBlock` (the number to dial from, :216-235) and `BatchContactsBlock` (the first run's CSV, collapsible, with a door into Go Live, :243-292).
- **Code / SDK**: `CodeConfigure` (:453-524), install snippet plus a join snippet plus a stop snippet.

`components/wizard/deploy-preflight.tsx`:72-89 renders one "Deployment" row whose value is `channelTarget(draft)` (`lib/wizard-draft.ts`:876-890), which prints a number, "Web widget", "No number yet" or "No surface yet". There is no channel-level health, because there are no channels below the intent.

### Six different channel taxonomies, two of them named the same thing

This is the finding that decides the design. Nothing in the app agrees on what a channel is.

| Type | File:line | Members |
|---|---|---|
| `DeployChannel` | `lib/wizard-draft.ts`:33 | inbound · batch · web · code (intent; `web` is migration-only and "never produced", :30-33) |
| `InboundSurface` | `lib/wizard-draft.ts`:37 | phone · web |
| `ChannelKind` | `lib/campaign-data.ts`:21 | telephony · **whatsapp** · **sms** · web (transport) |
| `ChannelType` | `components/channels-panel.tsx`:28 | phone · whatsapp · web · batch · code (inventory) |
| `SessionChannel` | `lib/session-trace.ts`:19 | phone · web · **chat** · **sip** (observability) |
| `SessionAgentChannel` | `lib/agent-store.ts`:17 | phone · whatsapp · web · batch · code · none |

Two exported constants are both called `CHANNEL_LABEL` with different key sets: `lib/campaign-data.ts`:1788 (telephony · whatsapp · sms · web) and `lib/session-trace.ts`:21 (phone · web · chat · sip). A monitor row and a deployment row can therefore label the same run two different ways, and no code path reconciles them.

The three new channels all land in this collision. WhatsApp exists in four of the six taxonomies. SMS exists in exactly one (`campaign-data.ts`:21 and :27) and has **zero rows anywhere**: no deployment, no channel-panel entry, no UI. Text is only in `SessionChannel` as `"chat"`, produced at random by `channelForSession` (`session-trace.ts`:191-197), backed by nothing.

### WhatsApp is already in the data and already in the inventory, with no surface behind it

`lib/campaign-data.ts` declares `{ kind: "whatsapp"; sender: string }` (:26) and ships a live deployment on it: `dp_ib_06` "Acme WhatsApp", sender `+1 (628) 555-0220`, backed by Support Bot v2, 220 calls, with a channel-specific prompt suffix `# CHANNEL\nWhatsApp. Casual register, emojis sparingly, one question at a time.` (`campaign-data.ts`:1399-1411).

`components/channels-panel.tsx` (the "Deployment Channels" tab of Resources, mounted at `app/(dashboard)/integrations/page.tsx`:351) lists it as row `ch_03` "Acme WhatsApp" with `href: "/deploy/whatsapp"` (`channels-panel.tsx`:51). That route is `app/(dashboard)/deploy/whatsapp/page.tsx`:5, a six-line file that redirects to `/integrations?tab=channels`. **The Manage action on the WhatsApp row returns to the page it was clicked from.** Same loop for `/deploy/sms`, `/deploy/slack` and `/deploy/telephony` (all `redirect("/integrations?tab=channels")`), and `/deploy` itself redirects there too (`deploy/page.tsx`:7).

Also in that file: row `ch_07` "Toll-Free" has `backs: ", "` (`channels-panel.tsx`:55), so the Agent cell renders a stray comma for an unassigned number. Small, but it is the empty state of the column that this feature is about.

The panel's own doc comment states the lock as "One channel backs one agent (1 agent ↔ 1 channel); duplicate an agent to put it on another channel" (`channels-panel.tsx`:25-26), which is the 2026-06-11 wording, not the 2026-07-29 one that supersedes it.

### The web widget is the most finished thing here, and it is already a text surface

`components/widget-studio.tsx` (763 lines) is a real configurator: config sections on the left, live preview on the right, three preview modes Collapsed · Voice · Chat, an agent picker, and Get Code / Embed actions (`widget-studio.tsx`:143-206). It has four entry points, all reading one store:

- `WidgetStudio` at `/deploy/web-widget` (`app/(dashboard)/deploy/web-widget/page.tsx`:9)
- `WidgetStyleConfig` inline in the builder (`channel-section.tsx`:185)
- `WidgetPreviewCard` in the test panel (`components/wizard/test-panel.tsx`:223)
- `WidgetStudioEmbedded`, exported but not mounted

`lib/widget-config.ts` holds the contract: `interactionMode: "voice-chat" | "voice" | "chat"` (:14), theme, blob style, six brand colors, three semantic colors, input styling, four UI toggles, and four copy strings (:13-40). It persists per agent to `localStorage` key `sx:widget_cfg:<id>` (:96-97).

Two honesty problems sit in it.

1. **`interactionMode: "chat"` already ships a text-only agent.** The chat preview renders a full text conversation with an input placeholder (`widget-studio.tsx`:591-618). No Engine field backs it (§4). Task 868kyjfnv is therefore not "add text-only agents", it is "make the text-only agent we already draw real, or stop drawing it".
2. **The embed snippet points at a URL that does not exist.** `widgetSnippet` emits `<script src="https://cdn.agora.io/agent-widget.js" data-agent-id=…>` (`lib/widget-config.ts`:70-81). That URL returns **404**. The same fiction is in `channel-configs.tsx`:338-344.

### The "browser SDK" in the product is a package that does not exist

`CodeConfigure` tells the user to `npm install @agora/agent-sdk` and shows `import { AgentClient } from "@agora/agent-sdk"` with `client.joinChannel({ channel: "support-room" })` and `client.leaveChannel()` (`channel-section.tsx`:457-470, :495-496). `EmbedConfig` repeats it (`channel-configs.tsx`:306-315).

`@agora/agent-sdk` returns **404 from the npm registry**. The real packages are in §4. Task 868kykbf8 is partly a correction, not only an addition.

### Dead siblings that will be mistaken for the surface to extend

Four components look like the channel design and are reachable by nobody:

- `components/channel-hero.tsx` (157 lines): the three "Deploy <agent> to a channel" cards, plus `SipConnect`. `ChannelHero` is imported nowhere.
- `components/campaign-channel-badges.tsx` (39 lines): `ChannelBadge`, the icon-plus-label chip keyed on `ChannelKind`, including the WhatsApp and SMS icons. Imported nowhere.
- `components/agent-deployment-panel.tsx` (226 lines): the legacy Deploy step with a 2×2 channel chooser. `AgentDeploymentPanel` is imported nowhere.
- Through it, most of `components/wizard/channel-configs.tsx`: `CHANNELS` (:42-54, the four-way batch · inbound · code · web chooser), `InboundConfig`, `BatchConfig`, `EmbedConfig`, `WebWidgetConfig` are reachable only from that dead panel.

What is still live in `channel-configs.tsx` is `publishDeployment` (:64-109), the one shared go-live action that fires `deployment_went_live` plus `time_to_live_ms` and routes to Monitor. It is called from the dead panel (:77) and from the real wizard (`components/wizard/agent-wizard.tsx`:836). Its `channel` argument is a free-form string, and its `mode` is `"inbound" | "outbound" | "code"` (:80), so the north-star event cannot currently tell WhatsApp from a phone line.

### The outbound campaign lifecycle: what the wireframe has

`components/wizard/campaigns-card.tsx` (653 lines) is a managed list of runs, not a single config. Per run: name, language or region tag, phone number to dial from (with busy inbound lines shown disabled and the reason named, :468-474), the contacts CSV with a variable preview, launch timing, and dialing.

- `CampaignLaunchFields` (`components/wizard/step-call-settings.tsx`:129-192): Launch on deploy vs Schedule for later, then start date · start time · timezone.
- `CampaignDialingFields` (`step-call-settings.tsx`:196-276): call window (business 9-5 contact-local · extended 8-8 · anytime), free-entry max concurrent, retry unanswered (none · once · twice) with an interval select, and a capacity note.
- Rerun vs Duplicate: a rerun locks every field but the CSV and the timing so analytics aggregate across runs (`lib/wizard-draft.ts`:273-280, `campaigns-card.tsx`:403-421).
- Status vocabulary: `CampaignStatus = "draft" | "scheduled" | "running" | "completed"` (`wizard-draft.ts`:254), with a run filter over the same four (`campaigns-card.tsx`:193).
- Call dispositions exist as a 13-value map (`campaign-data.ts`:366-380), including voicemail, carrier-failed and max-retries.

Every batch deployment in the mock data is `channel: { kind: "telephony" }` (`campaign-data.ts`:1417, :1455, :1489, :1524, :1563, :1587). **Batch is telephony-only in the wireframe**, so "put one agent on WhatsApp, SMS, web and text" has no outbound half today.

### What is missing, plainly

- No WhatsApp surface, no SMS surface, no text-only agent type. Three redirect stubs and one data type.
- No single answer to "what is a channel". Six types, two identically named label maps.
- No channel in the north-star event, so a WhatsApp deployment going live would be indistinguishable from a phone one.
- No outbound channel other than telephony.
- The two code artifacts users are told to install (`@agora/agent-sdk`, `cdn.agora.io/agent-widget.js`) do not exist.

## Agora fact-check

Sources: `docs.agora.io/en/` (fetched 2026-09-17, markdown mirrors at `<page>.md`), the installed server SDK `agora-agents@2.4.0` at `/Users/shaktisoni/Documents/Agora Design & FE/ng-console/node_modules/agora-agents/dist/cjs/`, the npm registry, and the shipping Console at `/Users/shaktisoni/Documents/Agora Design & FE/ng-console/src/`.

### The engine has exactly one channel, and it is an RTC channel

`StartAgentsRequest.Properties` requires `channel: string`, `token: string`, `agent_rtc_uid: string` and `remote_rtc_uids: string[]` (`api/resources/agents/client/requests/StartAgentsRequest.d.ts`:74-81). Every agent joins an Agora RTC channel. The pipeline is `asr` + `llm` + `tts`, or `mllm` as "an exclusive alternative to the standard `asr` + `llm` + `tts` pipeline" (:95-101). `remote_rtc_uids` carries the note "Currently, only one user ID is supported" (:80).

Pricing confirms the unit: the billed line is the "**Conversational AI Engine Audio Task**" at "0.10" USD per minute with "First 300 minutes are free", and the footnote "You are charged the same price even if you bring your own key (BYOK)" (https://docs.agora.io/en/ai/reference/pricing, table under "Unit price"). Audio RTC is a separate 0.00099 per participant-minute line in the same worked example.

### WhatsApp: nothing. **Requires Engine**

`grep -ril "whatsapp" dist/` across `agora-agents@2.4.0` returns nothing. The AI documentation index (https://docs.agora.io/llms/ai.txt, 154 lines, every page in the section) contains no WhatsApp page. The release notes (https://docs.agora.io/en/ai/release-notes) contain no WhatsApp entry at any version. There is no sender field, no template-message field, no 24-hour-window field, no Business Account binding anywhere in the contract.

What does exist, and is the nearest primitive, is SIP: an imported number binds to a pipeline for inbound and for outbound separately (`UpdatePhoneNumbersRequest.d.ts`:17-19, `InboundConfig.pipeline_id` and `OutboundConfig.pipeline_id`). WhatsApp voice would either arrive over that SIP leg or need a new transport the contract has no word for. Nothing in the docs says which.

### SMS: nothing. **Requires Engine**

`grep -ril "sms" dist/` returns nothing. No SMS page in the AI index or the REST reference index (https://docs.agora.io/llms/api-reference-api-ref-conversational-ai.txt, 16 pages, all voice). SMS is also not a conversation the current pipeline can hold: it is asynchronous and turn-less, while `turn_detection` and `interruption` (`StartAgentsRequest.d.ts`:216-512) assume a duplex audio stream. This is a different runtime, not a channel toggle.

### Text-only agents: no path. **Requires Engine**

Three separate facts:

1. `channel` and `token` are required on join, so there is no way to start a pipeline without an RTC channel (`StartAgentsRequest.d.ts`:74-78).
2. `tts` is optional in the type (:96) but nothing documents a text-out mode, and the billed unit is an "Audio Task" (pricing, above). How a text-only agent would bill is unstated.
3. The closest thing to text in and text out already exists, and it is still voice-shaped: `agentThink` injects "custom instruction text to inject into the current conversation pipeline. The system processes this as user input" (`api/resources/agentManagement/client/requests/AgentThinkAgentManagementRequest.d.ts`:22-23), and `speak` broadcasts "The broadcast message text. The maximum length of the text content is 512 bytes" through TTS (`SpeakAgentsRequest.d.ts`:16). Both operate on a running audio agent.

`llm.input_modalities?: string[]` and `llm.output_modalities?: string[]` exist (`api/types/Llm.d.ts`:23-26, mirrored on `Mllm.d.ts`:21-24) with the doc gloss "LLM input modalities" and nothing more. `agentkit/types.d.ts`:367-369 gives the only examples: `["text"]`, `["text", "image"]`, `["text"]`, `["audio"]`, `["text", "audio"]`. These shape what the model reads and writes inside the pipeline. They are not a channel, and there is no documented `output_modalities: ["text"]` configuration that removes the audio leg.

### Browser SDK and widget: the SDK is real, the widget is not

The browser SDK exists and is named. https://docs.agora.io/en/api-reference/api-ref/conversational-ai/client-toolkit/web documents the **Web toolkit API**, installed as `pnpm add agora-agent-client-toolkit@2.9.0`, with `agora-agent-client-toolkit-react@2.9.0` for React. Both resolve on the npm registry; latest is **2.10.0**. Android and iOS toolkits are peer pages in the same index.

Its surface: `init` · `getInstance` · `subscribeMessage` · `unsubscribe` · `chat` · `interrupt` · `manualSOS` · `manualEOS` · `speak` · `think` · `destroy`. `chat(agentUserId, message)` takes `IChatMessageText | IChatMessageImage`, so **text in is a first-class browser call**, since v1.7.

The constraint that matters for the widget: `IConversationalAIAPIConfig` requires **both** `rtcEngine: IAgoraRTCClient` and `rtmEngine: RTMClient` (client-toolkit/web, `IConversationalAIAPIConfig`). A chat-only widget still stands up an RTC client and an RTM client. RTM is gated server-side by `advanced_features.enable_rtm`, with the note "make sure the token includes both RTC and RTM privileges" (`StartAgentsRequest.d.ts`:156-157), and transcripts travel on `parameters.data_channel: "rtm" | "datastream"` (:653-657, :722-727).

There is **no embeddable widget** in the documentation. No page, no CDN bundle, no script tag. `https://cdn.agora.io/agent-widget.js` returns 404. AI Studio's own answer to "put this agent somewhere" is a copyable REST call: "The **Embed** option provides a pre-configured API call with your agent's identifiers already populated", reached from the agent list's Action menu as "Embed Agent" (https://docs.agora.io/en/ai/studio/deploy/connect-agent). The snippet carries `name`, `pipeline_id`, `channel`, `agent_rtc_uid`, `remote_rtc_uids` and a token "valid for 24 hours". So the widget half of 868kykbf8 is **Requires Engine** (or requires someone to own a hosted bundle), while the SDK half is a naming correction plus a real integration story.

### Outbound campaigns: the contract exists, and it is richer than our wireframe

Two layers, and they disagree about what a campaign is.

**Engine layer, one call at a time.** `agora-agents@2.4.0` exposes a telephony resource with exactly four operations: `call` · `get` · `hangup` · `list` (`api/resources/telephony/client/requests/`). `CallTelephonyRequest` takes `sip.to_number`, `sip.from_number`, `sip.rtc_uid`, `sip.rtc_token`, an optional `pipeline_id` ("The unique ID of a published project in AI Studio") and `properties` (`CallTelephonyRequest.d.ts`:67-113). **One number per request. No list, no batch, no schedule, no retry policy, no concurrency cap anywhere in the contract.** `ListTelephonyRequest` filters by `number`, `from_time`, `to_time` and `type: inbound | outbound` (:8-28). Release notes date this: v2.0, November 15, 2025, "Telephony (Beta): This version adds an outbound calling feature that enables the conversational AI agent to initiate an outbound call", plus "A set of phone number management APIs" (https://docs.agora.io/en/ai/release-notes). Note that the public REST reference index for Conversational AI lists **no** telephony or phone-number endpoints (https://docs.agora.io/llms/api-reference-api-ref-conversational-ai.txt), and the URLs the search engine still indexes for them, `/en/conversational-ai/rest-api/telephony/{start,history,hang-up}`, all return 404. The primitive ships in the SDK and is undocumented in the current REST tree.

**Console layer, the real campaign.** The orchestration is Console-side, and it is already built. `ng-console/src/features/telephony/campaigns/` is 14,563 lines across 41 files. The editor contract, `CampaignCreateFormInput` (`campaign-editor-domain.ts`:26-60), is the honest scope of "the complete outbound campaign lifecycle":

`action: "draft" | "launch"` · `agentUuid` · `phoneNumberId` · `csvS3Key` · `csvFile` · `recipientCount` · `isSendImmediately` · `scheduledStartTime` · `timezone` · `scheduledTimeRangesConfig` (per weekday, several time ranges each, :3-13) · `concurrencyMaxLimit` · `callDelayIntervalMs` · `maxCallDurationSeconds` · `maxRingDurationSeconds` · `maxSilenceDurationSeconds` · `enableMaxSilenceHangup` · `enableEndOfConversation` · `enableVoicemail` · `enableFaxDetection` · `enableRecording` · `enableTranscript` · `enableSipTransfer` · `transferType: "number" | "sip"` · `transferPhoneNumber` · `transferDescription` · `transferHeaders` (constant or dynamic, :19-24) · `enableLlmCallEvaluation` · `llmCallSuccessCriteria` · `structuredEvaluations` · `systemEvaluationNames`.

The endpoints behind it (`ng-console/src/lib/telephony/telephony-api.ts`): list and create `/api/telephony/campaigns` (:511, :704) · get, update and delete `/api/telephony/campaigns/{id}` (:519, :716, :793) · `/publish` (:824) · `/interrupt` (:813) · `/duplicate` (:803) · `/upload-url` (:840) · `/csv` (:570) · `/template/export` (:562) · `/call-history` and `/call-history/export` (:531, :582) · `/summary` (:554) · `/redial/export` (:592). Statuses: editable `draft`, `scheduled`; results `active`, `completed`, `failed`, `interrupted`, `running` (`campaign-domain.ts`:38-45).

The published documentation matches (https://docs.agora.io/en/ai/studio/deploy/campaign): "Maximum file size is 25 MB, with a maximum of 50,000 rows"; `phone_number` required in E.164; other columns "become variable names available in your **Prompt** configuration"; "To override agent settings per contact, add columns like `prompt_override`"; Schedule Campaign or Save as Draft; Action menu Edit, View Results, Delete. It carries a compliance callout naming TCPA, written consent, business identification, a callback number, immediate honouring of do-not-call requests and "calling hour restrictions (8 AM to 9 PM in the recipient's time zone)".

Three consequences for the design.

- Our wireframe's **retries** (`retries`, `retryIntervalMin`, `campaigns-card.tsx` via `step-call-settings.tsx`:240-270) exist in neither the Console contract nor the docs. The Console's answer is `/redial/export`, a file you take away. Shipping a retry select would fake a capability. **Requires Engine** if it is wanted as a control.
- The Console has **`concurrencyMaxLimit` and `callDelayIntervalMs`**, which our wireframe half-has (max concurrent, no delay) and the public campaign doc does not mention at all.
- The Console has a large set of controls our wireframe does not draw: ring seconds, silence seconds, voicemail detection, fax detection, transfer to human with SIP headers, post-call structured evaluation, per-weekday call windows. "Complete the lifecycle" mostly means **catching the wireframe up to the Console**, not inventing.

Campaigns are also **telephony-only by construction**: the module lives under `features/telephony/`, the caller identity is a `phoneNumberId`, and the CSV key is `phone_number`. Nothing in the contract accepts a WhatsApp sender or an SMS long code.

### Number-to-agent binding is one-to-one, per direction

`AddPhoneNumbersRequest` takes `provider: "byo" | "twilio"`, `phone_number`, `label`, `inbound?: boolean`, `outbound?: boolean`, plus `inbound_config.allowed_addresses` and `outbound_config.{address, transport, prefix}` (`AddPhoneNumbersRequest.d.ts`:34-82). `UpdatePhoneNumbersRequest` then binds **one `pipeline_id` for inbound and one for outbound** (:13-35). The Console form agrees: `PhoneNumberFormInput.agentId: string`, singular (`ng-console/src/lib/telephony/phone-number-contracts.ts`:11). The docs call it "Associate Agent" and "Assign to Agent" in an Inbound Settings panel (https://docs.agora.io/en/ai/studio/deploy/inbound). Agora sells no numbers: "**Vendor**: Select `SIP Trunk` (currently the only supported vendor)" (https://docs.agora.io/en/ai/studio/deploy/import).

So "one agent ↔ one channel" is, at the contract level, already "one number ↔ one agent, per direction". The lock and the API are not in conflict for telephony. They have nothing to say about the three new channels, because the three new channels do not exist in the API.

### Summary of Requires Engine

| Task | Field or endpoint today | Verdict |
|---|---|---|
| WhatsApp voice | none, at any version | **Requires Engine** |
| SMS as a channel | none, and the turn model does not fit | **Requires Engine** |
| Text-only agents | `llm.input_modalities` / `output_modalities` only; `channel` + `token` still required on join; billing unit is an audio task | **Requires Engine** |
| Browser SDK | `agora-agent-client-toolkit@2.10.0` (+ `-react`), documented Web toolkit API | **Ships today** |
| Embeddable widget | no page, no bundle; Studio's "Embed Agent" is a REST snippet | **Requires Engine**, or an owner for a hosted bundle |
| Outbound campaign lifecycle | `POST /telephony/call` per contact, plus the Console's own `/api/telephony/campaigns/*` | **Ships today**, minus retries |

## Already decided

- **The current lock is 2026-07-29 (v6), not 2026-06-11.** The tracker cites the older wording. The sequence: 2026-06-11 set "one agent ↔ one channel" and dropped multichannel (`LEARNINGS.md`:508, `references/ia-revamp-agent-vs-deployment.md` §9). 2026-07-28 (v4) **reversed** it to a multi-select (`LEARNINGS.md`:521). 2026-07-29 (v6) reversed it back, emphatically: "**CHANNEL IS ONE CHOICE** … top-level multi-select was **NEVER asked for**. Multi-select lives ONLY INSIDE Inbound as **surfaces** (phone + web widget together; WhatsApp/Telegram soon). **Web widget is part of Inbound**, never a peer channel." (`LEARNINGS.md`:523, item 1). The lock has been litigated twice and re-affirmed once. Re-opening it needs a reason neither round produced.
- **Inbound XOR outbound**, from the owner's dealership example: "one agent cannot handle both", enforced on every write path by `enforceDirection()` (`LEARNINGS.md`:522 item 1, `lib/wizard-draft.ts`:62-70).
- **The word "Channel" was retired as a section label** on 2026-07-30 after a five-platform vocabulary check: "**none uses 'Channel'** (the industry word for phone · web · SIP/code is Deploy/Deployment)". The locked labels are Voice & Models · Deployment · Prompt & knowledge · Test · Go Live (`LEARNINGS.md`:526). This feature's own tracker name collides with that decision.
- **Campaign editing lives only in Go Live.** The Deployment section's batch state is "a read-only roll-up with doors into it, not a second editor" (`components/wizard/channel-section.tsx`:33-42).
- **Rerun keeps the config locked; Duplicate is the editable copy** (`LEARNINGS.md`:522 item 3).
- **North star: first live deployment carrying traffic, then first paid usage.** Publishing earns Agora $0 (`CLAUDE.md` "Don't re-litigate", `LEARNINGS.md`:427). The activation line is Believe then **Connect**: "put it on traffic: campaign / number / widget" (`LEARNINGS.md`:433). A new channel only counts when it carries minutes.
- **Agora sells no numbers.** Telephony is BYO SIP (`LEARNINGS.md`:513 fact-check 2). The 07-29 roadmap read reverses this for purchased numbers (feature 16), but not for the channels in this brief.
- **The pricing fact.** Flat $0.10 per agent-minute, the same with BYOK. Never design a control whose premise is that a channel choice moves the Agora bill.
- **Copy discipline (2026-08-10):** no new UI text without asking; one short line under a control at most; explanations behind InfoHint or `title`. Every string this feature adds gets proposed in `05-directions.html` first.
- **Honesty floor.** "Not supported by <vendor>" is a real state. Three of the five tasks in this brief have no contract, so the design's first job is saying so on the surface, not hiding it.

## Open questions for the owner

This is a ⚠ lock feature, so this section is the brief.

### 1. Does "one agent ↔ one channel" survive three new channels?

Reframed by what §3 and §4 found: the lock is not really about channels. It is an **intent** radio (Inbound · Batch · Code) with a **surface** multi-select inside Inbound that already prints "WhatsApp · Telegram · soon". Three answers are actually available.

**A. Keep the lock. WhatsApp and text join the inbound surface list; SMS does not.**
The surface list grows from two to four: Phone number · Web widget · WhatsApp · Telegram. Text-only becomes a property of the web widget, which already has `interactionMode: "chat"`. Nothing new is invented, `enforceDirection` is untouched, and the "soon" line becomes real. What it costs: SMS has no home, because SMS is asynchronous and inbound-surface semantics assume a live session. SMS would have to wait for the Engine, or be declared out of scope for this wave, and outbound on WhatsApp stays impossible because Batch is telephony-only.

**B. Keep the lock for intent, add a channel dimension to Batch.**
Batch grows a "dial from" that can be a phone number **or** a WhatsApp sender **or** an SMS sender, so the outbound half exists. The radio still allows one intent; the channel becomes a property of the deployment, which is what `campaign-data.ts`'s `Channel` union has modelled since 2026-06-11. What it costs: the Console's campaign contract is telephony-shaped end to end (`phoneNumberId`, `phone_number` CSV column, ring seconds, voicemail detection). A WhatsApp campaign needs a parallel contract nobody has written, and every one of those call-settings toggles becomes "Not supported on this channel".

**C. Break the lock. Deploy grows a channel matrix: one agent, many channels, per-channel overrides.**
The Fin model this IA was derived from does exactly this, and `references/ia-revamp-agent-vs-deployment.md` §1 cites it. What it costs: it reverses the 07-29 lock for the third time in six months, reopens inbound XOR outbound, and multiplies every downstream surface, preflight, Monitor, session history, the north-star event, by the number of channels. It also cannot be honest yet, because two of the three channels it would display have no API.

**Recommendation: A now, B as the stated next step, C not at all in this wave.**
A is the only option that ships something true. It reuses the surface list the owner already designed a door into, it makes the "soon" line honest by dating it, and it costs no reversal. B is the right answer for outbound, but it should follow a written Engine contract rather than precede one, because the first thing a WhatsApp campaign needs is a sender identity and a message-window rule, and neither exists. C buys reach we cannot deliver and pays for it with the third reversal of a lock the owner has already settled twice.

The design under A states "Not supported by Agora yet" as a first-class state on WhatsApp, SMS and text, with the Engine ticket named on each, the same idiom 07 used for the disabled Test failover row.

### 2. Is "Channels" still the name of this feature?

2026-07-30 retired "Channel" as a label after checking Vapi, Retell, ElevenLabs, OpenAI and Anthropic, and locked **Deployment** in its place (`LEARNINGS.md`:526). The tracker task is called "Channels", the Resources tab is called "Deployment Channels", and the builder section is called "Deployment".

- **Keep "Channels" for the tracker only**, and ship nothing with that word on it. Cheapest, but the mismatch will keep producing surfaces named after the tracker.
- **Rename the feature "Deployment surfaces"** and rename the Resources tab to match. Costs one rename, ends the drift.
- **Reverse the 07-30 decision** and use "Channels" throughout. Needs a reason the five-platform check did not find.

### 3. SMS is a different runtime. Do we design it, or park it?

SMS has no field, no page, no release note, and does not fit `turn_detection`. The design can either draw the surface it would have and mark it inert (the pattern 07 used for the Backup providers row, which shipped with a `Requires Engine · Nov` caption and a disabled action), or leave it out and say in the tracker that it is Engine-blocked.

- **Draw it inert.** The owner sees the shape, the Engine team sees the ask, and the row carries a date once there is one. Risk: an inert row on a P0 task reads as done to anyone skimming.
- **Park it.** Honest, and it keeps the P0 pressure on the Engine ticket where it belongs. Risk: the wave ships with a P0 untouched.

### 4. Who owns the embeddable widget bundle?

The SDK half of 868kykbf8 ships today as `agora-agent-client-toolkit`. The widget half needs a hosted script at a real URL, and the one our product already prints, `cdn.agora.io/agent-widget.js`, is a 404 we are showing to users right now.

- **Agora hosts it.** Then the widget is a real product and this task is a build, not a design.
- **We ship a React component, not a script tag**, on top of `agora-agent-client-toolkit-react`. Smaller promise, deliverable, and it matches what the docs already support.
- **Neither yet.** Then the immediate design job is to stop emitting the fake snippet and replace it with the toolkit install plus the "Embed Agent" REST call Studio already documents.

Whichever answer, **the fake package name and the fake CDN URL come out in the first slice**. That is not a channel decision, it is a correction.

### 5. Does the campaign lifecycle catch up to the Console, or extend past it?

The Console already has scheduled per-weekday windows, concurrency, call delay, ring and silence limits, voicemail and fax detection, SIP transfer with headers, and post-call evaluation. Our wireframe has roughly a third of that, plus a retry control the contract does not have.

- **Catch up.** Port the Console's real fields into the Go Live run editor, drop retries or relabel them as the export that actually exists. Lowest risk, and it makes the wireframe usable as a spec.
- **Catch up and add the one thing nobody has: pause and resume.** The Console has `/interrupt` but no resume, and `interrupted` is a terminal status (`campaign-domain.ts`:39-45). A paced or paused run needs a way back. This is the only genuine whitespace in the lifecycle.
- **Leave it at P2 and spend the wave on the three channels.** Defensible on priority, but then the one task in this feature with a real contract is the one we skip.

### 6. Which taxonomy wins?

Six channel types, two `CHANNEL_LABEL` constants. Any new channel makes this worse. Before a single new surface is drawn, one of these has to be the source.

- **`ChannelKind` (`campaign-data.ts`:21)** already names telephony · whatsapp · sms · web, and is closest to the transport the Engine would eventually carry.
- **`InboundSurface` (`wizard-draft.ts`:37)** is the one the locked IA actually uses, and option A in question 1 grows it.
- **A new single type** that both collapse into, with the other five deleted or derived.

The answer changes every file this feature touches, so it belongs in stop 0, not in the prototype.
