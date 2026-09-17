# 20 · Knowledge sources — what the vendors' public docs say (2026-09-17)

Stop 2, docs half. The signed-in product is captured separately from the shot list at the end of this file.

Five questions asked of every vendor, one per roadmap task:

1. Can a whole site go in, or only one page at a time? (868kyjfp6)
2. Can a source behind a login go in, and with what credential? (868kyjfnu)
3. Does anything re-fetch on a schedule, and who sets the interval? (868kyjfp7)
4. Is retrieval tunable, and does the tuning live on the base or on the agent? (868kbyqef)
5. Can the customer point at a vector store they own? (868kbyqf9)

A fifth vendor, **Intercom Fin**, is added at the end. Reason: it is the only product in the set whose whole job
is this JTBD, it has shipped the surface for years, and it is the only one that publishes an answer to question 2
instead of staying silent. Its answer is a refusal, which is exactly the state our honesty floor needs a precedent for.

---

## Retell AI

**Surface.** A top-level **Knowledge Base** tab in the dashboard, plus a **Knowledge Base** section inside the agent
editor, plus a **Node Knowledge Base** section on each Conversation Node and Subagent Node of a Conversation Flow
agent. Three places, one object.
Docs: https://docs.retellai.com/build/knowledge-base

**Shape of the control.** One "Add Knowledge Base" dialog: a name field and an **Add** menu with six source types.
*URL* ("Supports single pages or entire websites"), *File*, *Text*, *Google Drive*, *Microsoft OneDrive*, *Notion*.
The three connector types are greyed until the account is connected: the docs say "Connect Google Drive first; the
Add menu then lists your connected accounts."

**Whole-site crawl.** Give a URL, and Retell opens a **Select Site Maps** dialog listing every page it discovered,
each with a checkbox, a *Select All*, and an **Auto add future page** toggle. Unticked pages are not dropped, they
go onto an exclusion list you can edit later; previously crawled URLs appear in bold and can be excluded or
reinstated. With the toggle on, "The system will automatically crawl all pages under each path every 24 hours,
excluding any URLs you've added to the exclusion list."

**Schedule.** Two separate switches, both fixed at 24 hours and neither user-set. *Auto-refreshing* re-fetches every
URL and re-syncs the Drive, OneDrive and Notion sources whose source changed. *Auto-crawling* discovers new pages
under a path. There is no interval field, no time-of-day, no cron.

**Retrieval tuning, and where it lives.** On the **agent**, after a base is attached, under "Adjust KB Retrieval
Chunks and Similarity": *Chunks to retrieve* (1 to 10, default 3) and *Similarity Threshold* (default 0.60). The
docs give the tradeoff out loud: more chunks "increases the prompt length and can interfere with generation
quality". A separate **Knowledge Base Instruction** (up to 500 characters) steers the search query only, and the
docs say so plainly: "It shapes the search query; it does not filter or rewrite the retrieved chunks."
Conversation Flow agents can set both per node, and a node-level instruction overrides the flow-level one.

**Proof that retrieval worked.** The best control in this whole teardown. Open a call in Call History and any agent
turn that used the base carries a **Knowledge Base Retrieval** link above it. The link opens a dialog listing
**Chunk 1**, **Chunk 2** and so on, each the exact text passed to the LLM. The docs then teach the debug loop: if
the chunk is missing, raise chunks or lower the threshold; "If the chunk was retrieved but the agent ignored it,
fix the agent's prompt."

**Limits, per knowledge base.** 500 URLs. 200 exclusion URLs per auto-crawl path and 500 per base. 50 text snippets.
25 files at 50 MB each; spreadsheets capped at 1000 rows and 50 columns. Retrieval latency "should generally be
under 100ms". Retrieved chunks are appended to the prompt under the header `## Related Knowledge Base Contexts`
and count toward a prompt-token surcharge.

**Cardinality.** Many, said out loud as the answer to the limits: "You can create multiple knowledge bases to
overcome these limits. An agent can have more than one knowledge base linked to it."

**What they refuse.** No credential, header or cookie for a crawl anywhere in the docs. Private content arrives
only through an OAuth connector to a named SaaS. For anything without a connector they write the honest sentence
rather than pretend: OneNote content should be exported and uploaded, and "Exported files don't stay in sync with
the source app, so re-upload after the content changes."

