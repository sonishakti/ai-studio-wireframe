# 20 · Knowledge sources — JTBD, all types

ClickUp: [20 · Knowledge sources](https://app.clickup.com/t/868m0mf4k) (Design Tracker, P1, knowledge, no lock)
Roadmap parent: *Connect agents to knowledge, tools, and customer data* (Studio, level 0, `references/clickup-q3-roadmap-export-2026-09-03.tsv:185`). Five roadmap tasks: 868kyjfnu · 868kyjfp6 · 868kyjfp7 · 868kbyqef · 868kbyqf9.
Evidence: `00-brief.md` (surface audit + Agora fact-check) · `02-research/_docs.md` (Retell · ElevenLabs · Vapi · LiveKit · Intercom Fin, read 2026-09-17) · `03-learnings.md`

## Headline JTBD

**When my prices, policies and help pages change every week and my agent is still answering from the PDF
I uploaded in June *(situation)*, I want it reading the same pages my customers read, and to keep reading
them without me *(motivation)*, so a caller never gets last quarter's answer in a confident voice *(outcome)*.**

## Success event

No event in `references/telemetry/event-spec.json` covers knowledge; the 42 events stop at the deploy and
the first live call. Three are proposed below in the spec's own shape (snake_case, `object_verb`, past tense,
camelCase properties, verbs from the allowed list). All three need their keys added to the sanitize allowlist
in `ng-console/src/lib/observability/sanitize.ts` before any of them ships, per the spec's ALLOWLIST note.

**The success event is `knowledge_retrieval_completed`.** A refresh nobody's answer needed is worth nothing,
which is the one mechanism Intercom has and the voice vendors do not: its scheduled sync pauses after 90 days
without a retrieval (`_docs.md` · Intercom help 9357945). So the event that counts is a production turn that
answered from a source, carrying how old that source was.

```
knowledge_retrieval_completed
  when       A production (non-test) agent turn retrieves chunks. Server-anchored, like
             first_live_call_received: from the runtime path, not the client.
  properties agentId · versionId · kbId · sourceKind (upload|crawl|external) ·
             sourceAgeDays · chunkCount · topScore · thresholdUsed · usedInAnswer (boolean) ·
             retrievalMs
  feeds      Fresh-answer rate (the headline) · the chunk view that makes tuning debuggable ·
             retrieval latency against the 250 ms ElevenLabs publishes and the sub-100 ms Retell claims
  priority   P0
```

```
knowledge_refresh_completed
  when       A re-fetch of an existing source ends, manual or scheduled.
  properties kbId · sourceId · trigger (manual|scheduled) · pagesFound · pagesChanged ·
             pagesFailed · pagesExcluded · durationMs · retainedOnError (boolean)
  feeds      Does the schedule actually run · the partial-failure state Retell ships copy for ·
             whether anyone presses Refresh now once the switch exists
  priority   P1
```

```
knowledge_source_linked
  when       A source is added to a base: a file upload, a crawled URL, or an external index that
             passed both tests. Sibling of phone_number_linked.
  properties agentId · kbId · sourceKind (upload|crawl|external) · vendor · pageCount ·
             fieldCount · wallMs · testsPassed (connection|retrieval|both|none)
  feeds      Time from opening the knowledge row to a source that answers · crawl vs upload mix ·
             how many external sources ship with a green connection and no proven retrieval
  priority   P1
```

**Headline metric: fresh-answer rate.** The share of production turns with a retrieval whose chunks came from
a source re-fetched inside its stated cadence. It is the JTBD sentence made countable, and it is the only one
of these numbers that goes down when the product quietly stops working. North-star link: a deployment whose
answers stay right keeps its callers on the line, and callers on the line are the paid minutes.
Rejected KPIs: time on page, session length, DAU.

## Agora primitives

