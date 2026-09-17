# 19 · Tools & connectors · Learnings from four vendor environments

Evidence: `02-research/_docs.md` (public docs, 2026-09-17) plus the product shots the browser agent
captures from the shot list. Five learnings, each one sentence, each changing something we draw.

1. **A tool belongs to the workspace, not to the agent.** ElevenLabs moved every tool out of the
   agent and onto the workspace on purpose, leaving the agent holding only `prompt.tool_ids`, and
   Vapi's Tools list has always been reused "across multiple assistants", so our Custom Tools row in
   `SectionKnowledgeTools` (`studio_x_2/components/wizard/step-build.tsx` :117) must be a
   `ResourceField` that attaches a workspace record by id, with the create form behind the sheet's
   "Create New" door, never an editor that writes onto `AgentDraft`.
   *(https://elevenlabs.io/docs/eleven-agents/customization/tools/agent-tools-deprecation ·
   https://docs.vapi.ai/tools/custom-tools)*

2. **Nobody lets you prove a no-code HTTP tool works before an agent depends on it, and we already
   can.** Vapi's only test is a CLI command and its failures surface afterwards as log strings like
   "ok, no result returned", Retell and ElevenLabs put a Run button on the *code* tool and none on
   the HTTP one, and LiveKit only offers a whole-agent live preview, while Agora's Console already
   ships `POST /custom-tools/{toolId}/test` with a status badge and raw body
   (`ng-console/src/components/console/integrations-page.tsx` :1946–2020): so the test moves from a
   dialog behind an overflow menu to the form's finish, the tool list gains a last-result column,
   and a tool that has never returned 200 is attachable but marked.
   *(https://docs.vapi.ai/tools/custom-tools-troubleshooting ·
   https://docs.retellai.com/build/single-multi-prompt/code-tool)*

3. **The connector marketplace the market actually has is one native card and a door to everything
   else.** Retell's eleven OAuth providers is the ceiling among the four, Vapi has four, ElevenLabs
   has one native connector behind a page advertising "over 400", LiveKit has none, and three of the
   four route the long tail through a single Zapier MCP URL covering "9,000+ apps": with our server
   still refusing every provider but `hubspot` (`integrations-handlers.ts` :921–928), the Connectors
   tab leads with Add your own (MCP or HTTP), shows HubSpot as the one live card, and drops the five
   coming-soon placards rather than dressing a roadmap as a catalog.
   *(https://docs.retellai.com/integrations/overview · https://elevenlabs.io/agents/integrations ·
   https://zapier.com/mcp)*

4. **Structured outputs become a resource by being attached by id, not by getting a better editor.**
   Vapi is the only vendor that made them reusable, as a named JSON-Schema definition linked through
   `artifactPlan.structuredOutputIds` with several per assistant, while Retell's per-agent **Post
   Call Extraction** tab is field-for-field what our sandbox already copied (name · description ·
   Boolean, Text, Number, Selector against our `text|number|boolean|enum` in
   `lib/wizard-draft.ts` :151–159): so 868khqaqj is a promotion of the existing `DataPoint` set into
   a Resources row plus one `ResourceField`, which also collapses the two write doors in
   `step-analysis.tsx` and `call-capture-sheet.tsx` into one.
   *(https://docs.vapi.ai/assistants/structured-outputs ·
   https://docs.retellai.com/features/post-call-analysis-create)*

5. **Hosted code tools are shipped product at half the market, so parking 868kykbfa is a position we
   have to state rather than a gap we can leave blank.** Retell runs JavaScript in a QuickJS sandbox
   with a 20,000-character limit, a 5 to 60 second timeout, a **Run Code** button and one fixed
   egress IP for the customer's firewall, and ElevenLabs runs a default-export JS module with a 1 to
   30 second timeout, no npm, domain allowlisting and secrets injected on egress only: since
   `llm.tools[].function.execution.mode` has the single value `"sync"` and `server` is required, the
   Tools sheet carries a third kind that is visibly disabled with the reason on the row, the way
   `agent-detail-page.tsx` :266 already does for MLLM agents.
   *(https://docs.retellai.com/build/single-multi-prompt/code-tool ·
   https://elevenlabs.io/docs/eleven-agents/customization/tools/code-tools ·
   https://docs.agora.io/en/api-reference/api-ref/conversational-ai/join)*

## One field-level fact worth carrying, which is not a learning on its own

ElevenLabs solved the placeholder problem we already half-solved. Their tools reference a
workspace-scoped record as `{{system__env_<label>}}` in URLs, headers, MCP endpoints and auth, of
three types (String, Secret, Auth connection), and the URL field enforces that it "must begin with
`https://` before any environment variable references" so a placeholder can never inject a protocol.
Our Console rejects an undeclared `{{placeholder}}` at save (`integrations-page.tsx` :2330–2348) and
treats `Authorization`, `api-key`, `token`, `secret`, `cookie` as secrets by name
(https://docs.agora.io/en/ai/studio/build/custom-tools), which is the same problem answered one
level lower. If the header rows ever gain a secret type, it stores a reference, not a value.
*(https://elevenlabs.io/docs/eleven-agents/integrate/environment-variables)*
