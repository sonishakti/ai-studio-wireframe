# P0.7 · Check the agent answers as intended — Research

## Rule 0, data first
1. **Does a new logged-in account show this flow's data?** No. A brand-new account has no agent, so there is nothing to
   test. Once an agent exists, `TestPanel` (`src/prototypes/agent-builder-v3/parts/list-and-create.tsx`) only needs the
   agent's own `prompt` to be non-empty — it has no dependency on account age, minutes used, or plan.
2. **Where does the missing evidence exist outside our accounts?** The happy path and most rainy states are already
   documented in this row's `research[]` (Vapi, Retell, ElevenLabs, LiveKit product shots, `research/15-simulations/`).
   The two states the row's `research_brief` calls out as still missing — **test refused for quota or concurrency**
   and **testing with unsaved changes** — are not visible in any signed-in competitor account we hold; Refero supplied
   a generic SaaS "no payment method" gate (Rox) and a generic "unsaved changes" confirm dialog (Acctual) as
   analogous, non-voice patterns. No product research surface shows a voice-test concurrency-limit message
   specifically (see Gaps).
3. **What must exist in our own fixtures?** `SEED_AGENTS` already includes an agent with a filled prompt
   (`agent_payments`, "Payment reminders"), which is enough to reach the panel's one "ready" state today. Nothing else
   in `data.ts` or `store.tsx` models: an agent with unsaved edits, a suspended/no-card account, a concurrency-limit
   response, a start-failure (422/5xx) response, a mid-call tool failure, or a "nothing heard" connection state — all
   six rainy states (P0.7.b–h minus c) have no fixture today, confirmed by reading `TestPanel`'s full source (it
   renders exactly three states: not-ready, idle, live-with-one-greeting-bubble).

## Vendor status

| Vendor | Status | Sources |
|---|---|---|
| Vapi | Done | Existing: `competitors/product/vapi/` (2 shots), `research/15-simulations/02-research/vapi/` (Evals vs Simulations report) |
| Retell | Done | Existing: `competitors/product/retell/retell-agent-editor.png`; `research/15-simulations/02-research/retell/report.md` (docs-only, no dashboard access) |
| ElevenLabs | Done | Existing: `competitors/product/elevenlabs/` (2 shots) |
| LiveKit (indirect) | Done | Existing: `competitors/product/livekit/` (2 shots, Agents Playground / Console) |
| Refero (gap-fill) | Partial | `refero_search_screens` / `refero_search_flows`: Acctual "Unsaved changes" modal, Rox "No Payment Method" modal. No concurrency-limit voice-test pattern found (see Gaps) |

## Shots

| File | Source | Path | Finding | Region (x,y,w,h) |
|---|---|---|---|---|
| `before-01-test-panel-closed-state.png` | browser (our prototype) | happy P0.7.a (today) | The only test surface that exists today is a generic "Test" sheet reached from the agent header, not tied to Save; it just says "Talk to the agent with your microphone." No transcript, no tool marks, no Simulations section nearby. | 2432,0,768,2000 |
| `before-02-test-panel-live-state.png` | browser (our prototype) | happy P0.7.a (today) | Starting a call shows one greeting bubble and a bare "Listening" line — no running transcript, no timer beyond a stopwatch, no tool-call markers, no end-of-call summary. | 2432,0,768,2000 |
| `vapi-07-talk-button-header.png` | existing | happy P0.7.a | Vapi puts **Talk** in the persistent header next to Publish, as a dropdown button, not inside a settings tab — the test entry point survives every tab switch. | 2619,120,149,51 |
| `vapi-08-web-call-room-deleted-error.png` | existing | rainy P0.7.f (session fails to start) | A failed web-call session surfaces three stacked red "Error" toasts ("Exiting meeting because room was deleted") inside the transcript panel itself, not as a full-panel takeover — the transcript area doubles as the error log. | 2395,1520,773,418 |
| `retell-09-test-audio-test-llm-run-test.png` | existing | happy P0.7.a + rainy P0.7.g (tool/feature limit) | Retell splits Test Audio / Test LLM as tabs beside a single "Run Test" call-to-action, and states a hard limit inline above the mic icon ("call transfer is not supported in Webcall") rather than waiting for it to fail mid-call. | 2474,896,694,368 |
| `elevenlabs-10-preview-pane-call-chat-door.png` | existing | happy P0.7.a | ElevenLabs gives one preview pane with a single phone-icon door plus a text composer below it — voice and a text fallback share one surface instead of two separate entry points. | 2352,1232,824,640 |
| `elevenlabs-11-mic-permission-denied.png` | existing | rainy P0.7.c (mic denied) | "Permission denied" renders as plain red text directly under "Call started" in the same transcript column, with a toast duplicate — no inline instructions for re-enabling the mic and no offer of a text-only fallback at the point of denial. | 2560,360,384,56 |
| `livekit-12-start-call-live-preview.png` (indirect) | existing | happy P0.7.a | LiveKit's empty pre-test state reads "Preview your agent — Start a live test call to speak to your agent as you configure and iterate," then one **START CALL** button; the copy explains *why* before the control. | 2160,800,736,248 |
| `livekit-13-console-idle-no-agent.png` (indirect) | existing | rainy P0.7.h (nothing heard / connection state) | The separate "Console" test surface shows a persistent CURRENT STATUS chip (here **IDLE**) beside Start session — LiveKit keeps connection state visible as a label, not just implied by button state, which is the pattern P0.7.h needs for "the panel shows the connection state." | 2368,112,816,64 |
| `refero-acctual-05-unsaved-changes-modal.png` | refero | rainy P0.7.b (unsaved edits) | Acctual's generic pattern: "Unsaved changes — If you close now, the draft will be deleted... Keep editing / Close without saving." Useful as a **contrast**, not a model — P0.7's recovery is silent (save-then-test from `agent_id`), so Sam should never see a confirm dialog at all; this is evidence for what *not* to copy. | 350,195,420,238 |
| `refero-rox-06-no-payment-method-modal.png` | refero | rainy P0.7.d (suspended / minutes used up) | Rox gates a blocked action with a centered "No Payment Method" modal naming the exact blocker and a single "Add Payment Method" primary action, plus Cancel — a plain-language pattern for surfacing `test_refused {reason: suspended}` with "Add card" in place, matching the row's own recovery text. | 314,234,491,159 |

