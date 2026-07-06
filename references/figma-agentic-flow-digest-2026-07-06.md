# Figma digest — "Draft Updated Agentic flow" (Agora Studio X)

File: `Agora-Studio-X` (xaAgeioGlZosBsRquDXLvI), page **Final Designs**, section node `1941-64098`
Theme: StudioX/Dark. 7 frames, each 1440×875. Captured 2026-07-06 from the live Figma file.
This digest is an EXACT transcription — treat copy in quotes as verbatim (including errors).

## What this section is

The draft design for the **agentic flow journey**: first-time-user landing on /agents →
talk to the pre-provisioned agent (Aria) → configure it via a 5-step checklist →
edit agent → deploy. It maps onto the live app `studio_x_2/` (Next.js, mock data),
where a version of this journey already exists (AgentWizard on /agents).

## Shared chrome (all frames)

- Sidebar: agora logo · BUILD (Agents [active], Composer) · OBSERVE (Monitor) ·
  MANAGE (Resources, Realtime Services, Project Settings) · footer: "Search ⌘K" · "My first project"
- Topbar breadcrumb: "My First Project > Agents > Edit Agent >" (trailing chevron; "Edit Agent"
  crumb present EVEN on the first-run landing frames) · right: help ? · bell · "✦ Composer"

## Frame 1 — 01_Landing_First_time_user_experience (BASE, node 1941-64179, X=54)

- Import banner: bold "Coming from Vapi, Retell, Bland or ElevenLabs?" /
  "Import your agent. We will map the voice, prompt, model and tools within seconds." → button "Import Agent"
- H1 "Deploy an AI agent in minutes" · right button "Create New Agent"
- LEFT CARD: purple orb · "Aria" · caption "Ready to deploy" · divider ·
  "⏱ 800ms  $ 0.10/min" · stack line "gpt-4o-mini · nova-2 · turbo · voice_name" ·
  primary white button "🎙 Talk to Aria" · ghost "✎ Edit Aria"
- RIGHT CHECKLIST (5 rows, numbered circles 1–5, each with a trailing settings/slider icon):
  1. "Choose your voice" + chips [gpt-4o-mini] [nova-2] [turbo] [voice_name]
  2. "Choose how it runs" / sub "How your agent connect" + INLINE segmented control [Inbound|Outbound|Code] (Inbound active)
  3. "System Prompt" / sub "Behavior · Connectors" (other frames: "Behavior · Connectors · Knowledge Base")
  4. "Configure" / sub "Attach numbers · Upload caller list"
  5. "Test & Deploy" / sub "Select channels"

## Frame 2 — variant (node 1941-64422): step 1 done

Same as base; step 1 circle = green ✓; steps 2–5 numbered. Aria caption "Ready to deploy".
Breadcrumb here: "My First Project > Agents >" (no Edit Agent).

## Frame 3 — variant (node 1941-64285): voice panel open

Landing dimmed at left; right-side panel (drawer) titled "Choose your voice":
- Two selector cards (radio): "STT-LLM-TTS" (selected) / "MLLM"
- "Speech-to-Text (STT)" dropdown "Deepgram Nova" · "Language" dropdown "English" · slider icon
- "Large Language Model (LLM)" dropdown "Open AI GPT-5 nano" · slider icon
- "Text-to-Speech (TTS)" dropdown "Eleven Labs eleven_flash_v2_5" (in panel variant shown truncated "Eleven Labs eleven_…") · "Voice" dropdown "Blake" · slider icon
NOTE: the "voice" drawer actually configures the whole MODEL STACK.

## Frame 4 — variant (node 1941-66029): all steps ✓, agent LIVE

All 5 rows green ✓. Aria badge now "● Live" (green pill). Breadcrumb: "My First Project > Agents > Edit Agent >".
Everything else identical to base.

## Frame 5 — Edit Agent (node 1941-65712)

- Breadcrumb "My First Project > Agents > Edit Agent >"; H1 "Edit agent"; top-right link "</> Add Custom Config"
- Same left Aria card ("● Live", 800ms · $0.10/min, same stack line, "Talk to Aria", "Edit Aria")
- Same 5 rows but leading icons in circles instead of numbers/checks (waveform, routes, doc, antenna, rocket)
  Row 2 sub: "How your agent connect" + segmented [Inbound|Outbound|Code]
  Row 3 sub: "Behavior · Connectors · Knowledge Base"

## Frame 6 — Exploration (node 1941-64099)

Agent-scoped screen, 3 columns:
- CENTER-LEFT panel: chip "Appointment Reminder" (top center) · silver/grey orb · "Aria" ·
  button "Test Agent" · bottom stats table:
  "LLM  Open AI" / "ASR  DeepGram" / "TTS  ElevenLabs" /
  "AVERAGE END-TO-END LATENCY  500 ms" / "AVERAGE LLM TIME TO FIRST TOKEN  23 ms"
- RIGHT panel: selector cards "STT-LLM-TTS / Configure your STT, LLM and TTS models." (radio, selected)
  vs "MLLM / Configure your MLLM" — then the same STT/LLM/TTS+Voice/Language dropdowns as Frame 3.
- FAR-RIGHT icon rail (vertical): waveform · routes · doc · antenna/broadcast · code </> · rocket

## Frame 7 — 04_Deploy Agent (node 1941-64530)

- Breadcrumb "My First Project > Agents > Edit Agent >"
- Agent bar: "← Aria" then chevron subnav "Stack > Knowledge Base > MCP > Connectors > Deploy >" ·
  right: ⋮ menu · white button "Deploy Agent"
