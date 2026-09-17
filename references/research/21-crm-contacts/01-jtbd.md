# 21 · CRM & contacts — JTBD, all types

ClickUp: [21 · CRM & contacts](https://app.clickup.com/t/868m0mf5e) (Design Tracker, tagged P0, deferred, no dates)
Roadmap tasks: [Supply agent context from CRM records](https://app.clickup.com/t/868kyjfp4) (P0) ·
[Add CRM actions and controlled write-back](https://app.clickup.com/t/868kykbfx) (P1) ·
[Manage contacts, audiences, and cross-session context](https://app.clickup.com/t/868kykbf7) (P1)

Evidence for every line below: `00-brief.md` (what the two repos ship, plus the Agora fact-check),
`02-research/_docs.md` (four vendors' docs), `03-learnings.md`.

## Headline JTBD

**When a customer who is already on file rings in and my agent opens with "how can I help you today"
like it has never met them, I want it to say their name and the thing they called about, and to put
the outcome back on their record before I get to it, so the call is finished when it ends instead of
waiting in my inbox as a note to type up.**

Only the read half is P0 (`00-brief.md` §Scope: 868kyjfp4 is P0, the other two are P1). The write half
is what makes the read half worth keeping.

## Success event

Nothing in `references/telemetry/event-spec.json` covers this: its 42 events run from `builder_opened`
to `telemetry_heartbeat` and none of them touches a variable, a contact or a CRM. Proposed in the same
shape, sitting between `first_live_call_received` and `call_reviewed` in the live-traffic arc:

```
name        caller_context_received
when        A live (non-test) call starts and the agent's {{variables}} were valued before the
            greeting played. Server-anchored, from the same runtime path as
            first_live_call_received, not the client.
properties  agentId · versionId · deploymentId · channel · direction (inbound|batch) ·
            source (csv_row|api_dial|connector_lookup|none) · matched (boolean) ·
            varCount · valuedCount · missCount · lookupMsBucket
feeds       The P0 read half, directly: the share of live calls where the agent knew who it was
            talking to. Splits the north-star Connect stage (LEARNINGS §17) by whether traffic
            arrived personalised or blank.
priority    P0
hookPoint   Server/webhook side, beside first_live_call_received (Agora notification events
            201/202); surfaced in app/(dashboard)/calls
```

Two counters ride on the same event, and both are the honest half of the story. `missCount > 0` on a
live call means a real caller heard a gap where a value should have been. `matched: false` is the rate
at which the agent meets a stranger, which is the case nobody in the category designs for
(`_docs.md` §What nobody does).

The write half gets its own pair at P1, because a write that quietly does nothing is the failure mode
Retell documents: `contact_write_succeeded` and `contact_write_failed`, both carrying `fieldCount`,
`updateMode (overwrite|fill_if_empty|merge)` and `errorStage`.

Every property key above is new, so it must be added to the `ng-console` sanitiser allowlist before
the event ships or it arrives in PostHog with no properties at all (`event-spec.json` §conventions,
"ALLOWLIST ADDITIONS"). Rejected as KPIs, as standing: time on page, session length, DAU.

## Happy scenario

The inbound path, because that is the P0 task and the product has no answer for it today.

1. I write the greeting the way I would want to be greeted: *"Hi {{first_name}}, I can see your
   balance is {{balance}}."*
2. The screen tells me it needs two values it does not have yet, and points at the one place they can
   come from.
3. I connect HubSpot once, in the same row where my other tools already live.
4. I pick which field on a contact fills `first_name` and which fills `balance`, and I can see it is
   matching people by the number they call from.
5. It shows me one real contact with the greeting already filled in, so I read the exact sentence the
   next caller will hear.
6. I choose what the agent writes back when the call ends: the outcome, and one line of notes on the
   contact.
7. I go live, and the first call comes in with the caller's name already on the screen.
8. I open that call afterwards and the record it touched is one click away, showing the two fields it
   changed and nothing else.

## Rainy scenarios

1. **Nothing to look anything up with.** "I put `{{first_name}}` in the greeting and nothing on this
   screen can tell me where a first name is supposed to come from." (The only variable source in the
   product is a CSV column, and the coverage check compares the prompt against a five-item constant:
   `studio_x_2/lib/wizard-draft.ts`:773 and :781–785.)
2. **Inbound has no list to upload.** "This agent answers the phone, there is no CSV, and the product
   just tells me it is coming." (`studio_x_2/components/wizard/section-prompt.tsx`:139: "Inbound
   agents: per-call variables via API: coming soon.")
3. **The lookup is slower than the greeting.** "My CRM took four seconds and the caller heard silence
   before the agent said anything." (Vapi fixes `assistant-request` at "within 7.5 seconds end-to-end"
   and says it is not configurable, https://docs.vapi.ai/server-url/events; Retell allows 10 seconds
   per attempt, https://docs.retellai.com/features/inbound-call-webhook.)
4. **The caller is not in the CRM.** "Somebody new called and I have no idea what my agent just said
   to them." (The documented behaviour across the category is failure, not a fallback: Vapi has the
   agent speak *"Unable to find customer record."* and end the call,
   https://docs.vapi.ai/assistants/personalization; Retell disconnects after three failed attempts.)
5. **There is no number to match on.** "The caller withheld their number, so there is nothing to look
   them up by." (`sip.phoneNumber` is "absent when `HidePhoneNumber` is set",
   https://docs.livekit.io/reference/telephony/sip-participant.)
6. **The vendor is down.** "HubSpot was out for ten minutes and I cannot tell whether those calls went
   ahead without context or dropped." (Connect state in the prototype is mock OAuth in `localStorage`
   with no failure state at all, `studio_x_2/lib/agent-resources.ts`:229–249; the real Console's
   connector API has connect and disconnect and nothing else,
   `ng-console/src/lib/agents/studio-connectors-api.ts`:47–89.)
7. **We are on the other CRM.** "We run Salesforce and the only thing I can actually connect is
   HubSpot." (`StudioConnectorProvider = "hubspot"` is the whole catalogue,
   `studio-connectors-api.ts`:15, and every other row in `integrations-page.tsx`:192–237 is
   `comingSoon: true`, while the prototype still draws a Salesforce card,
   `studio_x_2/lib/campaign-data.ts`:1762–1781.)
8. **The region forbids it.** "Our HubSpot is the EU instance and the connector will not take our
   token." (ElevenLabs supports US-hosted HubSpot only, `api.hubapi.com`, and states that tokens
   beginning `pat-eu1-` are not supported,
   https://elevenlabs.io/docs/eleven-agents/customization/integrations/hubspot.)
9. **My column is not the column.** "My prompt says `{{phone_number}}` exactly like the docs do, and
   the screen tells me the variable is missing." (Agora requires a `phone_number` column in E.164,
   https://docs.agora.io/en/ai/studio/deploy/campaign, while `MOCK_CSV_COLUMNS` ships `phone` and the
   mismatch blocks publish, `wizard-draft.ts`:773 and `publishBlocks`:843.)
10. **The file is over the line.** "I exported 80,000 rows from our CRM and I cannot tell which half it
    took." (The documented cap is 25 MB and 50,000 rows,
    https://docs.agora.io/en/ai/studio/deploy/campaign; `attachCsv` parses nothing and sets a fixture
    count unconditionally, `studio_x_2/components/wizard/campaigns-card.tsx`:543–549.)
