
# Retell AI · primary product evidence, features 13-22
Captured 2026-09-17 from the signed-in dashboard at dashboard.retellai.com. Account is a free
trial workspace with no call volume, so several surfaces are empty by nature. Left nav is grouped
into five bands: "BUILD" (Agents, Knowledge Base) · "DEPLOY" (Phone Numbers, Batch Call) ·
"DATA" (Call History, Chat History, Contacts) · "MONITOR" (Analytics, Live Monitoring, AI Quality
Assurance, Alerting) · "SYSTEM" (Integrations, Billing, Settings).

## 13 · Dashboards and alerts
**Surface:** "Analytics" and "Alerting", both under the "MONITOR" band in the left nav. Analytics
splits into two tabs, "Call Dashboard" and "Chat Dashboard". Alerting splits into "Alerting" and
"Alert history".

**Shot:** `retell-13-analytics-dashboard.png` - the default call dashboard over "Aug 21 - Sep 17,
2026" with every tile at zero, plus the docked "Conductor" assistant.
**Shot:** `retell-13-analytics-add-chart-editor.png` - the chart editor that opens from "Add Chart".
**Shot:** `retell-13-alerting-list-empty.png` - the Alerting page: an empty-state card over four
prebuilt alert templates.
**Shot:** `retell-13-alerting-rule-form.png` - the "Create Alert" dialog on open.
**Shot:** `retell-13-alerting-metric-catalogue.png` - the alert metric picker with its four tabs open.
**Shot:** `retell-13-alerting-notify-channels.png` - the same dialog filled to the last field, showing
the email and webhook rows.

**What the control actually is:**
Analytics is a dashboard the user assembles. The header carries a dashboard name, a date range
("Aug 21 - Sep 17, 2026"), "Filter", "Breakdown" and "Add Chart". Three summary tiles sit on top:
"Call Counts", "Call Duration", "Call Latency". Below them is a grid of named cards the user can
keep or drop: "Call Successful", "Disconnection Reason", "User Sentiment", "Phone
inbound/outbound", "Call Picked Up Rate", "Call Successful Rate", "Call Transfer Rate", "Voicemail
Rate", "Average call duration", "Average Latency", "Concurrency Used". The chart editor asks for
"Graph Type" (Column), a metric group ("Call Source Metrics"), the metric, an optional "Filter", an
optional "Breakdown", a "Date Range" with a granularity row of "Hour · Day · Week · Month", and a
"Previous period comparison" toggle. A right rail called "Conductor" offers "Build a dashboard",
"Add useful charts" and "Improve this dashboard", so the dashboard itself is prompt-buildable.

Alerting is the stronger surface. "Create Alert" opens a single dialog with four blocks.
"Alert Name" is free text. "Time Configuration" is one sentence made of two selects: "Check every"
5 min "for the last" 30 min. "Metric Condition" is a two-way segmented control, "Compare to
certain value" or "Compare to last cycle", then the metric, then "when sum" plus an operator
select ("is above") plus a typed value with a unit prefix ("$ 10.00"). The metric picker is tabbed
into "API · Call · Chat · QA" and holds exactly these: API: "Number of API requests that returned
error code". Call: "Number of Calls", "Concurrency used count", "Call successful rate (%)", "User
sentiment negative rate (%)", "Custom function response time (ms)", "Number of custom function
failures", "Number of Transfer call failures", "Total Call Cost". Chat: "Number of Chats", "Chat
successful rate (%)", "Chat user sentiment negative rate (%)", "Total Chat Cost". QA: "QA Not
Passed Count". "Filter" is one optional select, "All Agents (optional)", with an "Add" to stack
more. "Notify via" is two stacked repeatable rows: "Email address (e.g. email@example.com)" with
"Add", and "Webhook URL (e.g. https://example.com/webhook)" with "Test" and "Add". The empty
state ships four ready-made rules the user can "Edit" into their own: "Payment Failure Rate Spike",
"High Concurrency Spike", "LLM Retell Failure Surge", "TTS Provider Error Rate High", each
captioned with the metric it watches.

**Happy / rainy:** Analytics is rainy: real, populated, correctly-labelled charts over no data. The
Alerting dialog is happy: the form is fully live and the metric catalogue is complete. The Alerting
list is rainy, and it teaches, because the empty state is four editable templates rather than a
drawing of a bell.

