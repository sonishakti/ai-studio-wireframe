# 20 · Knowledge sources — learnings

Evidence: `02-research/_docs.md`, from the public docs of Vapi, Retell, ElevenLabs, LiveKit and Intercom Fin,
read 2026-09-17. Each learning below answers one of the open questions in `00-brief.md` and moves a control.

1. **An authenticated source is a connected account, never a credential on a crawl:** not one of the five exposes a
   header, cookie or password on a crawl source, Retell reaches private content only through OAuth to Google Drive,
   OneDrive and Notion (`docs.retellai.com/build/knowledge-base`) and Intercom prints the refusal on the help page a
   customer reads first, "If the content you want to use is behind a login, Fin won't be able to access or import
   it" (`intercom.com/help/en/articles/9357945-sync-and-manage-websites`), so 868kyjfnu becomes a connected-account
   entry in the existing source menu plus a "Public pages only" line under the URL field, and the write-only secret
   pattern at `studio_x_2/components/external-retrieval-form.tsx:188-199` stays where it is, on the vector store.

2. **A crawl fills a container, it does not become one:** Retell's crawled URLs are sources listed inside a single
   knowledge base and ElevenLabs' crawl job takes a `parent_folder_id` and returns a `root_folder_id`
   (`elevenlabs.io/docs/eleven-agents/api-reference/knowledge-base/create-crawl-job`), so open question 3 resolves
   to "a source inside a base", the crawled site joins the uploaded PDFs in one sources list, freshness is a
   per-source stamp, and no second list surface is added to the Console.

3. **Refresh is one switch and one button, and the interval is copy rather than a control:** every vendor that
   refreshes either fixes the interval (Retell at 24 hours, Intercom weekly with a **Sync now**) or keeps it in the
   API where no console user sees it (`minimum_frequency_days`, default 7), and ElevenLabs makes the cost explicit,
   "When auto-sync is on, the sync cycle manages the document and manual edits are blocked"
   (`elevenlabs.io/docs/eleven-agents/customization/knowledge-base/manage-documents`), so 868kyjfp7 ships as a
   switch, a "Refresh now", a last-synced line and a sentence naming the cadence, with no schedule picker drawn.

4. **The two retrieval dials belong on the agent, and they are dead controls without the chunk view beside them:**
   Retell puts *Chunks to retrieve* (1 to 10, default 3) and *Similarity Threshold* (default 0.60) on the agent
   after a base is attached and then teaches the loop with a **Knowledge Base Retrieval** link above each agent turn
   that opens the exact chunks passed to the LLM, telling you to raise chunks or lower the threshold when the chunk
   is missing and to fix the prompt when it was there and ignored (`docs.retellai.com/build/knowledge-base`), so the
   four controls stranded in `external-retrieval-form.tsx:338-372` move next to the knowledge row in the builder and
   ship together with a per-turn chunk list, or they do not ship at all.

5. **A blocked crawl is the common failure, so the crawl form has to say who is knocking:** ElevenLabs publishes the
   crawler's user agent `ElevenlabsBot/1.0`, states that it honours `robots.txt`, and names the exact silent failure
   we would otherwise ship, "the document is created but no content can be extracted from it"
   (`elevenlabs.io/docs/eleven-agents/customization/knowledge-base/manage-documents`), so the URL source reuses the
   copyable-egress-IP row already built at `external-retrieval-form.tsx:223-236` to show the crawler identity and
   the allowlist line, and an empty crawl reports zero pages rather than a green chip.