## Per-vendor copy / avoid

**Vapi**
- Copy: Talk lives in the persistent header, always reachable, independent of which settings tab Sam is on.
- Avoid: stacking raw error toasts inside the transcript column with no retry control next to them.

**Retell**
- Copy: naming a hard limitation inline, before Sam hits it ("call transfer is not supported in Webcall"), instead of only failing at the moment it's tried.
- Avoid: splitting Test Audio and Test LLM into separate tabs — P0.7 wants one Talk surface, not a mode picker.

**ElevenLabs**
- Copy: one door for voice with a text composer as a visible fallback on the same pane, not a separate flow.
- Avoid: rendering "Permission denied" as bare red text with no next step or retry affordance.

**LiveKit (indirect)**
- Copy: a persistent, labelled connection-state chip (IDLE / CONNECTING / LIVE) rather than inferring state from button text alone — directly answers P0.7.h's "panel shows the connection state."
- Avoid: LiveKit's empty state duplicates the same message in two places (card body and console banner) once an agent is selected — pick one location.

**Refero (generic SaaS patterns)**
- Copy (Rox): name the exact blocker and give one primary recovery action ("Add Payment Method") plus Cancel — this is the shape for `test_refused {reason: suspended}`.
- Avoid (Acctual): a "keep editing / discard" confirm dialog for unsaved changes — P0.7.b's own recovery is to save silently and test the saved version, so a confirm interrupt would contradict the row's spec.

## Gaps
- **No voice-product evidence for `test_refused {reason: concurrency_limit}`.** Neither the four researched vendors nor
  Refero (searched: "too many concurrent calls," "maximum concurrent sessions reached") show a live-voice-test
  concurrency gate. The build spec will have to design this state from the API shape alone (`test_refused` reason
  enum) rather than porting a seen pattern — flag this as a design decision, not a research citation.
- **Retell's voice-test tabs are docs-only.** `research/15-simulations/02-research/retell/report.md` notes the
  dashboard was never reached this session (drive server was down), so "Test Audio / Test LLM / Run Test" is
  confirmed from `docs.retellai.com` text, not a screenshot of Retell's own UI beyond `retell-agent-editor.png`.
- **No evidence anywhere (vendor or Refero) for a tool/MCP failure marked mid-transcript (P0.7.g's own scenario, as
  opposed to Retell's static pre-call limitation notice).** All four vendors mark tool calls as "completed"; none of
  the captured shots show a failed tool call inline. This state will need to be designed from the event spec
  (`agent_audio_heard`, transcript line marking) without a ported reference.
- **No fixture in the prototype for any of the six missing rainy states** (b, d, e, f, g, h) — `data.ts` has no
  suspended/no-card agent, no forced-concurrency state, and no forced start-failure. The Design/Build phases will
  need new `ProtoSearch` keys (e.g. `test` outcome states) the way `create` already models create-sheet outcomes.
