# 21 · CRM & contacts · Before, and what is wrong with it

**Before:** `references/research/_before10-2026-09-17/before-19-integrations.png` (Resources · Connectors) and
`before-18-deploy.png` (Resources · Deployment Channels), both light mode. The builder's contact list has no
shot in that set: the file named `before-21-batch-calls.png` is the Monitor overview in dark mode, not
`#wz-2-contacts`, so items 1 to 8 below are checked on the live build.

**Live:** <https://ai-studio-console-redesign.vercel.app/agents/agt_default/edit>, section 2 Deployment, pick
**Batch Calls**: the **Contact list** row is `#wz-2-contacts` and the rail carries a **Contact list** sub-item
while Batch is chosen. Connectors: <https://ai-studio-console-redesign.vercel.app/integrations?tab=connectors>.

**Source, and when it last changed:**

- `studio_x_2/components/wizard/campaigns-card.tsx`:520-663 · `CampaignContacts`, the one contact list · 2026-09-15 (`302245f`)
- `studio_x_2/components/wizard/channel-section.tsx`:243-300 · `BatchContactsBlock`, which mounts it in Deployment · 2026-09-15 (`302245f`)
- `studio_x_2/lib/wizard-draft.ts`:773-785 · the CSV fixture and the coverage check · 2026-09-17 (`1ef74db`)
- `studio_x_2/app/(dashboard)/integrations/page.tsx`:286-342 · the Connectors tab · 2026-09-12 (`0ac8422`)
- `studio_x_2/components/wizard/step-build.tsx`:117-165 · the Tools & connectors row · 2026-09-15 (`ffea129`)
- `studio_x_2/app/(dashboard)/calls/page.tsx`:35-120 · where a finished call lands · 2026-09-17 (`1ef74db`)
- `ng-console/src/components/console/agent-tools-page.tsx`:761-845 · the real Console's Connectors section · 2026-09-04 (`ce0d0f74`)
- `ng-console/src/components/console/integrations-page.tsx`:192-237 · the real Console's connector catalog · 2026-09-04 (`ce0d0f74`)

The read half for batch has a design. The inbound read path, the write-back boundary and the contact store have
none in either repo: the only thing drawn for all three is one sentence at
`studio_x_2/components/wizard/section-prompt.tsx`:139.

## What is wrong

1. **Uploading a contact list never opens a file picker, and every number on screen is invented.** `attachCsv`
   (`campaigns-card.tsx`:543-549) writes `csvName: "contacts.csv"` and `contacts: 248` on click, whatever the
   user has. The panel then reads "248 contacts · contacts.csv" (:586) next to "Preview 24 rows" (:591), and
   those 24 rows are generated names, account ids and balances (:506-518) that are not the first 24 of
   anything. Nothing is parsed, so a malformed number, a duplicate row, an empty cell and an 80,000-row export
   all produce the same screen. JTBD rainy 10, 11, 12.

2. **The coverage line is a tautology printed as a ratio.** `campaigns-card.tsx`:609 renders
   `${extractVars(...).length}/${extractVars(...).length} {{variables}} covered.`, the same number twice. It
   can read 3/3 and nothing else. A reviewer can type a fourth variable and watch it go to 4/4 without
   touching the file. JTBD rainy 1.

3. **"Covered" is measured against a five-item constant, not against a file.** `campaignMissingVars`
   (`lib/wizard-draft.ts`:781-785) filters the prompt's variables against `MOCK_CSV_COLUMNS` (:773). The green
   tick, the destructive panel at `campaigns-card.tsx`:613-620 and the publish gate at `wizard-draft.ts`:843
   are all one comparison between the prompt and that array. No CSV header is ever read. JTBD rainy 1;
   LEARNINGS 3 names this check as the thing to keep and extend, which makes the constant the defect.

4. **The one required column name is wrong, and it blocks deploy.** Agora requires `phone_number` in E.164
   (<https://docs.agora.io/en/ai/studio/deploy/campaign>). `MOCK_CSV_COLUMNS` ships `phone`
   (`wizard-draft.ts`:773). A greeting written from the docs, *"Hi {{phone_number}}"*, is reported as a missing
   variable and `publishBlocks` :843 blocks the deploy. JTBD rainy 9.

5. **The link that promises to explain variables is dead.** `campaigns-card.tsx`:569 points "Learn how
   {{dynamic vars}} work" at <https://docs.agora.io/en/conversational-ai>, which returns 404 (checked
   2026-09-17). The page that documents the contact list, its 25 MB and 50,000-row caps and the
   `prompt_override` column is at <https://docs.agora.io/en/ai/studio/deploy/campaign>, and nothing in the
   product links to it. JTBD rainy 9, 26.

