# LiveKit Cloud · product evidence for features 13-22
Captured 2026-09-17 from the signed-in console at `cloud.livekit.io/projects/p_5tos5u3omqa`.
The console is running its "BETA" early-access dashboard: a banner reads "You're in an
early-access view of the new dashboard. Return to original". The project has one agent,
`CA_rTyAuDHsdjJD`, stuck in "DEPLOYING · Not deployed yet", so session-shaped panels are empty.
Where a panel is empty, the panel titles and axes are still the finding: they show what LiveKit
decided is worth measuring.

## 13 · Dashboards and alerts
**Surface:** two separate dashboards. "Overview" is the project landing page. "Agents" is the
agent observability dashboard, one level down in the same left rail. There is no third surface.

**Shot:** `livekit-13-overview-dashboard.png` - the project landing page with four status tiles,
a six-item task list, a recently-deployed-agent card and a seven-day Insights strip.
**Shot:** `livekit-13-agents-observability-dashboard.png` - the agent dashboard with four KPI
tiles, the agents table and six time-series panels.

**What the control actually is:**
Overview leads with four label-over-number tiles in caps: "PROJECT ID", "PROJECT DATA REGION",
"AGENTS DEPLOYED", "CONCURRENT AGENT SESSIONS", plus "SYSTEM STATUS: ALL SYSTEMS OPERATIONAL".
Identity and health sit in the same row, at the same weight. Under them a plain list of six
next actions: "Build and manage agents", "Manage API keys", "Browse models and voices",
"Configure phone numbers", "View project usage", "Go to docs and API reference". Then
"Recently deployed agents" with a per-agent card carrying "CONCURRENT SESSIONS", "REGION" and a
status chip. Then "Insights", scoped by a "Past 7 days" range control, with six panels:
"SESSIONS SERVED", "AVERAGE SESSION DURATION", "AGENT SESSION MINUTES", "PARTICIPANTS",
"TOP COUNTRIES", "PLATFORMS".
The Agents dashboard is the operational one. Range control "Past 7 days", an "Auto-refresh off"
toggle, and two buttons: "Launch Console" and "Deploy new agent". KPI tiles: "TOTAL SESSIONS",
"AVG LLM TOKENS / SESSION", "INTERRUPTED RATE", "AGENT SESSION MINUTES" qualified
"this billing period". The agents table columns are "NAME · VERSION · SESSIONS · AVG TURNS ·
INTERRUPTED · E2E MEDIAN · REGION · STATUS", with a "Compare agents" action above it. Below:
"RESPONSE LATENCY" with two views, "Over time" and "Tails by stage"; "AGENT SESSIONS SERVED"
with two series, "Sessions" and "Dispatch errors"; then "TURNS", "INTERRUPTIONS", "LLM TOKENS",
"MODEL USAGE".

**Happy / rainy:** rainy. Every time series reads "No data for the selected time range." The
undeployed agent is why. The panel titles, the range control and the table columns are real.

**What it refuses to do:** there is no alert, no threshold, no notification rule, no destination
anywhere in the console. The left rail is Overview, Sessions, Simulations, Agents, Voices,
Telephony, Egress and Ingress, Usage, Settings, and none of them contains an alerting page.
Nothing on either dashboard lets you say "tell me when interrupted rate goes above X". There is
also no way to save a view, pin a panel, or change the panel set. Observability here is
read-only: you look, you leave.

**Steal / avoid:** steal "INTERRUPTED RATE", "E2E MEDIAN" and "Dispatch errors" as first-class
numbers, and steal "Tails by stage" as the second view of a latency chart rather than a separate
chart. Steal the empty-state sentence "No data for the selected time range." because it names the
range as the reason, not the account. Avoid shipping a dashboard with no alert: the thing a user
does after reading "interrupted rate is bad" is ask to be told next time, and LiveKit has no
answer for that.

## 14 / 15 · Evals and simulations
**Surface:** "Simulations" with a "BETA" chip, third item in the left rail, above Agents. A second,
separate surface does the live-testing job: "Agent Console", reached from the "Launch Console"
button on the Agents dashboard and from `/agents/console`.

**Shot:** `livekit-14-simulations-empty-state.png` - the entire Simulations surface. It is a range
control, one sentence, a docs link and a CLI command. There is no create button.
**Shot:** `livekit-15-agent-console-idle.png` - the Agent Console at rest, with the panel set it
fills during a session.
**Shot:** `livekit-15-agent-console-configuration-sheet.png` - the "Console configuration" sheet,
which is the only place in the console where a test session is configured.

