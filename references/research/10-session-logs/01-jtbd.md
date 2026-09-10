# 10 · JTBD + success metric

**JTBD.** When a call went wrong and I'm looking at it after the fact *(situation)*, I want to hear and read
exactly what happened, turn by turn *(motivation)*, so I can name the cause and change the agent instead of
guessing *(outcome)*.

**Personas.**
- **P1 builder, 9 pm, one bad call.** Has a call ID from a complaint. Wants to jump to the moment it broke,
  hear it, see why the agent stopped (interrupted? ignored? error?), and open the setting that caused it.
  Reads the transcript first, listens second — only to the 10 seconds that matter.
- **P2 support lead, 20 calls a day.** Never listens end-to-end. Scans transcripts, needs the failure marked,
  a link to paste into a ticket, and a download for the record. Shares, doesn't fix.

**Success event (activation-linked).** `call_replayed` already exists in the taxonomy
(`references/event-taxonomy-review.md`, ITERATION cluster: *"user opened a specific call playback or
transcript"*). Sharpen it: fire on first play **or** first click-to-seek. Add `transcript_seeked` (a line was
clicked while a recording is loaded — proves alignment is used, not just shown) and `session_link_copied`
(P2's job). Counter-metric: `transcript_seeked` with no playback within 10 s → alignment is wrong, not used.
North-star link: Retain — replay → `agent_edited_after_production` → `agent_redeployed` keeps a live deployment
carrying traffic. Rejected: time on page, DAU, listen-through rate.

**Agora primitives.** `GET …/agents/{agentId}/history` → `contents[].{role, content, speech_start_ms,
speech_end_ms, speech_algorithmic_delay}` (v2.8; timestamps only when `llm.vendor='custom'`; running agent
only — post-call via webhook `103 agent history`) · `GET …/agents/{agentId}/turns` (v2.5; 7-day window) →
`turn_id, start.{start_at, type}, end.{end_at, type, metadata.caused_by | reason}, metrics.segmented_latency_ms`
· `sal.sal_mode=recognition` (speaker identity, Engine) · `parameters.opt_out` (retention) · telephony
`callInfo.{recordFileUrl, transcript}` + binding `enable_recording / enable_transcript` · Cloud Recording
individual mode for web/RTC sessions. Not in the contract: payloads, per-word timing, speaker labels beyond
user/assistant — see `00-brief.md` fact-check table.
