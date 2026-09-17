# 18 · Channels · Learnings from five competitor environments

Evidence: `02-research/_docs.md` (public docs, fetched 2026-09-17) and the product shots the browser agent
is capturing against the same surfaces. Five learnings, each one changes a control we would otherwise draw.

## Learnings

1. **ElevenLabs configures channels inside the agent, in a section named Channels, so the 2026-07-30 lock
   that retired the word because "none uses 'Channel'" is now factually wrong and the name is back in play
   for the brief's question 2.** (Evidence: the Custom Channel page opens *"Open your agent, select
   Channels"*, the widget page places modality *"under Channels, Widget, Interface"*, and a peer panel is
   called **Channel behavior**: https://elevenlabs.io/docs/eleven-agents/customization/integrations/custom_channel,
   /customization/widget, /customization/channel-behavior. `LEARNINGS.md`:526 checked five platforms in July
   and this one has shipped the vocabulary since.)

2. **WhatsApp is two runtimes on one account binding, not one more row in the inbound surface list, so the
   muted "WhatsApp · Telegram · soon" line at `studio_x_2/components/wizard/channel-section.tsx`:175 cannot
   simply become a fourth `ToggleCard` next to Phone number and Web widget.** (Evidence: ElevenLabs applies
   text behaviour to WhatsApp messages and *"WhatsApp calls are voice conversations and use voice
   behavior"* from the same imported number, https://elevenlabs.io/docs/eleven-agents/customization/channel-behavior;
   LiveKit's WhatsApp Connector carries voice calls only and has no messaging call in its API,
   https://docs.livekit.io/telephony/connectors/whatsapp.md.)

3. **Turning SMS on is an approval queue with a rejection cascade, not a toggle, so the SMS surface's
   resting state is "pending carrier review, submitted <date>" with the reviewer's reason attached, and its
   dependent controls stay disabled until the parent clears.** (Evidence: Retell's A2P 10DLC flow is three
   approvals, $4 or $45 plus $15, *"around 2-3 weeks"*, $20 per month per number, US only, no toll-free, and
   *"until the brand is approved or pending, the campaign controls stay disabled"*,
   https://docs.retellai.com/deploy/enable-sms; Vapi needs a 10DLC-approved Twilio number, refuses
   agent-initiated first messages, and on a billing gate *"does not send a reply or show an error in the
   Dashboard"*, https://docs.vapi.ai/chat/sms-chat.)

4. **No vendor can pause a running outbound run and resume it, and none has our retry control, so drop
   `retries` and `retryIntervalMin` from `studio_x_2/components/wizard/step-call-settings.tsx`:240-270 and
   spend that budget on resume, which is the one unoccupied square on the board.** (Evidence: Vapi campaigns
   have *"no draft state"*, are read-only after creation and accept only *"a status-only cancellation"*,
   https://docs.vapi.ai/outbound-campaigns/scheduling-and-lifecycle; Retell's **Planned** batch *"cannot be
   edited once scheduled"*, https://docs.retellai.com/deploy/make-batch-call; ElevenLabs offers cancel and a
   whole-job retry and nothing between, https://elevenlabs.io/docs/eleven-agents/phone-numbers/batch-calls.
   Our Console already ships `/interrupt` with `interrupted` as a terminal status, `campaign-domain.ts`:38-45.)

5. **Concurrency is asked backwards in our wireframe: the useful question is how many slots to hold back for
   inbound, not how many the campaign may take, so the free-entry "max concurrent" becomes a reservation
   that names what it protects.** (Evidence: Retell's field is literally **Reserved Concurrency for Other
   Calls**, minimum 1, maximum the limit minus 1, with the derived *"Concurrency allocated to batch
   calling"* shown underneath, https://docs.retellai.com/deploy/make-batch-call; ElevenLabs removes the
   field entirely and takes *"the minimum of either 50% of your workspace's concurrency limit or 70% of your
   agent's concurrency limit"*, https://elevenlabs.io/docs/eleven-agents/phone-numbers/batch-calls; Vapi
   warns that `maxConcurrency` *"does not reserve"* slots,
   https://docs.vapi.ai/outbound-campaigns/scheduling-and-lifecycle.)

## What this does not change

The lock. Nothing in five products argues for reversing 2026-07-29 a third time. ElevenLabs and Fin both run
one agent across many channels, and both pay for it with a per-channel override layer (ElevenLabs: three
settings, sparse, defaults visible; Fin: channel-targeted guidance plus per-channel workflows). Neither
ships a channel matrix in the builder. Option A in `00-brief.md` §6.1 survives this research, and option B
gains one piece of evidence it did not have: ElevenLabs runs **one batch object across telephony and
WhatsApp** by adding `whatsapp_params` to the same job rather than building a second campaign type
(https://elevenlabs.io/docs/eleven-agents/whatsapp/outbound). That is the shape option B should take when
the Engine contract exists.

## The two corrections this research makes urgent

Both are already named in `00-brief.md` §6.4 and both are stated here because every competitor gets them
right. **The widget needs an origin allowlist before it can be enabled at all**: LiveKit refuses the toggle
until one origin exists and *"the widget receives no token and doesn't load"* off-list
(https://docs.livekit.io/agents/start/embed.md), and ElevenLabs uses an **Allowlist** in the agent's
**Security** tab (https://elevenlabs.io/docs/eleven-agents/customization/widget). Ours emits a snippet with
no origin concept at all, pointed at `https://cdn.agora.io/agent-widget.js`, which 404s
(`studio_x_2/lib/widget-config.ts`:70-81). **And the package name is wrong**: `@agora/agent-sdk`
(`channel-section.tsx`:457-470) does not exist, while `agora-agent-client-toolkit` does and is documented.
Every vendor's widget install snippet resolves. Ours is the only one that does not.