- Meta row: "# agt_2344 ⧉ · $ 0.10/min · ⏱ 800ms" · right link "</> Custom Config"
- 3 intent cards (icon, title, sub, divider, chips):
  1. "Launch batch calls" / "Upload a list of contacts and agent calls each one" → chip "📞 Batch Calling"
  2. "Answer a phone number" / "Agent picks up every inbound call 24x7" → chips "▭ Web Widget" "📞 Phone Number"
  3. "Code" / "Export your agent to any stack" → chips "<> cURL" "<> Python" "<> Node"
- RIGHT rail: chip "Appointment Reminder" · grey orb · "Test Agent" · same stats table as Frame 6
  (LLM Open AI / ASR DeepGram / TTS ElevenLabs / 500 ms / 23 ms)

## Candidate design defects I observed (verify/extend, don't assume complete)

D1. Grammar: "How your agent connect" → "connects" (frames 1,2,4,5).
D2. Unresolved placeholder "voice_name" in stack chips + card stack line (all landing frames) — should be the actual voice (e.g. "Blake").
D3. Latency contradiction on ONE screen: meta "800ms" vs stats "AVERAGE END-TO-END LATENCY 500 ms" (frame 7); landing card also says 800ms while Exploration stats say 500ms.
D4. "AVERAGE LLM TIME TO FIRST TOKEN 23 ms" — implausible; likely meant ~230 ms.
D5. Brand casing: "Open AI" (→OpenAI), "DeepGram" (→Deepgram), "Eleven Labs" (→ElevenLabs) — inconsistent with each other and with chips elsewhere.
D6. Breadcrumb shows "Edit Agent" on FIRST-RUN landing frames (1941-64179 base? confirmed on 64179+66029) + trailing chevron after last crumb.
D7. "24x7" → "24/7".
D8. Identity conflict: chip "Appointment Reminder" above an orb named "Aria" (frames 6,7) — reads as a different agent; presumably the ROLE. Needs a label pattern (e.g. subtitle under name).
D9. Deploy subnav uses chevrons (Stack > Knowledge Base > MCP > Connectors > Deploy) implying hierarchy/sequence for what are peer tabs; "Deploy" tab coexists with "Deploy Agent" button (duplicate affordance).
D10. "Web Widget" chip under "Answer a phone number" — a web widget doesn't answer phone calls; channel conflation (inbound-phone vs web are different intents).
D11. Step 1 titled "Choose your voice" but its chips are MODELS (gpt-4o-mini = LLM, nova-2 = STT, turbo = ?) and its drawer configures the full STT/LLM/TTS stack — title/content mismatch.
D12. Title-case inconsistency: "System Prompt" vs sentence-case elsewhere ("Edit agent", "Choose your voice").
D13. Step 5 "Test & Deploy — Select channels": testing is already on the left card ("Talk to Aria") — duplicate test affordance; the app already renamed Step 5 to "Deploy" (commit 17fd266) with testing on the card.
D14. "$ 0.10/min" (space after $) vs "$0.10/min" elsewhere.
D15. Frame 1 row 3 sub omits "Knowledge Base" while frames 4/5 include it — inconsistent.
D16. In frame 7 the orb is grey/silver; landing frames purple. If grey = "test/preview mode", it's an unexplained state change.

## Current app state (studio_x_2 — live canonical app)

- `/agents` = builder landing (AgentWizard, `landing` prop) with AgentIdentityCard (orb, name,
  status badge, stack line, $/min, latency w/ expandable ASR/LLM/TTS breakdown, Talk button),
  import banner ("Already have an agent elsewhere? … Import your agent"), heading
  "Deploy an AI agent in minutes", "View all agents" + "Create new agent" buttons.
- STEP_TITLES: "Choose your voice / Select agent type / System prompt / Configure / Deploy".
  Rows open right-side Sheet drawers (`?step=N` deep links); completion = ✓; sticky
  "N of 5 complete" + Deploy bar; publish gated by hints not locks.
- Step 1 drawer = voice PERSONA picker (preset/custom artifacts + playground links) — NOT the
  model-stack config in the design. Stack (STT/LLM/TTS) exists in data (`lib/campaign-data.ts`:
  STACK_PRESETS/stackSummary/stackEstimate/stackLatencyBreakdown) but has no editing UI in the wizard.
- Step 2 = inbound/outbound/code with data-loss stash/undo. Step 3 = prompt+knowledge+MCP.
  Step 4 = channel config. Step 5 = read-only summary + Deploy CTA.
- `/agents?view=list` = returning-user table (search/status filter/pagination, stack badge, channel).
- `/agents/[id]/edit` = same wizard in edit mode; `/agents/playground` = voice playground;
  `/agents/[id]/test` exists. NO agent-scoped deploy-hub screen like frame 7 (deploy intent
  cards live in Step 4/5 drawers + /deploy elsewhere); NO chevron subnav (by design — app uses drawers).
- Templates sheet exists on the list view ("Appointment Reminder" is a TEMPLATE name there —
  explains D8's chip).

## North-star context (from repo docs)

Signup → first live deployment carrying traffic → first paid usage. Aria is auto-provisioned
and LIVE on signup; first-run = talk-to-it → put-it-to-work. Don't reintroduce a
build-an-agent-first wall. Step 5 is "Deploy" (not "Test & Deploy") per explicit user direction.