**What it refuses to do:** there is no Slack, SMS, PagerDuty or on-call destination: only an email
address and a webhook URL, typed by hand. There is no severity, no snooze, no grouping, no
"who owns this alert". The alert cannot fire on a latency percentile, only on averages and counts.
The alert cannot be scoped to a phone number or a campaign, only to agents. The analytics date
range and the alert time window are separate concepts that never meet, so a user cannot turn a
chart they are looking at into an alert.

**Steal / avoid:** steal the sentence-shaped rule ("Check every 5 min for the last 30 min · when
sum of X is above Y · notify these addresses") and steal the four seeded templates in place of an
empty state; avoid the split between the chart you are staring at and the alert you have to
re-specify from scratch, and give the notify row a real channel picker rather than a bare URL field.

## 14 · Evals and scorecards
**Surface:** "AI Quality Assurance", under "MONITOR". Two tabs: "Call QA Overview" and "Detailed
Calls". Header actions are "Feedback" and "Create QA", plus "Date Range" and "Configure QA
Settings" on the tab bar.

**Shot:** `retell-14-qa-overview.png` - the QA overview: an explainer card sitting on top of a fully
drawn sample dashboard.
**Shot:** `retell-14-qa-cohort-step1.png` - step one of "Create Cohort".
**Shot:** `retell-14-qa-cohort-agent-picker.png` - the same dialog with the agent picker open.

**What the control actually is:** QA is authored as a **cohort**, not as a rubric. "Create QA" opens a
two-step wizard whose steps are named "Define QA Cohort" and "Define successful resolution
criteria". Step one has: "Cohort Name" ("Enter cohort name"), a block headed "Filter Calls by Agent
and Criteria" with "Agents" ("Select Agents", multi-select, each row showing the agent name over
its `agent_...` id), "Date Range", and a stackable "Filter" row whose only operator is "Duration" ">"
a number of "s"; then a block headed "Set Sampling Percentage" with "Percentage" "%" and
"Weekly Max" "calls". Validation is inline and blunt: "Cohort name is required", "Agents are
required", "Start date range is required".

That sampling block answers the important question: **scoring runs on production calls, not on
tests.** The user picks agents and a date range, then tells Retell what share of those live calls to
grade and caps the weekly volume. The overview then reports "Calls Analysed" as "Completed: 68
/ Total: 240", "Average Score" 87.00 on a 0-100 line chart, "Call Resolution Rate" 75.00%,
"Transfer Success Rate" 70% with "Total: 100 · Success: 70 · Failure: 30", "Transfer Wait Time"
4.0s, and a "Top Questions from User" table with columns "No. · Question · Resolution Rate ·
Resolved / Total". The page prices itself in the empty state: "First 100 minutes of analysis is free".
The explainer names the dimensions: "audio quality (overlapping speech, tone, WER)", "agent
hallucinations", "resolution accuracy", "user sentiment".

**Happy / rainy:** rainy, but unusually well made. Retell ships a full sample dashboard with
plausible numbers behind the explainer card, so a new user sees the shape of the answer before
they have any data. The cohort wizard is live.

**What it refuses to do:** there is no rubric library, no per-criterion weight, no pass mark the user
sets, and no human review queue with agree/disagree on the model's score. The only call filter
besides agent and date is call duration, so a user cannot build a cohort out of "calls that
transferred" or "calls from this campaign". Step two was not reachable inside the budget because
the wizard requires a date range and the picker did not open from automation.

**Steal / avoid:** steal the sampled cohort as the unit of QA, a percentage plus a weekly cap, so the
cost of grading is bounded and visible before the user commits; steal the fully drawn sample
dashboard as the empty state. Avoid making duration the only filter: the cohort is only as good as
the slice, and "agent plus date plus duration" cannot express the calls a team actually argues about.

## 16 · Phone number purchase
**Surface:** "Phone Numbers", under "DEPLOY". A two-pane layout: a left list with "Search phone
numbers" and a single dark "+" in the panel header, and a right detail pane.

**Shot:** `retell-16-phone-numbers-empty.png` - the empty list and the lone "+" that carries every
way in.
**Shot:** `retell-16-add-number-menu.png` - the menu the "+" opens: exactly two items.
**Shot:** `retell-16-buy-number-identity-gate.png` - what "Buy New Number" actually opens.

