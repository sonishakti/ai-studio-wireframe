# P0.4 Tell the agent its job · Directions

Track: **v3**. Constraints: extend `PromptEditor` and `GreetingSheet`, do not redraw; existing design system only; one door per action (team ask 9: greeting and failure message behind the one door next to the system prompt); empty first, quiet chrome; tooltip, not helper text (requirement 11); prompt first (requirements 9, 40); locked words (session, test, run); P0.3's Advanced sheet holds nothing of this and points here.

## Three directions

### 1. One row, one door, grown to the API (the extension)
Keep the System prompt row as it is: the textarea first, the Variables line and the one ghost door under it. Give the row a draft with **Cancel** · **Save** · **Save and test** in its footer once it is dirty (the Voice & models footer plus P0.3's third button) and a footer reason line when Save is off. While the editor is empty a **Use the starter prompt** link sits beside the door. Each chip opens a `Popover` with one Default field, and the greeting's variables join the line. The sheet behind the door grows to the API: Who speaks first (inbound, batch), Greeting, Delay, When it plays (code only), Failure message with the honest (i) and **Use a suggested line**; footer **Cancel** · **Save** · **Save and test**; P0.3's guard on close. The test panel asks once for values the agent lacks. The header **Test** saves a dirty prompt first.
Research: today's row and sheet (`shots/before-01-system-prompt-row.png`, `shots/before-02-greeting-sheet-open.png`), ElevenLabs's empty-state line (`shots/elevenlabs-agent-agent.png`), LiveKit's variable insertion (`shots/livekit-19-agent-builder-conversation.png`), our own Failure message under Opening (`shots/05-silence-recap.png`).

### 2. Greeting and failure message inline under the prompt (the vendor pattern)
No sheet. The row grows a Greeting group and a Failure message group under the textarea, the way Vapi, Retell, ElevenLabs and LiveKit put the first message beside the prompt, and the way the live Console's Opening section does today. Who speaks first, the text, Delay and When it plays all sit in the row. But the row becomes four groups tall for every agent, so the prompt loses the fold and the KPI's first edit moves down the page; the failure message, a field most agents never touch, sits in the first fold; and the 2026-09-24 team review already moved this content behind one door (ask 9), so the direction reverses a decision.
Research: Vapi's First Message above the prompt (`shots/vapi-assistant-model.png`), Retell's Welcome Message with "Pause Before Speaking" (`shots/retell-agent-editor.png`), LiveKit's Welcome message with its interrupt checkbox (`shots/livekit-19-agent-builder-conversation.png`).

### 3. A prompt page with a side column (ElevenLabs's Agent page)
The System prompt row becomes a full-height editor with a right column holding the greeting, the failure message and a variables table with defaults, and a Save at the top. The prompt gets the most room of any direction and variables become a proper table. But it is a new surface with no sibling in DESIGN.md, it breaks concept A's row grid (Voice & models above, Knowledge and tools and Analysis below lose their place), the rail's `section=` model has no page to scroll to, and the side column repeats the sheet's content in a second home.
Research: ElevenLabs's Agent page with its right test rail (`shots/elevenlabs-agent-agent.png`).

## Audit

Scored 1 to 5 (5 best).

| Criterion | 1 One row, one door | 2 Inline groups | 3 Prompt page |
|---|---|---|---|
| Extend, do not redraw | 5 | 3 | 1 |
| Prompt first, above the fold (KPI) | 5 | 2 | 4 |
| One door per action (ask 9) | 5 | 2 | 3 |
| Empty first, quiet chrome | 5 | 2 | 3 |
| Rainy .b to .f in one place | 5 | 4 | 3 |
| Touches P0.1 to P0.3 (in review) | 5 (none) | 4 | 2 |
| API fit (draft PATCH of edited fields, `greeting: null`) | 5 | 4 | 4 |
| **Total / 35** | **35** | **21** | **20** |

Cut: 2 reverses the team's one-door decision and pushes the prompt down for every agent; 3 is a new surface with no sibling and a second home for the greeting.

## Pick: direction 1, one row, one door, grown to the API

1. **The row is already right; it lacked a save.** Today's row puts the prompt first with chips and one door (`shots/before-01-system-prompt-row.png`); giving it a draft with **Save and test** creates the `agent_updated` the KPI measures and ties `prompt_edited` to `agent_audio_heard` for the churn counter, with no new surface.
2. **Prompt first keeps the fold.** Vapi's First Message pushes the prompt below the fold (`shots/vapi-assistant-model.png`); Retell, ElevenLabs and LiveKit lead with the prompt. The textarea stays the only control above the fold, so the first edit is the first thing Sam can do.
3. **Empty means something, and the field says it.** ElevenLabs states "If empty, the agent will wait" under First message (`shots/elevenlabs-agent-agent.png`); the (i) on Failure message says the agent stays silent, in the API's own words, and caller first shows "No greeting. The agent waits for the caller." ported from the live Console.
4. **One click to a failure line, not three.** ElevenLabs's only failure field is three clicks deep behind an alpha toggle (`shots/elevenlabs-docs-01-soft-timeout-failure-message.png`); ours keeps the field one door away and adds **Use a suggested line** so .d is one click.
5. **The chip is the door to its default.** LiveKit and ElevenLabs insert variables but hold no defaults (`shots/livekit-19-agent-builder-conversation.png`); the chip Sam already sees opens the one field the API's `variables` map needs, and a missing default is normal: the test asks once, a run fills it from the list.

## Questions for the owner (max 3)

1. **Starter prompt.** The PRD's ".b restores the preset prompt" is read as a Studio starter per deployment type (three to four sentences, no company name) offered by one link while the editor is empty, never inserted by itself. Keep it, or drop the link and let .b's one action be Cancel?
2. **When it plays on telephony.** `greeting.on` (every join or first join) is shown on code agents only and omitted for inbound and batch, since a phone session has one join. Agree, or show it on every type as today?
3. **AI disclosure.** The live Console composes "You're talking to an AI assistant." into the greeting behind a switch; the v3 API has no field for it. This row leaves it out of the sheet. Add it back as a sentence folded into `greeting.text` (Studio-only), or leave it to a later row?
