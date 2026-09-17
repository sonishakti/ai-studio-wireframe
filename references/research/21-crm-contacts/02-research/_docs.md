# 21 · CRM & contacts — what the four vendors' docs say (2026-09-17)

Public docs only. The signed-in product is captured separately from the shot list at the end of this file.

The job splits into three questions and every vendor was asked all three:

1. **Read.** Where does the agent get the caller's record before it speaks, on an inbound call and on an outbound one?
2. **Write.** What may the agent change on that record during or after the call, and what bounds it?
3. **Store.** Does a contact outlive one run, and does anything survive the hang-up?

One vendor answers all three. Two answer one and a half. One answers none and says so.

---

## Retell AI

The only vendor in the set with a first-class contact object, a CRM sync engine and a documented memory
feature. Retell is the reference implementation for this feature and most of the specific numbers below
come from it.

### Contacts

Nav path **Data · Contacts** (https://docs.retellai.com/features/contacts). A contact is keyed by phone
number. Built-in fields: Phone Number, First Name, Last Name, Do Not Call, Contact ID, External ID, plus
a count of related calls and chats and the timestamp of the latest one. Custom fields are workspace-wide
and typed: Text, Number, Boolean, Selector, Date, Datetime. Names are snake_case, must start with a
letter, may not collide with a built-in, may not begin with `contact` or `external`, and the type cannot
be changed after creation.

Three ways a contact appears, and **CSV import is not one of them**. The docs answer the question
directly: contacts come from CRM sync, from adding them in the dashboard, or automatically after a
conversation. When a phone call or SMS chat ends Retell looks the number up and creates the contact if
none matched. Web calls and web chats create nothing, because there is no number.

Refusals, verbatim in shape: a phone number identifies exactly one contact, and adding a duplicate fails
with `A contact with phone number +14155551000 already exists.` The dashboard offers no delete, only
field clearing; the API delete exists but is refused while two-way CRM sync is active, because the next
sync would recreate the row (https://docs.retellai.com/api-references/delete-contact). Do Not Call is a
per-contact flag, filterable in the table and syncable both ways with the CRM.

Contact fields are handed to the agent as dynamic variables on the next phone call: `{{first_name}}`,
`{{last_name}}`, `{{do_not_call}}`, plus every custom field. Chats write contact fields but do not
receive them.

### Read

`{{variable_name}}`, all values strings (https://docs.retellai.com/build/dynamic-variables). The
substitution targets are wider than anyone else's: prompts, the begin message, **tool configuration**
(custom function URLs, descriptions and property descriptions), voicemail prompts, transfer phone
numbers, warm transfer instructions, and agent-level and account-level webhook URLs. Outbound values go
in `retell_llm_dynamic_variables` on Create Phone Call.

Inbound values come from the **Inbound Call Webhook**
(https://docs.retellai.com/features/inbound-call-webhook). Retell POSTs `call_id`, `from_number`,
`to_number`, `agent_id`, `agent_version` and `custom_sip_headers`. You return `call_inbound` holding any
of `reject`, `override_agent_id`, `override_agent_version`, `dynamic_variables`, `metadata` and
`agent_override`. Budget: 10 seconds per attempt, up to two retries, three attempts total. If all three
fail and no inbound agent is set, the call disconnects.

### Write

Five CRMs: Salesforce, HubSpot, Microsoft Dynamics 365, GoHighLevel, Zoho
(https://docs.retellai.com/integrations/crm-overview). Configured in Integrations, Available tab, then a
**Set up contact sync** dialog with Import and Sync tabs. Only one connection drives contact sync per
workspace at a time.

The boundary is a set of mapping tables, not a permission model
(https://docs.retellai.com/integrations/crm-mappings). Four of them, each a three-column table of source
field, direction and target field:

| Table | Direction | Cadence |
|---|---|---|
| Inbound sync | CRM into the Retell contact | every 5 minutes, modified records |
| Analysis data mapping | Post Call Extraction into the contact | at analysis |
| Outbound sync | Retell contact into the CRM | on change |
| Activity logging | Retell conversation into the CRM | per call or chat |

Analysis mappings carry an **update mode** per row: Overwrite, Fill if empty, or Merge. Merge combines
old and new with an LLM, applies to string fields only, caps around 512 tokens, and when it fails Retell
keeps both values with the new one appended below the old separated by a blank line.

Hard rules: phone number is required on inbound sync and cannot be unmapped; outbound sync never writes
the phone number back, because it is the matching key; by default outbound sync updates existing records
only and creating new ones is behind a toggle; deletion never happens whatever the settings. **No human
approves anything.** Outbound sync fires on a manual contact edit immediately and on analysis results
according to the update mode.

Agent-callable CRM functions are a separate surface
(https://docs.retellai.com/integrations/salesforce-functions): Search Contact, Get, Create and Update
Contact, Get, Create and Update Lead, Get and Update Account, List Account Opportunities, Get
Opportunity, Get Case, Get User, Get and Update Custom Object, Query Records, Create Task, Create Note.
**No delete operation exists.** The field allowlist is read live from Salesforce, with the fields
Salesforce itself requires marked required. Limits: Query Records times out at 6 seconds, an integration
tool response is capped at 30,000 characters, and Search Contact runs on Salesforce's search index,
which lags writes by a few seconds. The Salesforce connection runs as one named user whose permissions
govern everything, and missing field permissions produce silent failure rather than a connection error.

### Store

**Contact Memory** is the named feature (https://docs.retellai.com/integrations/build-contact-memory).
It is not a store, it is three steps: Post Call Extraction pulls structured data from the transcript, an
analysis data mapping writes it into a named contact field with an update mode, and the field arrives as
a dynamic variable on the next call. The docs' own example fields are `preferences`,
`interaction_history`, `pending_actions` and `objections_and_concerns`, each described with its own size
limit in the field description: "Limit to 10 most recent interactions", "Keep under 500 words".
Mappings are org-level, so memory accumulates across every agent that talks to the same number.

### The gap inside Retell

Batch calls do not use Contacts (https://docs.retellai.com/deploy/make-batch-call). A batch still takes a
CSV with a `phone_number` column, reserved columns `ignore e164 validation`, `override agent id`,
`override agent version`, `metadata` and `custom_sip_headers`, and any other column becomes
`{{column_name}}`. Draft batches are editable, Planned ones are not. Reserved Concurrency for Other Calls
must be at least 1 and at most the limit minus 1. Nothing in the batch flow reads the Do Not Call flag.

---

## Vapi

### Read

The page is called **Variables** (https://docs.vapi.ai/assistants/dynamic-variables). `{{name}}`,
substituting into the system prompt, the first message and "any message in the dashboard". The
load-bearing sentence is the refusal: "You cannot set variable values directly in the dashboard."
Values only exist on the wire, in `assistantOverrides.variableValues` on `/call/phone`.

Built-ins are read off the call object: `{{customer.number}}` ("caller-ID for inbound calls, destination
for outbound calls"), `{{phoneNumber.number}}`, `{{phoneNumber.name}}`, `{{call.id}}`, `{{call.type}}`,
`{{transport.callSid}}`, and a time family `{{now}}`, `{{date}}`, `{{time}}`, `{{month}}`, `{{day}}`,
`{{year}}`. Formatting goes through LiquidJS, including the `date` filter with timezones and `{% if %}`
conditionals, so the prompt itself can branch on a variable.

Inbound context is a webhook you host. The guide is literally named **Personalization with user
information** (https://docs.vapi.ai/assistants/personalization): Vapi sends the `assistant-request`
server event with the call object, your server looks the caller up in your own database or CRM, and you
reply with an `assistantId` plus `assistantOverrides.variableValues`. Budget: "You must respond to the
`assistant-request` webhook within 7.5 seconds end-to-end", fixed by the telephony provider and not
configurable (https://docs.vapi.ai/server-url/events). When the caller is not found, the documented
answer is to return `{"error": "Unable to find customer record. Please try again later."}`, which the
agent speaks and the call ends.

### Write

No CRM sync. Four prebuilt integration tools (https://docs.vapi.ai/tools/integrations): Google Calendar,
Google Sheets, Slack, and GoHighLevel, described as "Manage contacts, check calendar availability, and
book appointments". The shape of the boundary is stated once and never specified: "you connect the
account once, configure what the tool is allowed to do, and add it to an assistant." What "allowed to
do" means per tool is not on this page.

Write-back after the call is the `end-of-call-report` server event, carrying `recording`, `transcript`
and `messages`. Anything reaching a CRM from there is code the customer writes.

### Store

None. Contacts exist only inside a campaign (https://docs.vapi.ai/outbound-campaigns/overview). A
campaign takes a CSV or manual entry, up to 10,000 contacts, with `number` mandatory; `number` and `name`
"have dedicated contact fields" and every other column becomes a `{{variable}}`. Scheduling reaches
seven days ahead. Each contact is processed independently and nothing about it survives the campaign.

One detail worth a screenshot: on the Contacts step of the campaign wizard the preview shows names and
phone numbers, and "additional columns do not appear in the preview"
(https://docs.vapi.ai/outbound-campaigns/quickstart). The columns that decide what the agent says are
the ones the builder cannot see.

---

## ElevenLabs

Note for the shot list: the product is documented as **Eleven Agents** and the paths are
`/docs/eleven-agents/...`. The older `/docs/agents-platform/...` URLs now 404.

### Read

**Personalization** names exactly three methods
(https://elevenlabs.io/docs/eleven-agents/customization/personalization): Dynamic variables, Overrides,
and Conversation initiation webhooks.

Dynamic variables are `{{var}}`, typed String, Number or Boolean, substituting into system prompts,
first messages, **tool parameters and headers**, and webhook tool response assignments
(https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables). Two prefixes
carry meaning: `system__` for built-ins such as `system__caller_id`, `system__called_number`,
`system__conversation_id`, `system__call_duration_secs`, `system__time`, `system__timezone` and
`system__conversation_history`, and `secret__` on a custom variable to keep its value away from the LLM
while still letting a tool header use it. The dashboard holds
`conversation_config.agent.dynamic_variables.dynamic_variable_placeholders`, which is the only
builder-visible place a variable has a value, and it is a default rather than live data.

Inbound context is the conversation initiation webhook, documented on the Twilio personalization page
(https://elevenlabs.io/docs/eleven-agents/customization/personalization/twilio-personalization). It is
enabled in two places, which matters for our IA: the workspace URL and auth secret live at
https://elevenlabs.io/app/agents/settings, and the per-agent switch lives on the agent's **Security**
tab. The request carries `caller_id`, `agent_id`, `called_number`, `call_sid` and `conversation_id`. The
response is `type: "conversation_initiation_client_data"` with a required `dynamic_variables` object and
an optional `conversation_config_override`. No number is given for the timeout, only "respond within a
reasonable timeout period to avoid delaying the call handling", and no failure behaviour is documented.

ElevenLabs is the only vendor that lets the agent change a variable **mid-call**: the **Update state**
system tool (https://elevenlabs.io/docs/eleven-agents/customization/tools/system-tools/update-state).
It is added like any other tool, takes expressions of the form `variable_name = expression`, accepts
LLM-extracted values (`should_escalate = (llm: "User sounds frustrated") OR (retry_count > 3)`), allows
up to 10 variables per call and up to 10 state updates per tool, is dashboard-only with no API or SDK
yet, and applies all-or-nothing when an expression fails to evaluate.

### Write

HubSpot and Salesforce integrations exist as agent tools
(https://elevenlabs.io/docs/eleven-agents/customization/integrations/hubspot). HubSpot connects with a
Private App access token beginning `pat-`, pasted into a **Private App Access Token** field. The docs
name example scopes, `crm.objects.contacts.read` and `crm.objects.contacts.write`, and describe
capability in prose ("customer identification", "get previous interactions", ticket creation) rather
than listing the tools. The one hard limit is regional: US-hosted HubSpot only, `api.hubapi.com`;
EU tokens starting `pat-eu1-` are not supported. Zero retention mode and tool attachments are also
unsupported on this integration. No approval step is documented.

Generic webhook tools take name, description, method (GET, POST, PUT, PATCH), a URL with `{}` path
parameters, headers, query parameters and body parameters, plus assignment of response fields back into
dynamic variables (https://elevenlabs.io/docs/eleven-agents/customization/tools/webhook-tools). No
confirmation, no field allowlist, no dry run.

Post-call, **Data collection** items are defined as identifier, data type (String, Boolean, Integer,
Number) and a description that instructs the extraction
(https://elevenlabs.io/docs/eleven-agents/customization/agent-analysis/data-collection). Results appear
in conversation history and leave through post-call webhooks
(https://elevenlabs.io/docs/eleven-agents/workflows/post-call-webhooks), payload
`post_call_transcription` with `agent_id`, `conversation_id`, `transcript`, `metadata` and `analysis`.
Pushing that into a CRM is the customer's code.

### Store

**Users**, at Operate · Users (https://elevenlabs.io/docs/eleven-agents/operate/users): "everyone who has
talked to your agents in this workspace". It is keyed by `user_id`, "the external id you passed at
session start", and holds only that id, the last contact time, the agent and a conversation count.
Search is an exact match on the id, so you cannot find a person by name or number. Nothing on this page
feeds back into a later call. It is a log of identifiers, not a record.

Batch calling is CSV or XLS with a required `phone_number` column, other columns becoming dynamic
variables, scheduled immediately or for a date, time and timezone
(https://elevenlabs.io/docs/eleven-agents/phone-numbers/batch-calls). Concurrency is taken automatically
as the lower of 50% of the workspace limit and 70% of the agent limit. No contact store is involved.

---

## LiveKit

LiveKit has no contacts, no audiences, no campaigns, no CRM integration and no variable substitution in
a prompt. It is a framework, and the docs say so plainly: "you can install any Python package or add
custom code to the agent to use any database or API that you need"
(https://docs.livekit.io/agents/build/external-data/).

### Read

Context arrives as **job metadata**, a JSON string on the dispatch. The docs' own example is a `dial_info`
object, `{"phone_number": "+15105550123"}`, parsed in the entrypoint as
`dial_info = json.loads(ctx.job.metadata)` (https://docs.livekit.io/telephony/making-calls/outbound-calls).
Room metadata and participant attributes are the two alternatives. The guidance is to send user-specific
data in the job metadata rather than loading it in the entrypoint, which is the same latency argument
everyone else makes about the initiation webhook.

Inbound, the agent reads SIP participant attributes
(https://docs.livekit.io/reference/telephony/sip-participant): `sip.phoneNumber` ("The phone number the
call originates from", absent when `HidePhoneNumber` is set), `sip.trunkPhoneNumber` ("The number dialed
in to by an end user"), `sip.callID`, `sip.callIDFull`, `sip.callStatus`, `sip.ruleID`, `sip.trunkID`,
plus `sip.twilio.accountSid` and `sip.twilio.callSid` on Twilio trunks. Custom attributes come from a
dispatch rule or from `X-*` SIP headers mapped through `headers_to_attributes` on the trunk. That is the
whole context surface: a number and whatever the carrier stapled to the INVITE.

### Write

Function tools in code. The only write path the guide demonstrates is RPC back to the frontend,
`room.local_participant.perform_rpc(...)`. There is no boundary because there is no console control to
put one in.

### Store

Nothing. The external-data page points at third parties for memory (Letta, Mem0) and at AgentMail for
email. `https://docs.livekit.io/agents/build/memory/` does not exist.

---

## Fifth, added: GoHighLevel

Added because it is the CRM both of the leading voice vendors integrate **into**: Vapi ships a
GoHighLevel tool and Retell ships GoHighLevel contact sync and agent functions. It is the only product
in the set where the agent lives inside the contact record rather than beside it, which is the shape
owner question 1A is really asking about. Caveat on fidelity: the evidence is a support-portal article,
not a developer doc, so it is kept out of the comparison table.

A Voice AI agent's writes are built one at a time
(https://help.gohighlevel.com/support/solutions/articles/155000004107-how-to-create-voice-ai-agents):
click **+ New Action**, choose the type, name the action, define its triggering conditions, fill the
destination, workflow, field or calendar settings, and save. The types are **Update Contact Field**,
**Appointment Booking**, **Trigger a Workflow**, **Send SMS**, **Call Transfer**, **Agent Transfer** and
**Custom Action**. "After-call actions can apply updates or trigger follow-up processes after the
conversation" without interrupting the caller, which is the post-call write-back that owner question 3C
describes. Access is gated by a **View & Manage Voice AI Agents** permission.

What the article does not answer, and what we therefore cannot claim: whether the agent is handed the
contact automatically on an inbound call, and what boundary sits on a single Update Contact Field action
beyond the field it names.

---

## The four, side by side

| | **Vapi** | **Retell** | **ElevenLabs** | **LiveKit** |
|---|---|---|---|---|
| **A contact that outlives one run** | No. Contacts exist inside a campaign, up to 10,000, then they are gone | **Yes.** Keyed by phone number, one number one contact, typed custom fields, created automatically after a conversation | Partial. **Users** keyed by an `user_id` you supply; id, last contact, agent, conversation count. Exact-match search only | No |
| **Inbound context** | `assistant-request` webhook you host, **7.5 s end to end**, fixed | Inbound Call Webhook, **10 s × 3 attempts**, else disconnect. Contact fields also auto-pass as variables | Conversation initiation webhook, workspace URL plus a per-agent Security switch, **no stated timeout** | `sip.phoneNumber` and friends, nothing else |
| **Where a variable can land** | System prompt, first message, any dashboard message. LiquidJS filters and `{% if %}` | Prompt, begin message, **tool URLs and descriptions**, voicemail prompt, transfer numbers, webhook URLs | System prompt, first message, **tool parameters and headers**; `secret__` hides a value from the LLM | Nowhere. Metadata is code, not substitution |
| **Built-in CRM** | GoHighLevel only, as one of four prebuilt tools | **Five**: Salesforce, HubSpot, Dynamics 365, GoHighLevel, Zoho, with sync plus a named function list per provider | HubSpot and Salesforce as agent tools; HubSpot is **US-hosted only** | None |
| **What bounds a write** | "configure what the tool is allowed to do", unspecified | Field mapping table plus an update mode per row (Overwrite · Fill if empty · Merge). Phone never written back, create behind a toggle, **delete never**, **no human approval** | Nothing. Webhook tools take GET, POST, PUT, PATCH with no confirmation | Nothing to bound |
| **Cross-session memory** | None | **Contact Memory**: post-call extraction mapped into named contact fields, org-wide, returned as variables next call | None. Update state changes variables **within** a call only | Points at Letta and Mem0 |

---

## What nobody does

**Nobody shows the builder what the agent will actually know before the call runs.** Vapi's campaign
preview renders names and numbers and drops every other column, so the columns that decide what the
agent says are the ones the builder never sees. Retell has typed contact fields and a prompt full of
`{{variables}}` and no documented check that the two agree. ElevenLabs gets closest with
`dynamic_variable_placeholders`, but those are defaults the builder typed, not a reconciliation against
a real record. Our `campaignMissingVars` (`studio_x_2/lib/wizard-draft.ts`:781–785) does the thing none
of them document, and today it does it against a five-item constant.

Two smaller holes sit beside it. **Nobody puts a person between the agent and the CRM write**: Retell
states outright that outbound sync fires automatically, ElevenLabs webhook tools carry no confirmation,
GoHighLevel actions fire on a condition, and the only boundary anyone ships is a field allowlist plus an
update mode. And **nobody designs the miss**. When the lookup finds no record the documented behaviour
is failure, not a fallback: Vapi has the agent speak `"Unable to find customer record."` and end the
call, Retell disconnects after three webhook attempts, and ElevenLabs says nothing at all. An inbound
agent that greets a stranger gracefully is unbuilt everywhere.