**Failure copy, verbatim, because it is the model for ours.** A partly broken base still works: "Some knowledge
base sources could not be processed:" followed by the list. A dead one reads **Failed** with "Failed to process the
knowledge base:" and the error. A refresh never destroys what it cannot update: "Refresh completed with N errors.
Existing content was retained for sources that could not be refreshed." and "Refresh reached its time limit after
processing X of Y sources. The remaining sources were retained unchanged." Each notice has an **Ignore** action.

**Price.** First 10 bases free, then $8 per month each; $0.005 per minute of calls with a base enabled, "It does
not matter if your agent is using 1 or many".

---

## ElevenLabs Agents

**Surface.** A **Knowledge base** dashboard at https://elevenlabs.io/app/agents/knowledge-base, reachable from an
agent's configuration too. The object is a **document**, not a base; a base is whatever set of documents an agent
points at.
Docs: https://elevenlabs.io/docs/eleven-agents/customization/knowledge-base ·
https://elevenlabs.io/docs/eleven-agents/customization/knowledge-base/manage-documents ·
https://elevenlabs.io/docs/eleven-agents/customization/knowledge-base/rag

**Shape of the control.** One **Add document** button with three sources: *File* (PDF, DOCX, TXT, MD, HTML, EPUB,
up to 20 MB), *URL*, *Text*. Documents are reusable across agents, and **folders** group them for bulk attach: "A
folder attached to an agent makes all of its documents available through RAG", so a folder forces RAG on.

**Whole-site crawl.** A first-class async job, but API-only in the docs. `POST /v1/convai/knowledge-base/crawl`
with `url`, `max_depth` (1 to 5, default 3), `max_pages` (1 to 10000, default 1000), `pattern` to filter URLs,
`sitemap_urls` to override discovery, and `parent_folder_id`. The response carries `id`, `status`,
`root_folder_id` and a `type` of `discovery` or `sitemap`. So a crawl does not make a knowledge base, it fills a
folder.
Docs: https://elevenlabs.io/docs/eleven-agents/api-reference/knowledge-base/create-crawl-job

**Schedule.** Three fields on the same crawl call: `enable_auto_sync` (default false), `minimum_frequency_days`
(default 7) and `auto_remove` (default false), the last two "Only applicable when auto-sync is enabled". The
dashboard exposes auto-sync as a switch; the docs never show the interval as a dashboard control. Auto-sync takes
ownership of the document: "When auto-sync is on, the sync cycle manages the document and manual edits are
blocked." A one-shot `documents.refresh` exists for people who do not want the switch.

**Retrieval tuning, and where it lives.** On the **agent**, `conversation_config.agent.prompt.rag`:
`enabled`, `embedding_model` (`e5_mistral_7b_instruct` is the only one named), `max_vector_distance` (0.6 in the
example), `max_documents_length` (50000), `max_retrieved_rag_chunks_count` (20). In the dashboard it is a **Use
RAG** toggle in the agent's Knowledge Base section with embedding model, maximum document chunks and maximum
vector distance under an **Advanced** tab. Per **document** there is one setting only, `usage_mode`: `auto`
(default, retrieve when relevant) or `prompt` (always in the system prompt, if it fits).

**Limits.** Full context caps at roughly 300,000 characters per document. The RAG index is capped per workspace by
plan: Free 1 MB, Starter 2 MB, Creator 20 MB, Pro 100 MB, Scale 500 MB, Business and Enterprise 1 GB, measured on
"original file size" not index size. On Free, "Indexes may be deleted after inactivity." Documents under 500 bytes
cannot be indexed and fall back to the prompt. RAG "adds on slight latency to the response time of your agent,
around 250ms."

**What they refuse.** No credential on a crawl. Instead they publish the crawler's identity and make it the
customer's job to let it in: pages are fetched as `ElevenlabsBot/1.0`, `robots.txt` is respected, and if a CDN or
WAF blocks the request "the document is created but no content can be extracted from it". That is a named failure
with a named fix, and it is a failure mode our own "connected is not working" rule predicts exactly.

**Deletion is guarded by dependency.** Each document has a **Dependent agents** tab listing the agents using it,
and "A document cannot be deleted while an agent depends on it", with force deletion as the explicit override.

---

## Vapi

