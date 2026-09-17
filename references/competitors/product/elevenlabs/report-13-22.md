# ElevenLabs Agents · primary research, features 13 to 22
Captured 2026-09-17 from the signed-in workspace "My Workspace" at https://elevenlabs.io/app/agents.
Workspace is small: 3 agents, 2 conversations, 1 phone number's worth of setup. Where a surface was
empty I say so and treat it as a rainy scenario.

## 13 · Dashboards and alerts
**Surface:** "Home" at /app/agents, the first item in the sidebar, above the agent list. Conversation
records live separately under "Monitor · Conversations" at /app/agents/history.

**Shot:** `elevenlabs-13-home-dashboard-90d.png` - the home dashboard over "Last 90 days" with six
number tiles and four time series.

**What the control actually is:** the dashboard is a set of named tabs, not one fixed page:
"General", "Evaluation", "Data Collection", "Workflow", "Audio", "Tools", "LLMs", "Topics",
"Knowledge Base", "Advanced", and a "Create view" button that adds your own. The filter bar carries a
date range ("Last 90 days"), a timezone ("UTC+7"), "Granularity" ("Daily", "Hourly"), an "Agent"
picker, "Group By", and a "Stacked view" toggle. The General tab's tiles are "Number of
conversations", "Average duration", "Total cost" in credits, "Average cost" in credits, "Total LLM
cost" in dollars, "Average LLM cost" in dollars. Charts below: "Overall Success Rate", "Average CSAT
Rating", "Agent Response Time", "Total Conversation Duration". Each chart has its own "Linear" / "Log"
scale switch and its own source label, "Filtered conversation history". Cost is shown twice in two
different units: credits for the platform, dollars for the LLM.

**Shot:** `elevenlabs-13-create-dashboard-view-dialog.png` - "Create new view", "Create a new view
with a name and optional description", fields "View Name" and "View Description", buttons "Create"
and "Close".

**Shot:** `elevenlabs-13-evaluation-tab-empty.png` - the Evaluation tab with nothing in it.
The empty copy is "No evaluation criteria. Select an agent or configure default evaluation criteria
for this tab." The Evaluation dashboard is downstream of per-agent criteria: no criteria, no chart.
Note this tab silently resets the range to "Last 7 days" and granularity to "Hourly" while the
General tab was on 90 days and Daily. Range is per tab, not per page.

**Shot:** `elevenlabs-13-conversation-history-list.png` - the conversation list: columns "Agent",
"Title", "Date", "Duration", "Messages", "Evaluation". Titles are model-written summaries
("Mindfulness Tip", "Introduction and greeting"), not ids. "Evaluation" is a green "Successful" pill.

**Shot:** `elevenlabs-13-history-customize-table.png` - the "Customize table" popover:
"Drag columns to reorder. Toggle to show or hide." Available columns are Agent, Branch, Title, Date,
Duration, Messages, Evaluation, Status, Language and more below the fold. Also a toggle "Hide ongoing
& processing conversations", a "Date format" segmented control "Relative" / "Absolute", and buttons
"Add column" and "Reset to defaults".

**Happy / rainy:** the General tab and the history list are happy on a thin data set. The Evaluation
tab is rainy and teaches the dependency.

**What it refuses to do:** there is no alerting anywhere. No threshold, no notification rule, no
recipient, no "notify me when success rate drops". The dashboard is read-only observation. There is
also no way to pin a tile from a tab into a custom view from the chart itself, and no export button
on any chart.

**Steal / avoid:** steal the tabbed dashboard with user-created views and the per-chart Linear/Log
switch, and steal "Customize table" as the single door for column choice, order, date format and row
filtering. Avoid letting each tab keep its own silent date range: the range must be one control that
survives the tab switch, or people will read 7 days thinking they are reading 90.

## 14 · Evals and scorecards
ElevenLabs splits this in two. "Tests" is the pre-release half at workspace level and inside every
agent. "Analysis" is the post-call scorecard half, and it lives only inside an agent.

**Surface:** "Monitor · Tests" at /app/agents/agent-testing, and "Configure · Analysis" inside an agent
at /app/agents/agents/<id>/analysis.

**Shot:** `elevenlabs-14-tests-empty.png` - the Tests list with two tabs, "All Tests" and "Past Run
Analysis", and two buttons, "Create Folder" and "Create a test". Empty copy: "No tests found. You have
not created any tests yet." with "Create your first test" and "Learn how". Tests are foldered, which
says they expect a lot of them.

