# P0.9 Let callers reach the agent · Before and after

Track: **v3**, in the existing Console design system. Before shots captured 26 Sep 2026 at 1600 x 1000, scale 2, dark, from the latest preview of concept A. They show the inbound deploy tab and its sheet as P0.3's commit left them; P0.8 (in review, build not landed) renames the tab Deployment, adds Readiness and Retention above the Numbers row, retitles the sheet Go live and drops the words connect and disconnect. This row starts from P0.8's spec and grows what it left to P0.9.

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-inbound-deploy-tab.png` | `…&agent=agent_frontdesk&tab=deploy` | Front desk, inbound, Live: one number row `+1 415 555 0142 · Support line` with Disconnect, the footer Connect another number, the header Connect a number (region 432,373,2064,168) |
| `shots/before-02-connect-number-sheet.png` | the sheet, project source | Two source rows and the Number select, nothing else (region 2344,96,840,272) |
| `shots/before-03-sip-trunk-fields.png` | the sheet, SIP source | Phone number, SIP host, Transport, Username, Password with a Save key button (region 2344,256,840,720) |

## Before · Concept A at P0.3 (e7a91276), with P0.8's spec applied

`InboundNumbers` and `ConnectNumberSheet` in `src/prototypes/agent-builder-v3/parts/deploy.tsx`, rendered by `DeployArea` for an inbound agent; P0.8 renames the sheet `GoLiveNumberSheet`, holds it on `panel=go-live`, and gives the row Go live, Remove and Add another number. What is still wrong against the JTBD and the v3 spec:

1. **No call policy.** Nothing sets `max_call_duration_seconds`, `max_silence_duration_ms` or the four `end_call` rules; a session on the number runs until the caller hangs up, and Sam has no way to say otherwise. (red, .a step 2, requirement 48)
2. **No transfer.** No E.164 number and no line saying when to hand over; the agent can never pass a caller to a person. (red, .a step 3, requirement 48)
3. **No allowlist.** The SIP form has no `allowed_ips` field, so a trunk trusted by IP cannot be added and a password trunk is open to any address. (amber, .b, learning 3)
4. **A warning instead of a confirm.** Picking a number another agent answers with shows one amber line; pressing the button moves the number with no confirm, and the other agent loses its number silently. (amber, .d)
5. **Failures are silent.** A 409 on the number or a 400 on the host has no place to land; the sheet's `ready` check only asks that the fields are non-empty. (red, .c)
6. **Nothing after the save.** The row lists the number and its label and says nothing about whether callers arrive; no dial prompt, no carrier link, nothing for the KPI's first answered call to stand on. (red, .a step 4, .f, .h, KPI)
7. **No numbers, no help.** With an empty project the sheet shows the SIP form (P0.8's line) but no way to learn how a trunk is set up at the carrier; Agora sells no numbers and the sheet does not say where they come from. (amber, .b)
8. **Idle timeout is misdescribed.** P0.3's inbound session line says "The API has no per-number setting yet."; the spec now has `max_silence_duration_ms` on the number's call policy. (amber, .g, API truth)
9. **Password control.** The SIP password field carries a Save key button (P0.6 removed it from `SecretKeyField`); the value should ride on the sheet's Go live. (amber, P0.6)
10. **No edit after Go live.** A live number cannot have its policy changed; only Remove exists. (amber, edit, P3.3)

## After

The same sheet, titled **Go live** (P0.8), grows two collapsed folds under the number: **Call policy** with Max duration (min), Max silence (s) and four end-rule checkboxes, and **Transfer** with the number and one line saying when to hand over. Each fold shows its value line collapsed ("Ends when the caller hangs up.", "None"), ticks gray when configured, and stays empty first. The SIP form gains **Allowed IPs** and loses the Save key button; a 409 or a bad host lands as a `FieldError` on the field; with no numbers the sheet says so in one sentence, opens on the SIP form and links the **Carrier checklist**. Go live saves the number and its policy in one request (`PATCH /numbers/{id}` or `POST /numbers`, both with `inbound.agent` and `inbound.call_policy`); when the number answers with another agent, a confirm names that agent before the move. Afterwards the Numbers row lists the number, a second line with the label and the policy summary, and a third line that reads "Not reached yet. Dial it to hear the agent." with **Dial it** (a `tel:` link) and **Carrier checklist** until the first inbound session, then "First session today, 14:12."; three days without a session the line counts the days. The row's `…` menu offers **Edit** (the same sheet as Edit number, folds pre-filled) and **Remove**. The Max silence (i) says an idle timeout is not on a number and that this is the nearest control, and P0.3's inbound session line links here.

```
Go live                                                            ×

(•) A number in this project
( ) A new number on your SIP trunk

Number
[ +1 628 555 0110 · Spare                                       ▾ ]

───────────────────────────────────────────────────────────────────
✓ Call policy                                                     ⌃
  Max duration   [ 10 ] min  (i)      Max silence  [ 30 ] s  (i)
  Agent may end the session
  [✓] When the conversation is complete
  [✓] When the caller asks to end it
  [ ] When a fax machine answers
  [ ] When another AI assistant answers
───────────────────────────────────────────────────────────────────
  Transfer                     None                                ⌄
───────────────────────────────────────────────────────────────────

                                              [Cancel]   [Go live]
```

```
Numbers   ┌──────────────────────────────────────────────────────────────────┐
          │ +1 628 555 0110                                              …   │
          │ Spare · Ends after 10 min or 30 s of silence · Transfers to      │
          │ +1 415 555 0100                                                  │
          │ Not reached yet. Dial it to hear the agent.  Dial it · Carrier   │
          │ checklist                                                        │
          ├──────────────────────────────────────────────────────────────────┤
          │                                              Add another number  │
          └──────────────────────────────────────────────────────────────────┘
```

| Before | After | Why |
|---|---|---|
| Number only | Call policy fold: Max duration, Max silence, four end rules, all empty and off first | .a step 2, requirement 48, API truth |
| No transfer | Transfer fold: Transfer to (E.164) and When to hand over, with a suggested line | .a step 3, .e, requirement 48 |
| No allowlist | Allowed IPs, optional, "Empty allows any address." | .b, learning 3 |
| Warning line, silent move | The line stays; Go live opens a confirm naming the agent that loses the number | .d, learning 4 |
| Non-empty check only | `FieldError` on Phone number (409, E.164) and SIP host (400, pattern); P0.1's `Alert` for a 5xx | .c, learning 2 |
| Row: number and label | Row: number; label and policy summary; reach line with Dial it and Carrier checklist; `…` menu Edit and Remove | .a step 4, .f, .h, edit, learning 1 and 5 |
| SIP form with no help | One sentence and the Carrier checklist link when the project has no numbers | .b |
| "No per-number setting yet" | The Max silence (i) and P0.3's session line name it as the nearest control | .g, API truth |
| Save key button | P0.6's `SecretKeyField` shape, value sent with Go live | P0.6 |
| Remove only | Edit reopens the same sheet as Edit number | edit, P3.3 |

Nothing new enters the design system: `FormSheet`, `RadioGroup`, `Select`, `Field` and `Input`, `Textarea`, `Checkbox`, `InputGroup` with a unit addon, `FieldError`, `FieldDescription`, `InfoTip`, the P0.3 fold row with the gray tick, `AlertDialog`, the `…` `DropdownMenu`, a link `Button`, `Alert` and `sonner` with an action all ship today.
