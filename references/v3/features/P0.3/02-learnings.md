# P0.3 Make the conversation feel natural · Learnings

Research phase done 26 Sep (`02-research.md`, 21 shots in `shots/`). Order followed: Refero first (no voice-AI builder indexed), then the archive, then vendor docs; no sign-in. Vapi, Retell, ElevenLabs and LiveKit all Done.

## 1. Group by the signal path, not by feature age

- LiveKit's own docs put turn detection, interruptions and silence handling under one nav section (`shots/livekit-01-turns-overview-docs.png`); Retell keeps Speech, Transcription, Call and Security settings as sibling accordions beside the prompt (`shots/retell-agent-editor.png`).
- Today's sheet is a flat list of four switches (`shots/before-02-advanced-sheet.png`). Listen, Think, Speak is the order the P0.2 logo strip and Custom rows already use, so the same words carry from the preset card into the sheet.
- **Change:** three groups, same order as the strip; each row is a fold whose collapsed line states the current value.

## 2. State the range on the control, not only in the error

- Vapi prints both bounds at the ends of every slider, "5 sec" to "3600 sec", and pairs it with a number field (`shots/vapi-05-call-timeouts.png`, `shots/vapi-05-idle-messages.png`); ElevenLabs writes the bound into the label, "Files kept in memory (max 10)" (`shots/elevenlabs-05-agent-settings.png`).
- The Console ships no slider, and the row says "tooltip, not helper text". **Change:** the (i) beside each label says "Default 320 ms, 120 to 2000", the input carries `min` and `max`, and the error repeats the range in one sentence. No vendor shows the error state itself (research gap 1); ours is original.

## 3. Name the default where Sam reads it

- Retell writes "(default)" on the option label and puts the info icon only on the non-default options (`shots/retell-03-background-noise.png`); Vapi states the default in prose under the field (`shots/vapi-docs-speech-configuration.png`).
- **Change:** selects say "Default" in the tooltip and pre-select it; numbers pre-fill it. The group header's gray tick means "differs from the default", the same meaning as everywhere in the builder, and **Reset** appears only then (no control for what Agora does by default). No vendor offers a reset (gap 2, `shots/refero-fingerprint-01-restore-defaults.jpg` is the closest generic analog); ours is per group, original.

## 4. Realtime hides settings with the reason, never silently

- LiveKit says in one sentence which options do not apply to a realtime model and where to tune instead: "every other field is ignored. Tune interruption on the model itself" (`shots/livekit-03-realtime-interruption-ignored-docs.png`), and disabling interruptions there is a hard error.
- **Change:** on a realtime agent Listen holds one Turn detection row for the model's own detection and one line saying why the cascaded rows are absent; nothing is shown disabled.

## 5. Word-first controls, numbers second

- ElevenLabs offers turn eagerness as patient, normal, eager rather than milliseconds (`shots/elevenlabs-05-conversation-limits.png`); LiveKit argues turn detection by a demo, not by exposed thresholds (`shots/livekit-docs-turn-detector.png`).
- **Change:** the type select (Semantic, Voice activity, Manual) leads each turn row; the millisecond fields sit under it and stay at their defaults for most agents. Interruptions reads "When the person speaks", "On keywords", "Never".

## 6. What we do not copy

- Vapi's per-row icons and paywall crowns (`shots/vapi-assistant-advanced.png`): quiet chrome, no icon per row.
- ElevenLabs' one broad Settings tab mixing chat mode, DTMF and ASR (`shots/elevenlabs-05-agent-settings.png`): no ungrouped list.
- Vendor jargon in labels: VAD, SAL, MLLM, endpointing, TTFB. The API names live in tooltips and read-only rows only.
- A second failure message control: it belongs to Greeting and failure message next to the prompt (P0.4). Advanced points there in one line.
