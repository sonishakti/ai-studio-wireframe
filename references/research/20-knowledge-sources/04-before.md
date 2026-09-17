# 20 · Knowledge sources — Before, and what is wrong with it

**Before:** `references/research/_before10-2026-09-17/before-19-integrations.png`, the Resources tab bar
with **Knowledge Base** as its first tab. No shot of the Knowledge Base tab itself, and none of the
builder's knowledge row, was captured on 2026-09-17; both are read from source below.

Live: <https://ai-studio-console-redesign.vercel.app/integrations?tab=knowledge> ·
<https://ai-studio-console-redesign.vercel.app/agents/agt_default/edit?step=3>

Source, prototype (`studio_x_2`): `app/(dashboard)/integrations/page.tsx:137-210` project list and create
sheet, and `components/external-retrieval-form.tsx` (388 lines), both last touched 2026-09-12 (0ac8422) ·
`components/wizard/step-build.tsx:68-90` the builder row and `:487-540` the create form, 2026-09-15
(ffea129) · `lib/agent-resources.ts:45-51,149-168`, 2026-09-15 (69f968c) · `lib/campaign-data.ts:1724-1740`,
2026-09-16 (fb6f7e3).

Source, real Console (`ng-console` `design/sandbox`): `src/components/console/integrations-page.tsx:396-760`
`KnowledgeBasesPanel`, 2026-09-04 (ce0d0f74) · `src/components/console/agent-knowledge-page.tsx` (653 lines),
2026-08-14 (cd473e26), mounted inside the agent's **Actions** tab at `agent-detail-page.tsx:727` ·
`src/lib/agents/knowledge-base-document-lifecycle.ts:4-16`, 2026-09-04.

A design exists for creating a base, uploading PDFs and attaching it to an agent, so that half is a
Before → After. Nothing exists for a crawl, an authenticated source, a schedule, a freshness stamp, a page
inventory or retrieval tuning that survives Save: those are blank pages, and the list below says where the
blank starts rather than pretending a control is there.

What is on screen today: a project-level list of knowledge bases in each repo (a table in the Console, a
card grid in the prototype), a create form whose only content source is a file picker, and an agent-level
row that attaches a base by name. Five roadmap tickets ask for a crawler. The string `crawl` returns zero
hits across `ng-console/src/`, and the prototype seeds a base whose source reads "URL Crawl".

## What is wrong

Each item ties to a JTBD rainy scenario or a roadmap ticket.

1. **Two knowledge bases can be attached and only the first one is ever read, and nothing on screen says
   which.** Attach posts `{ knowledgeBaseIds: string[] }`
   (`ng-console/src/lib/agents/studio-agent-attachments-api.ts:24`); the engine payload carries a single
   `llm.rag_config.search_config.kb_id` (`orchestration-properties.ts:696-710`).
   `attachKnowledgeBase` writes `kb_id` only when it is still empty
   (`agent-knowledge-page.tsx:209-210`), and the attached list renders name plus status for every row with
   no mark on the primary (`:346-389`). Attach the product docs and the policy docs: two identical rows,
   one live base. → JTBD rainy 11, 12. Every crawl ticket lands on top of this answer.

2. **For two of the stacks the knowledge surface is deleted, not disabled.** `mcpOnlyActions`
   (`agent-detail-page.tsx:266-267`) replaces the whole of `AgentKnowledgePage` with one sentence,
   "Realtime and Default LLM agents only support MCP servers." (`:719-724`, `common.ts:1967-1968`). An MLLM
   or Default LLM agent has no knowledge row, no unsupported state, and no route back to the bases the
   project already owns. → Honesty floor: "Not supported" is a row with a reason, not an absence.

3. **A crawled site has no field to be typed into and no field to be stored in.** The create dialog is
   name, description, type and a PDF or DOCX picker (`integrations-page.tsx:2444-2467`); the record the
   backend returns is `created_at · created_by · description · failed_documents · name ·
   processing_documents · provider · status · total_documents · total_size · updated_at · updated_by · uuid`
   (`src/server/console-backend/studio-knowledge-bases.ts:121-135`). No url, no source, no interval, no
   last-synced. → 868kyjfp6, 868kyjfnu, 868kyjfp7.