**What the control actually is:**
Simulations, in full: a "Past 30 days" range control, the heading "No simulations yet", the line
"Run automated conversations against an agent using auto-generated or pre-defined scenario tests."
with "Learn more", and a copyable command block, `lk agent simulate -n 5`, captioned "Simulates 5
sessions with scenario tests unique to your agent". The only two links on the page are the project
breadcrumb and the docs. There is no new-simulation form, no scenario editor, no persona field and
no schedule. The console is a viewer for runs the CLI starts; the docs confirm the CLI "reports
results live, with a link to the run in the dashboard".
What a run actually grades lives in a checked-in `scenarios.yaml`, not in any UI. Per scenario:
`label` a human-readable name, `instructions` the persona and goal for the simulated user,
`agent_expectations` what the LLM judge grades the transcript against, `tags` arbitrary key/value
pairs for grouping and filtering runs, `userdata` nested data passed into the agent at runtime to
seed deterministic mocks and to declare the expected end state. A code callback,
`on_simulation_end`, can call `ctx.fail(reason=...)` so a run is graded on real final state and not
only on the conversation. Runs have two modes, text and audio. Concurrency is capped at 15 per run
by default, 20 explicit maximum, 30 simultaneous per project. Audio runs add caller-side quality
scores: end-to-end latency as heard by the caller at p50, p95 and p99, with negative values meaning
the agent talked over the caller; a stage breakdown of STT, endpointing, LLM time-to-first-token
and time-to-first-sentence, tokens per second, TTS time-to-first-byte; a turn-taking score with
named failures including end-of-turn misprediction, time to yield after a barge-in, false
interruptions, overlapping speech and unanswered caller turns; word and character error rates in
both directions with key entities such as names, IDs and confirmation codes scored separately; and
conversation quality with conciseness and flags for unnecessary tool calls, information loss and
redundant statements. Three flags degrade the simulated caller on purpose:
"--background-noise", "--low-quality-microphone", "--packet-loss".
The Agent Console is the other half. Idle it shows "CURRENT STATUS: IDLE", two actions "Configure"
and "Start session", and the panels that will fill: SESSION with "ROOM · REGION · DURATION ·
PARTICIPANTS"; ROOM CONFIGURATION with "METADATA · E2E ENCRYPTION · RECORDING"; AGENT CONFIGURATION
with "SDK / VERSION · REGION · LLM · TTS · STT"; METRICS with "AVERAGE LLM TIME-TO-FIRST-TOKEN" and
"AVERAGE END-TO-END LATENCY"; USAGE with "LLM INPUT / OUTPUT TOKENS · TTS CHARACTERS · STT
DURATION". A tab strip runs "Audio · Events · Session · Participants · RPC · DTMF · Metrics ·
Models" with "Clear events". Every panel carries an "OPEN IN TOOLBAR" affordance. The configuration
sheet is grouped Participant, Agent, Room: "Observe as hidden participant" default OFF, Identity,
Metadata, Attributes with "Add entry"; "Agent name" with the note "If omitted, any unnamed agent
will be dispatched at random", "Deployment" defaulting to "production", "Job metadata"; room name
and metadata, then "Advanced room settings" with the instruction "Leave a field blank or set it to
0 to use the LiveKit default" over "Empty timeout (seconds)", "Departure timeout (seconds)",
"Max participants", "Min playout delay (ms)", "Max playout delay (ms)", "Sync streams" and
"End-to-end encryption".

**Happy / rainy:** rainy for Simulations. No run exists and I did not start one, because a run
costs money and dispatches inference. The empty state is the evidence: it proves the surface has no
create path. Rainy but instructive for Agent Console: idle, with the full panel skeleton visible.

**What it refuses to do:** Simulations refuses to be started from the console. It refuses to let you
write a scenario, name a persona, set a pass condition, pick text or audio, choose how many runs, or
schedule a nightly regression. It refuses to hold a library of saved scenarios. The console has no
concept of a suite, a baseline, or a diff between two runs. The Agent Console refuses to keep
anything: it is a live scope, not a record, and nothing it shows is saved as a test result.