6. **A variable in the failure message is invisible everywhere.** Every caller of `extractVars` reads the
   system prompt and the greeting only: `section-prompt.tsx`:46, `wizard-draft.ts`:782, `campaigns-card.tsx`:535
   and :608. The failure message is a textarea on the same screen (`section-prompt.tsx`:188), and Agora
   substitutes into `failure_message` and `parameters.silence_config.content` as well (release notes v2.1, four
   targets). A `{{name}}` typed there gets no chip, no count, no coverage and no block, and the caller hears
   the raw braces. Ticket 868kyjfp4.

7. **An inbound agent is told to wait, and that is the whole design.** `section-prompt.tsx`:139 reads "Inbound
   agents: per-call variables via API: coming soon." There is no API shape, no docs link, no webhook row and no
   latency budget, while three of four vendors ship exactly that row with a published budget (Vapi 7.5 s, Retell
   10 s times three attempts). This is the P0 task. JTBD rainy 2 · ticket 868kyjfp4.

8. **The only code sample that could carry per-call context names a package that does not exist.**
   `channel-section.tsx`:495 prints `npm install @agora/agent-sdk` and :457 imports
   `{ AgentClient } from "@agora/agent-sdk"`. The published SDK is `agora-agents`
   (`ng-console/node_modules/agora-agents/package.json`, 2.4.0, `github:AgoraIO/agora-agents-ts`) and it exports
   `AgoraClient`, `Agent` and `AgentSession`, not `AgentClient`. The snippet also passes neither
   `llm.template_variables` nor `labels`, the two shipped fields that carry a record into a call and its
   callbacks. JTBD rainy 2 · ticket 868kyjfp4.

9. **Salesforce is drawn as connectable and it is not.** `lib/campaign-data.ts`:1774 seeds Salesforce
   `available` with "Read and update leads and opportunities.", and the card renders a Connect action
   (`integrations/page.tsx`:304-320). It is the second card in `before-19-integrations.png`. The real catalog is
   one provider: `StudioConnectorProvider = "hubspot"`
   (`ng-console/src/lib/agents/studio-connectors-api.ts`:15), with every other row `comingSoon: true`
   (`integrations-page.tsx`:192-237). Clicking Connect authorizes nothing. JTBD rainy 7 · honesty floor.

10. **A connector has no word for being broken.** `Connector["status"]` is
    `"connected" | "available" | "coming-soon"` (`campaign-data.ts`:1769) and `effectiveConnectorStatus`
    (`agent-resources.ts`:246-249) can return only those three. There is no expired token, no revoked grant, no
    vendor outage and no "EU HubSpot not supported", which ElevenLabs states as a hard limit. A connector that
    stopped working at 09:00 still reads Connected on the card and Active in the builder row
    (`step-build.tsx`:144). JTBD rainy 6, 8.

11. **The Connectors search box does nothing.** `integrations/page.tsx`:290 renders
    `<Input placeholder="Search" />` with no value and no handler, and :304 maps the whole `CONNECTORS` array
    unfiltered. It is the first control on the tab in `before-19-integrations.png`. Heuristic eval
    2026-07-06:109.

12. **Connecting a CRM sends the user to a section that does not exist.** The success toast at
    `integrations/page.tsx`:96 reads "Attach it to an agent from Prompt & tools." The section is called
    **Prompt & knowledge** (`components/wizard/types.ts`:22) and the connectors sit in a row labelled
    **Tools & connectors** inside it. Three names, one destination, at the moment the user has just connected a
    CRM. Heuristic eval 2026-07-06:109, "Attach a CRM/knowledge connector: Failure".

