# Real time agent preview and A/B testing configuration

## Real-Time Agent Preview
- Real-time panel should include a Talk to Agent bubble for live testing
- Lets users replicate surprising session scenarios on the spot
- Useful for testing without leaving the agent view
## A/B Testing (Future Scope)
- A/B testing flagged as a future feature, not v3 scope
- Core concept: deploy prompt changes to a % of users, compare metrics vs. original
- Likely implemented at deployment level, not agent level
- Session overrides also need flagging in analytics
- If a session overrides system prompt, LLM, ASR, or TTS, metrics should not be aggregated with default sessions
- Users should be able to filter/dice metrics by override type
- Shape of solution deferred to a second-pass call
## Session History and Monitoring
- Session history and call history to be combined into one unified view
- Backlinks required: session  agent real-time view, and agent view  session
- Each session card needs to be modality-aware:
- Current card is telephony-specific (from/to, campaign, etc.)
- Need custom cards for: RPC, telephony, and WhatsApp (TBD)
- Common fields across cards: transcript, structured output, events, logs/diagnostics
- Modality-specific fields (e.g. SIP) to be determined
- Omnichannel axes to represent:
- Inbound / outbound / code
- RTC / telephony / WhatsApp (more modalities coming)
- Configurable columns: users set their own output metrics (e.g. call sold a car vs. sentiment)
- Deferred for now; core requirement is agent column with backlink
## Agent Monitoring Tabs and Error Logs
- Two tabs on the agent real-time page:
- Analytics: visual, aggregated session performance metrics
- Logs and diagnostics: error-level detail, technical logs
- Error logs already exist via RTM (Real-Time Messaging) SDK; just need UI wiring
- Top-level error/warning badge on agent: e.g. 2 errors, 3 warnings
- Metrics should be filterable and time-synced: changing date range updates both sessions list and metrics
- Reference platforms for design inspiration: Datadog, Referral (for log/filter UX patterns)
## Data Policy, Resources Page, and API Parity
- Data retention: currently two options only, zero or 30 days
- Zero retention: session history shows call occurred and cost, no transcript/audio/events
- Granular retention (1 day, 7 days, etc.) is future scope
- Not compliance-related; purely a storage/cost decision
- Design needed for both states: data present vs. no data (mirrors empty/first-time user state)
- Resources page (now called Transports) needs to scale for new channel types
- Phone number = transport identifier; telephony = transport type
- WhatsApp credentials and other transports coming; needs a scalable home in the UI
- Secrets replacing credentials (BYOK flow):
- Flexible key naming: users define key names per vendor (e.g. Agora needs customer ID + customer secret)
- Secret set structure: top-level key  set ID  secret ID
- Pricing change (not yet public): 5/min managed stack, lower if BYOK keys provided
- API parity requirement: UI and API must be 1:1 for Start a Session and Create an Agent
- Use AI/Claude Code to diff current UI fields against API spec and surface gaps
- Features like dynamic context injection are intentionally outside Studio scope
## Next Steps
- 
Send scope-of-work breakdown to Vineet and Samyak (Shakti)
List all pages and updates needed, with approximate days per item and review sessions factored in. Send first thing tomorrow morning.
- 
Show revamped agent builder next week (Shakti)
Target early next week; monitoring section will take longer given the depth of revamping required.
- 
Run API spec diff against current UI (Shakti)
Use AI agent to check "Start a Session" and "Create an Agent" for field-level parity gaps.
- 
Design session cards for RPC, telephony, and WhatsApp modalities (Shakti)
Identify common fields and modality-specific fields; WhatsApp fields are TBD, so note intent without finalizing.
- 
Provision a log display area in the agent UI (Shakti)
Vineet to confirm which logs currently exist via RTM; Shakti to design where and how they surface.