**Steal / avoid:** steal the grading vocabulary wholesale. `label` · `instructions` ·
`agent_expectations` · `tags` · `userdata` is the cleanest four-field model of a voice eval any of
the four vendors has, and "what a successful run looks like" as the definition of the pass condition
is better than any score. Steal caller-heard latency as the headline number, with a negative value
meaning the agent talked over the caller, and steal the three degraded-caller toggles as a named
"bad line" preset. Avoid LiveKit's split: the person who reads the result cannot start the run, and
the person who writes the scenario is in a text editor. One surface should hold write, run and read.

## 16 · Phone number purchase
**Surface:** "Phone numbers", a tab inside Telephony. Telephony has its own sub-nav across the top:
"Calls · Dispatch rules · Phone numbers · SIP trunks".

**Shot:** `livekit-16-phone-numbers-empty-state.png` - the surface with no numbers yet and the one
sentence that explains what renting buys you.
**Shot:** `livekit-16-rent-a-number-catalogue.png` - the "Rent a number" dialog with the live
catalogue, ten pages of US local numbers at $1.00 a month.

**What the control actually is:** LiveKit does sell numbers, and the verb is "Rent", not "Buy".
The empty state reads "Purchase phone numbers directly from LiveKit for your voice agents to answer
inbound calls, no external SIP trunk configuration required." That sentence is doing the real work:
it positions renting as the escape hatch from the trunk setup that sits one tab away. Inside the
dialog: "All plans include one free US local phone number for inbound calling. Additional local and
toll-free numbers can be purchased for a monthly rate. Currently limited to US numbers only."
The table is "NUMBER · LOCATION · TYPE · FEATURES · MONTHLY RATE" with a per-row "Rent" button.
Every row on page 1 is "+1 240 212 xxxx", "OAKLAND, MD", "Local", "$1.00". The footer reads
"Page 1 of 10". I stopped at this screen; the per-row "Rent" is where money moves.

**Happy / rainy:** both. The Phone numbers list is the empty state and the catalogue is populated.

**What it refuses to do:** there is no search and no filter of any kind in the catalogue. No area
code field, no state or city picker, no toll-free toggle, no vanity search, no quantity. The three
column headers sort, and that is the entire control surface. To find a number in a specific area
code you page through ten pages of Oakland, Maryland. The "FEATURES" column is present but empty on
every row, so it never says whether a number does SMS or MMS. Non-US is refused outright.

**Steal / avoid:** steal the word "Rent" and the sentence that says renting means "no external SIP
trunk configuration required", because it tells a user which of two doors to walk through before
they open either. Avoid a purchase catalogue with no area-code search: a paginated list of one
town's numbers is a worse answer than a search box with no results.

## 17 · SIP trunk setup
**Surface:** "SIP trunks" and "Dispatch rules", two tabs inside Telephony. The Telephony landing
tab is "Calls", a call-log dashboard.

**Shot:** `livekit-17-telephony-calls-dashboard.png` - the Telephony landing dashboard, five KPI
tiles over a filterable call table.
**Shot:** `livekit-17-sip-trunks-list.png` - the trunks surface: two counts, the project SIP URI,
and two separate tables for inbound and outbound.
**Shot:** `livekit-17-inbound-trunk-form.png` - the create-trunk sheet with direction set to
Inbound.
**Shot:** `livekit-17-outbound-trunk-form.png` - the same sheet with direction set to Outbound,
showing a different field set.
**Shot:** `livekit-17-trunk-json-editor-validation.png` - the "JSON editor" tab of the same sheet,
with live per-field validation errors.
**Shot:** `livekit-17-dispatch-rule-form.png` - the create-dispatch-rule sheet.

