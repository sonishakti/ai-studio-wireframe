# P0.6 Run the agent on the team's own accounts · Before and after

Track: **v3**, in the existing Console design system. Before shots captured 26 Sep 2026 at 1600 x 1000, scale 2, dark, from the latest preview of concept A on Front desk. They show the Advanced settings sheet as it was before P0.3's rebuild (a Provider keys group); P0.3's build on the `design/v3` working tree (`parts/advanced.tsx`, untracked at the time of writing) has since moved the same control into each model row. The wrongs below hold for both.

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-advanced-provider-keys.png` | `…&agent=agent_frontdesk&panel=advanced` | Provider keys: Speech recognition, Language model, Voice, each "Managed by Agora" with **Use my key** |
| `shots/before-02-key-paste-field.png` | same, Use my key pressed on Speech recognition | A password field "Paste the key" and **Save key**, off until a character is typed |
| `shots/before-03-key-saved.png` | same, Save key pressed | The row reads **Key saved** with Replace and Remove; the value is gone |

## Before · Concept A after P0.2 (87f05b3f) with P0.3's build

`ProviderKeyControl` and `SecretKeyField` in `src/prototypes/agent-builder-v3/parts/model.tsx`, rendered by `ModelRow` and the Avatar row in `parts/advanced.tsx`; `ProtoAgent.keys: Record<KeySlot, boolean>` in `data.ts`. The door is right: the key sits beside the module's vendor and model, inside the sheet that holds its endpoint and headers, and a managed module shows one button. What is wrong against the JTBD and the v3 spec:

1. **Save key saves nothing.** `SecretKeyField` calls `onSave()` without the value; the draft stores `true`; no secret set is created, no `credential` is sent, no reference exists. The API's `POST /secrets` and `ModelCredential` are unused. (red, .a step 3)
2. **Key saved is claimed before the sheet is saved.** The row reads Key saved while the sheet's footer still says Save; Cancel then drops it, so the word lied. (amber, .a step 3)
3. **Two commits for one field.** Save key inside a sheet whose footer has Save, unlike the Headers field two lines below, which is committed by the sheet. (amber, one door per action)
4. **A wrong key looks like a right one.** No rejected state on the row, no line in the test panel, no event; the KPI's numerator cannot be read. (red, .c, .f, KPI)
5. **Remove flips a boolean.** Nothing says what happens to the stored value; no DELETE, no 409 path, no agent named. (red, .e)
6. **Replace sends nothing.** The field reopens and Save key drops the value again; no PUT. (red, .d)
7. **A key is offered on a model Agora runs.** Lowest latency's language model is Gemma 4 on SuperNode; there is no vendor account to bill, and the button still shows. (amber, .a)
8. **Changing the vendor keeps the old vendor's key silently.** Switch OpenAI to Anthropic on a row with a saved key and nothing warns; the next test fails. (amber, .c)
9. **No reference path.** A `$secrets` reference pasted into the field would be stored as a value; a set that exists cannot be picked. (amber, .g)
10. **No name and no trace.** Sam cannot see which set holds the key, and View last save shows no secrets call. (amber, .b)

## After

The same row, the same button, grown to the API and given a state. **Use my key** opens the password field beside the module's selects with an (i) that says where the key goes and who is billed; the value sits in the sheet's draft like a header and the footer's **Save** and **Save and test** turn on. Save writes one secret set per module key, `studio-<agent_id>-<module>` with `api_key`, retries with a suffix on 409, sends the module's credential as a `$secrets` reference and records the set in a label. Reopened, the row reads **Key saved** with the reference in an (i), **Replace** (the field again with the re-enter line, PUT on save) and **Remove** (managed on save, then DELETE; a 409 keeps the set and prints the agent the API named). A test that the vendor rejects writes one transcript line naming the module and the code, plays the failure message, offers **Replace key** under the line, and flags the row **Key rejected in last test** with the time; a clean test clears it. A model Agora runs shows one line and no control; a vendor change on a row with a saved key shows one line; a `$secrets` reference pasted is used as is; behind a flag, saved sets can be picked instead of pasted.

```
Think                                                                  Reset
  Language model                          OpenAI GPT-5.1 · Your key      ˄
    [OpenAI ▾] [GPT-5.1 ▾]   🔑 Key saved (i)   Replace   Remove
    Endpoint (i)   [https://                                          ]
    Headers (i)    [X-Api-Key: value                                   ]
  History                                 32 messages                    ˅

                                                       [Cancel] [Save] [Save and test]

Test                                                                   Close
Kenji · 0:09
“Hi, I'm here to help with the course. Which lesson are you on?”
🔑 Language model · key rejected · 401
“Sorry, I lost track there. Could you say that again?”
Replace key
Listening
```

| Before | After | Why |
|---|---|---|
| Save key drops the value, no set, no credential | The sheet's Save writes `POST /secrets` then `credential: { mode: byok, api_key: $secrets… }` | .a step 3, learning 2 |
| Key saved before the save | Masked value in the draft; Key saved only after Save, with the reference in the (i) | .a step 3, learning 6 |
| Save key and Save | One commit, the sheet's Save, like Headers | one door, learning 2 |
| A wrong key looks right | Transcript line with module and code, failure message, Replace key; row flag with the time | .c, .f, KPI, learning 3 |
| Remove flips a boolean | Managed on save, then DELETE; a 409 keeps the set and names the agent | .e, learning 4 |
| Replace sends nothing | PUT on the one-key set; other modules untouched; flag cleared | .d |
| Key offered on Gemma on SuperNode | One line, no control | .a, learning 5 |
| Vendor change keeps the old key silently | One line naming the old vendor with two ways out | .c |
| No reference path | A `$secrets` value is used as is; saved sets pickable behind the flag | .g |
| No name, no trace | Suffix on 409, reference in the (i), both calls in View last save | .b, learning 6 |

Nothing new enters the design system: `AdvancedRow`, `Field`, `FieldLabel`, `FieldDescription`, `Input type="password"`, `Button`, `Badge`, `Tooltip`, `AlertDialog`, `CodeBlock`, `sonner` all ship today; the (i) is P0.3's `InfoTip`, the re-enter line is P0.5's, the danger badge with a time is P0.5's row state, the transcript line is P0.5's tool line with a key icon.
