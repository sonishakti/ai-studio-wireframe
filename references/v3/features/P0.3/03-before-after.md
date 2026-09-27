# P0.3 Make the conversation feel natural · Before and after

Track: **v3**, in the existing Console design system. Before shots captured 26 Sep 2026 at 1600 x 1000, scale 2, dark, from the P0.2 preview `https://ng-console-8vizr1ga3-agoraio.vercel.app/v3?concept=a`, agent Renewal survey.

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-voice-models-row.png` | `…&agent=agent_survey&section=voice-models` | Voice & models after P0.2; "Advanced settings" is a lone ghost button at the bottom of the Agent tab, under Analysis |
| `shots/before-02-advanced-sheet.png` | same, sheet open | Today's Advanced settings sheet |

## Before · Concept A after P0.2 (87f05b3f)

The sheet (`AdvancedSheet` in `src/prototypes/agent-builder-v3/parts/model.tsx`) holds one "Conversation" block with four rows, End of turn, Interruptions, Silence reminder, Filler words, then a "Provider keys" block, and a **Done** footer.

What is wrong, against the JTBD and the v3 spec:

1. **Flat and incomplete.** Four controls stand for twenty-odd API fields: no speech threshold, no start of speech, no silence duration or max wait, no keywords, no silence timeout or line, no filler timing or phrases, no history, no skip patterns, no avatar, no endpoint or headers. Requirement 38 asks for every advanced setting restored. (red)
2. **No default, no range.** Nothing says what a field is at or may be. The tooltip explains the concept ("Semantic waits for a finished thought") and stops. (red, .a step 2, .b)
3. **No grouping.** Rows are not Listen, Think, Speak, so they do not match the preset card's strip or Custom's rows. (amber)
4. **No Reset, no guard, no save.** Edits write the store on every change; **Done** only closes. Sam cannot back out of a change, and there is no dirty state to guard. (red, .f, .h)
5. **The door is in the wrong row.** The PRD and the live Console open Advanced from Voice & models; here it is a separate row at the end of the tab. (amber, one door)
6. **Realtime is impossible.** `data.ts` has no pipeline mode; a realtime agent cannot exist, so its settings cannot be honest. (red, .d)
7. **API fields vanish.** An agent made through the API with `llm.style` or `params` shows nothing, and nothing says it is kept. (red, .g)
8. **Silence reminder and filler words are bare switches.** Turning them on sends nothing the API can use: `silence_config` needs a timeout, an action and a line; `filler_words` needs a wait and phrases. (red)
9. **Session settings have no pointer.** Sam looking for idle timeout finds nothing and no hint of where it lives. (amber, .e)
10. **Copy.** "Provider keys" block title; "Semantic" and "Silence" as option names read as jargon; the test panel says "Start test call" and "End call" (call is a never word for session). (amber)

## After

The same right sheet, title **Advanced settings**, opened from the Voice & models footer, ported from the live `AdvancedSharedSection`: three `FormSheetSection` groups in the strip's order, each row an `AdvancedRow` fold whose collapsed line states the current value, every label with an (i) that names the default and the range, a gray tick and a **Reset** on a group only once it differs from the defaults, read-only rows for API-only fields, one line at the end for session settings, and a footer **Cancel** · **Save** · **Save and test** that keeps the draft until Sam decides.

```
Advanced settings                                            ×
--------------------------------------------------------------
LISTEN                                          ✓  Reset
› Speech recognition     Deepgram Nova 3 · Managed by Agora
› Start of speech        Semantic · threshold 0.5
▾ End of speech          Semantic · 480 ms silence
    Type (i)             [Semantic          ▾]
    Silence (i)          [480        ] ms
    Max wait (i)         [3000       ] ms
    Pause state (i)      (on)
› Interruptions          When the person speaks
› Silence                Off

THINK
› Language model         Google Gemma 4 on SuperNode · Managed by Agora
› History                32 messages
  What the agent says when the model fails is set in
  Greeting and failure message.

SPEAK                                           ✓  Reset
› Voice                  Cartesia Sonic 3.5 · Managed by Agora
› Skip patterns          None
› Filler words           On · after 1500 ms · 2 phrases
› Avatar                 Off

Idle timeout, maximum duration and graceful stop belong to the
session, not the agent. Set them in New run.
--------------------------------------------------------------
                          [Cancel]  [Save]  [Save and test]
```

| Before | After | Why |
|---|---|---|
| Four switches | Every cascaded field the spec allows, in twelve rows | Requirement 38; .a |
| Concept tooltip, no default | (i) says "Default 320 ms, 120 to 2000"; value pre-filled | .a step 2, research learning 2 and 3 |
| Flat list | Listen, Think, Speak, same order as the strip | Learning 1 |
| Writes on change, Done | Draft, Cancel, Save, Save and test; guard on close | .h, KPI (heard in the same session) |
| Lone row under Analysis | Door in the Voice & models footer | PRD .a step 1, one door |
| No realtime | `pipelineMode` with one Turn detection row and the reason line | .d, learning 4 |
| API fields silent | Read-only rows, "Set through the API. Saving keeps it." | .g |
| Bare switches | Silence and Filler words expand to their required fields | API: all four `silence_config` fields required |
| Nothing about sessions | One line and the door for the type | .e |
| "Start test call" | "Start test", "End test" | Locked vocabulary |

Nothing new enters the design system: `Sheet` (via `FormSheet` and `FormSheetSection`), `Separator`, `Button`, `Switch`, `Select`, `Input`, `InputGroup`, `Textarea`, `Checkbox`, `Field`, `FieldLabel`, `FieldError`, `Tooltip`, `CodeBlock`, `AlertDialog`, `sonner` all ship today; `AdvancedRow` and the group tick are ports of what the live builder renders.
