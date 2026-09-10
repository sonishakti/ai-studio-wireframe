# 04 · Greeting, filler & disclaimer — intake brief (2026-09-10)

Tracker: https://app.clickup.com/t/868m0mejc · status `added` · priority high · estimate 6 d (48 h) ·
design window 2026-09-30 → 2026-10-29 (Oct wave, rides card sort R1 with 02 · 03 · 05).
Feature line: **Tags:** builder · P0-Sep · **UI:** Partial (greeting field exists) · **Locks:** none.

## Scope (from the roadmap tasks, pulled via `clickup_get_task` 2026-09-10)

None of the five tasks carries formal acceptance criteria; each has an *Outcome* + *Scope* pair. Quoted verbatim.

- **868kuj32p** `[O1.1-T1.b] Add greeting and silence-recovery controls` — status **delivered** (Engine).
  Outcome: *"Allow a controlled opening without trapping the session in silence."*
  Scope: *"Add an optional non-interruptible greeting and four-second recovery behavior."*
  → maps to `llm.greeting_configs.interruptable` (v2.7) + `parameters.silence_config` (4000 ms default in #1446).
  Engine shipped it; the Console exposes the silence half (Advanced tab) but not `greeting_configs`.
- **868ker6zx** `Ability to add AI disclaimer in front of the greeting` — status `added` (Kevin Tu).
  Description: *"EU AI Act Article 50 requires that in any call established between a human and an AI agent,
  that there be an indication at the beginning of the call that the agent is an AI agent."* No field, no owner team.
- **868kuj31y** `[O1.2-T1.b] Add multi-turn context to generated filler words` (tracker calls it "context and persona")
  — status **in version**. Outcome: *"Generated filler fits the active conversation."* Scope: *"Use recent conversation
  context while preserving latency and fallback guardrails."*
- **868kuj327** `[O1.2-T1.d] Continue answers after filler words` — status `added`. Outcome: *"The primary answer
  continues naturally after spoken filler without repeated acknowledgements."* Scope: *"Add answer continuation,
  online quality metrics, and reusable density and fallback guardrails."*
- **868kewaqq** `[O1.2-T1.c] Add filler words during tool execution` — status `added`. Outcome: *"Agents fill long
  tool-execution silence without obscuring the tool result."* Scope: *"Align filler timing, interruption,
  cancellation, and continuation with HTTP tool execution."*

Roadmap PRD (2026-07-09) row **C4 Dynamic Filler Words** — Retain · P2 · *"✗ / —"* · *"Masks LLM latency → feels
responsive."* · *"Engine; filler injection during model wait."* Line 47: *Deployment owns prompt + greeting.*

## What the Console has today (ng-console `.worktrees/rebase`, read-only)

**Prompt tab — `src/components/console/agent-editor-workspace.tsx`**
- `AgentPromptForm` :806–930. Stacked sections: System prompt (required, `isAgentSystemPromptMissing`, `{{var}}`
  editor, char-count badge) → **Greeting** :888–905 → **Failure message** :907–927.
- Greeting section = `h2` "Greeting" + line *"First assistant message before the live exchange starts."* + a
  single-line `Input` whose `aria-label` is **"First message"** (i18n `pages.agents.builder.firstMessage`) — heading
  and accessible name disagree. No `{{var}}` editor on the greeting although `llm.template_variables` applies to it.
- Quick-test gate :1234–1236: `if (!draft.greeting.trim()) return t("previewNeedsFirstMessage")` → *"Add a first
  message before preview."* **An empty greeting (= caller speaks first) cannot be previewed.**
- Preview mock :1165–1170 renders `Caller: "Can you help me understand the next step?"` **then** `Agent: {greeting}` —
  the order is the reverse of what the Engine does (agent greets on join). Honesty-floor bug.
- `DEFAULT_DRAFT.greeting` :177 = `"Thanks for calling. I can help with that."`; `failureMessage` :176 =
  `"Please hold on a second."` (hardcoded English in tsx).

**Prompt tab mount — `src/components/console/agent-detail-page.tsx`**
- :266–270 `greetingValue = (mllmEnabled ? mllm.greeting_message : undefined) ?? builder.greeting ?? "Thanks for
  calling. I can help with that."` → an agent with **no** greeting shows (and on next edit saves) the default;
  only an explicit `""` survives. Write path :473–505: MLLM → `mllm.greeting_message`, else → draft `greeting`.
- :640–650 mounts `<AgentPromptForm showName={false} variant="flush">` under a static `{{}}` variables note.
  `AgentPromptForm` is also mounted in the create flow at `agent-editor-workspace.tsx` :717 — one component, two hosts.

**Advanced tab — `src/components/console/agent-config-drawer.tsx` (`AdvancedSharedSection` :458)**
- **Filler Words** row :1049–1098. Title "Filler Words", description *"Natural filler phrases while the agent
  processes a response."*, switch → `filler_words.enable`. Body: `TextField` **"Filler content"** (comma list →
  `content.static_config.phrases`), `NumberField` **"Response Wait Threshold (ms)"** min 0 · max 10000 · step 100 ·
  default 1500 → `trigger.fixed_time_config.response_wait_ms` (contract minimum is 100 — UI allows 0), `SelectField`
  **"Selection Rule"** `shuffle | round_robin` → `content.static_config.selection_rule`. Labels are API words.