4. **The retrieval tuning the roadmap asks for is already drawn, and Save throws it away.** Text field,
   Embedding field, Chunks to retrieve and Similarity threshold are local React state
   (`external-retrieval-form.tsx:69-72`, rendered at `:338-372`). The submit passes
   `{ name, externalSource }` (`:374-380`) and `createKnowledgeBase` has no parameter for any of the four
   (`agent-resources.ts:149-168`). The threshold is read exactly once, to colour a badge in the test result
   (`:319`). → JTBD rainy 17 · 868kbyqef E2.

5. **A base created in the builder can never be opened again.** The knowledge `ResourceField` passes no
   `config` flag on its items and no `onConfigure` or `onDelete` (`step-build.tsx:69-89`); the MCP row
   directly below passes all three (`:101,110-111`). The per-row menu is gated on
   `i.config && (onConfigure || onDelete)` (`:395`), so it never renders for a knowledge base. The project
   tab's cards carry no actions either (`integrations/page.tsx:164-178`). Type eight fields of Couchbase
   credentials, save, and the only two verbs left are attach and detach. → JTBD rainy 17, 21.

6. **The status vocabulary has no word for the states a crawl actually produces.** Prototype:
   `"ready" | "indexing"` (`campaign-data.ts:1729`), shown as Active or Processing (`step-build.tsx:80`,
   badge at `:376-388`). Console: seven labels, active · disabled · failed · inactive · pending ·
   processing · ready (`agent-knowledge-page.tsx:63-71`, `common.ts:2498-2506`). A crawl that got 3,100 of
   4,000 pages, a refresh that errored on six, and a source last read in June all render the same word. The
   seven labels only reach the agent page: the project table prints the raw upstream string, or the
   hardcoded English "Unknown" (`integrations-page.tsx:638-644,739`), so one base can read two different
   words on two screens. → JTBD rainy 6, 7, 23.

7. **The two counts that would answer "which pages failed" are parsed off the payload and dropped before
   the screen.** `failedDocuments` and `processingDocuments` are mapped at
   `studio-knowledge-bases.ts:371,374` and typed at `studio-knowledge-bases-api.ts:24,28`, and no component
   renders either (grep across `src/`, 2026-09-17). The Documents column prints `totalDocuments` alone
   (`integrations-page.tsx:646-653`). → JTBD rainy 6.

8. **Three numbers on screen are invented.** `campaign-data.ts:1739` seeds "GDPR Laws", source "URL Crawl",
   0 chunks, status `indexing`, size "5.2 Mb": five megabytes of a crawl that never ran.
   `agent-resources.ts:163` mints 210 chunks for a website, 480 for a file and 4,182 for an external index
   the product does not index. The builder row prefers the size string to the chunk count
   (`step-build.tsx:79`), so that base reads "GDPR Laws · 5.2 Mb" while holding nothing.
   → Honesty floor · JTBD rainy 9.

9. **Attaching reports success and writes nothing when the agent has no Studio id.** `agentId` is
   `studioAgentId?.trim() || undefined` (`agent-detail-page.tsx:199`, passed at `:728`). Undefined, and
   `attachKnowledgeBase` skips the POST (`agent-knowledge-page.tsx:201-208`) while `patchKbId` still writes
   `kb_id` into the properties (`:186-190`). No error, no disabled control. The list is empty after a
   reload and the config still carries a `kb_id` no attachment backs. → JTBD rainy 12.

10. **A base that is still indexing cannot be attached and the row does not say why.** The attach switch is
    `disabled={i.status === "processing" && !on}` (`step-build.tsx:390`). The item type already carries a
    `note` field for exactly this (`:180-181`) and the knowledge row passes none. → JTBD rainy 9.

11. **One place, four names, and the link between them goes to the wrong page.** The builder section header
    reads "Prompt & knowledge" (`components/wizard/types.ts:22`); the Resources tab tells the user to attach
    from the "Knowledge & Tools section" (`integrations/page.tsx:144`); the connector toast in the same file
    says "Prompt & tools" (`:98`); the real Console keeps the row under a tab called **Actions**, with
    `?tab=knowledge` folded into it (`agent-detail-page.tsx:727,868-871`). That link points at
    `/agents?step=3` (`:143,214`), which is the agents list, a page that ignores `step`: the builder is
    `/agents/[id]/edit?step=N`, as the list's own Deploy link shows (`app/(dashboard)/agents/page.tsx:413`).
    The label also ends in an arrow. → JTBD rainy 1.