**What the control actually is:** the trunks page leads with "TOTAL INBOUND TRUNKS" and
"TOTAL OUTBOUND TRUNKS", then prints the project's own SIP URI in full,
"sip:5tos5u3omqa.sip.livekit.cloud", as copyable text before any table. Then two tables under two
headings, "Inbound" with columns "TRUNK ID · TRUNK NAME · NUMBERS · CREATED", and "Outbound" with
the same plus "SIP URI". One "Create new trunk" button serves both.
The sheet opens with "Configure a SIP trunk for inbound calls (from a carrier into LiveKit) or
outbound calls (from LiveKit out to a carrier)." Direction is a radio pair, "Inbound" and
"Outbound", and it swaps the form beneath it.
Inbound: "Trunk name"; "Numbers" with the help text "List of provider phone numbers this trunk
accepts calls for. If none are specified, it accepts calls to any number."; "Allowed addresses"
with "For better security, only allow IP addresses you trust. If left empty or set to
\"0.0.0.0/0\", all IP addresses will be allowed."; then a collapsed "Optional settings" holding
"Media encryption (SRTP)" with three values, "Media encryption disabled" (default), "enabled",
"required"; "Include headers" with "No headers" (default), "X headers", "All headers"; and a
checkbox "Enable Krisp".
Outbound: "Address"; "Transport" with "Auto · UDP · TCP · TLS"; "Numbers"; then "Optional settings"
holding the same three-value media-encryption select plus "Username" and "Password".
Every sheet has a second tab, "JSON editor", editing a file literally named
`sip-trunk-info.json`. It validates live and names the field path:
"Field \"name\": Required", "Field \"numbers.0\": Empty numbers are not allowed.",
"Field \"numbers.0\": Only phone numbers (digits with optional + prefix and * symbol) or SIP URIs
(sip: or sips: format) are allowed."
Dispatch rules is the routing half: "Route inbound SIP calls to an agent or room based on the trunk
they arrive on." Columns "DISPATCH RULE ID · RULE NAME · INBOUND ROUTING · DESTINATION ROOM ·
AGENTS · RULE TYPE · CREATED · UPDATED". The sheet has "Rule name"; "Rule type" as a select over
"Direct · Individual · Callee", defaulting to "Individual", plus a "Room prefix" field; an
"Agent dispatch" block, "Configure an agent to dispatch to LiveKit rooms and enable inbound calling
for your agent." with an "Add agent" row; and "Inbound routing", "Configure origination by setting
up how inbound calls will be dispatched to LiveKit rooms by matching phone numbers and specific
trunks. If no number or trunk is selected, the rule will be applied to all." over two pickers,
"Phone numbers" and "Trunks". The number picker reads "No phone numbers owned".

**Happy / rainy:** rainy lists, happy forms. Both trunk directions and the dispatch rule sheet were
captured fully populated with their real fields. I created nothing.

**What it refuses to do:** there is no wizard and no carrier presets. Nothing offers to set up
Twilio or Telnyx for you, and nothing tests the trunk: no "verify", no test call, no reachability
check, so you find out the address is wrong when a call fails. The form never explains why you would
choose "Direct" over "Individual" over "Callee" beyond the three words. Nothing links a trunk to the
dispatch rule that uses it, so the two halves of one setup live in two tables that do not reference
each other. A rented LiveKit number does not appear here at all, which is the point of renting, but
nothing on the trunks page says so.

**Steal / avoid:** steal the direction radio that swaps one sheet into two forms, the project SIP
URI printed as copyable text above the table, the field-path validation wording
"Field \"numbers.0\": ...", and the habit of stating the default behaviour of an empty field
("If none are specified, it accepts calls to any number"). Steal the JSON tab as the escape hatch
for the engineer who already has the config. Avoid splitting trunk and dispatch rule into two
unlinked tables: one inbound number is one setup, and it should read as one.

## 18 · Channels
**Surface:** there is no channels page. The choice is made in two unconnected places: the
"Advanced" tab of the Agent Builder, under a heading called "Telephony", and the Telephony section's
own "Dispatch rules" tab.

**Shot:** `livekit-18-agent-builder-advanced-telephony.png` - the Advanced tab, where "Telephony"
is the last block on the page, under agent name, custom metadata and secrets.

**What the control actually is:** the block reads "Connect your agent to phone numbers. To assign
already-owned numbers to this agent, see dispatch rules to create or edit an existing rule, setting
explicit dispatch for this agent." The only control is a "Rent a number" button. So the agent gets a
phone channel by renting a new number here, or by leaving this page entirely and writing a dispatch
rule. Web is not a choice at all: every LiveKit agent is already reachable over WebRTC by joining
its room, which is what "Test in Console" and the builder's "START CALL" do. Egress and Ingress is a
separate top-level item and is about recording and streaming media, not about a conversational
channel.

**Happy / rainy:** rainy. No number owned, so the block shows only the rent path.

**What it refuses to do:** there is no channel list, no per-channel on and off, and no chat, SMS,
WhatsApp or widget anywhere in the console. Nothing shows an agent's current reach in one place: you
cannot look at an agent and read "answers +1 240 212 4072 and the web widget". The help text sends
you to a different section to finish the job and does not link the specific rule.