**Surface.** There is no knowledge page. Files live at `Build > Files`
(https://dashboard.vapi.ai/files) and a knowledge base is a **query tool** that names some of them.
Docs: https://docs.vapi.ai/knowledge-base · https://docs.vapi.ai/knowledge-base/using-query-tool ·
https://docs.vapi.ai/knowledge-base/custom-knowledge-base

**Shape of the control.** Upload files, then tick them in the assistant's Files section. Publishing does the
wiring: "This automatically creates a default knowledge base (using the query tool) with the selected files for
the assistant." The underlying object is `tool.type: "query"` holding `knowledgeBases[]`, each entry being
`provider` (`"google"`), `name`, `description` and `fileIds[]`. Several bases can sit in one query tool, each with
its own `description`, and the description is how the model picks between them. Retrieval is not automatic: the
docs say the description "alone is not sufficient for the assistant to know when to search", so the system prompt
has to tell it to.

**Formats and limits.** `.txt .pdf .docx .doc .csv .md .tsv .yaml .json .xml .log`. One number only: "Keep
individual files smaller than 300KB."

**Whole-site crawl.** None. No URL source of any kind.

**Schedule.** None, and the docs say so by putting the work on the customer: "Update regularly: Refresh your
knowledge base files whenever information changes."

**Retrieval tuning.** None documented on the Google provider. No top-k, no threshold, no chunk size, no embedding
choice.

**Customer-owned store, and what happened to it.** Vapi shipped a vendor-named one and it died. On 20 January 2025
the changelog told users to configure Trieve knowledge bases with the new `createPlan` and `searchPlan` fields
(https://docs.vapi.ai/whats-new/2025/1/20). Today the KB docs name Google as the only provider, and
https://docs.vapi.ai/knowledge-base/migrating-from-trieve returns 404 (checked 2026-09-17); the indexed copy of
that page recorded Trieve shutting down on 1 November 2025 and pointed people at a Custom Knowledge Base instead.
What survives is the generic escape hatch: `provider: "custom-knowledge-base"` with `server.url` and
`server.secret`, a webhook where "Vapi sends search request to your custom endpoint" and "Your server returns
relevant documents or direct response". The named vendor came and went; the unnamed endpoint outlived it.

---

## LiveKit Agents

**Surface.** None. LiveKit has no hosted knowledge base, no upload, no crawler and no managed vector store, and
does not pretend otherwise.
Docs: https://docs.livekit.io/agents/build/external-data/ · https://docs.livekit.io/recipes/rag-delay/

**What they give you instead.** Three code seams. A `ChatContext` you fill before `session.start()` for data the
agent needs up front. `@function_tool()` definitions for anything the model should decide to call. And the
`on_user_turn_completed` node, which runs a lookup on the user's last turn before generation, "highly performant
as it avoids the extra round-trips involved in tool calls". The retrieval function is yours, and they say what
that costs: "the results are only as good as the accuracy of the search function you implement."

**Where their design effort actually went.** Not into configuring knowledge, into surviving the wait for it. The
same page prescribes a verbal status update fired on a 0.5 second timer and cancelled if the search returns first,
cached TTS for fixed phrases like "let me check that for you", and a background "thinking" sound while a tool call
runs. A whole recipe page exists for the delay alone.

**Why they still belong in the four.** They set the floor for the honesty rule. A platform is allowed to say this
is not ours, name the third parties (LlamaIndex, Mem0, Letta), and design the consequence instead of the feature.

---

## Intercom Fin (added fifth)

Added because questions 2 and 3 have no answer in the four, and Fin is the product that has had to answer them at
scale. Fin is a support agent, not a voice platform, so nothing here is ported wholesale; it is cited for the two
answers it publishes.
Docs: https://www.intercom.com/help/en/articles/9357945-sync-and-manage-websites ·
https://www.intercom.com/help/en/articles/9440354-knowledge-sources-to-power-ai-agents-and-self-serve-support

**Surface.** `Fin AI Agent > Train > Content`, with **Website sync** as one entry under *Add content*. You give a
top-level domain and it fetches the pages nested under it. Limits: up to 100 top-level domains and a maximum of
4,000 pages from each source.

**The page inventory nobody else draws.** A synced source lists its status (*Syncing*, *Live*, *Failed*,
*Excluded*), the sync date, the count of synced pages, excluded pages and failed pages, the duration, and who
started the sync. Not a chip. A ledger.

**Schedule, tied to use.** Public URLs sync weekly, with a **Sync now** button for a manual run. After 90 days the
schedule is earned rather than assumed: "it keeps syncing automatically if a page from it was used in a Fin answer
in the last 90 days", otherwise scheduled syncs pause. Very large sites drop to a 14-day cycle automatically.
Connector-synced internal sources (Confluence, Guru, Notion) authenticate with the account's own credentials and
re-sync every 24 hours.

**The refusal.** "If the content you want to use is behind a login, Fin won't be able to access or import it." The
route for private pages is to push rather than pull, through the External Pages API. The mature player in this
market does not crawl an authenticated site, and says so on the help page a customer reads before they try.

---

## Across the five

| | **Retell** | **ElevenLabs** | **Vapi** | **LiveKit** | **Intercom Fin** |
|---|---|---|---|---|---|
| **Whole site in** | Yes. Discovered pages listed for selection; unticked ones become an exclusion list | Yes, API only. `max_depth` 1 to 5, `max_pages` to 10000, sitemap override | No. Files only | No | Yes. Nested pages under one domain, 4000 pages per source |
| **Source behind a login** | Only via OAuth connectors: Google Drive, OneDrive, Notion | No. Crawler identity `ElevenlabsBot/1.0` published so the customer can allow it | No | Your code, your credential | Refused in writing; push via the External Pages API instead |
| **Scheduled refresh** | Two switches, both fixed at 24 hours | `enable_auto_sync` plus `minimum_frequency_days`, default 7, API only | None. "Refresh your knowledge base files whenever information changes" | None | Weekly, paused after 90 days without a retrieval; 14 days for large sites |
| **Retrieval tuning, and where** | On the **agent**: chunks 1 to 10 (default 3), threshold (default 0.60), plus a 500-character query instruction | On the **agent**: `max_retrieved_rag_chunks_count`, `max_vector_distance`, `max_documents_length`, `embedding_model` | None | Yours, in code | Not exposed |
| **Bases per agent** | Many, stated as the way around the limits | Many documents, and folders to attach them in bulk | Many, each with a `description` the model routes on | n/a | Many sources, one content library |
| **Proof retrieval fired** | **Knowledge Base Retrieval** link on the turn, chunk by chunk, in Call History | Indexing status in the list; nothing per turn | Nothing | Whatever you log | Per-source page counts; nothing per turn |
| **Customer-owned store** | No | No | Generic webhook only; the named one (Trieve) shut down | Any, it is all yours | No |

## What nobody does

**Nobody crawls behind a login with a credential the user typed.** Not one of the five has a header, cookie or
password field on a crawl source. Private knowledge reaches an agent in exactly two shapes: an OAuth connector to
a named SaaS (Retell's Drive, OneDrive and Notion; Intercom's Confluence, Guru and Notion), or an API the customer
pushes into (Intercom's External Pages). Task 868kyjfnu, read literally, is a feature nobody in this market ships.

**Nobody lets the user choose the interval.** Retell is 24 hours, take it or leave it. ElevenLabs has
`minimum_frequency_days` and keeps it out of the dashboard. Intercom is weekly. There is no schedule picker, no
cron field and no time-of-day anywhere. A schedule control is a thing we would invent, not adopt.

**Nobody except Intercom shows what the crawl actually got.** Retell and ElevenLabs turn a site into a flat list of
documents. Only Intercom reports synced, excluded and failed page counts, the duration, and who ran it. A customer
who crawls 4,000 pages and gets 3,100 has no way to learn that from three of the four voice vendors.

**Nobody except Intercom ties freshness to use.** Its 90-day rule stops re-crawling a source no answer has needed,
which is the only mechanism in the set that treats a refresh as something a source earns.

**Nobody except Retell proves a retrieval at the turn level.** One link above one agent message, opening the exact
chunks that were passed. It is the cheapest honest answer to "the crawl says Live and the agent still cannot
answer", and it costs nothing to draw next to a transcript we already render.

**And the one that is table stakes, not whitespace:** retrieval tuning. Both vendors that expose it put the same
two dials in the same place, on the agent. Ours are drawn already and save nothing.