- **Silent reminder** row :1145–1199 (PR #1446, Hariharan G, Sept 9). Description *"Prompt inactive users after a
  period of silence. Does not apply to realtime (MLLM) agents."* Switch on → `{timeoutMs: 4000, action: "speak",
  content: "Are you still there?"}` (:1156–1160, English literal in tsx), off → `{timeoutMs: 0}`. Body: "Reminder
  timeout (ms)" 1–60000 + *"Enter 1–60,000 ms. Turning the reminder off sets the timeout to 0."* · "Reminder action"
  speak/think + *"Speak announces the message using TTS. Think sends it to the LLM as context."* · "Reminder message"
  (required).
- **`AdvancedRow`** primitive :1233–1330: `Separator` · chevron `Button size="icon-xs"` · title + one-line
  description · right `Switch size="sm"`; when `switchDisabled && switchDisabledTooltip` the switch is wrapped in
  `Tooltip … side="left"` (:1312–1320) · body `pl-9 pt-2.5`. **This is the grammar for inert "Requires Engine" rows.**

**Data layer — `src/lib/agents/orchestration-properties.ts`**
- Read :63–67: `failureMessage ← llm.failure_message ?? parameters.failure_message`; `greeting ←
  llm.greeting_message ?? parameters.greeting`; `fillerWords ← readFillerWordsDraft(properties.filler_words)` :45.
- `patchFillerWords` :201–257 normalises legacy shapes (`enabled`, string `content`, `duration_ms`, `mode:
  "sequential" → round_robin`), forces `trigger.mode = "fixed_time"`, `content.mode = "static"`, `response_wait_ms`
  default 1500, and — from **d73125ed** — fills `DEFAULT_FILLER_WORD_PHRASES = ["Please wait.", "Okay.", "Uh-huh."]`
  when enabled with an empty list.
- Write: `llm.greeting_message` :443–445, `llm.failure_message` :446–448, `mllm.greeting_message` :575–577; legacy
  `parameters.greeting` / `parameters.failure_message` deleted :613–618; `parameters.silence_config` via
  `patchSilenceConfig` :642–672 (read :403–407).
- **Not present anywhere in `src/`** (grep 2026-09-10): `greeting_configs`, `greeting_audio_url`, `interruptable`,
  `template_variables`. The Console reads/writes only `greeting_message` + `failure_message`.

**Validation**
- `src/lib/agents/agent-validation.ts` (created in **d73125ed** "Fix agent prompt validation and filler defaults
  (#923)", czhen, Jul 16, 13 files): `isAgentSystemPromptMissing` :60, `readAgentSystemPrompt` :83 (MLLM →
  `mllm.params.instructions`, xAI → `mllm.messages[role=system]`). Nothing validates greeting or filler shape;
  the same commit added i18n `systemPromptRequired: "System prompt is required."`.
- `src/lib/agents/studio-conversation-contract.ts` :21–66 retires `silence_timeout`, `llm.silence_message`,
  `advanced_features.enable_mllm`; validates `silence_config.timeout_ms` integer 0–60000, `content` required when
  > 0, `action ∈ speak|think`.

**Test rail** — `agent-preview-surface.tsx` :51–63 `ControlledLivePreview = { startPreview, stopPreview,
transcript, events, previewStatus, agentState, remoteAudioLevel … }` from `src/lib/playground/use-agent-live-preview.ts`.
A preview starts a real agent, so **the real greeting already plays on Talk**. The only standalone audio primitive is
`new Audio(sampleUrl)` in `studio-voice-library-dialog.tsx` :126 (voice samples).

**Installed SDK `agora-agents@2.4.0`** — `api/types/Llm.d.ts` :27–41 types `greeting_message`, `greeting_audio_url`,
`failure_message`, `template_variables: Record<string,string>`, and `greeting_configs` with **only**
`audio_download_timeout_ms · audio_pcm_sample_rate · uninterruptible_asr_policy (merge_reply | context)` plus
`[key: string]: any`. `mode`, `delay_ms`, `interruptable` are documented (release notes) but untyped in 2.4.0 —
they pass through the index signature.

## Already decided (don't re-litigate)

- **Ethics (LEARNINGS §6):** *"AI disclosure: recommend opt-in default (EU AI Act trajectory makes this required
  ground)"*; *"surface disclosure / consent / moderation affordances so users can treat their users ethically"*.
  Watchlist: **Prechecked Consent** ("GDPR direct conflict") and **Undisclosed AI Decisions** ("Studio is the AI
  surface — disclosure is load-bearing"). `measurement-framework.md` :263: *"If we ever optimize for higher
  disclosure-skip-rate, we have crossed a line."* → the disclosure switch is the **builder's** choice; it is never a
  pre-checked consent for the end user, and no metric rewards turning it off.
- **Voice (§11):** Honest · Direct · Calm · Confident. Specific over vague; present-tense active; no softening
  adverbs; no fake friendliness. Error = recovery in the same line.
- **§20 2026-07-08:** *"sequential fields are never column-split (… stacks system prompt → greeting → …)"*;
  *"one greeting, one home"*; *"guidance sits where the action happens"*.
- **§20 2026-07-29 v7 Plain Form:** one flat form, hairline rows, no cards-in-cards, no badge pills, helper prose
  only where the field name can't carry meaning, background knowledge behind InfoHint/tooltip; honesty floor
  (simulated-preview disclosures) is never trimmed. **v8:** Test Strip is the one test entry; folded rows recap
  their values inline.
- **Facts sheet:** Console rows = `AdvancedRow` grammar; copy discipline (propose the exact string set); fieldless
  draft state lives in `sessionStorage` per agent, never in `properties`; prototype pattern = `src/lib/agents/<f>.ts`
  + `src/components/console/<f>.tsx` + ≤8-line mount + `pages.<page>.<f>.*`.

## Agora fact-check (field paths + URLs)

| Primitive | Path | Source / quote |
|---|---|---|
| Greeting text | `llm.greeting_message` (MLLM: `mllm.greeting_message`) | SDK `Llm.d.ts` :28 "Agent greeting." Join doc: *"If provided, the first user in the channel is automatically greeted with this message upon joining."* → not provided = **caller speaks first** (documented behaviour, no field). https://docs.agora.io/en/conversational-ai/rest-api/agent/join |
| Pre-recorded greeting | `llm.greeting_audio_url` | Release notes v2.9 (Jul 1 2026): *"greeting_audio_url to the URL of an mp3, wav, or pcm file"*; *"greeting_message is now required as a fallback when greeting_audio_url is configured."* https://docs.agora.io/en/ai/release-notes |
| Greeting mode | `llm.greeting_configs.mode` = `single_every \| single_first` | v2.2 (Dec 15 2025): *"single_first: The agent broadcasts a greeting only when the first user joins a channel."* |
| Greeting delay | `llm.greeting_configs.delay_ms` | v2.7: *"The delay in milliseconds before the agent plays the greeting message after a user joins the channel."* |
| Greeting interruptible | `llm.greeting_configs.interruptable` | v2.7 (May 20 2026): *"controls whether user speech can interrupt a greeting during playback"*; `false` = *"Uninterruptible. The greeting plays in its entirety"*; `true` follows the global interruption settings. |
| Uninterruptible ASR policy | `llm.greeting_configs.uninterruptible_asr_policy` = `merge_reply \| context` | SDK `Llm.d.ts` :68–69. |
| Audio greeting tuning | `greeting_configs.audio_download_timeout_ms`, `audio_pcm_sample_rate` | v2.9. |
| Variables in greeting | `llm.template_variables{}` → `{{var}}` | v2.1 (Dec 5 2025): variables *"in greeting_message and other text fields"*. |
| Failure message | `llm.failure_message` | SDK :31 "Prompt for agent activation failure." |
| Filler words | `filler_words.enable`; `trigger.mode = "fixed_time"`; `trigger.fixed_time_config.response_wait_ms` (100–10000); `content.mode = "static"`; `content.static_config.phrases` (≤100 × ≤50 words); `content.static_config.selection_rule` = `shuffle \| round_robin` | Doc: *"Filler words address this by playing short phrases while the agent waits for the LLM to generate a response."* · *"When the agent invokes tools through MCP servers, response times can increase significantly. Filler words bridge this gap while the agent waits for tool results."* · *"Start with a response_wait_ms of 1500 ms and adjust based on your LLM's typical response time."* · Tone: *"For customer support agents, use reassuring phrases like 'Let me look into that for you.' For casual assistants, use informal phrases like 'Hmm, one sec.'"* · Samples: "Let me look into that", "One moment, please", "Sure, give me a second", "Hmmm, let me check". SDK: `shuffle` = *"Already-used filler words are not repeated until all have been used once."* https://docs.agora.io/en/ai/build/shape-the-conversation/filler-words |
| Silence recovery | `parameters.silence_config.{timeout_ms (0 off, (0, 60000]), action speak \| think, content}` | SDK `StartAgentsRequest.d.ts` :680–700: *"Settings related to agent silence behavior. Does not apply when you integrate a mllm."* · `speak`: *"Uses the TTS module to announce the silent prompt"*; `think`: *"Appends the silent prompt to the context and passes it to the LLM."* v1.5 (Jun 9 2025). `llm.silence_message` / `silence_timeout` deleted (v2.5, retired by ng-console validator). |

**Discrepancy to flag:** release note v2.4 (Feb 2 2026) says filler can *"insert pre-set or LLM-generated filler
phrases"*, but the SDK 2.4.0 and the filler-words doc expose only `content.mode: "static"`. Treat generated filler as
unavailable until a `content.mode` value exists.

**Engine gaps — design against the ticket, label "Requires Engine (<ticket>)":**
- AI disclaimer as a field — **none**. The only real write today is **prefixing the greeting text** (868ker6zx).
- Context/persona-aware filler — `content.mode` has no generated option → Requires Engine (868kuj31y, in version).
- Continue the answer after a filler — Requires Engine (868kuj327).
- Tool-execution-specific filler — today's fillers already bridge MCP waits (doc above); per-tool timing/cancel is
  Requires Engine (868kewaqq).
- Reminder max-count (Vapi ×3, Retell ×1) — no `silence_config` field; not on the roadmap → observation only.

**EU AI Act, Article 50(1)** (https://artificialintelligenceact.eu/article/50/ — in force since **2 August 2026**
per Article 113, i.e. already binding on the day of this brief): *"Providers shall ensure that AI systems intended to
interact directly with natural persons are designed and developed in such a way that the natural persons concerned
are informed that they are interacting with an AI system, unless this is obvious from the point of view of a natural
person who is reasonably well-informed, observant and circumspect, taking into account the circumstances and the
context of use."*

## Competitor evidence (public docs, fetched 2026-09-10)

- **Vapi** — `firstMessageMode` default `assistant-speaks-first`; also `assistant-waits-for-user` and
  `assistant-speaks-first-with-model-generated-message` (*"when the introduction should adapt to the preceding
  conversation"*). https://docs.vapi.ai/calls/assistant-based-warm-transfer (the Create Assistant reference exceeds
  10 MB and could not be fetched). Idle messages: *"Idle messages automatically prompt users during periods of
  inactivity to maintain engagement and reduce call abandonment."* `timeoutSeconds` 7.5 (1–1000) · `triggerMaxCount`
  3 (1–10) · `triggerResetMode` never | onUserSpeech; samples "Are you still there?", "Can I help you with anything
  else?", "I'm here whenever you're ready to continue." https://docs.vapi.ai/assistants/idle-messages. Quickstart
  first message "Hello! How can I help you today?" https://docs.vapi.ai/assistants/quickstart
- **Retell** — Welcome message is a radio: **"User speaks first"** → *"the agent stays silent until the caller says
  something."*; **"AI speaks first"** → "Dynamic message" *"the agent generates its own opener each call, based on
  your prompt."* or "Custom message" *"the agent reads a fixed message you type in the field below."*; *"Pause Before
  Speaking appears beside the setting"*. https://docs.retellai.com/build/single-multi-prompt/configure-basic-settings.
  API: `begin_message_delay_ms` [0, 5000] *"Only applicable when agent speaks first."*; `reminder_trigger_ms` default
  10000; `reminder_max_count` default 1; `enable_backchannel` (*"yeah", "uh-huh"*) + `backchannel_frequency` 0.8;
  `end_call_after_silence_ms` default 600000. https://docs.retellai.com/api-references/create-agent
- **ElevenLabs** — *"This is the first message the assistant will speak out loud when a user starts a
  conversation."* Example: *"Hi, this is Alexis from <company name> support. How can I help you today?"* — a
  human-sounding name, **no AI mention** (the pattern to avoid). Dynamic vars: *"Hi {{user_name}}"*.
  https://elevenlabs.io/docs/eleven-agents/quickstart ·
  https://elevenlabs.io/docs/agents-platform/customization/personalization/dynamic-variables
  (`…/customization/first-message` returns 404; no disclosure guidance found in the public docs.)
- **Bland** — `first_sentence` *"Makes your agent say a specific phrase or sentence for it's first response."*;
  `wait_for_greeting` default false: *"By default, the agent starts talking as soon as the call connects. When
  wait_for_greeting is set to true, the agent will wait for the call recipient to speak first before responding."*;
  `block_interruptions`; `guard_rails` **`tcpa:ai_disclosure`** — *"AI must disclose it's an AI"* with a time window
  (default 30 s). https://docs.bland.ai/api-v1/post/calls

**Patterns to take**
1. **Who speaks first is one explicit control** (Vapi enum · Retell radio · Bland boolean) — never "leave the field
   blank". Agora's "empty greeting" behaviour needs the same explicit control.
2. **Timing + interruptibility sit beside the greeting** (Retell "Pause Before Speaking" / `begin_message_delay_ms`,
   Bland `block_interruptions`) — Agora has `delay_ms` + `interruptable` for exactly this.
3. **The reminder is sentence-shaped with a cap** (Vapi 7.5 s × 3; Retell 10 s × 1) — Agora has timeout + message,
   no cap.
4. **Nobody puts disclosure in the greeting UI.** Bland enforces it as a guardrail check; ElevenLabs' example opener
   hides the AI behind a human name. **Whitespace:** Agora can ship the compliant default in the builder.
5. **Model-generated opener** (Vapi, Retell "Dynamic message") — Agora has none; not on the roadmap → note only.

## What we need (user-visible)

1. One explicit **who-speaks-first** choice next to the greeting, with the caller-first state previewable.
2. An **AI disclosure** the builder turns on (recommended ON for new agents), with the exact composed opening shown
   so nothing is hidden — written as a prefix to `greeting_message` until Engine has a field.
3. The **greeting's interruptibility** (`greeting_configs.interruptable`) reachable from the greeting, not JSON.
4. The **silence recovery** state visible where the opening is authored (recap of #1446, single home stays Advanced).
5. **Filler words in user words** on Advanced, with the three Engine follow-ups named and inert ("Requires Engine").
6. A way to **hear the opening** with the agent's voice before go-live, from the Test rail.

## Tech requirements

- Composition must **round-trip**: `split(compose(d, g)) === {d, g}` for every stored disclosure sentence; toggling
  off removes exactly the prefix; a greeting that no longer starts with a known sentence reads as disclosure off.
- Disclosure sentence and Engine-row drafts live in `sessionStorage` (`ng-console.design.04.*:<agentId>`), never in
  `properties`; the composed text is the only thing written to `llm.greeting_message` / `mllm.greeting_message`.
- Caller-first writes `greeting_message: ""` (and keeps `greeting_configs` untouched); the preview gate at
  `agent-editor-workspace.tsx` :1234 must stop blocking on an empty greeting when caller-first is chosen.
- `greeting_configs.interruptable` writes through the `[key: string]: any` index signature (untyped in SDK 2.4.0);
  hide for MLLM (`greeting_configs` is `llm`-only) and hide the silence recap for MLLM (`silence_config` N/A).
- Every string via `pages.agents.opening.*`; the default disclosure sentence is a **locale-keyed** resource, not a
  literal in tsx; today only `en` exists (guard test scans tsx for hardcoded English).
- "Hear the opening" reuses `startPreview`/`stopPreview` + `events`/`transcript` (stop after the first agent turn);
  no new audio primitive; needs mic permission handling identical to Talk.
- Filler UI: raise `NumberField` min from 0 to 100 to match the contract; phrases ≤100, ≤50 words each.

## Open questions for the owner

1. **Default ON for new agents?** Recommended yes (Article 50 is in force). For **existing** agents: show the switch
   off and never rewrite a saved greeting silently — should Go Live's pre-flight carry a warn-only "No AI disclosure"?
2. **Whose words?** Agora-provided default sentence per locale (legal-reviewed, keyed by `asr.params.language`) with
   "Edit", or user-authored only? Recommended: Agora default + Edit. The proposed en sentence is legal copy and needs
   sign-off.
3. **Caller speaks first + disclosure:** Article 50 still applies to the agent's first utterance, but the Engine has no
   "disclose on first reply" hook. Accept the gap, or add a system-prompt instruction as a second write?
4. **Expose `greeting_configs.interruptable` in v1** (one switch), or hold until the SDK types it?
5. **Push Engine for `llm.disclosure_message`** (868ker6zx) so the prefix hack retires — who owns that ticket?
6. Does `custom_settings` (wire allowlist) accept Console-only keys? If yes it replaces `sessionStorage` for the
   disclosure sentence.