13. **In the real Console the connector picker cannot load.** `agent-editor-workspace.tsx`:752-755 renders
    `<AgentToolsPage>` with no `projectId` and no `agentId`. `useStudioConnectorsQuery` is
    `enabled: (input?.enabled ?? true) && Boolean(input?.projectId)`
    (`use-studio-connectors-query.ts`:32) and the attachment queries need both ids
    (`use-studio-agent-attachments-query.ts`:29-32), so the Connector select holds only its placeholder, Attach
    connector stays disabled, and `addConnector` returns with no message at `agent-tools-page.tsx`:346. The one
    shipped CRM is unreachable from the editor. Ticket 868kyjfp4.

14. **Resources says a batch deployment has 4,210 contacts while the builder says 248.**
    `components/channels-panel.tsx`:53 hardcodes `identifier: "4,210 contacts"` on a row named Q2 Collections
    that has no `CampaignDraft`, no CSV and no link to `firstRun`. It is visible in `before-18-deploy.png`, two
    clicks from the list that claims 248. The same table renders a bare `", "` in the Agent column for the
    unassigned number (:55). Ticket 868kykbf7.

15. **A call ends and nothing lands on a person.** `CallRow` (`app/(dashboard)/calls/page.tsx`:35-47) carries
    `from` and `to` and no contact, no record id and no pointer back to the row that dialled. The three columns
    offered as structured output, Sentiment · Intent · Language (:110-114), are computed from the row itself at
    :117-121: Sentiment reads Positive whenever the outcome is Successful. The agent's own data points are never
    read here, although the row that authors them says "Results appear in Call History"
    (`deploy-section.tsx`:120). JTBD rainy 17, 24 · ticket 868kykbfx.

16. **Nothing on a contact can say "never call this person", and no row can be the same person twice.**
    `CampaignDraft` (`lib/wizard-draft.ts`:256-280) has no suppression field, no per-row flag and no dedupe, and
    the preview table's first column is a display string (`campaigns-card.tsx`:630) rather than the row's key.
    Retell makes the phone number the identity of the contact and refuses a duplicate outright
    (<https://docs.retellai.com/features/contacts>). JTBD rainy 11, 13.

17. **The pre-flight states coverage as fixed text.** `deploy-preflight.tsx`:98 builds the batch row as
    `${c.name} · ${c.contacts ?? MOCK_CSV_ROWS} contacts · ${c.csvName} · variables covered`, appending the last
    two words whenever `campaignWarn` returns null. The words are read from nothing, and the count falls back to
    the same 248. JTBD rainy 9.

18. **Write-back has no boundary, and the method list is wider than the Engine's.**
    `ng-console/src/lib/agents/studio-custom-tools-api.ts`:17 offers `DELETE · GET · PATCH · POST · PUT`;
    `llm.tools` documents `GET` and `POST` only (release notes v2.12). There is no field allowlist, no update
    mode, no dry run, no approval and no record of what the agent changed. "Controlled" in the ticket has no
    control to extend. Ticket 868kykbfx · JTBD rainy 15, 16.

19. **The field that would make a write attributable is deliberately unavailable.**
    `ng-console/src/lib/convoai/agent-properties.ts`:4-22 lists `labels` in `reusablePropertyKeys`, then :24-26
    builds `configurablePropertyKeys` as that list minus `labels`. It is the only shipped field that carries a
    CRM record id from the dial into every notification callback, and it is populated only with provenance
    (`agent-editor-workspace.tsx`:182-186). Ticket 868kykbfx.

## What is right, and must survive any redesign

- **The list is the decision, not a detail behind a toggle** (`campaigns-card.tsx`:526-527, owner 2026-09-15).
  Deployment shows the table straight away.
- **One run, one id.** `firstRun` and `patchFirstRun` (`wizard-draft.ts`:288-304) are why there is one list and
  not two. A second contact list is a failed design.
- **Reconciling the prompt against the list, in the panel that owns the list.** No vendor documents this check.
  It is `campaignMissingVars`, and the defect is the constant it reads, not the idea.
- **The coverage failure names the two ways out** and says the deploy is blocked until they match
  (`campaigns-card.tsx`:616-618).
- **"Inbound agents: per-call variables via API: coming soon."** is the only honest sentence in the feature. It
  is replaced by a real row, never by silence.
- **One door per action:** connectors are attached in the builder's Tools & connectors row and connected in
  Resources. 21 does not add a third attach surface.