**Steal / avoid:** steal the honesty that web needs no configuration, which is why it has no
control. Avoid the split: the agent page should state every way this agent can be reached and let
you add one from there, rather than naming dispatch rules in a sentence and making the user go find
them.

## 19 · Tools and connectors
**Surface:** "Actions", a tab inside the "Agent Builder". The Builder is reached only from an
agent's own tab strip: "Overview · Versions · Console · Builder · Configuration". It is not in the
left rail, and nothing at project level advertises it.

**Shot:** `livekit-19-agent-builder-actions.png` - the Actions tab with its three empty blocks.
**Shot:** `livekit-19-http-tool-form.png` - the "Add HTTP tool" sheet, the whole no-code tool
definition.
**Shot:** `livekit-19-mcp-server-form.png` - the "Add MCP server" sheet.
**Shot:** `livekit-19-agent-builder-conversation.png` - the Conversation tab with a populated
customer-support prompt and welcome message.
**Shot:** `livekit-19-agent-detail-observability.png` - the agent's own Overview tab, which is
entirely charts.
**Shot:** `livekit-19-agent-configuration-secrets.png` - the agent's "Configuration" tab, which is
a secrets table and nothing else.

**What the control actually is:** LiveKit does have a no-code tool builder, which contradicts the
usual reading of LiveKit as code-only. Actions has exactly three kinds. "HTTP tools · Define web
requests to enable your agent to interact with web-based APIs and services." "Client tools ·
Connect your agent to client-side RPC methods to retrieve data or perform actions." "MCP servers ·
Configure external MCP servers for your agent to connect and interact with."
The HTTP tool sheet is short and well-worded: "Tool name" with "Unique name used by the LLM to
identify and use the tool."; "Description" with "The tool's purpose, outcomes, usage instructions,
and examples."; "HTTP method" as a select over GET, POST, PUT, DELETE, PATCH, defaulting to GET;
"URL"; "Parameters" with "Arguments passed by the LLM when the tool is called.", empty state
"No parameters added" and an "Add parameter" row; "Headers" with "Optional HTTP headers for
authentication or other purposes." and "Add header"; and a toggle "Silent · Hide tool call result
from the agent and do not generate a response.", default NO.
The MCP sheet is three fields: "Server name · A human-readable name for this MCP server.", "URL",
and "Headers" with "Add header".
The Builder itself is four tabs, "Conversation · Models & Voice · Actions · Advanced", with a right
rail that flips between "Live preview" and "Code", a "START CALL" button, and header actions
"Test in Console" and "Deploy agent" beside "Last saved 2 months ago". Conversation carries "Type"
with two values, "Open ended" and "Data collection", the "Instructions" editor with an
"Insert variable" control, a "Welcome message" with a toggle and the note "Allow users to interrupt
the greeting.", and "Call ending · Define how the call should end" behind a "Configure" button.
Advanced holds "Agent name · Used for agent dispatch.", "Custom metadata", "Secrets · Define
secrets to be set as environment variables for your agent, and for use in HTTP tool calls." and the
Telephony block.
The deployed agent's own pages hold no configuration at all. Its Overview is nine charts. Its
Configuration tab is one table, "Secrets", with columns "KEY NAME · KIND · CREATED · UPDATED".

**Happy / rainy:** happy for the Conversation tab, which carries a real prompt. Rainy for Actions,
where all three blocks are empty, and for Configuration, which has no secrets.

**What it refuses to do:** there is no catalogue. No Google Calendar, no Salesforce, no Slack, no
prebuilt anything: every tool is a URL you type. Nothing tests a tool. The HTTP sheet has no
response mapping, no timeout, no retry, no auth type, and no way to say what the agent should say
while it waits. There is no transfer-to-human action and no end-call action in the Actions tab; call
ending is a separate control on the Conversation tab. The Builder is buried under an agent's tab
strip, and a deployed agent's own pages never show what tools it is running.

**Steal / avoid:** steal the three-way split of HTTP tool, client tool and MCP server, because it
names where the work happens rather than what the integration is called, and steal the "Silent"
toggle with its one-line explanation. Steal "Insert variable" sitting on the prompt editor itself.
Avoid hiding the builder behind an agent tab, and avoid a deployed agent whose pages cannot tell you
what it is configured to do.