11. **The same person is in there twice.** "Two rows carry the same number and both of them got a
    call." (Retell refuses the duplicate outright with "A contact with phone number +14155551000
    already exists.", https://docs.retellai.com/features/contacts; our list has no dedupe,
    `00-brief.md` §7.)
12. **The cell is empty.** "The greeting went out as *"Hi , your balance is."*" (Values are strings
    substituted at the start of each call and no null behaviour is documented anywhere,
    https://docs.agora.io/en/conversational-ai/studio/build/prompt-design.)
13. **Somebody on the list asked never to be called.** "Our do-not-call flag is right there in the CRM
    and the batch dialled them anyway." (Retell keeps Do Not Call as a per-contact flag and its own
    batch flow does not read it, https://docs.retellai.com/features/contacts and
    https://docs.retellai.com/deploy/make-batch-call; our contact list has no suppression field,
    `00-brief.md` §7.)
14. **The record was stale.** "They paid yesterday and the agent still opened by asking for the
    money." (CRM inbound sync runs every five minutes over modified records,
    https://docs.retellai.com/integrations/crm-mappings.)
15. **It wrote the wrong thing.** "It marked the deal closed and I cannot see what it changed or put it
    back." (A Custom Tool can `POST` anywhere with no allowlist, dry run or record of the write,
    `ng-console/src/lib/agents/studio-custom-tools-api.ts`:19–31; Retell states plainly that no human
    approves anything and deletion never happens,
    https://docs.retellai.com/integrations/crm-mappings.)
16. **The write silently did nothing.** "The call looks fine and nothing reached the CRM." (Missing
    field permissions on the connected named user "produce silent failure rather than a connection
    error", https://docs.retellai.com/integrations/salesforce-functions.)
17. **The caller hangs up first.** "They cut off mid-sentence and I still want the number they gave me
    on the record." (Post-call extraction is the only write-back path we have, and it runs after the
    call: `AnalysisConfig` and `DataPoint`, `studio_x_2/lib/wizard-draft.ts`:151–169.)