**What the control actually is:** the "+" opens a two-item menu, "Buy New Number" and "Connect
to your number via SIP trunking". One door, two paths, no separate "Import" or "Port" entry.
Choosing "Buy New Number" does not open a catalogue at all. It opens a dialog headed "Identity
Verification Required": "To purchase a phone number, you need to complete identity verification
first. This process is quick, secure, and only needs to be completed once." with a "Powered by
Persona" credit and a single "Start Verification" button. No country picker, no area code search, no
price, no number type is shown before that gate. I stopped at this screen: identity verification is a
credential flow and I do not enter one.

**Happy / rainy:** rainy, and it is the most honest rainy state of the four vendors, because it is the
real first-run experience: a new account cannot see a single number for sale until it has passed KYC.

**What it refuses to do:** it will not show the catalogue behind the gate, so a user cannot find out
whether Retell even carries numbers in their country, or what a number costs, before handing over
identity documents. The empty state says "You don't have any phone numbers" and offers no path
of its own: the only affordance is a 32px "+" in the other pane's header.

**Steal / avoid:** steal the two-item menu, buy or bring your own, because it names the real choice
at the top. Avoid putting KYC in front of browsing: let the user search countries, area codes and
prices first and gate only the commit, and never leave an empty state whose only way forward is an
unlabelled icon in a neighbouring panel.

## 17 · SIP trunk setup
**Surface:** "Connect to your number via SIP trunking", the second item on the Phone Numbers "+"
menu. A modal, not a page.

**Shot:** `retell-17-sip-trunk-form.png` - the whole form, six rows and two buttons.