## 20 · Knowledge sources
**Surface:** none. There is no knowledge base, no documents, no RAG and no file upload anywhere in
the signed-in console.

**Shot:** `livekit-19-agent-builder-actions.png` - the Actions tab is the whole of what an agent can
reach outside itself, and it contains no knowledge block.
**Shot:** `livekit-13-overview-dashboard.png` - the left rail in full: Overview, Sessions,
Simulations, Agents, Voices, Telephony, Egress and Ingress, Usage, Settings. No knowledge item.

**What the control actually is:** what stands in its place is an HTTP tool or an MCP server. If the
agent needs to know something, you point it at an endpoint that knows. The Builder's prompt editor
is the only place text lives, and it is instructions, not content. The docs call the equivalent
concept "External data & RAG" and treat it as code you write in the agent, not a surface in the
console.

**Happy / rainy:** neither. The finding is the absence.

**What it refuses to do:** it refuses to hold a single document. No upload, no URL crawl, no
chunking, no retrieval settings, no per-agent attachment, no indication of what the agent knows.

**Steal / avoid:** nothing to steal. The lesson is the opposite: three of the four vendors ship a
first-class Knowledge Base, and LiveKit's answer of "write a tool" is the reason its console reads
as infrastructure rather than product. If we ship knowledge, the agent page should say which sources
it is attached to.

## 21 · CRM and contacts
**Surface:** none. There is no contacts, people, audiences, users or segments surface in the
console.

**Shot:** `livekit-13-overview-dashboard.png` - the full left rail, which is the evidence of the
absence.

**What the control actually is:** the nearest thing is "PARTICIPANTS" as a number on the Overview
Insights strip and a column in the Agent Console, plus "TOP COUNTRIES" and "PLATFORMS" panels. A
participant is a connection, not a person: it has an identity string, metadata and attributes, all
set per session in the Console configuration sheet, and none of it persists between sessions. The
caller's number appears only as the "FROM" column in the Telephony call log.

**Happy / rainy:** neither. The finding is the absence.

**What it refuses to do:** there is no record of a caller across calls, no list to call out to, no
notes, no tags on a person and no import. Outbound at scale is a SIP trunk and your own code.

**Steal / avoid:** steal "identity · metadata · attributes" as the per-session shape of who is on the
call, because it is the minimum a session needs. Avoid stopping there: a caller who rings twice
should be the same row both times, and LiveKit has no place to put that row.

## 22 · Usage, credits, concurrency
**Surface:** three pages, not one. "Usage" in the left rail is the meter. "Settings ·
Quota and limits" is the ceiling. "Settings · Billing" is the money.

**Shot:** `livekit-22-usage-all-sections.png` - the Usage page with all seven sections expanded.
**Shot:** `livekit-22-quota-and-limits.png` - the limits table with peak usage bars and a per-row
upgrade path.
**Shot:** `livekit-22-billing-plan-and-statements.png` - the plan, three usage tiles and the
statements table.