18. **They correct themselves mid-call.** "They gave a new address halfway through and the agent kept
    reading the old one back." (`template_variables` is absent from `UpdateAgentsRequest.Properties`,
    so a value set at dial time is fixed for the call; ElevenLabs' Update state tool is the only
    mid-call change in the category,
    https://elevenlabs.io/docs/eleven-agents/customization/tools/system-tools/update-state.)
19. **Two of us edit at once.** "My colleague repointed the same field while I was saving and neither
    of us was told." (Retell permits only one connection to drive contact sync per workspace at a time,
    https://docs.retellai.com/integrations/crm-overview; the attachment contract in our Console is a
    plain id list per agent with no concurrency handling,
    `ng-console/src/lib/agents/studio-agent-attachments-api.ts`:8–26.)
20. **Retention is off.** "Legal disabled retention on these calls and now there is nothing left to
    build memory from." (`parameters.opt_out` disables retention for the session,
    `agora-agents@2.4.0 api/resources/agents/client/requests/StartAgentsRequest.d.ts`:669–674, and
    neither repo surfaces the flag.)
21. **The memory outgrew the field.** "The note on this contact is four calls long and reads like
    nothing." (Merge is string-only, caps near 512 tokens, and on failure keeps both values stacked,
    https://docs.retellai.com/integrations/build-contact-memory.)
22. **Nobody agreed to this.** "We switched write-back on for everyone and our DPO wants to know who
    consented." (LEARNINGS §6 names Prechecked Consent as a direct GDPR conflict and Destructive
    Defaults beside it; `00-brief.md` §Already decided, "Regulated, and consent is load-bearing".)
23. **The account cannot pay for the calls.** "The list is loaded, the mapping is right, and there are
    no minutes left." (The free tier is 300 minutes a month shared with Real-Time STT and Translation,
    `references/roadmap-activation-strategy-2026-07-09.md`:44, against a flat $0.10 per agent-minute,
    `studio_x_2/lib/campaign-data.ts`:949.)
24. **The dial never connected.** "The call was rejected before it rang and the row still reads as
    contacted." (A call row carries two phone numbers and no contact,
    `studio_x_2/app/(dashboard)/calls/page.tsx`:33–47, so nothing ties a failed dial back to the list
    row that produced it.)
25. **The channel has no number.** "Half our conversations come through the web widget and none of them
    land on anybody's record." (Retell creates no contact for web calls or web chats, "because there is
    no number", https://docs.retellai.com/features/contacts.)
26. **The export carries a column we do not know about.** "My CSV has a `prompt_override` column and I
    cannot tell whether it did anything." (It is a documented, supported column,
    https://docs.agora.io/en/ai/studio/deploy/campaign, and nothing in either repo reads it,
    `00-brief.md` §Agora fact-check.)

## What this is not

- **Attaching a tool so the agent can do something during the call.** That door is
  [19 · Tools & connectors](https://app.clickup.com/t/868m0mf40): the Connectors and MCP rows in the
  builder (`studio_x_2/components/wizard/step-build.tsx`:93–165) and the real Console's Actions tab
  (`ng-console/src/components/console/agent-tools-page.tsx`:761–845). 21 does not build a second attach
  surface. It decides what a CRM connector is allowed to read and write once 19 has attached it.
- **Documents the agent reads.** [20 · Knowledge sources](https://app.clickup.com/t/868m0mf4k) owns
  knowledge bases. A contact record is per-caller data, not a corpus, and the two must not share a
  picker.
- **Reading back what was said.** [10 · Session & call logs](https://app.clickup.com/t/868m0meta) owns the
  transcript and the recording. 21 owns only the structured residue of a call and where it lands.
- **Getting a number and making the dial work.** [16 · Phone number purchase](https://app.clickup.com/t/868m0mf09) and
  [17 · SIP trunk setup](https://app.clickup.com/t/868m0mf18) own procurement and the trunk. 21 assumes the call connects.
- **The batch run itself.** Schedule, concurrency, retries and the call window stay on `CampaignDraft`
  in Go live (`studio_x_2/lib/wizard-draft.ts`:256–280). 21 extends the contact list block inside it
  (`CampaignContacts`, `campaigns-card.tsx`:520–663) and never the dialer.
- **Charts and alerts on what was written.**
  [13 · Dashboards & alerts](https://app.clickup.com/t/868m0mewr) owns aggregate views. 21 stops at one
  call and one record.
