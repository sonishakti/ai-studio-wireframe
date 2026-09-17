# 18 · Channels · competitor teardown from public docs (2026-09-17)

Stop 2, docs half. The product half is captured separately by a browser agent from the shot list at the
end of this file.

The question asked of every vendor, in the words of the tracker JTBD: **can one agent serve WhatsApp, SMS,
web and text, and if so, is the channel a property of the agent, of the number, or of the run?** Then the
three sub-questions the brief's §6 turns on: where does a text-only agent live, who hosts the widget, and
what does the outbound lifecycle actually expose.

Five vendors. Four are the standing set. The fifth is Intercom Fin, added because it is the only product
whose shipped feature *is* this JTBD (one agent answering on chat, email, WhatsApp, SMS, Slack and phone),
and because `references/ia-revamp-agent-vs-deployment.md` §1 already derives our Agent / Deployment split
from it. Reading its channel surface is cheaper than re-deriving the split.

Sources are public documentation only, fetched 2026-09-17. Markdown mirrors at `<page>.md` where the vendor
publishes them.

---

## Vapi

**Where it lives.** There is no channel section. Vapi has one `assistant` object and four ways to reach it,
each documented in a different part of the tree: `/quickstart/phone`, `/quickstart/web`, `/chat/*` and
`/outbound-campaigns/*`. The dashboard nav that matches is **Phone Numbers**, **Campaigns**, **Session
Logs**. Chat, SMS and the web widget all sit under **Chat** in the docs, not under the assistant.

