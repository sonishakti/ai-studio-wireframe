# P0.4 Tell the agent its job · Before and after

Track: **v3**, in the existing Console design system. Before shots captured 26 Sep 2026 at 1600 x 1000, scale 2, dark, from the latest preview of concept A (`/v3?concept=a`), agents Payment reminders and Renewal survey.

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-system-prompt-row.png` | `…&agent=agent_payments&section=prompt` | The System prompt row: textarea, the Variables line with three chips and an (i), the door "Greeting and failure message" with a tick |
| `shots/before-02-greeting-sheet-open.png` | same, door pressed | The compact sheet: Greeting text, "Every time someone joins", Failure message with an (i) |
| `shots/before-03-empty-greeting-no-default.png` | `…&agent=agent_survey&section=prompt` | The row on an agent with nothing configured: one chip, no default anywhere, the door without a tick |

## Before · Concept A after P0.2 (87f05b3f)

`PromptEditor` and `GreetingSheet` in `src/prototypes/agent-builder-v3/parts/prompt.tsx`. The row is already the right shape: prompt first, chips from the text, one door. What is wrong against the JTBD and the v3 spec:

1. **Writes on every keystroke.** The textarea writes the store on change; there is no draft, no Cancel, no Save, no Save and test. A cleared prompt is saved as cleared (.b has no block), and the header Test can never find unsaved edits because nothing is ever unsaved, so the KPI's "first prompt save" has no moment to measure. (red, .b, .f, KPI)
2. **A chip is a dead end.** `{{customer_name}}` shows as a chip, but nothing opens, so `variables` (the agent's defaults in the API) cannot be set. The batch (i) explains list columns and nothing else. (red, .a step 2, .c)
3. **No starter, no block.** An empty prompt shows a placeholder and nothing else; a cleared prompt saves silently; the test panel is the only place that says the prompt is missing. (red, .b)
4. **Who speaks first is missing.** The sheet has Greeting text and a "when" select, but no way to say the caller speaks first; an empty greeting on an inbound agent is neither an error nor an explicit choice. (red, .e)
5. **No Delay.** `greeting.delay_ms` (0 to 5000) has no field. (amber, .a step 3)
6. **"Every time someone joins" on a phone agent.** `on` is shown for every type, though telephony has one join; the select is noise on inbound and batch and its default is unstated. (amber)
7. **Failure message says too little.** The (i) reads "Spoken when the model cannot reply." and stops; nothing says empty means silence, and an empty field offers nothing. (amber, .d)
8. **Realtime is impossible to represent.** A realtime agent (P0.3) has no `failure_message` on the API, and the sheet would show the field anyway. (amber)
9. **The test panel never asks.** Start test plays the greeting with `customer_name` replaced by a hard-coded "Sam"; a variable without a default is silently faked. Labels still read "Start test call" and "End call". (red, .c; locked vocabulary)
10. **The door's tick counts the wrong things.** Tick shows when greeting text or failure message is set; an explicit "caller first" or a non-zero delay does not count. (amber)

## After

The same row and the same door, extended: the row holds a draft with **Cancel** · **Save** · **Save and test** in its footer once it is dirty (the Voice & models pattern plus P0.3's third button), a **Use the starter prompt** link beside the door while the editor is empty, chips that open a `Popover` with one Default field, and a footer reason line when Save is off. The sheet grows to the API: Who speaks first (inbound, batch), Greeting, Delay with its default in the (i), When it plays (code only), Failure message with the honest (i) and one **Use a suggested line** link, footer **Cancel** · **Save** · **Save and test** and P0.3's guard on close. The test panel asks once for values the agent lacks, then plays the greeting with them.

```
System prompt      [ You are Aria from Bayview Dental. You are on the phone   ]
                   [ with {{customer_name}} to confirm their appointment on   ]
                   [ {{appointment_time}} ... the office is open              ]
                   [ {{office_hours}}. Keep every reply under two sentences.  ]
                   Variables  customer_name  appointment_time  office_hours · Monday to Friday, 8 to 6  (i)
                                                   ✓ Greeting and failure message
                                                   [Cancel]  [Save]  [Save and test]

Greeting and failure message                                          ×
------------------------------------------------------------------------
Who speaks first          [The agent                    ▾]
Greeting
[ Hi, this is Aria from Bayview Dental. Is this {{customer_name}}?      ]
Delay (i)                 [0        ] ms

Failure message (i)
[                                                                      ]
Use a suggested line
------------------------------------------------------------------------
                                   [Cancel]  [Save]  [Save and test]

Test                                                             Close
Values for this test
customer_name        [                ]
appointment_time     [                ]
office_hours         [Monday to Friday, 8 to 6]
Asked once. Each run fills them from the contact list.
                                   [Start test]
```

| Before | After | Why |
|---|---|---|
| Writes on change | Row draft, Cancel, Save, Save and test; the header Test saves first | .b, .f, KPI (a save to measure), counter metric (heard tests) |
| Chip is a dead end | Chip opens a Popover with one Default field; greeting variables on the same line | .a step 2, .c, API `variables` |
| Placeholder only | **Use the starter prompt** while empty; reason line and Save off when cleared | .b, learning 5 |
| No who speaks first | Select The agent / The caller; caller first hides the fields with the live line | .e, learning 2 |
| No Delay | Delay (ms) with "Default 0 ms, 0 to 5000" in the (i) | .a step 3, API |
| When to greet on every type | When it plays on code only; omitted for telephony | API `on`, quiet chrome |
| Failure (i) says little | "Spoken when the language model fails. Empty means the agent stays silent." plus **Use a suggested line** | .d, learning 2 and 3 |
| Realtime shows the field | One line, no field | P0.3 .d, learning 5 |
| Test fakes "Sam" | Values for this test, asked once; "Start test", "End test" | .c, locked vocabulary |
| Tick on text only | Tick when any of greeting text, caller first, delay, failure message differs from new | "you configured this" |

Nothing new enters the design system: `AgentBuilderRow`, `Textarea`, `Popover`, `Field`, `FieldLabel`, `FieldError`, `FieldDescription`, `Input`, `InputGroup`, `Select`, `Button`, `Tooltip`, `FormSheet`, `AlertDialog`, `Sheet`, `sonner` all ship today; the chip is the existing `code` chip; the reason line is P0.1's footer line; the footer is P0.2's row footer with P0.3's third button.