**Shot:** `elevenlabs-14-create-test-simulation.png` - the create-test form on the "Simulation test"
tab. The type is a three-tab control at the top: "Simulation test", "Next reply test", "Tool
invocation test". Simulation fields: "Test name", "Describe simulated user scenario", "Describe
success criteria" with "Add criterion" for more than one, "Maximum conversation turns", a "Mock all
tools" toggle with "Configure" and the line "Return mock responses for every tool call." plus "Choose
tools to mock", a "Model configuration" block described as "Which LLMs are used for the simulation.
Stronger models may yield better results, but at higher costs.", a "Dynamic variables to use in the
test run (optional)" table with "Add New", and a "Simulated channel" picker set to "Default". The
seed turn is editable: the agent's opening line "Hello, how can I help you today?" sits in the form as
the first message. Footer copy: "A simulated user will continue the conversation based on your
scenario. The full conversation will be evaluated against your success criteria and visible to you."

**Shot:** `elevenlabs-14-create-test-next-reply.png` - the "Next reply test" tab. It swaps the
scenario field for "Describe expected next message", plus "Success Examples (optional)" with "Add
Example" and "Failure Examples (optional)" with "Add Example". Grading by example, not by rule.

**Shot:** `elevenlabs-14-create-test-tool-invocation.png` - the "Tool invocation test" tab. Fields:
"Test name", "Tool to test" with "Add tool", the hint "If you leave this empty, the test will check
that no tool has been called.", and a toggle "Pass test if any tool matches". The negative assertion
is the default, which is the smart part.

**Shot:** `elevenlabs-14-test-object-json.png` - "Edit as JSON" shows the whole test object:
`name`, `type` ("llm"), `chat_history` as an array of role/message/time_in_call_secs, `dynamic_variables`,
`conversation_initiation_source`, `environment`, `success_condition`, `success_examples`,
`failure_examples`, `tool_call_parameters`. Every form has a "Switch to Form" twin, so the same object
is authored either way.