**Text.** `POST /chat` takes `assistantId`, `input`, and `previousChatId` or `sessionId`
(https://docs.vapi.ai/chat/quickstart, https://docs.vapi.ai/chat/session-management). The same assistant
serves voice and text. There is no text-only flag and no separate chat agent: text is a transport, not an
agent type. The honest limit is stated at the top of the quickstart: server webhook events such as status
updates and end-of-call reports are **"not supported"** for chat.

**SMS.** Surface name **SMS chat** (https://docs.vapi.ai/chat/sms-chat) plus **Inbound SMS** on the number
(https://docs.vapi.ai/phone-numbers/inbound-sms). The whole control is one boolean, `smsEnabled`, on an
imported Twilio number, default true, plus the assistant assigned under Inbound Settings. Three refusals,
stated as a Limitations list: 10DLC-approved Twilio numbers only, **"Twilio only"**, and
**"Assistants cannot send the first message"**. Inbound SMS is US to US only. Sessions expire after 24
hours of inactivity and a new text opens a fresh one.

The rainy state is documented and is the one to copy the shape of but not the behaviour: a usage-based org
without a saved payment method still receives the message and still gets a session, but Vapi
**"does not send a reply or show an error in the Dashboard."** A silent failure with a row in the log and
no reason on it.

**WhatsApp.** None. `whatsapp` appears zero times in the full documentation index
(https://docs.vapi.ai/llms.txt, 441 lines, fetched 2026-09-17).

**Widget.** A web component, not a console surface: `<vapi-widget>` loaded from
`https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js`, or the React `VapiWidget`
(https://docs.vapi.ai/chat/web-widget). Configured entirely by HTML attributes: `public-key`, `assistant-id`,
`mode` (`voice` or `chat`), `theme`, `size`, `radius`, `position`, four colour attributes, six copy
attributes, `require-consent` and `terms-content`, `show-transcript`. Nothing is stored server side, so
there is no dashboard page to screenshot and no origin allowlist. HTTPS is required in production.

**Outbound.** **Campaigns**, a real dashboard object (https://docs.vapi.ai/outbound-campaigns/overview,
https://docs.vapi.ai/outbound-campaigns/scheduling-and-lifecycle,
https://docs.vapi.ai/outbound-campaigns/contact-data). Fields: `name`, `assistantId`, `phoneNumberId`,
`maxConcurrency`, `schedulePlan.earliestAt`, `schedulePlan.latestAt`, `customers[]`. CSV: lowercase
`number` required, lowercase `name` optional, every other column becomes a dynamic variable. Limits: 10,000
rows, 5 MB, name 40 characters, 100,000 characters of serialized variables per contact, Dashboard schedules
**up to seven days ahead in 15-minute increments** with one named time zone per campaign.

What Vapi refuses: **"campaigns do not have a saved draft state"**, configuration is read-only after
creation, `PATCH` accepts **"a status-only cancellation"** and nothing else, `DELETE` archives rather than
deletes, and the only way to run again is **Duplicate campaign**. There is no pause, no resume, no edit, no
rerun. Contact statuses: pending, dispatched, completed, failed, skipped, pre-dial failed. Concurrency is
shared with inbound and **does not reserve** slots. The one control nobody else has is the **pre-dial
webhook**, called immediately before each dial, which returns `eligible: false` to skip a contact whose
consent changed since the campaign was scheduled.

Telephony only. Every field in the object is a phone field.

---

## Retell AI

**Where it lives.** Retell's answer to text is a **second agent object**. The Agents page has a
**Create an Agent** dropdown with **Voice Agent** and **Chat Agent**
(https://docs.retellai.com/build/create-chat-agent). Chat agents have their own CRUD, their own versions and
their own publish endpoint (`Create Chat Agent`, `List Chat Agents`, `Publish Chat Agent`,
`Create Draft Chat Agent Version`, https://docs.retellai.com/llms.txt).

**Text.** A chat agent shares prompt, functions, knowledge base, webhooks, security and Post Chat Extraction
with a voice agent, and adds a **Chat Settings** section with two fields: auto-close inactive chats
(`end_chat_after_silence_ms`, 2 minutes to 72 hours, API default 1 hour) and an optional auto-close message.
The workflow slots are renamed **pre-chat** and **post-chat**. Billing changes with the object: chat is
**per agent message**, voice is per minute (https://docs.retellai.com/test/testing-pricing).

The migration path is a one-way copy in both directions. **Convert to Chat Agent** in the voice agent's More
options menu creates a new chat agent and leaves the original untouched; conversion deletes what text cannot
carry, named explicitly: call transfer including bridge and cancel, press digit, mid-call SMS, and the voice,
speech, transcription and call settings. **Convert to Voice Agent** exists on the chat agent. Custom LLM is
voice only, so a custom-LLM agent cannot become a chat agent at all.

**SMS.** Surface name **Enable SMS** (https://docs.retellai.com/deploy/enable-sms), and it is an approval
queue, not a toggle. The add-on sits under **Advanced Add-Ons** on the phone number page and starts a
three-step A2P 10DLC application: business profile (free), brand ($4 low-volume or $45 standard), campaign
($15, non-refundable). **"The entire application takes around 2-3 weeks"**, manually reviewed by the
telephony provider. Approved, the add-on is $20 per month per number plus $0.01 per SMS. US numbers only,
toll-free excluded, Telnyx not supported. Low-volume caps at 6,000 message segments a day.

Three details worth stealing. Rejection **cascades downward**: a rejected business profile marks its brand
and every campaign under it rejected, with the profile's reason attached, and
**"until the brand is approved or pending, the campaign controls stay disabled."** The brand type is
read-only once registered. And the application form itself is the surface (use case, description, opt-in
explanation, two sample messages, privacy and terms URLs), with a dedicated docs page on how to fill it in
(https://docs.retellai.com/deploy/sms-campaign-application).

Once approved, the phone number page grows **Inbound SMS agent** and **Outbound SMS agent** selectors, each
taking a chat agent, sitting directly under the call agent fields. One number therefore binds up to four
agents: inbound call, outbound call, inbound SMS, outbound SMS.

**WhatsApp.** None, and Retell says so in a Note on the chat agent page:
**"Retell has no built-in integrations with third-party chat platforms such as WhatsApp or Messenger."**
Beyond the widget and SMS you connect your own channel through the chat API. `whatsapp` appears zero times
in the documentation index.

**Widget.** One `<script>` tag from `https://dashboard.retellai.com/retell-widget-v2.js`
(https://docs.retellai.com/deploy/chat-widget), in two modes: **Chat & Voice Widget** and **Callback
Widget**. The interesting part is the agent binding: `data-agent-id` takes a **chat** agent,
`data-voice-agent-id` takes a **voice** agent, and **"when both are set, the widget displays a chooser
screen letting users pick between voice and chat."** One surface, two agent objects, a user-facing picker
between them. Twenty attributes cover title, logo, three colours, FAB text, bot name, popup message and
delay, auto-open, dynamic variables, agent version pinning, a white-label token and a reCAPTCHA v3 site key.
Public keys carry allowed domains (https://docs.retellai.com/accounts/public-keys). The **Callback Widget**
collects a number and places a phone call instead of opening a chat, so the widget is also a door into
telephony.

**Outbound.** **Batch Call**, its own tab (https://docs.retellai.com/deploy/make-batch-call). Name, From
Number, CSV with a phone number column, a time-window modal, and one control nobody else has:
**Reserved Concurrency for Other Calls**, where you set how many slots to hold back for inbound and the
batch runs on the remainder, with the derived value shown beneath as
**"Concurrency allocated to batch calling."** Minimum 1, maximum your limit minus 1. Statuses: **Draft**
(editable, unsent), **Planned** (scheduled, **"cannot be edited once scheduled"**), **Ongoing**, **Sent**.
Metrics: Sent, Picked Up, Successful. No pause and no resume.

Per-contact overrides are CSV columns: `override agent id`, `override agent version`, `metadata`,
`custom_sip_headers`, plus `ignore e164 validation` for custom telephony only.

**One surface they have and nobody else does: Contacts.** `List Contact Conversations` merges a contact's
inbound calls, outbound calls and chats **"into a single timeline, most recent first"**, matched by phone
number (https://docs.retellai.com/conductor/contacts). The person is the record; the channel is a column.

---

## ElevenLabs (Agents Platform)

The only vendor that has actually shipped this job. It is also the vendor whose vocabulary our 2026-07-30
lock ruled out.

**Where it lives.** Inside the agent, in a section named **Channels**. The Custom Channel page opens with
**"Open your agent, select Channels"** (https://elevenlabs.io/docs/eleven-agents/customization/integrations/custom_channel),
and the widget page places its modality setting in the dashboard under **Channels · Widget · Interface**
(https://elevenlabs.io/docs/eleven-agents/customization/widget). Alongside it, an **Agent behavior** panel
holds **Channel behavior** (https://elevenlabs.io/docs/eleven-agents/customization/channel-behavior).

**Per-channel overrides, sparse.** `conversation_config.agent.text_behavior_overrides` is a map from channel
to the settings you want to change, and **"a channel uses its defaults for any setting you leave unset."**
Three settings only: **Verbosity** (Auto · Concise · Thorough), **Output format** (Plain text · Markdown),
**Response time** (`interaction_budget`: Realtime · 5 min · 10 min · 1 hour). Each channel ships tuned
defaults, and the dashboard shows the effective default next to the override. Slack defaults to thorough and
Markdown with a long budget; the widget defaults to plain text and realtime.

The line that answers our brief's hardest question is in the same page:
**"Voice conversations are not affected: they always use behavior tuned for live calls"**, and
**"WhatsApp channel behavior applies to text messages only. WhatsApp calls are voice conversations and use
voice behavior."** One binding, two runtimes, and the product says which one you are configuring.

**Text-only.** One toggle, **Text only**, in the agent's **Advanced** tab, backed by
`conversation_config.conversation.text_only`, plus a per-session runtime override
(`overrides: { conversation: { textOnly: true } }`)
(https://elevenlabs.io/docs/eleven-agents/guides/chat-mode). Not an agent type, not a channel. A mode with a
session-level escape hatch.

**WhatsApp.** A top-level page at `https://elevenlabs.io/app/agents/whatsapp` and five doc pages
(https://elevenlabs.io/docs/eleven-agents/whatsapp and its children). You click **Import account**, run
Meta's OAuth, and land on the account settings page where you **assign an agent**. If you do not:
**"inbound messages will be ignored and inbound calls will be rejected. However, you will still be able to
make outbound calls."** Three account toggles: **Enable messaging**, **Enable audio message response**
(voice notes answered with voice notes in the agent's voice, falling back to text if generation fails),
**Enable typing indicator**.

Inbound handles text, voice notes (transcribed in, synthesized out), images, documents, stickers, location
and contacts, plus quoted replies, emoji reactions, template button taps and interactive list replies.
Conversations close on the End conversation tool, Max conversation duration, or a **15-minute inactivity
timeout** measured from the agent's last response, and the configured farewell message is sent first.

Outbound is where WhatsApp stops being a channel toggle
(https://elevenlabs.io/docs/eleven-agents/whatsapp/outbound). An agent
**"can only send free-form WhatsApp messages inside an active conversation"**, so reaching someone first
means sending a Meta-approved **message template**, created and approved in WhatsApp Manager, not in
ElevenLabs, categorised Utility · Marketing · Authentication, each priced and rate-limited differently by
Meta. **"A template that is pending or rejected cannot be sent: the API accepts the request but Meta never
delivers the message."** Sending a template starts the conversation but **the agent stays silent until the
user replies**, and no timer starts until then. Outbound *calls* need a template carrying a **call
permission request** component, and ElevenLabs resolves three states: already granted (call placed), not yet
requested (permission template sent, call placed on approval), declined (conversation recorded as failed
with the reason). Recipient IDs are digits only, and the docs warn the WhatsApp user ID differs from the
dialed number in Mexico and Brazil.

Stated limitations: no WhatsApp Flows, no inbound video, no message batching (**"the agent replies to each
message individually"**), no import of a number registered with another provider or active in the WhatsApp
Business app, no WABAs created under a developer app, no ad-referral metadata, and human handoff
**"coming soon"**.

**SMS.** Thin by comparison (https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/sms-conversations):
import a Twilio number that supports SMS, assign an agent on the **Phone Numbers** page, done. One honest
gotcha: **"Phone numbers you imported before SMS support are not automatically enabled for SMS"**, so you
re-import. Verified caller IDs are outbound only.

**Widget.** `<elevenlabs-convai agent-id="...">` plus a script from `@elevenlabs/convai-widget-embed`
(https://elevenlabs.io/docs/eleven-agents/customization/widget). Three modality modes set in the dashboard:
**Voice only** (default), **Voice + text**, **Chat Mode**. Attributes cover `variant`, `dismissible`,
`server-location`, avatar image and two orb colours, six copy strings, and
`markdown-link-allowed-hosts` (links render as plain text by default **"to prevent phishing"**). Security is
a dashboard **Allowlist** in the **Security** tab, and the widget
**"currently requires public agents with authentication disabled"**.

**Other channels in the same list.** Slack, Telegram, Zendesk, Intercom, Freshdesk, Genesys, Five9, Microsoft
Teams (as a widget tab), and **Custom Channel** (alpha): you paste a **Reply Webhook URL**, receive an
**Inbound Webhook URL**, an **Inbound Secret** and an **Outbound Signing Secret**, and post
`{data:{type:"user_message", text, user_identifier}, user_message_id, conversation_id?, dynamic_variables?}`.
Text only, no attachments, not available under zero-retention mode. This is the pattern for a channel the
vendor has not built: a documented door rather than a greyed row.

**Outbound.** **Batch calling** at `https://elevenlabs.io/app/agents/batch-calling`
(https://elevenlabs.io/docs/eleven-agents/phone-numbers/batch-calls). Name, phone number, agent, CSV or XLS
with a mandatory `phone_number` column, send immediately or schedule with a date, time and time zone. Four
CSV headers are per-contact config overrides (`language`, `first_message`, `system_prompt`, `voice_id`) and
the batch **fails** if they are passed while the agent's security settings do not mark them overridable.
Concurrency is not a field: batches take
**"the minimum of either 50% of your workspace's concurrency limit or 70% of your agent's concurrency
limit"** so capacity stays free for inbound and widget calls. You may **Test call** one recipient before
submitting. Zero-retention mode cannot be used with batch calls at all. The API has cancel, **retry**,
export and delete, but no pause and no resume.

The batch object is not telephony-only. It takes `whatsapp_params`: **"provide the phone number ID and the
call permission request template once, and a `whatsapp_user_id` per recipient."** There is still
**"no native batch endpoint for outbound messages"**, so a template campaign is one API call per recipient
inside Meta's messaging limits.

---

## LiveKit (Agents)

**Where it lives.** Nowhere, by design. The agent has no channel concept: every client, phone call and
connector **joins a room as a participant** (https://docs.livekit.io/llms.txt). Channel identity is the
participant `kind`, which is `SIP` for a phone call and `CONNECTOR` for WhatsApp. The Agent Builder, the
no-code console surface, has Instructions, Data collection, Welcome greeting, Models, Actions, Variables,
Secrets and Call ending, and **no deployment or channel section at all**
(https://docs.livekit.io/agents/start/builder.md).

**Text.** Two mechanisms, both in code. Session level: start with `audio_input=False, audio_output=False`,
or toggle mid-session with `session.input.set_audio_enabled()` and `session.output.set_audio_enabled()` for
hybrid sessions (https://docs.livekit.io/agents/multimodality/text.md). Prompt level, and this is the finding
that travels: **Modality-aware instructions** (https://docs.livekit.io/agents/multimodality/instructions.md).
An `Instructions` object holds an `audio` variant and a `text` variant of the system prompt, the framework
**applies the matching variant per turn**, and the `text` variant is optional and falls back to `audio`. The
reason given is exact: spoken input arrives as imperfect transcription with relative expressions and
self-corrections, typed input is literal, and voice instructions
**"can degrade text responses by adding spoken-style confirmations or stripping useful formatting."** Beta
in Python, stable in Node.

**WhatsApp.** A **Connector**, voice calls only
(https://docs.livekit.io/telephony/connectors/whatsapp.md). LiveKit Cloud only, self-hosted not supported.
You bring a WhatsApp Business number, a Cloud API access token, a Meta developer app, and
**an app of your own that receives Meta's webhooks**, because the connector does not: Meta posts the call
connect webhook with the SDP to you, and you pass it to `ConnectWhatsAppCall`. `DialWhatsAppCall` takes
`WhatsAppPhoneNumberId`, `WhatsAppToPhoneNumber` (country code, no `+`), `WhatsAppApiKey`,
`WhatsAppCloudApiVersion` (23.0 to 26.0), optional `DestinationCountry`, `Agents`, `ParticipantMetadata`,
`ParticipantAttributes`, `RingingTimeout`. Outbound is region-limited by Meta and needs explicit user
permission. There is **no messaging API** in the connector: the overview mentions sending a follow-up text
as a use case, and nothing in the reference sends one.

**SMS.** None. `sms` appears zero times in the telephony documentation index
(https://docs.livekit.io/telephony/llms.txt, 41 pages).

**Widget.** The most considered of the five: **Agent Embed Widget**
(https://docs.livekit.io/agents/start/embed.md), configured on the agent's page in the Cloud dashboard
behind an **Embed** button with two tabs. **Install** holds **Allowed origins** and the **Embed widget**
toggle; **Settings** holds theme, button colour, icon and capabilities. The order is enforced:
**"You must add at least one origin before you can enable the widget"**, origins are exact or
leading-subdomain wildcards with no full `*`, and if the snippet is copied elsewhere
**"the widget receives no token and doesn't load."** Enabling needs the **Write** role, and the widget
**"doesn't take effect until you save."**

Capabilities: **voice is always on**, camera, screen share and text chat are toggles, and
**"capabilities are enforced by LiveKit Cloud, so snippet attributes can't enable a capability that's
disabled in the dashboard."** Two configuration layers, stated as such: the dashboard sets defaults for
every placement, snippet attributes override them per placement and are the only way to pass per-user data,
which the dashboard deliberately does not store (`data-lk-identity`, `data-lk-name`, `data-lk-metadata`,
`data-lk-job-metadata`, `data-lk-attrs`). Limitations are listed: Cloud agents only, one widget per page,
classic `<script>` only, and the snippet cannot change the room name or dispatch.

**Outbound.** No campaign object. `CreateSIPParticipant` places one call
(https://docs.livekit.io/telephony/making-calls.md). Batching, scheduling, retries, contact lists and
dispositions are yours to build. The related feature they do ship is **answering machine detection**
(https://docs.livekit.io/telephony/features/answering-machine-detection.md).

---

## Intercom Fin (the fifth, and why)

Added because the tracker JTBD is Fin's shipped product, and because our Agent / Deployment split already
cites it. One agent, deployed per channel, from one screen: **Fin AI Agent › Deploy**
(https://www.intercom.com/help/en/articles/13377077-choose-channels-to-deploy-fin-ai-agent). The channel
list: Messenger (web, iOS, Android), Email, Phone (Fin Voice), WhatsApp, Facebook Messenger, Instagram, SMS,
Slack. It is a multi-select with an explicit rollout posture: start with one channel, watch it, add more.

Two things it does that no voice vendor does. **Channel-specific guidance**: the same agent gets different
tone, behaviour and escalation rules per channel, expressed as targeting on the current channel, so the
override is a rule and not a second prompt. And **per-channel workflows**, so greeting, routing and
auto-close differ per channel from one agent.

Its limits are the same physics everyone else hits and Fin names them in the console's own help: WhatsApp
has a 24-hour reply window and needs pre-approved templates outside it, and it is common to auto-close
WhatsApp conversations inside that window; SMS replies cap at 1,600 characters per message; Fin Voice is
gated to selected customers on US, EU and Australia workspaces.

---

## The comparison, on the six dimensions that decide our design

| | **Vapi** | **Retell** | **ElevenLabs** | **LiveKit** | **Fin** |
|---|---|---|---|---|---|
| **Where a channel is configured** | Nowhere. Transport is chosen by which API you call | On the **number** (4 agent slots) and on the widget script | Inside the agent, section named **Channels**, plus an **Agent behavior** panel | Nowhere. Participant `kind` in a room | **Deploy**, one multi-select on the agent |
| **One agent across channels?** | Yes, implicitly | **No.** Voice agent and chat agent are separate objects, converted one way at a time | **Yes**, with sparse per-channel overrides | Yes, but there is no channel to select | **Yes**, with per-channel guidance |
| **WhatsApp** | None | None, said out loud | Import account, assign agent, **messages and calls**, templates for anything outbound | **Connector, voice calls only**, Cloud only, you host the webhook | Messages, inside the 24-hour window |
| **SMS** | `smsEnabled` on a 10DLC Twilio number, **inbound only**, US to US | An **A2P application**: 3 approvals, $4 or $45 plus $15, 2-3 weeks, $20/mo per number, US, no toll-free | Re-import a Twilio number, assign an agent | None | Yes, 1,600 characters per reply |
| **Text-only agent** | No such thing. Text is a transport on the same assistant | A **Chat Agent** object with its own versions and per-message billing | A **Text only** toggle in Advanced, plus a per-session override | `audio_input/output=False`, plus **per-modality system prompts** | Channel property |
| **Widget** | Web component, attributes only, no server state, no origin list | One script, **two agent ids**, user picks voice or chat; public key carries allowed domains | `<elevenlabs-convai>`, three modality modes, **Allowlist** in Security, public agents only | Dashboard **Embed**: allowed origins required **before** enabling, capabilities enforced server side, two config layers | Messenger |
| **Outbound at scale** | **Campaigns**: 10k contacts, 7-day horizon, **no draft, no edit, no pause**, cancel or duplicate, pre-dial webhook | **Batch Call**: Draft · Planned · Ongoing · Sent, **reserved concurrency for inbound**, no pause | **Batch calling**: auto concurrency, test-one-first, per-contact overrides, cancel and **retry**, **also runs on WhatsApp** | One SIP participant per call. Build it yourself | Not an outbound product |

---

## What nobody does

**Nobody lets you pause a run and pick it back up.** Vapi is read-only the moment a campaign exists and
offers cancel, archive and duplicate; Retell freezes a batch at **Planned**; ElevenLabs gives you cancel and
a whole-job retry; LiveKit has no run to pause. Across five products the only way to slow a campaign down is
to kill it and rebuild it, which throws away the aggregate the run was created to produce. Our Console
already has `/interrupt` and already makes `interrupted` terminal (`campaign-domain.ts`:38-45), so we are
one state transition away from the only genuinely unoccupied square on this board. The second empty square
is next to it: **nobody shows what a campaign is about to cost or consume before it is launched**, even
though every one of them knows the contact count, the concurrency and the window.

Two smaller gaps, both about honesty rather than capability. **Nobody reconciles the channel with the
person.** Retell comes closest with Contacts, merging a contact's calls and chats into one timeline, and even
there the merge key is a phone number, so a WhatsApp ID or a widget visitor falls out. And **nobody states a
channel's readiness on the surface where you pick it**: Retell's A2P status lives on the phone number page,
ElevenLabs' template approval lives in WhatsApp Manager, Vapi's billing gate is invisible and fails silently.
A "Not supported yet" row with an Engine ticket on it, and a "Pending carrier review, submitted 3 Sep" row
with the reason attached, would both be new to this market. Given that three of our five tasks have no API
behind them (`00-brief.md` §4), that is the cheapest differentiation available to us: say the state.

---

## Shot list for the browser agent (stop 2, product half)

Fifteen shots, three to five per vendor, at least one rainy each. Run one tab per vendor
(`node scripts/drive.mjs serve` once, then `--tab vapi`, `--tab retell`, `--tab elevenlabs`, `--tab livekit`),
two vendors at a time. Never sign in, never pay, never submit an application. Where a state needs money or a
credential the shot is marked **blocked** and the pre-state is captured instead.

Dashboard paths marked *guessed* are reconstructed from the docs screenshots, not from a URL the vendor
publishes. Confirm with `drive.mjs url` after the first `goto` and correct the list.

| # | Vendor | Scenario | Shot | URL |
|---|---|---|---|---|
| 1 | Vapi | happy | Campaign wizard, Schedule step, populated | https://dashboard.vapi.ai/campaigns |
| 2 | Vapi | happy | Phone number detail, SMS Enabled on, assistant assigned | https://dashboard.vapi.ai/phone-numbers |
| 3 | Vapi | rainy | Launched campaign, action menu with no pause and no edit | https://dashboard.vapi.ai/campaigns |
| 4 | Retell | happy | Create an Agent dropdown, Voice Agent and Chat Agent | https://dashboard.retellai.com/agents *(guessed)* |
| 5 | Retell | happy | Batch call config, Reserved Concurrency for Other Calls | https://dashboard.retellai.com/batch-call *(guessed)* |
| 6 | Retell | rainy | Phone number, Advanced Add-Ons, SMS before approval | https://dashboard.retellai.com/phone-numbers *(guessed)* |
| 7 | ElevenLabs | happy | Agent, Channels section, the channel list | https://elevenlabs.io/app/agents |
| 8 | ElevenLabs | happy | Agent behavior, Text channels expanded, one override set | https://elevenlabs.io/app/agents |
| 9 | ElevenLabs | happy | Advanced tab, Text only toggle on | https://elevenlabs.io/app/agents |
| 10 | ElevenLabs | happy | Batch calling, recipients uploaded, schedule set | https://elevenlabs.io/app/agents/batch-calling |
| 11 | ElevenLabs | rainy | WhatsApp page with no account imported | https://elevenlabs.io/app/agents/whatsapp |
| 12 | LiveKit | happy | Embed, Install tab, origin added, widget enabled, snippet | https://cloud.livekit.io/projects/p_/agents |
| 13 | LiveKit | happy | Embed, Settings tab, capabilities | https://cloud.livekit.io/projects/p_/agents |
| 14 | LiveKit | rainy | Embed, Install tab, zero origins, toggle unavailable | https://cloud.livekit.io/projects/p_/agents |
| 15 | LiveKit | rainy | Telephony, no WhatsApp surface anywhere in the console | https://cloud.livekit.io/projects/p_/telephony |

The full steps, the blocked notes and the design question each shot answers are carried in the structured
shot list handed to the capture agent.