- `llm.rag_config.search_config.kb_id`: a single string, written at `ng-console/src/lib/agents/orchestration-properties.ts:696-710`, accepted by the SDK only through `Llm`'s open index signature, and absent from https://docs.agora.io/en/conversational-ai/rest-api/agent/join. Everything here rides on an undocumented field.
- Studio knowledge bases are a Console-backend resource (`/api/v1/studio/knowledge-bases`). The payload keys are listed at `ng-console/src/server/console-backend/studio-knowledge-bases.ts:121-145` and carry no url, no source, no crawl state, no interval and no last-synced stamp.
- Documented ingestion is PDF and DOCX, 20 MB per file (https://docs.agora.io/en/ai/studio/build/integrations), with the 10-file cap enforced in code only (`knowledge-base-document-lifecycle.ts:4-9`).
- https://docs.agora.io/en/conversational-ai/develop/custom-llm states the Engine does not manage RAG internally, so this is a Studio feature layered on top of the Engine, not an Engine capability.
- **Requires Engine:** crawl, schedule, freshness, page inventory, retrieval tuning, and Couchbase as a `kbType` value. Per-task verdicts in `00-brief.md` §Per-task verdict.
- Pricing is flat $0.10 per agent-minute on managed and BYO keys alike, so nothing here may be drawn as a cost control. The per-turn price of retrieval is latency, and the prototype already says so (`studio_x_2/components/external-retrieval-form.tsx:313`).

## Happy scenario

1. "I open the agent's knowledge row and paste my help centre URL instead of hunting for a PDF."
2. "It comes back with the pages it found, so I untick careers and the blog and keep the 214 that matter."
3. "It tells me 211 went in and 3 were skipped, and it names each one and why."
4. "I leave the weekly refresh on because the line under it says when the next run is."
5. "I talk to the agent right there and ask the one thing only the new pricing page can answer."
6. "The answer is right, and above the agent's line I can open the three chunks it read and see which page each came from."
7. "I deploy, the price changes the following Tuesday, and I do nothing."

## Rainy scenarios

1. "I opened the knowledge row and there is nothing here, and I can't tell whether I'm meant to upload a file or paste a link." (`ng-console/src/components/console/agent-knowledge-page.tsx:336-343`: "No Knowledge Base found" · "You haven't added any knowledge base yet.", `common.ts:2490-2491`)
2. "I dragged in my price list and it refused: PDF and DOCX only, ten files, 20 MB each, and my content is none of those." (`knowledge-base-document-lifecycle.ts:4-9`, published at https://docs.agora.io/en/ai/studio/build/integrations)
3. "Our docs sit behind an internal login and the crawler is reading the sign-in page." (Not one of the five exposes a header, cookie or password on a crawl; Intercom prints the refusal on the page a customer reads first, "If the content you want to use is behind a login, Fin won't be able to access or import it", `_docs.md` §Intercom Fin · `03-learnings.md` 1)
4. "It says the source was added and there isn't a word of content in it." (ElevenLabs fetches as `ElevenlabsBot/1.0`, honours `robots.txt`, and names the exact silent failure, "the document is created but no content can be extracted from it", `_docs.md` §ElevenLabs · `03-learnings.md` 5)
5. "The crawl finished, the chip is green, and the agent still can't answer anything." (Wave 1's standing rule, "a wrong embedding-field name produces a perfectly healthy connection that retrieves nothing", `wave1-implementation-log-2026-07-29.html:223`; an empty crawl must report zero pages, not a green chip)
6. "It got 3,100 of my 4,000 pages and nothing on screen tells me which 900 are missing." (Only Intercom draws the ledger: synced · excluded · failed counts, duration, who ran it. `_docs.md` §What nobody does)
7. "The weekly refresh ran, six pages errored, and I need to know whether it just wiped the copy that worked." (Retell answers it in copy: "Refresh completed with N errors. Existing content was retained for sources that could not be refreshed.", `_docs.md` §Retell)
8. "My site is bigger than whatever cap you have and I found out at page 500." (Retell caps 500 URLs per base and tells users to make more bases; ElevenLabs `max_pages` defaults to 1000 with a 10000 ceiling. `_docs.md`)
9. "It has said Processing for ten minutes and I don't know whether to wait or start over." (`StudioKnowledgeBase.processingDocuments` · `failedDocuments` · `status` at `studio-knowledge-bases-api.ts:20-35`; the prototype already seeds a base reading source "URL Crawl", status `indexing`, `studio_x_2/lib/campaign-data.ts:1739`)
10. "I kicked off a 4,000-page crawl and closed the tab, and I have no idea what I'm coming back to." (ElevenLabs models a crawl as an async job with its own `id` and `status`; Intercom records the duration and who started it. `_docs.md`)
11. "I attached the product docs and the policy docs and only one of them ever answers." (Attach takes `knowledgeBaseIds: string[]` at `studio-agent-attachments-api.ts:24`; the Engine payload carries one `kb_id` at `orchestration-properties.ts:696-710`; the page silently promotes the first and treats the rest as legacy, `agent-knowledge-page.tsx:132-142`)
12. "My colleague attached his base while I was attaching mine and mine stopped being the one that answers." (Same single `kb_id`, kept in step by `patchKbId` at `agent-knowledge-page.tsx:170-195`, with no lock, no draft and no last-writer notice anywhere in the flow)
13. "I picked the external index and now the document count is a dash and the upload button is gone." (An OceanBase base renders a dash instead of a document count at `integrations-page.tsx:646-656`, and its documents carry an `externalDocumentId` that changes the download path, `knowledge-base-document-lifecycle.ts:21,149-169`)
14. "I have a crawled site and a vector index I own, and it won't let me attach both." ("Only one OceanBase knowledge base can be attached and it cannot be mixed with Default knowledge bases.", `common.ts:2496-2498`, enforced at `agent-knowledge-page.tsx:143-161`)
15. "My teammate sees a Type column on knowledge bases and I don't." (The type picker and the column render only behind the `oceanbase_kb` flag, `studio-feature-access.ts:10,42` · `integrations-page.tsx:625`)
16. "I was told Couchbase is supported and the picker offers Default and OceanBase." (`KnowledgeBaseType = "local" | "oceanbase"` at `knowledge-base-document-lifecycle.ts:16`; the only Couchbase in the Console repo is five test fixtures, `00-brief.md` §What the product has today)
17. "I set chunks to 8 and the threshold to 0.4, saved, came back, and it was 3 and 0.6 again." (All four tuning controls are local React state at `external-retrieval-form.tsx:69-72,338-372`; the submit callback passes `{ name, externalSource }` and nothing else, :374-380)
18. "The right paragraph clearly went in and the agent made something up anyway." (Retell's per-turn Knowledge Base Retrieval dialog exists to split this: raise chunks or lower the threshold when the chunk is missing, fix the prompt when it was there and ignored. `_docs.md` §Retell)
19. "Every answer got slower the day I turned this on." (ElevenLabs publishes roughly 250 ms added per turn, Retell claims under 100 ms, and our own form already says retrieval is a per-turn latency cost, `external-retrieval-form.tsx:313`)
20. "I pasted my docs URL and someone on my team already crawled it into another base." (Retell shows previously crawled URLs in bold with exclude and reinstate; nothing in either of our repos knows a URL twice. `_docs.md` §Retell)
21. "I deleted the old base and three live agents went quiet." (ElevenLabs guards deletion with a Dependent agents tab and "A document cannot be deleted while an agent depends on it"; our delete sits in the row actions at `integrations-page.tsx:666` with no dependency check)
22. "I fixed a wrong sentence by hand and the next refresh threw my edit away." (ElevenLabs states the cost of the switch out loud: "When auto-sync is on, the sync cycle manages the document and manual edits are blocked.")
23. "The switch says weekly and there is no way for me to tell whether it has ever run." (No interval, source or last-synced key exists in either payload shape, `studio-knowledge-bases.ts:121-145`; `00-brief.md` fact-check 4. A schedule drawn today promises something no field can hold.)
24. "Legal wants to know where the crawled copy is stored and whether we took a page we shouldn't have." (Regulated constraint, LEARNINGS §3.4: HIPAA · GDPR · SOC 2 · EU AI Act; `robots.txt` is the only consent signal any vendor in the set publishes)
25. "I want to know what this crawl costs me and the page doesn't say." (Retell charges $8 per base per month past ten, plus $0.005 per minute with a base enabled; ElevenLabs caps the index by plan and warns that free indexes may be deleted after inactivity. Agora is flat $0.10 per agent-minute and index size moves none of it, so the honest answer is that the crawl is free and the answers are billed like every other minute.)
26. "This source hasn't answered a question in three months and we're still crawling it every week." (Intercom is the only product that ties the schedule to use, pausing scheduled syncs after 90 days without a retrieval. `_docs.md` §Intercom Fin)

## What this is not

- **Connecting a named SaaS account.** Google Drive, OneDrive, Notion, Confluence, Zendesk: every vendor that reaches private content does it with OAuth to a named system, not a credential typed onto a crawl (`03-learnings.md` 1). That is [19 · Tools & connectors](https://app.clickup.com/t/868m0mf40), and task 868kyjfnu probably belongs there rather than here (`00-brief.md` open question 4).
- **Building the transcript.** This feature adds one link above an agent turn and the chunk list behind it. The call detail, the session record and the evidence trail are [10 · Session & call logs](https://app.clickup.com/t/868m0meta).
- **Judging whether the answer was right.** A retrieval that fired is not an answer that passed; scoring lives in [14 · Evals & scorecards](https://app.clickup.com/t/868m0mexd) and [15 · Simulations](https://app.clickup.com/t/868m0meyb).
- **Writing the prompt.** When the chunk was retrieved and ignored, the fix is the prompt, and the prompt is owned by the builder's *Prompt & knowledge* section, not by a knowledge control.
- **Settling Integrations against Extensions Marketplace.** The label tension is open by decision (CLAUDE.md, Open IA tensions #3) and does not get resolved inside one feature.
- **Plans, caps and what an index costs.** [22 · Usage, credits & concurrency](https://app.clickup.com/t/868m0mf7b) owns anything that meters or gates. Nothing here is premised on knowledge moving the Agora bill.