**Shot:** `elevenlabs-14-agent-analysis-settings.png` - the per-agent "Analysis" page: "General
settings" with "Default analysis model" ("Gemini 2.5 Flash", described as "The default LLM model used
for post-call analysis, including evaluation criteria and data collection. Individual criteria and
data points can override this setting."), "Topic discovery", "Sentiment analysis" with a standing
disclosure the user must "Acknowledge" ("We analyze the text of your conversations to estimate
sentiment. Audio is not analyzed for sentiment."), then "Language & attribution" with "Analysis
Language" ("Auto (infer from conversation)"), "Auto-translate transcript" and "Source Attribution"
("Record which knowledge base sources are cited in each response"), then "Evaluation criteria" ("0
criteria") and "Data collection" ("0 data points").

**Shot:** `elevenlabs-14-evaluation-criteria-form.png` - the "Add evaluation criteria" right-hand
sheet. Fields: "Criteria name" with the hint "Enter the name to generate an ID.", "Evaluation
instructions" ("Describe how the agent should evaluate whether the conversation was a success or
not."), "Scoring" as a segmented "Binary" / "Numeric", "Analysis scope" as a segmented "Conversation"
/ "Agent", and "Analysis model" defaulting to "Use agent default". Primary button "Add criteria".

**Shot:** `elevenlabs-14-agent-sidebar-overview.png` - the agent's own left rail, which is the same
shape as the workspace rail: Main (Overview, Spotlight, Dashboards), Configure (Agent, Procedures,
Workflow, Branches, Knowledge Base, Analysis, Tools, Guardrails, Settings), Monitor (Conversations,
Tests, Users), Deploy (Channels, Outbound). Every workspace noun has an agent-scoped twin.

**Happy / rainy:** the create-test forms and the criteria sheet are happy. The tests list is rainy and
teaches that tests are foldered and that nothing runs until you author one.

**What it refuses to do:** a test cannot be generated from a real conversation. There is no "turn this
call into a test" anywhere in conversation history, so the simulated scenario is written by hand even
though a transcript exists. There is also no pass threshold on a suite and no scheduling: nothing
says "run these on every publish".

**Steal / avoid:** steal the three test types as one object with one JSON twin, and steal the tool
test's default assertion that no tool was called. Steal "Scoring: Binary or Numeric" and "Analysis
scope: Conversation or Agent" as the two axes of a criterion. Avoid burying evaluation criteria inside
a per-agent Analysis page while the workspace Evaluation dashboard sits empty and only says "configure
default evaluation criteria for this tab": the criterion and the chart that reads it must be one
journey.

### 13 addendum · the thing they ship instead of alerting
**Shot:** `elevenlabs-13-agent-spotlight-recommendations.png` - the agent's "Spotlight" page, which is
what you land on when you open an agent. Above the charts sits a stack of recommendation cards, each
with a severity tag and one button: "High severity · Enable guardrails · Block prompt injection and
unsafe input so the agent stays on script and trustworthy. [Enable]", "High severity · Update
deprecated LLM · This agent uses a deprecated LLM. Switch to the recommended replacement to keep it
running reliably. [Update]", "Recommended · Add tests for this agent · This agent has no tests
attached. Tests catch regressions before they reach callers. [Add tests]", "Suggested · Try Eleven v3",
"Suggested · Enable workflow". Below them are per-agent charts: "Conversations", "Success Rate",
"Topics", "Latency", "Conversation Cost", "Conversation Duration", "Transfer to Human", "Positive
Sentiment", "CSAT", and a topic table with columns "Topic", "Conversations", "Sentiment", "Success
rate". Two charts are honest about being unconfigured rather than empty: "The data will appear after
you enable Transfer To Human tool. [Set up in Tools]" and "Enable feedback collection in the widget to
let customers rate their satisfaction. [Set up in Widget]".

**Steal / avoid:** steal this. A severity-tagged recommendation card with one verb button is a better
answer to "is my agent healthy" than a threshold alert, and it works on day one when there is no
traffic to threshold against. Steal the pattern of a chart that names the toggle that would fill it
and links straight to that toggle. Avoid calling the page "Spotlight": the word tells a first-time
user nothing.

## 16 · Phone number acquisition
**Surface:** "Deploy · Phone Numbers" at /app/agents/phone-numbers.

**Shot:** `elevenlabs-16-phone-numbers-list.png` - the empty list. "No phone numbers. You don't have
any phone numbers yet." One action only, repeated in the header and in the empty card:
"Import number". There is no "Buy number", no catalogue, no country search, no price. ElevenLabs does
not sell numbers, and the page makes that clear by having exactly one door.

**Shot:** `elevenlabs-16-import-number-chooser.png` - the chooser that drops from "Import number":
"From Twilio", "From SIP Trunk", "From Exotel". Three carriers, named, no generic "other".

**Shot:** `elevenlabs-16-import-from-twilio-form.png` - "Import phone number from Twilio". Fields:
"Label" with the placeholder "Easy to identify name of the phone number" and a live "0/50" counter,
"Phone number" as a country-flag dial-code picker plus a number field, "Twilio Account SID or API Key
SID" with the placeholder "Starts with AC (Account SID) or SK (API Key SID)", a "Routing Region
Configuration" toggle ("Configure a specific routing region with dedicated token", off by default),
and an "Enable inbound SMS" toggle ("Route inbound texts to ElevenLabs.") which is ON by default.
Primary button "Import". The country list is the full ITU list with dial codes.

**Happy / rainy:** rainy, because the workspace owns no number. The rainy state is the evidence: it
proves the model.

**What it refuses to do:** you cannot get a number here at all. There is no path from "I need a phone
number" to having one: you must already hold a Twilio, SIP or Exotel number. No availability search,
no area-code picker, no price, no port-in request.

**Steal / avoid:** steal the honesty of one verb. If we do not sell numbers, the button says "Import
number" and the chooser names the carriers, rather than a vague "Add". Avoid defaulting "Enable
inbound SMS" to on inside an import dialog: turning on a second channel is a decision, not a detail of
importing a voice number.

## 17 · SIP trunk setup
**Surface:** the same "Import number" chooser, second item, "From SIP Trunk". SIP is not a separate
page: a trunk is one kind of phone number.

**Shot:** `elevenlabs-17-sip-trunk-form.png` - "Import SIP Trunk", the inbound half.
**Shot:** `elevenlabs-17-sip-trunk-outbound.png` - the same panel scrolled to the outbound half.

**What the control actually is:** one right-hand panel, split into two named halves.
Top: "Label" with a 0/50 counter and "Phone number". Then a standing notice, "Static IP SIP Servers
Available. ElevenLabs offers SIP servers with static IP addresses for enterprise clients requiring IP
allowlisting. Static IP infrastructure uses a /24 block across US, EU, and India regions. Available
for enterprise accounts. Contact sales to learn more."
"Inbound Configuration · Forward calls to the ElevenLabs SIP server": "Media Encryption" as a three-way
picker "Disabled" / "Allowed" / "Required", default "Allowed"; "Allowed Numbers (Optional)" with "Add
Number" and the rule "Phone numbers that are allowed to use this trunk. Leave empty to allow all
numbers."; "Allowed Source IP Addresses (Optional)" with "Add IP Address" and the warning "Works only
for TCP/TLS transport, not UDP. ... Leave as 0.0.0.0/0 to allow all addresses."; "Remote Domains
(Optional)" with "Add Domain" and "Specify the FQDN domains of your SIP servers from which you
originate the calls. E.g. example.pstn.twilio.com. These domains are used for TLS certificate
validation. Leave this field empty if you don't use TLS."; "Authentication (Optional)" with "SIP Trunk
Username" and "SIP Trunk Password".
"Outbound Configuration · Configure where ElevenLabs should send calls for your phone number":
"Address", with the field-level warning "Hostname or IP the SIP INVITE is sent to. This is not a SIP
URI and shouldn't contain the sip: protocol. In case of TLS, use the hostname with valid certificate."
Footer: "Import" and "Close".

**Happy / rainy:** happy path of the form, rainy account. No trunk was created.

**What it refuses to do:** nothing validates before you submit. There is no "Test connection", no
dry-run INVITE, no echo of the ElevenLabs-side SIP URI to paste into your PBX, and no status pill
afterwards. You fill nine fields blind and find out on the first real call.

**Steal / avoid:** steal the writing. Every optional field states the permissive default in words
("Leave empty to allow all numbers", "Leave as 0.0.0.0/0"), and two fields carry the mistake the
author expects you to make ("This is not a SIP URI", "Works only for TCP/TLS transport, not UDP").
That is worth more than a tooltip. Avoid shipping a trunk form without a test: our version needs a
"Test connection" next to Import and a reachability pill on the row afterwards.

## 18 · Channels
**Surface:** three places. "Deploy · WhatsApp" and "Deploy · Outbound" at workspace level, and
"Deploy · Channels" inside an agent. The agent page is the real one: a channel is attached to an
agent, not to the workspace.

**Shot:** `elevenlabs-18-agent-channels.png` - the agent's "Channels" catalogue, the single best shot
for 18. Ten rows, each a name plus one line: "Telephony · Phone calls via a telephony provider.",
"WhatsApp · Calls & messaging via WhatsApp Business.", "Widget · Embeddable chat widget for your
website.", "Zendesk · Customer support platform", "Genesys · Cloud-based contact center platform",
"Intercom · Alpha · Customer messaging and support platform", "Slack · Alpha · Team communication
platform", "Freshdesk · Alpha · Customer support and helpdesk platform", "Telegram · Alpha · Messaging
platform with Bot API", "Custom Channel · Alpha · Generic async text messaging via inbound webhook".
Header actions are "New", "View new features" and "Request a channel". Voice, chat widget, helpdesk
and team chat all sit in one list under one word.

**Shot:** `elevenlabs-18-widget-channel-embed.png` - the Widget channel opened. "Setup · Attach the
widget on your website." then a one-line "Embed code" snippet,
`<elevenlabs-convai agent-id="agent_...">` plus a script tag, with the agent id already baked in. Then
"Feedback collection" ("Callers can rate their satisfaction from 1 to 5 and optionally leave a comment
after the conversation."), then "Interface · Configure the parts of the widget interface." with eleven
toggles: "Chat (text-only) mode", "Send text while on call", "Realtime transcript of the conversation",
"Language dropdown", "Mute button", "Expanded behavior", "Starts collapsed", "Action indicator", "Show
conversation ID when finished", "Hide audio tags in transcript", "Show resize button". Then "Markdown
links" with an allowlist ("Only links matching your allowlist are enabled. For security, javascript:
links are always blocked.", "Allow all domains", "Allowed domains / Add domain", empty-state "No
domains specified. Links will be shown as blocked.", "Include www. variants", "Allow HTTP links").
Then "Avatar" with "Type: Orb / Link / Image" and two color pickers. Then "Terms & Conditions" with a
Markdown body prefilled with a real consent paragraph and a "Local storage key" so a returning caller
is not asked twice. Then "Styling".

**Shot:** `elevenlabs-18-whatsapp-page.png` - workspace "WhatsApp accounts", empty: "No WhatsApp
accounts. You don't have any WhatsApp accounts yet." with one button, "Import account". WhatsApp is
modelled exactly like a phone number: you import a Business account you already own.

**Shot:** `elevenlabs-18-batch-channel-chooser.png` - "Create a batch call" first asks the channel:
"Telephony" or "WhatsApp". The same outbound batch runs down either channel.

**Shot:** `elevenlabs-18-batch-call-form.png` - the batch form. Fields: "Batch name", "Phone Number"
(blocked here, with the inline reason "Please add a phone number to start batch calling"), "Ringing
timeout (seconds)", "Concurrency limit (optional)", "Select Agent", "Recipients" as a CSV or XLS
upload capped at "25.0 MB", a "Formatting" note ("The phone_number column is required. You can also
pass certain overrides. Any other columns will be passed as dynamic variables.") with a downloadable
"Template" and a worked three-row example showing name, phone_number and language, then "Timing" as
"Send immediately" / "Schedule for later", then "Test call" and "Submit a Batch Call". Right pane empty
state: "No recipients yet. Upload a CSV to start adding recipients to this batch call".

**Happy / rainy:** the channels catalogue and the widget panel are happy. WhatsApp and the batch form
are rainy, and the batch form's rainy state is the useful one because it names the blocker in place
rather than greying the button with no reason.

**What it refuses to do:** a channel is attached per agent, so one agent can serve several channels
but there is no view of which agents share a channel, and no way to attach one channel to several
agents from the channel's own side. Clicking "Import account" on the WhatsApp page opened nothing in
this tab, which points at a Meta embedded-signup popup; I did not follow it, because that is a sign-in.

**Steal / avoid:** steal the one catalogue. Phone, web widget, WhatsApp, Zendesk and Slack are all
"channels" on one page with one sentence each and an honest "Alpha" tag, and that beats scattering
them across Deploy, Integrations and Settings. Steal "Request a channel" as the pressure valve on a
catalogue that will never be complete. Steal the batch form's habit of naming the blocker inside the
disabled field. Avoid eleven ungrouped widget toggles: they need to be three groups, because
"Mute button" and "Hide audio tags in transcript" are not the same kind of decision.

## 19 · Tools and connectors
**Surface:** two sibling pages under "Configure": "Tools" at /app/agents/tools and "Integrations" at
/app/agents/integrations. Tools are ones you define. Integrations are MCP servers, yours or theirs.

**Shot:** `elevenlabs-19-tools-list.png` - the Tools list, empty. Three creation buttons side by side:
"Add webhook tool", "Add client tool", "Add Integration tool". Two filters: "Type" and "Creator".
Empty copy: "No tools found. You don't have any tools yet."

**Shot:** `elevenlabs-19-webhook-tool-form.png` - the "Add webhook tool" panel, the best single piece
of evidence for 19. Sections in order:
"Configuration · Describe to the LLM how and when to use the tool." with "Name" and "Description".
"Method" (GET default) and "URL", with the inline hint "Type {{ to use an environment variable" and
two links, "Manage environment variables" and "Docs".
"Authentication": "Workspace has no auth connections", with "Create new auth connection" and
"Environment variables". Auth is a reusable workspace object, not a field on the tool.
"Advanced · Response filtering · Control which parts of the API response are visible to the agent."
default "All fields".
"Headers · Define headers that will be sent with the request" with "Add header".
"Path parameters · Add path wrapped in curly braces to the URL to configure them here."
"Query parameters · Define parameters that will be collected by the LLM and sent as the query of the
request." with "Add param".
"Dynamic Variables · Variables in tool parameters will be replaced with actual values when the
conversation starts."
"Dynamic Variable Assignments · Configure which dynamic variables can be updated when this tool
returns a response." with "Add assignment". The tool writes back into conversation state.
"Response Mocks · Use mock responses to evaluate agent behavior in test simulations without connecting
to production systems. Conditions are evaluated top-to-bottom and the first match is returned." with
"Add mock". The mock lives on the tool, and feature 14's simulation test consumes it.
Footer: "Edit as JSON", "Cancel", "Add tool".

**Shot:** `elevenlabs-19-webhook-tool-json.png` - the same tool as JSON, which exposes the defaults the
form hides: `response_timeout_secs: 20`, `follow_redirects: false` with
`follow_redirects_allowed_domains: []`, `content_type: "application/json"`, `auth_connection: null`,
`mtls_auth_connection: null`, `response_filter: null`, `interruption_mode: "allow"`,
`pre_tool_speech: "auto"`, `tool_call_sound: null`, `tool_call_sound_behavior: "auto"`,
`execution_mode: "immediate"`, `tool_error_handling_mode: "auto"`, `response_mocks: []`.

**Shot:** `elevenlabs-19-integrations-mcp-library.png` - Integrations, empty: "No integrations
configured. Create a new custom MCP server or browse our library of integrations below." with four
suggested cards under it.

**Shot:** `elevenlabs-19-add-integration-catalogue.png` - the "Add integration" catalogue with a
left-hand category rail: "All integrations", "CRM", "Calendar", "Customer Support & CX", "Developer
Tools", "IT Service Management", "Knowledge Base", "Messaging", "Scheduling", "Search", "Telephony".
First card is always "Custom MCP Server · Connect your own MCP server.", then Calendly, Cal.com,
Salesforce, Cursor, Exa, Freshdesk (Alpha), HubSpot, Intercom (Alpha), Jira, Twilio, ServiceNow,
Zendesk, Slack (Alpha), Telegram (Alpha), Parallel, Genesys, Google Calendar, Google Drive, Amazon
Connect, WhatsApp, Tavily, Custom Channel (Alpha). Footer: "Request an integration · Don't see what
you need? Let us know what integration you'd like."

**Shot:** `elevenlabs-19-custom-mcp-server-form.png` - the "Custom MCP Server" form, and the richest
surface in the whole product. "Server type" is "SSE" or "Streamable HTTP". "Server URL" accepts a
literal, a "Secret", or a "{{ }}" environment variable, chosen from a Type / Value pair. Then "HTTP
Headers", then "Request Metadata · Add entries sent in the MCP _meta field of every tool call. Each
value can be a literal, a secret, a dynamic variable, or an environment variable."
Then "Tool Approval Mode · Control how the agent requests permission to use tools from this MCP
server." as three named options with their own explanations: "Always Ask · Maximum security. The agent
will request your permission before each tool use.", "Fine-Grained Tool Approval · Recommended ·
Disable & pre-select tools which can run automatically & those requiring approval.", "No Approval ·
The assistant can use any tool without approval."
Then "Tool Settings · Configure settings for all tools from this server.": "Pre-tool speech" ("Force
agent speech before tool execution, disable it entirely, or let the agent decide based on recent
execution times." · Auto / Force / Off), "Interruptions" ("Control whether the user can interrupt the
agent while tools from this server run, and during the agent response that follows." · Allow / Disable
during execution / Disable during whole turn), "Execution mode" ("Determines when and how the tool
executes relative to agent speech." · Immediate / Post speech / Async), and "Tool call sound" (None /
Typing / Elevator Music 1 to 4).
Then a required acknowledgement: "I trust this server · Custom MCP servers are not verified by
ElevenLabs."
Footer: "Cancel", "Test Connection", "Add Server".

**Happy / rainy:** the two creation forms are happy. Both lists are rainy and both name the next step
in the empty copy rather than just stating the absence.

**What it refuses to do:** a webhook tool has no "Test" button, while an MCP server has "Test
Connection". The same product gives you a dry run on one connector and not on the other. There is also
no version history on a tool, and nothing shows which agents use a tool before you change it.

**Steal / avoid:** steal the MCP form's approval model wholesale. "Always Ask / Fine-Grained /
No Approval", each with its own sentence, plus a "I trust this server" checkbox that names who did not
verify it, is the clearest trust control any of the four vendors ships. Steal "Response Mocks" living
on the tool, so the eval surface and the tool surface share one object. Steal the three latency
controls being one group ("Pre-tool speech", "Interruptions", "Execution mode"): they are the same
decision seen three ways. Avoid a "Test Connection" that exists on one connector and not the others:
every connector we ship needs the same dry run.

## 20 · Knowledge sources
**Surface:** "Configure · Knowledge Base" at workspace level, and a per-agent "Knowledge Base" page
that attaches a subset of it.

**Shot:** `elevenlabs-20-knowledge-base-list.png` - the workspace library. The header carries a quota
meter, "RAG Storage: 0 B / 1.0 MB", next to four creation buttons: "Add URL", "Add Files", "Create
Text", "Create Folder". Columns are "Title", "Type", "Creator". Empty copy: "No documents found. You
don't have any documents yet." The quota sits beside the buttons that spend it, which is the right
place for it.

**Shot:** `elevenlabs-20-add-url-dialog.png` - "Add URL" with three modes as one radio row: "Single
URL", "Sitemap", "Whole Website". Then "Parent folder" (default "Knowledge Base", with a "Current"
shortcut), "URL", and an "Auto Refresh" toggle, "Check the URL for new content on a regular schedule".

**Shot:** `elevenlabs-20-crawl-whole-website.png` - the same dialog in "Whole Website" mode. Three
more fields appear: "Crawl depth · Control how deep the crawler will follow links from the starting
URL." as a 1 to 5 segmented control, "Max number of URLs · Limit the no. of unique URLs to crawl from
the website. Max: 10,000.", and "Pattern · Only follow URLs that match this pattern. All URLs included
if left empty." The Auto Refresh line rewords itself for this mode: "Refresh underlying eligible
documents on a regular schedule". Primary button changes from "Add URL" to "Add website".

**Shot:** `elevenlabs-20-configure-rag.png` - the per-agent "Configure RAG" popover. "Enable RAG" is a
three-way: "Disabled" ("No retrieval search is performed."), "Every turn", "Optional". The agent page
also carries "Test RAG" and an "Add document" that attaches from the workspace library, plus two tabs,
"Sources" and "Memory".

**Happy / rainy:** the dialogs are happy. Both lists are rainy.

**What it refuses to do:** "Auto Refresh" promises "a regular schedule" and never says what the
schedule is, and offers no way to choose it. There is no last-crawled timestamp, no crawl log, no
"refresh now", and no preview of which pages a depth of 3 will actually pull before you commit. The
1.0 MB free RAG quota is spent blind.

**Steal / avoid:** steal the mode radio that rewrites the form and the primary button under it: one
dialog, three shapes, one verb per shape. Steal the quota meter sitting inside the header next to the
add buttons. Avoid a refresh toggle that hides its cadence, and avoid a crawl with no dry run: ours
should show the URL count it would fetch, and the storage it would use, before the user commits.

## 21 · CRM and contacts
**Surface:** "Monitor · Users" at /app/agents/users, and a per-agent "Users" page with the same shape.
ElevenLabs is the only one of the four that makes the person a first-class object next to the
conversation.

**Shot:** `elevenlabs-21-users-list.png` - the Users list. Filters across the top: "Date After",
"Date Before", "Agent", "Branch". Columns: "User ID", "Last contact", "Agent", "Conversations". The
one row reads "hnmgghqLugYYX0LTFo6VA1vksXm2 · Sep 11, 2026, 12:54 PM · Mindfulness coach · 2".

**Shot:** `elevenlabs-21-user-detail-timeline.png` - the user panel, the strongest shot for 21.
Title is "User: <id>". Left, "Conversation timeline": one entry per conversation, each with date, the
agent and its branch and version ("Mindfulness coach · Main · v2"), a written summary of what happened
("The user requested a quick mindfulness tip for a busy afternoon. The agent, Joe, introduced the
'three breath anchor' technique ..."), then "Successful", "1:43", "5", "English". Right, "Customer
details": "Last contact", "First contact", "Total conversations", "Last interacted agent". There is an
"Architect" button in the panel header, which is their assistant.

**Happy / rainy:** happy. This is the one populated surface in the workspace.

**What it refuses to do:** the user has no name, no phone, no email and no attributes. The identity is
an opaque id the widget generated, there is no way to add a field, merge two ids, tag a person or add
a note, and no import. Nothing carries forward into a conversation: "Customer details" is four
read-only counters, not memory the agent can use. There is no link from a phone number or a batch-call
recipient row to a user, so the outbound list and the user list never meet.

**Steal / avoid:** steal the shape. A person's page whose body is a timeline of conversations, each
one summarised in a sentence with its agent, branch and version stamped on it, is the right answer to
"what happened with this caller" and it costs nothing to build once summaries exist. Steal stamping
the agent version on each past conversation. Avoid stopping there: ours has to let a caller carry a
name, a phone and at least one writable note, or the page is a log with a person-shaped title.

## 22 · Usage and credits
**Surface:** two pages, and they do not agree with each other. "Developers · Analytics · Usage" at
/app/developers/analytics/usage is the meter. "Subscription" at /app/subscription is the plan. Neither
is reachable from the ElevenAgents sidebar except through "Upgrade".

**Shot:** `elevenlabs-22-usage-credits.png` - the Usage page. Controls: "View: By product & model",
"Time: Last 7 days", "UTC+7", "Granularity: Daily", "Refine", "Group By: 2 values", "Filter",
"Cumulative view". Tiles: "Usage · 113 credits", "Character Usage · ---", "Total Duration · 0 s",
"Average Cost per Request · 18.8 credits", "Billable Request Count · 6". The main chart has a
"Credits" / "USD" switch beside the "Linear" / "Log" switch, so the same series reads in either unit.
Below it, "Billing Windows · New · View Stripe invoice summaries, or apply specific billing window time
ranges to the graph" with a "Show" button, which lets an invoice period become the chart's x-axis.
Then "Average Time to First Byte (TTFB)", "Average Time to Completed Transcript (TTCT)" (labelled
"Realtime speech-to-text only"), "Concurrent Requests - Max used", and "High priority requests"
explained as "For enterprise tier, concurrent request limits set a number of requests at the highest
priority. Requests exceeding this limit will still be processed, but at a lower priority." A separate
line states a second quota in plain words: "In your current billing cycle, you have used 0 out of 55
voice add/edit operations." Every chart carries its own footnote about how filters apply, for example
"Note: Filters are applied to the data shown, but data is not grouped."

**Shot:** `elevenlabs-22-subscription-plans.png` - the Subscription page, read only, nothing clicked.
"Credits used · 0 credits / 10,000 credits", "You're currently on Free plan", a "Monthly" / "Yearly
(save 2 months)" switch, and seven tiers: Free $0 ("15 minutes of calls included", "4 Concurrent
Calls", "API access"), Starter $6 (75 minutes, 6 concurrent), Creator $22 shown at $11 "First month
half price" (275 minutes, 10 concurrent), Pro $99 (1,238 minutes, 20 concurrent), Scale $299 (3,738
minutes, 30 concurrent, "3 Workspace Seats"), Business $990 (12,375 minutes, 40 concurrent, "10
Workspace Seats", "10 Professional Voice Clones"), Enterprise "Custom". Below the tiers, a per-plan
table restates the agent rates: "Calls per minute cost $0.08/min" and "Text message cost
$0.0030/message", identical on every tier. The page is scoped by a product tab row, "ElevenCreative" /
"ElevenAgents" / "ElevenAPI".

**What the credit model actually is:** one credit balance for the whole account, spent by every
product. The agent surfaces quote credits (a conversation cost "113 credits"); the plan page quotes
minutes ("15 minutes of calls included"); the rate card quotes dollars per minute ($0.08/min); and the
home dashboard splits platform cost in credits from LLM cost in dollars. Four units for one bill.

**Happy / rainy:** happy, on a free plan with almost no spend. Nothing was purchased and no Upgrade
button was clicked.

**What it refuses to do:** there is no spend cap, no budget alert and no per-agent or per-phone-number
cost attribution anywhere. You can see that 6 requests cost 113 credits, but not which agent, number
or channel spent them, and nothing will stop or warn you at a threshold.

**Steal / avoid:** steal the "Credits" / "USD" switch on the usage chart and the "Billing Windows"
control that snaps the chart to an invoice period: those two together answer "what am I being charged
for" without leaving the chart. Steal restating a quota as a sentence ("you have used 0 out of 55") next
to the meter. Avoid four units for one bill: pick one unit for the console, show the other on hover,
and attribute spend to the agent that caused it.

## Targets not reached
- The **WhatsApp import dialog** never opened in this tab. "Import account" almost certainly launches
  Meta's embedded-signup popup, which is a sign-in, so I stopped. `elevenlabs-18-whatsapp-page.png`
  records the surface up to that point.
- The **"Memory" tab** on the agent's Knowledge Base page would not switch; the page stayed on
  "Sources" (`elevenlabs-20-agent-knowledge-base-sources.png`). Cross-session memory for 21 is
  therefore evidenced only by the Users panel's read-only "Customer details".
- **"Past Run Analysis"** on the Tests page has nothing to show, because no test exists and I did not
  run one against a live agent.
- No **populated** phone number, SIP trunk, tool, integration, knowledge document or test exists in
  this workspace, so every "list" shot for 16 to 20 is an empty state by necessity. Nothing was
  created, deleted, renamed, disabled or purchased during this session.