**What the control actually is:** Usage is an accordion of seven sections, each with its own tiles
and charts, under one "Past 7 days" range control: "Agents" with "AGENT SESSION MINUTES" and
"CONCURRENT AGENT SESSIONS"; "Participants" with "WEBRTC PARTICIPANT MINUTES", "PARTICIPANT MINUTES
BY KIND" and "AVERAGE CONCURRENT CONNECTIONS" split three ways, "Agents · Participants · Total
connections"; "Telephony" with "MINUTES" split "Inbound · Outbound · Total minutes", plus
"TOTAL INBOUND", "TOTAL OUTBOUND" and "TOTAL SIP SESSIONS"; "Data transfer" with "TOTAL UPSTREAM"
and "TOTAL DOWNSTREAM" and a chart split "Downstream · Upstream"; "Rooms" with "TOTAL ROOM
SESSIONS", "AVERAGE ROOM SIZE", "AVERAGE ROOM DURATION"; "Egress" with counts and
"TOTAL BILLABLE EGRESS DURATION" versus "TOTAL TRACK EGRESS DURATION", broken out by
"Participant · Room composite · Track · Track composite · Web"; "Ingress" with "TOTAL BILLABLE
INGRESS DURATION" and "TOTAL NON-BILLABLE INGRESS DURATION". Note that billable and non-billable
are separate named numbers, not a footnote.
Quota and limits is the best page of the three. The lead sentence is blunt: "To ensure the stability
of our network and to prevent abuse, LiveKit Cloud projects have limitations on the number of
connections and inference that are included in your plan. Service may be disrupted when these limits
are exceeded." Then "The limits included with the Build plan are fixed. Upgrade your plan to raise
them." The table is "TYPE · LIMIT · PEAK USAGE (PAST 7 DAYS)" plus an action column. Rows:
"API requests per minute · 10K · 0% | 1/10K"; "Agents deployed on LiveKit Cloud · 1 · 0% | 0/1";
"Concurrent agent sessions · 5 · 0% | 0/5"; "Concurrent participants · 100 · 0% | 0/100";
"Concurrent Egress requests · 2 · 0% | 0/2"; "Total Ingresses · 2 · 0% | 0/2". Every row except the
API one carries its own "Upgrade plan to increase" link. Each peak-usage cell is a bar plus the text
"0% | 0/5", so the percentage, the current value and the ceiling are all readable at once. Below it,
"Inference limits" is a per-model table, "MODEL · ID · TYPE · LIMIT · PEAK USAGE", filtered by
"All · With usage · STT · TTS · LLM · TD · INT", with the empty state "Models will appear here once
they start receiving traffic or you set a custom limit." So a per-model limit is a thing a user can
set.
Billing is thin: "CURRENT PLAN: Build" with one "Upgrade" button, three tiles "BANDWIDTH TODAY",
"BANDWIDTH IN SEPTEMBER", "NEXT INVOICE $0.00", and a "Statements" table whose empty state reads
"No statements available. Statements become available after a payment has been processed."

**Happy / rainy:** rainy for Usage and Billing, both zeroed. Happy for Quota and limits, which is
fully populated because limits exist whether or not you use them. That is the whole point of the
page.

**What it refuses to do:** there is no credit balance, no prepaid balance, no spend cap and no
budget alert. Nothing warns you before a limit is hit, and the page tells you outright that
"Service may be disrupted when these limits are exceeded" without offering to tell you when. Usage
and Quota are two pages, so the number you are at and the number you can reach never appear side by
side except on the Quota page's own bars. Nothing on Usage shows cost: minutes and bytes, never
dollars. Billing shows one invoice total and no breakdown by agent, number or model.

**Steal / avoid:** steal the Quota and limits page nearly whole. A limit table with a live peak-usage
bar reading "0% | 0/5" and a per-row "Upgrade plan to increase" is the clearest treatment of
concurrency in the set, and "Concurrent agent sessions" is the right name for the number. Steal the
split of billable and non-billable duration as two named tiles. Avoid separating usage from limits:
show the ceiling on the same page as the meter, and warn before the ceiling, not after.

## 13 · addendum · where the observability switch actually lives
**Surface:** "Settings · Observability". The project Settings page still carries the old heading
"Agent observability" with the line "These settings have moved to Observability settings.", so the
console is mid-move and says so.

**Shot:** `livekit-13-observability-settings-pii-redaction.png` - the observability switch, already
on, above ten PII categories.

**What the control actually is:** "Agent observability · Capture traces, transcripts, and audio from
agent sessions for debugging. See pricing details", a single ON switch, already ON for this project,
with the note "Data from observability may be stored and processed in the US." Beneath it,
"PII redaction · Reduce exposure of personally identifiable information (PII) in agent sessions by
redacting sensitive data before storage.", default OFF, over ten category cards each showing a
selected count and a "View category" link: "Name 0 of 3", "Contact 0 of 2", "Demographics 0 of 8",
"Credentials 0 of 2", "Network 0 of 2", "Organization 0 of 1", "Financial 0 of 6", "Location 0 of 7",
"Date 0 of 1", "Identifiers 0 of 9". Each card names its members in one line, for example Financial
is "Bank accounts, routing numbers, SWIFT codes, credit cards, and CVVs." The page closes with
"Changes take effect on new sessions only. Existing sessions are unaffected."

**Happy / rainy:** happy. The switch was already on, so nothing had to be changed.

**What it refuses to do:** redaction is a project switch, not a per-agent one, and it still has no
alerting attached. Nothing tells you what a redaction setting will cost you in debuggability.

**Steal / avoid:** steal the "0 of 3" counter on each category card, which turns a long compliance
list into a scannable set of dials, and steal the closing sentence "Changes take effect on new
sessions only. Existing sessions are unaffected." Any setting that applies at session start should
say so in exactly that shape.
