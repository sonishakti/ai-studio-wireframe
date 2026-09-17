# 18 · Channels · JTBD, all types

ClickUp: [18 · Channels](https://app.clickup.com/t/868m0mf2u) (Design Tracker, P0, ⚠ lock, XL, wave Jan 2027)
Roadmap tasks: [Productize WhatsApp voice](https://app.clickup.com/t/868ka6ajk) ·
[Add SMS as an agent channel](https://app.clickup.com/t/868kyjfp2) ·
[Support text-only agents](https://app.clickup.com/t/868kyjfnv) ·
[Ship a browser SDK and embeddable agent widget](https://app.clickup.com/t/868kykbf8) ·
[Build the complete outbound campaign lifecycle](https://app.clickup.com/t/868kykbf1)
Evidence: `00-brief.md` (scope · what exists · Agora fact-check) · `02-research/_docs.md` (five vendors, public docs) · `03-learnings.md`

## Headline JTBD

**When my agent already answers the phone and half the people who need her message us instead of calling,
I want to put that same agent on WhatsApp and on the chat box on our site without building a second agent,
so the customers who will never dial get the same answers as the ones who do.**

The ⚠ lock does not move this sentence. It decides how much of it the product is allowed to say out loud.
Three of the five tasks have no API behind them at any version: WhatsApp, SMS and text-only are all
**Requires Engine** (`00-brief.md` §Agora fact-check). So owner question 1 decides whether a channel joins
the inbound surface list, the batch run, or a new matrix; question 3 decides whether SMS is drawn inert or
parked; question 4 decides who owns the widget bundle; question 5 decides whether the outbound lifecycle
catches up to the Console; question 6 decides which of the six channel taxonomies is the source.
Scenarios below carry **[Q1]** … **[Q6]** where the answer changes them.

## Success event

The tempting count is channels enabled. It is rejected for the same reason published agents were: a channel
that carries no messages earns Agora $0, and the north star is "first live deployment carrying traffic, then
first paid usage" (CLAUDE.md · `LEARNINGS.md` 2026-06-17). Enablement is also the metric every competitor
already optimises and none of them closes: Retell's A2P status sits on the phone number page, ElevenLabs'
template approval sits in WhatsApp Manager, Vapi's billing gate fails silently with a row in the log and no
reason on it (`02-research/_docs.md` §What nobody does).

**The success event is `first_live_call_received`**, already in
`references/telemetry/event-spec.json` (P0, server-anchored on Agora notification events 201/202, not the
client). It already carries `channel`, and a WhatsApp call is a voice call, so the voice half needs no new
event. It does not fit a message: SMS, WhatsApp text and the widget's chat mode have no call, no
`answered`, no `endReason` and no ring.

One sibling, proposed in the spec's shape (`object_verb`, past tense, camelCase properties, bucketed
numbers, stable codes):

```json
{
  "name": "first_live_message_received",
  "when": "The first production (non-test) inbound message reaches a deployed version on an asynchronous surface. Server-anchored, same path as first_live_call_received. Never fires for a test send.",
  "properties": ["agentId", "versionId", "surface (whatsapp|sms|widget_chat|custom)",
                 "msSinceDeploy", "answered (boolean)", "replyLatencyBucket",
                 "turnCount", "windowState (open|template_required|expired)",
                 "senderProvenance (imported|byo_trunk|meta_account)"],
  "feeds": ["Second-channel traffic rate", "Weekly Proven Agents on the text half",
            "Whether a reply actually went back out, which is where Vapi's billing gate fails silently"],
  "priority": "P0",
  "hookPoint": "Server/webhook side; surfaced in app/(dashboard)/monitor beside the call rows"
}
{
  "name": "channel_blocked",
  "when": "A surface the user asked for refuses, at any step: not supported by Agora, pending carrier or Meta review, no permission, no payment method, region excluded. ONE event carrying the full reason set, the way deploy_blocked already does.",
  "properties": ["agentId", "builderSessionId", "surface",
                 "code (not_supported_yet|engine_ticket_open|carrier_review_pending|carrier_rejected|template_pending|permission_declined|no_billing_access|payment_required|region_unavailable|number_in_use|origin_missing)",
                 "recoverable (boolean)", "engineTicket"],
  "feeds": ["The demand signal that unblocks the Engine tickets: how many people asked for WhatsApp and SMS before they existed",
            "Which rainy scenario below is real and which is theatre"],
  "priority": "P0",
  "hookPoint": "the inbound surface list in components/wizard/channel-section.tsx:158-176; codes only, never a provider's free-text description"
}
```

Two existing events need one property each before any of this is sliceable.
`channel_selected` fires on the intent radio and its enum is `inbound | batch | code`
(`event-spec.json`, hook `channel-section.tsx`:72), so it must carry `surfaces` as well as `channel`, or a
WhatsApp deploy and a phone deploy are the same row. `deployment_went_live` has the same hole from the other
end: `publishDeployment`'s `channel` argument is a free-form string and its `mode` is
`"inbound" | "outbound" | "code"` (`components/wizard/channel-configs.tsx`:64-109), so today the north-star
event cannot tell a WhatsApp deployment from a phone line (`00-brief.md` §"What is missing, plainly").
`surface` is already on the ng-console sanitiser allowlist; `channel` is on the wave-0 additions list;
`windowState`, `replyLatencyBucket` and `senderProvenance` are new keys and get added in the same PR or they
arrive as events with no properties (`event-spec.json` §conventions).

**The metric:** share of agents whose **second** surface carries a non-test session within seven days of the
first one going live, sliced by `surface`. Denominator is agents already live on one surface, so it measures
the job in the headline and not signups. Time on page, session length and DAU stay rejected.

## Happy scenario

1. "Aria answers our support line and she is good, and now half the people who need her message our WhatsApp number instead of calling it."
2. "I open her Deployment section and WhatsApp is a real choice next to Phone number and Web widget, not a grey word that says soon."
3. "Before I start it tells me the account is Meta's, not Agora's, and exactly what Meta will want from me."
4. "I connect our WhatsApp Business account, our own number comes back on it, and I point that number at Aria."
5. "It says plainly that she answers messages one way and answers WhatsApp calls another way, and shows me which one I am editing."
6. "I message the number from my own phone and watch her reply in the thread."
7. "I call the same number from WhatsApp and she picks up in the voice my phone callers already hear."
8. "The row now shows the number, Aria behind it, and the first real message that was not mine."

Step 8 is the end of the flow, not step 4. Connecting an account is not traffic, the same rule that made a
published agent worth $0 (A3 durable rule 1, `LEARNINGS.md` 2026-07-09; `first_live_call_received` is
server-anchored for exactly this reason).

Steps 3 to 8 have no contract behind them today. `grep -ril "whatsapp"` over `agora-agents@2.4.0` returns
nothing, https://docs.agora.io/llms/ai.txt has no WhatsApp page, and the release notes have no WhatsApp entry
at any version (`00-brief.md` §Agora fact-check). Step 2 is the only one that ships, and it ships as one
muted line, "WhatsApp · Telegram · soon", at `components/wizard/channel-section.tsx`:175. Saying which of
these eight sentences is a wish is this design's first job, not a caveat on it.

## Rainy scenarios

1. **Nothing is configured and the door is a loop.** "I clicked Manage on the WhatsApp row and it put me back on the page I clicked it from." (`app/(dashboard)/deploy/whatsapp/page.tsx`:5 redirects to `/integrations?tab=channels`, the page the row lives on; `/deploy/sms`, `/deploy/slack` and `/deploy/telephony` do the same, `00-brief.md` §3.)
2. **The channel already looks set up and is not.** "The list shows Acme WhatsApp backing Survey Bot with a sender on it, so I assumed someone had done this." (`dp_ib_06` ships with sender +1 (628) 555-0220, 220 calls and a channel prompt suffix, `lib/campaign-data.ts`:1399-1411; `components/channels-panel.tsx`:51 lists it with a dead href.)
3. **Agora does not do this yet and the product never says so.** "I picked WhatsApp, filled in the form, and only found out at the end that there is no WhatsApp." (No field, no page, no release note at any version, `00-brief.md` §Agora fact-check; the 07 Backup providers row is the shipped idiom for saying it.) **[Q1][Q3]**
4. **Not supported by the vendor I picked.** "Our WhatsApp runs through a connector that only carries calls, so the message I typed goes nowhere." (LiveKit's WhatsApp Connector is voice calls only and has no messaging call in its reference, https://docs.livekit.io/telephony/connectors/whatsapp.md; Retell states it outright, "Retell has no built-in integrations with third-party chat platforms such as WhatsApp or Messenger", https://docs.retellai.com/build/create-chat-agent.)
5. **One binding, two runtimes.** "I tuned her to be short and friendly for messages, then a WhatsApp call came in and she read my chat style out loud." ("WhatsApp channel behavior applies to text messages only. WhatsApp calls are voice conversations and use voice behavior", https://elevenlabs.io/docs/eleven-agents/customization/channel-behavior; `03-learnings.md` learning 2.)
6. **The account is connected and nobody is behind it.** "Messages started arriving and none of them were answered." (With no agent assigned, "inbound messages will be ignored and inbound calls will be rejected. However, you will still be able to make outbound calls", https://elevenlabs.io/docs/eleven-agents/whatsapp.)
7. **The number is already taken.** "Our WhatsApp number is live in the WhatsApp Business app already, so the import refuses it." (Stated limitations: no import of a number registered with another provider or active in the WhatsApp Business app, and no WABAs created under a developer app, same page.)
8. **I am not allowed to speak first.** "I wanted her to check in with 300 customers on WhatsApp and she can only reply to people who messaged us." (An agent "can only send free-form WhatsApp messages inside an active conversation"; anything else needs a Meta-approved template made in WhatsApp Manager, https://elevenlabs.io/docs/eleven-agents/whatsapp/outbound.)
9. **The vendor accepted it and delivered none of it.** "The send came back fine and not one customer got the message." ("A template that is pending or rejected cannot be sent: the API accepts the request but Meta never delivers the message", same page.)
10. **The conversation started and the agent stayed silent.** "The template went out, and then nothing happened for two days." (Sending a template opens the conversation but the agent stays silent until the user replies, and no timer starts until then, same page.)
11. **Permission was never granted.** "I scheduled WhatsApp calls and they came back declined without ever ringing." (Outbound WhatsApp calls need a template carrying a call permission request component, and three states resolve: already granted, not yet requested, declined and recorded as a failed conversation, same page.)
12. **The region forbids it.** "Most of my Mexico list failed because the WhatsApp ID is not the number I dial." (The docs warn the WhatsApp user ID differs from the dialed number in Mexico and Brazil, same page; LiveKit adds that outbound is region-limited by Meta, https://docs.livekit.io/telephony/connectors/whatsapp.md.)
13. **The window closed while I was reading.** "The conversation ended by itself and the customer's next message opened a brand new one with none of the history." (Conversations close on the End conversation tool, Max conversation duration, or a 15-minute inactivity timeout measured from the agent's last response, https://elevenlabs.io/docs/eleven-agents/whatsapp; Fin names the 24-hour reply window in its own help, https://www.intercom.com/help/en/articles/13377077-choose-channels-to-deploy-fin-ai-agent.)
14. **SMS is an application, not a toggle.** "I switched SMS on and it asked me for a business profile, two sample messages and three weeks." (Retell's A2P 10DLC flow is three approvals, $4 or $45 plus $15, "around 2-3 weeks", manually reviewed by the telephony provider, https://docs.retellai.com/deploy/enable-sms.) **[Q3]**
15. **The rejection came from a level I never filled in.** "My SMS campaign says rejected and the reason belongs to a business profile someone else submitted." (A rejected business profile marks its brand and every campaign under it rejected with the profile's reason attached, and "until the brand is approved or pending, the campaign controls stay disabled", same page.) **[Q3]**
16. **The account cannot pay and the failure is silent.** "The message arrived, a session opened, and the agent simply never answered." (On an org with no saved payment method Vapi still receives the message and still opens a session but "does not send a reply or show an error in the Dashboard", https://docs.vapi.ai/chat/sms-chat.)
17. **Turning it on is not mine to do.** "Enabling SMS costs money every month and my account cannot open the page that agrees to it." (`hasBillingAccess` requires the `FinanceCenter` permission, `ng-console/src/lib/billing/billing-access.ts`:21-26; the SMS add-on is $20 per month per number plus $0.01 per message, https://docs.retellai.com/deploy/enable-sms.)
18. **The limit is a day long.** "We hit the cap at lunchtime and the rest of the queue still looked like it was running." (Low-volume brands cap at 6,000 message segments a day, same page; ElevenLabs caps batches at "the minimum of either 50% of your workspace's concurrency limit or 70% of your agent's concurrency limit", https://elevenlabs.io/docs/eleven-agents/phone-numbers/batch-calls.)
19. **The agent I have cannot become the agent I need.** "I tried to put my best agent on chat and was told it has to be rebuilt." (Retell's conversion creates a second object and deletes call transfer, press digit, mid-call SMS and every voice, speech and call setting; a custom-LLM agent cannot become a chat agent at all, https://docs.retellai.com/build/create-chat-agent.)
20. **We already draw a text agent that does not exist.** "The widget preview is holding a typed conversation, so I assumed text-only was a setting I had already found." (`interactionMode: "chat"` renders a full text conversation with an input, `lib/widget-config.ts`:14 and `components/widget-studio.tsx`:591-618, while `channel` and `token` are required on every pipeline join and the billed unit is an Audio Task, `StartAgentsRequest.d.ts`:74-78 and https://docs.agora.io/en/ai/reference/pricing.) **[Q1]**
21. **The install line does not resolve.** "I pasted the snippet onto our site and the browser 404s on the script." (`widgetSnippet` emits `https://cdn.agora.io/agent-widget.js`, `lib/widget-config.ts`:70-81, which returns 404, and `@agora/agent-sdk` in `channel-section.tsx`:457-470 is not on the npm registry, while `agora-agent-client-toolkit@2.10.0` is and is documented, https://docs.agora.io/en/api-reference/api-ref/conversational-ai/client-toolkit/web.) **[Q4]**
22. **The widget runs anywhere, including on someone else's site.** "Our snippet is public and nothing says which domains are allowed to use it." (LiveKit refuses the enable toggle until one origin exists and off-list "the widget receives no token and doesn't load", https://docs.livekit.io/agents/start/embed.md; ElevenLabs uses an Allowlist in the agent's Security tab, https://elevenlabs.io/docs/eleven-agents/customization/widget; ours has no origin concept at all, `lib/widget-config.ts`:13-40.) **[Q4]**
23. **The webhook nobody told me I had to run went down.** "WhatsApp calls stopped connecting and neither Agora nor the log knows why." (LiveKit's connector does not receive Meta's webhooks: Meta posts the call connect webhook with the SDP to an app of your own, which you then pass to `ConnectWhatsAppCall`, https://docs.livekit.io/telephony/connectors/whatsapp.md.)
24. **Two people edit the same binding.** "My colleague pointed the number at a different agent while I had the page open." (Binding is one `pipeline_id` for inbound and one for outbound, `UpdatePhoneNumbersRequest.d.ts`:13-35; the Console already carries `TelephonyPhoneNumberEditStatus{editable, hasInbound, hasOutbound, campaignName, scheduledFor}`, `ng-console/src/lib/telephony/telephony-api.ts`:270-277, and the prototype hard-locks a number a deployment owns.)
25. **The trunk refuses the call.** "The channel says active and every inbound call drops the second it connects." (Inbound is gated by `allowed_addresses`, whose Console fallback is hardcoded to `["1.1.1.1"]`, `ng-console/src/lib/telephony/phone-number-contracts.ts`:85-88.)
26. **The caller hangs up first.** "It rang once on WhatsApp, they gave up, and the channel now reports its first live session." (`first_live_call_received` carries `answered` and `endReason`; provisioning success is not call success, A3 durable rule 1, `LEARNINGS.md` 2026-07-09.)
27. **The data has not arrived and the labels disagree.** "Monitor calls it Chat, the deployment row calls it WhatsApp, and I cannot tell whether that is one run or two." (Two exported constants both named `CHANNEL_LABEL` with different key sets, `lib/campaign-data.ts`:1788 and `lib/session-trace.ts`:21, and `channelForSession` assigns "chat" from a seeded random with nothing behind it, `session-trace.ts`:191-197.) **[Q6]**
28. **Live since this morning, empty all day.** "Every panel is blank and I cannot tell whether the channel is broken or just quiet." (`deployment_went_live` fires without any traffic while `first_live_call_received` is server-anchored on Agora notification events 201/202, so the console has nothing to show until the runtime delivers, `references/telemetry/event-spec.json`.)
29. **The outbound half does not exist.** "I built a WhatsApp list and Batch will only dial phone numbers." (Every batch deployment in the wireframe is `{kind: "telephony"}`, `lib/campaign-data.ts`:1417 onward, and the Console contract is telephony-shaped end to end: `phoneNumberId`, a required `phone_number` CSV column, ring and voicemail settings, `ng-console/src/features/telephony/campaigns/campaign-editor-domain.ts`:26-60. ElevenLabs solves it by adding `whatsapp_params` to the same batch object rather than building a second campaign type, https://elevenlabs.io/docs/eleven-agents/whatsapp/outbound.) **[Q1][Q5]**
30. **I want to slow it down and the only button kills it.** "I needed the run paused for an hour and pausing it threw away the numbers I had already dialled." (The Console ships `/interrupt` and `interrupted` is a terminal status, `ng-console/src/features/telephony/campaigns/campaign-domain.ts`:38-45; no vendor pauses and resumes, `02-research/_docs.md` §What nobody does.) **[Q5]**
31. **The retry control is fiction.** "I set it to retry unanswered twice and nothing ever retried." (`retries` and `retryIntervalMin` at `components/wizard/step-call-settings.tsx`:240-270 exist in neither the Console contract nor the docs; the real answer is `/redial/export`, a file you take away, `ng-console/src/lib/telephony/telephony-api.ts`:592.) **[Q5]**
32. **The campaign ate the line that pays.** "The batch took every slot and the customers ringing our support number got nothing." (Vapi warns `maxConcurrency` "does not reserve" slots, https://docs.vapi.ai/outbound-campaigns/scheduling-and-lifecycle; Retell asks the question the other way round with Reserved Concurrency for Other Calls, https://docs.retellai.com/deploy/make-batch-call; `03-learnings.md` learning 5.)
33. **The person is one person and the product shows four rows.** "The same customer called, texted and used the widget, and I am reading three unrelated histories." (Retell is the only vendor that merges a contact's calls and chats "into a single timeline, most recent first", and even there the merge key is a phone number, so a WhatsApp ID and a widget visitor fall out, https://docs.retellai.com/conductor/contacts.)

## What this is not

- **Buying or importing the number a channel rides on.** The purchase branch, KYC, provisioning states and the release path belong to [16 · Phone number purchase](https://app.clickup.com/t/868m0mf09), also ⚠ lock. This feature starts at a number that exists and asks what surface sits on top of it. Scenario 7 is the seam.
- **Standing up the trunk.** `allowed_addresses`, credentials, the five-stage connect ladder and the verification test call are 17 · SIP trunk setup and the shipped A3 quick connect. Scenario 25 is where a channel meets a trunk that refuses it, and all this feature owes it is a named reason.
- **Per-call behaviour on the channel.** Ring seconds, silence hangup, voicemail and fax detection, transfer to a human with SIP headers and post-call evaluation are agent-level call behaviour, owned by 05 · Call behavior rules. The lifecycle task here owns the run: contacts, window, pacing, and the resume state nobody ships.
- **Concurrency as something you buy.** A ceiling you can raise with money hangs off 22 · Usage, credits & concurrency, its own ⚠ lock. Scenario 32 is a user meeting the ceiling, and this feature owes it a reservation control that names what it protects, not a purchase.
- **Reading what happened afterwards.** Session and call history, transcripts and audio alignment are 10 · Session & call logs. What this feature must hand them is one channel vocabulary, because two `CHANNEL_LABEL` constants currently disagree (scenario 27, owner question 6). Choosing the source type is stop 0 work; rendering it is theirs.
- **Watching it live and taking the call back.** Barge-in, whisper and operator takeover are 12 · Live monitoring, deferred and ⚠ lock.
- **Versioning a channel binding.** Which version a surface is pinned to, and what a rollback does not restore, is 08 · Versioning & release, the feature paired with this one in the January wave. `deployment_rolled_back` already exists for it.
- **The person behind the channels.** One timeline per contact across calls, messages and widget sessions is 21 · CRM & contacts. Scenario 33 is the whitespace and it is theirs, not ours.
- **Writing the Engine contract.** WhatsApp, SMS and text-only have no fields to design against. This feature owes the Engine team a named ask and a demand count (`channel_blocked.engineTicket`), and owes the user a state that says so. It does not owe anyone a drawing of an API that has not been specified.