12. **Delete guesses at its own blast radius.** The Console's row delete (`integrations-page.tsx:686-697`)
    confirms with "Documents and agent references for this knowledge base may stop working."
    (`common.ts:2850-2851`). The attachments query that knows the exact list of dependent agents is already
    mounted on the agent page. The prototype has no delete at all. → JTBD rainy 21.

13. **The prototype's knowledge search is a decoration.** `<Input placeholder="Search knowledge bases…" />`
    has no value and no handler (`integrations/page.tsx:149`), and the same line repeats for MCP (`:220`).
    The Console's search is wired (`integrations-page.tsx:605-611`). Type into the prototype and the grid
    does not move. → JTBD rainy 20.

14. **"Where to find it" opens the wrong page twice.** Under Pinecone's *Index host* the link goes to the
    API-keys guide (`agent-resources.ts:98`); under Custom endpoint's *Retrieval endpoint* it goes to
    Agora's product overview (`:103`), while the page that documents a retrieval endpoint is
    <https://docs.agora.io/en/conversational-ai/develop/custom-llm>. Both return 200 and neither answers the
    question asked by the field above them. → 868kbyqef.

15. **The provider name is interpolated into two sentences that break when there is no provider.** With
    Custom endpoint selected the form reads "Copy this from your Custom endpoint console."
    (`external-retrieval-form.tsx:166`) and "Stored encrypted and never shown again. The same way Custom
    endpoint treats it." (`:202`). The resource-path select falls back to a placeholder of `", "` (`:272`).
    → Cold-read test.

16. **Two Console strings are wrong on the screens a first-timer reads first.** The upload hint says
    "Maximum: 10 KB files per conversation." (`common.ts:2741-2742`, shown at
    `integration-resource-fields.tsx:466`): "10 KB files" reads as a file size, the real cap is a count of
    ten (`knowledge-base-document-lifecycle.ts:5`), and nothing about it is per conversation. The Documents
    cell for an external base renders `&mdash;` with its reason hidden in a `title` attribute
    (`integrations-page.tsx:646-653`), while the mobile list prints that reason as the value
    (`:740-742`). → JTBD rainy 2, 13.

17. **A review link cannot open at the knowledge row.** The row is `SectionRow id="wz-5-kb"` with no
    `focusId` (`step-build.tsx:68`; the prop exists at `section-row.tsx:34,45`). The wizard resolves
    `?focus=` against `[data-design-focus]` or `wz-${step}-${focus}` (`agent-wizard.tsx:551,562`), and the
    row now lives in step 3 while its id still says 5. `?step=3&focus=kb` finds nothing and pulses nothing.
    → The prototype at stop 6 has to open where the review starts.

## What is right, and must survive any redesign

- **Two tests, because there are two failure modes.** "Test connection" proves auth, "Test retrieval"
  proves the index answers (`external-retrieval-form.tsx:89-123`), with "Connected isn't the same as
  working. Ask something your docs should answer." on screen (`:294-295`).
- **Named failures with their own fix.** The IP-allowlist error carries a copyable egress IP
  (`:96-103,223-236`); the auth error is a different message (`:104-106`). Never one "Connection failed".
- **The cascading resource path.** Each level unlocks from the one above and invalidates everything below
  (`:254-281`), so four unverifiable strings become four lists.
- **Write-only secrets.** After a passing test the field disables and reads "configured" with a Reset
  (`:188-199`).
- **The empty state is the row.** A label card on the left, one outline button on the right, inside one
  `rounded-lg border` (`step-build.tsx:301-314`), and its Console sibling `AgentActionEmptyState`
  (`agent-action-empty-state.tsx`) already serves three other rows.
- **Advanced does not make a beginner feel behind.** The external flow swaps the body instead of bolting
  eight fields onto the upload form, and the source picker stays visible so neither path is a dead end
  (`step-build.tsx:454-509`).
- **Latency is named as the per-turn price of retrieval** (`external-retrieval-form.tsx:313`), which is the
  honest cost. The Agora bill is flat at $0.10 per agent-minute and index size moves none of it.