**What the control actually is:** six fields and nothing else. "Phone Number" ("Enter phone
number") with the hint "Format to E.164" sitting next to the label. "Termination URI", whose
placeholder does the teaching: "Enter termination URI (NOT Retell SIP server uri)". "SIP Trunk User
Name", labelled "(encouraged)". "SIP Trunk Password", labelled "(encouraged)", a real password
input. "Nickname", labelled "(Optional)". Then one line of settings, "Outbound Transport: TCP".
"Cancel" and "Save".

**Happy / rainy:** happy. The form is live and complete; the account simply has no trunk yet.

**What it refuses to do:** there is no connectivity test, no "verify trunk" button, and no validation
feedback beyond the E.164 hint, so the first proof the trunk works is a failed call. Transport is
stated rather than chosen. There is no inbound leg, no IP allow-list, no codec choice, no region,
and no place to paste Retell's own SIP server address back out for the far end to configure.

**Steal / avoid:** steal the three-tier field labelling, nothing for required, "(encouraged)" for
credentials, "(Optional)" for the nickname, which grades the fields without a red asterisk, and steal
the placeholder that names the most common mistake ("NOT Retell SIP server uri"). Avoid shipping
a trunk form with no test: the "Test" button that Retell put on its alert webhook belongs here far
more than it belongs there.

## 18 · Channels
**Surface:** channel is not a picker anywhere. It is implied by which surface you are on. "Batch
Call" and "Call History" are voice. "Chat History" is text. An agent is built once and both a voice
and a chat session can run against it, but nothing in the UI names "channel" as a field.

**Shot:** `retell-18-batch-call-form.png` - the whole outbound campaign form in one dialog.
**Shot:** `retell-18-chat-history-empty.png` - the text side, with its column set visible.

**What the control actually is:** "Create a batch call" is a single dialog that prices itself in the
header: "Batch call cost $0.005 per dial". Fields: "Batch Call Name", "From number" (a "Select"),
"Upload Recipients" with "Download the template" and a drop zone, "Choose a csv or drag & drop
it here. Up to 50 MB". Then "When to send the calls" as two choices, "Send Now" or "Schedule".
Then "When Calls Can Run", showing "00:00-23:59, Mon-Sun". Then "Reserved Concurrency for
Other Calls", explained as "Number of concurrency reserved for all other calls, such as inbound
calls", with the running total "Concurrency allocated to batch calling: 15" and a "Purchase more
concurrency" link. A consent line, "You've read and agree with the Terms of service." Actions are
"Save as draft" and "Send", and a right pane headed "Recipients" says "Please upload recipients
first". Chat History lists sessions with the columns "Time · Cost · Session ID · Session Status · User
Sentiment · From · To", so a chat session carries a from and a to like a call does.

**Happy / rainy:** the batch form is happy and complete. Chat History is rainy and empty.

**What it refuses to do:** there is no place to choose a channel for an agent, so a user cannot see
which agents can take chat and which cannot, or set a channel-specific opening line. There is no
WhatsApp or SMS surface at all. The calling window is a single global string rather than a per-
recipient timezone rule.

**Steal / avoid:** steal two things from the batch dialog, the cost stated in the header before any
field is filled ("$0.005 per dial"), and the reserved-concurrency control that lets an outbound
campaign promise not to starve inbound, with the live number underneath it. Avoid splitting voice
and chat into two histories that never meet: a session is a session, and the "From / To" columns
prove Retell already models them the same way.

## 19 · Tools and connectors
**Surface:** two places. "Integrations", under "SYSTEM", with tabs "Connected" and "Available"
and a "Request integration" action. And, inside an agent, a right-rail section called "Functions",
with a separate section called "MCPs" further down.

**Shot:** `retell-19-integrations-available.png` - the full "Available" catalogue with its categories.
**Shot:** `retell-19-agent-functions-section.png` - the agent's "Functions" section holding a single
built-in function.

**What the control actually is:** the integrations catalogue is a card grid, each card carrying a name,
a one-word category, a one-line capability sentence and a "Connect" button. Eleven cards in four
categories. CRM: "HubSpot" ("Manage contacts, deals, companies, and CRM activities"),
"Salesforce", "Microsoft Dynamics 365", "GoHighLevel", "Zoho CRM". Support: "Zendesk" ("Find
users and manage tickets, comments, and private notes"). Knowledge base: "Google Drive",
"Microsoft OneDrive", "Notion". Calendar: "Calendly", "Cal.com". The empty "Connected" tab
reads "Connect with apps · Give your agents context and capabilities from the tools you already
use" with an "Add integration" button.

Inside an agent, "Functions" is described as "Enable your agent with capabilities such as calendar
bookings, call termination, etc." and ships with one function already present, `end_call`, plus an
"Add". The agent's right rail in full is: "Functions", "Knowledge Base", "Speech Settings",
"Realtime Transcription Settings", "Call Settings", "Post Call Extraction", "Security & Fallback
Settings", "Webhook Settings", "MCPs".

**Happy / rainy:** the catalogue is happy and fully populated. The agent's function list is rainy: one
built-in function and nothing else.

**What it refuses to do:** the custom-function editor did not open from automation inside the
budget, so the field set (name, description, URL, method, parameters) is unconfirmed from the
product. More usefully, the catalogue refuses to say what a connection actually grants: the card
promises "Manage contacts, deals, companies" but there is no scope list, no per-agent toggle, and
no way to see which agent is allowed to use a connected app.

**Steal / avoid:** steal the one-line capability sentence on every integration card, written as verbs
the agent will perform, not as a product blurb. Avoid keeping "Functions" and "MCPs" as two
separate sections in the same rail: to the person building the agent they are one question, what
can this agent do, and splitting them makes the user check two places.

## 20 · Knowledge sources
**Surface:** "Knowledge Base" under "BUILD", the same two-pane list-and-detail shape as Phone
Numbers, with a "+" in the list header.

**Shot:** `retell-20-add-knowledge-base.png` - the create dialog, three controls total.
**Shot:** `retell-20-kb-source-types.png` - the source menu with all six types visible.
**Shot:** `retell-20-kb-add-web-pages.png` - the web source dialog.

**What the control actually is:** "Add Knowledge Base" asks for "Knowledge Base Name" and a
"Documents" list with one "+ Add", and prices itself in the footer: "Your first 10 knowledge bases
are included at no extra charge." The "Add" menu offers six source types in one flat list: "Add Web
pages", "Upload files" (with "Up to 50MB" beneath it), "Add text", "Connect Google Drive",
"Connect Microsoft OneDrive", "Connect Notion". Choosing "Add Web pages" opens a dialog with
exactly one field, "URL Address" ("Enter URL"), plus "Cancel" and "Save".

**Happy / rainy:** rainy for the list, happy for the dialogs: every source type is live and the whole
add path is reachable without creating anything.

**What it refuses to do:** the web source is a bare URL with no crawl depth, no page limit, no
include or exclude pattern, and **no refresh schedule anywhere in the add path**. Nothing states
when a crawled page will be re-read, so a user cannot tell whether the knowledge base is a
snapshot or a subscription. There is no chunking or embedding control and no per-source preview
of what was ingested.

**Steal / avoid:** steal the flat six-item source menu that puts "paste a URL", "upload a file", "type
some text" and three connected drives on the same level, because it matches how people actually
think about where their knowledge lives. Avoid shipping a web source with no refresh story: put
the schedule, and the last-crawled time, on the source row itself.

## 21 · CRM and contacts
**Surface:** "Contacts", under "DATA". A table with "Filter" and an "Actions" menu, plus a
"Feedback" link. "Actions" leads to a second page, "Contact Fields".

**Shot:** `retell-21-contacts-actions-menu.png` - the "Actions" menu, which is where the whole
surface actually lives.
**Shot:** `retell-21-contact-fields.png` - the "Contact Fields" page and its four built-in fields.
**Shot:** `retell-21-add-contact-field.png` - the dialog for adding a field.

**What the control actually is:** the contact table's columns are "Phone Number · First Name · Last
Name · Contact ID · Related Conversations · Latest Conversation · Do Not Call · External ID", so a
contact is a phone-first record that carries its own conversation history, a suppression flag and a
foreign key back to the customer's own system. "Actions" holds five items: "Manage contact
fields", "Manage CRM sync", "Run full sync", "Backfill Post Call Extraction", "Add contact".

"Contact Fields" is the real find. Its columns are "Contact field · CRM field sync · Post Call
Extraction mapping · Last updated", with the four built-ins "Phone Number", "First Name", "Last
Name", "Do Not Call" each showing "—" in all three. "Add Contact Field" asks for "Type" (default
"Text"), "Field name" with the warning "Once created, the field type can't be changed",
"Description", and a "Map with Post Call Extraction" control, under a link reading "Learn how to
auto-update your CRM? See docs". So one row binds three things at once: a field on the contact, a
field in the customer's CRM, and a variable the agent extracts at the end of a call.

**Happy / rainy:** rainy for the table, happy for the schema surfaces, which are the interesting ones.

**What it refuses to do:** there is no CSV import on the Contacts page itself. The only bulk path is
the batch-call recipient upload, which is a campaign artefact rather than a contact list, so contacts
and recipients are two different populations. There is no segment, list or tag, so "Do Not Call" is
the only membership a contact can have. Nothing shows the direction or conflict rule of the CRM
sync from this page.

**Steal / avoid:** steal the three-column field row, one place where a field's name, its CRM
counterpart and the thing the agent extracts sit on one line, because it makes "the agent writes
back to the record" a visible, editable fact instead of a hidden webhook. Steal "Once created, the
field type can't be changed" said at the moment of creation. Avoid making import invisible: a CRM
surface with no way to bring a list in reads as a read-only mirror.

## 22 · Usage and credits
**Surface:** "Billing", under "SYSTEM", with tabs "Billing History" and "Usage", and header actions
"Change payment methods" and "Manage billing info".

**Shot:** `retell-22-billing-usage.png` - the "Usage" tab over a zero-usage period.

**What the control actually is:** the "Usage" tab reports a "Usage Period" ("Sep 01, 2026 - Sep 17,
2026") and three tiles: "Total Cost", "Call Minutes" and "Average Cost Per Minute". Under them is
a "Call + Chat Cost" chart with a "Day / Week" granularity toggle, and below that a "Cost by
Provider" breakdown. So usage is answered three ways at once: per period, per minute, and per
provider, with voice and text costs on the same axis. "Billing History" is an invoice table with the
columns "Invoice Created At · Amount · Details · Status", each row ending in an "Invoice" link. A
banner sits above both tabs: "Credit-based billing is available for your workspace · Usage charges
will move from monthly invoices to a prepaid credit balance. This switch is one-way." with "Switch
now" and "Learn what changes". I did not click "Switch now", "Add Payment", or "Purchase more
concurrency". The sidebar carries a persistent meter: "Free trial · Remaining: $9.42 · Concurrency
Used: 0/20 · Add Payment".

**Happy / rainy:** rainy on the numbers, happy on the structure. The three tiles, the toggle, the
provider breakdown and the invoice table are all real.

**What it refuses to do:** usage is never attributed to an agent, a phone number or a campaign, only
to a provider, so a team cannot answer "which agent spent this". There is no budget, no cap and no
spend alert on this page, although Alerting can watch "Total Call Cost" from the other side of the
product. There is no forecast of the current period.

**Steal / avoid:** steal "Average Cost Per Minute" as a first-class tile, because it is the number a
voice team actually argues about, and steal "This switch is one-way" stated in the banner rather
than buried in a confirm dialog. Avoid billing that only slices by provider: cost per agent is the
question our users will bring, and it should sit next to cost per minute.
