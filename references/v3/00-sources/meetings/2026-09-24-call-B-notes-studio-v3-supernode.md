# Studio redesign, API v3, and super node launch with Vinit

## Voice and Model Configuration
- Slider replaced with radio buttons: only two confirmed options (lowest latency, most capable), possibly three
- Lowest latency stack: Deepgram Nova 3 + Gemma 4 on SuperNode + Cartesia Sonic 3.5
- Balance tier: likely GPT-5.1 or 5.5 mini, but unclear if its meaningfully different from most capable
- Most capable: slower, higher accuracy
- Pricing is flat (10/min regardless of model), so cost is not a slider axis
- Real tradeoff axes: intelligence vs. latency
- Voice and model config to collapse into 3-4 lines: one radio button group, one dropdown
## Agent Creation Flow and Deployment
- Proposed flow: select deployment type (inbound, outbound, code/SDK) at agent creation, before any configuration
- Eliminates the changing selection changes everything below confusion
- Batch calling agents will never double as inbound; confirmed by engineering
- Deployment and Go Live sections to be merged into one tab
- Contact list (CSV upload) to be removed from the configuration screen
- Moved to Go Live, where runs are created
- Run concept retained: same agent, different contact list or variables, enabling A/B testing across campaigns
- Terminology: batch call preferred over campaign in docs (developer-centric); UI naming still TBD
## Prompt and Knowledge Section
- System prompt to be the primary, near-only visible element
- Opening message and failure message collapsed or moved behind a button (greeting configuration)
- Knowledge base, MCP servers, and tools unified into one panel
- Each type gets a distinct icon; all added items appear in a single list
- Tooltips replace inline descriptions (e.g., hover on knowledge base icon)
- Overall goal: dramatically reduce visible configuration and buttons
## v3 API and SuperNode Launch (Mid-October)
- Three entities in v3 API: Secret, Agent, Session
- Secrets stored as key-value sets; values never retrievable after save
- Secret sets auto-created under the hood when an agent is configured in Studio
- Agent is fully decoupled from deployment; pipeline, prompt, tools live on the agent
- Session handles deployment via a unified transport field (RPC, telephony, WhatsApp, etc.)
- SuperNode: co-located ASR + LLM + TTS on owned GPU servers, dramatically lower latency
- October launch bundle: new Studio, v3 API, SuperNode
- Launch at an event in China; US East the only supported region at launch
- UI and API terminology to stay in sync (e.g., if UI says pipeline, API says pipeline)
- Full API spec available as downloadable OpenAPI JSON; can be loaded into Claude or ChatGPT for Q&A
## Agent Analytics and Session Monitoring
- Agent page to show real-world performance: call count, session history, trends (week/month over month)
- Structured outputs (variables/analysis) and latency metrics live at agent level
- Session-level detail (individual call analytics) lives in Observer/session history view
- Agents list page: high-level monitoring overview with shortcut to agent detail page
- Analysis section placement (currently under Go Live) still under discussion
## Next Steps
- 
Explore agent creation flow mockups with deployment-type selection upfront (Shakti)
Multiple versions needed; the UX problem is non-trivial and what clicks is unclear.
- 
Redesign Prompt and Knowledge section (Shakti)
System prompt as primary element; collapse opening/failure messages; unify knowledge base, MCP, and tools into one icon-driven panel.
- 
Download and review v3 API OpenAPI spec (Shakti)
Load JSON into Claude or ChatGPT to explore entity relationships before the follow-up call.
- 
Follow-up call after standup to continue design review
Roughly 30 minutes needed to cover remaining open items.
