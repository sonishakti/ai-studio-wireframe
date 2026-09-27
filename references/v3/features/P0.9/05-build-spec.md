# P0.9 Let callers reach the agent · Build spec

Track: **v3**. Pick: **direction 1, one sheet, two folds**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Builds land in id order, so this row starts on P0.8's commit; if P0.8's commit is absent at build time, the Deployment tab, `GoLiveNumberSheet` on `panel=go-live`, the `dep=` states, `ProjectNumber` with ids and `agent_clinic` are made here exactly as P0.8's spec and `00-data.md` name them, and P0.8 takes them over; if P0.3's is absent, the fold row is ported here from `src/components/console/agent-config-drawer.tsx` `AdvancedRow` and P0.3 takes it over; if P0.6's is absent, `SecretKeyField` loses its Save key button here. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.9): point a number at the agent with a call policy and a transfer, then dial it`.

Scope rule: P0.9 only, the inbound branch of the Deployment tab in concept A: `GoLiveNumberSheet` (`parts/deploy.tsx`, P0.8's rename of `ConnectNumberSheet`), `InboundNumbers`, the inbound branch of `DeployArea` and `useDeployActions`, and their data. Touches outside it, each the smallest honest change (declare under `touches_locked`; nothing is locked, P0.1 to P0.8 are in review): P0.8's Numbers row gets a `…` menu with Edit and Remove in place of its Remove button, and its live toast gains the action Dial it; P0.3's inbound session line in Advanced settings gains the door to Max silence; P0.8's Readiness number item and Go live sheet keep their copy. `NewRunSheet`, `RunsTable`, `RunSheet` and `SdkCode` are untouched. Concepts B to E keep compiling: `GoLiveNumberSheet` keeps `{ agent, open, onOpenChange, update }` and gains optional `mode`, `numberId` and `fold` props with defaults; `InboundNumbers` keeps `{ agent, onConnect, update }` and gains optional `onEdit`; `ConnectNumberSheet` stays an alias for one more commit.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=agent_clinic&tab=deploy`, written below as `…`. The prototype link opens at step 1.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…&dep=ready` | The Clinic reception agent (inbound, Draft) on **Deployment** (P0.8): Readiness with the gray ticks "Heard in a test at 14:02, after the last change." and "System prompt written." and the plain line "A number is picked at Go live. 5 in the project."; Retention on 30 days; **Numbers** as one line "No number answers with this agent yet." and **Go live** | Sam opens Deployment with the agent tested and presses Go live |
| 2 | `…&dep=ready&panel=go-live&num=picked` | The sheet **Go live** (compact): A number in this project selected; the Number select reading `+1 628 555 0110 · Spare`; under it two collapsed folds, **Call policy** with the value line "Ends when the caller hangs up." and **Transfer** with "None", no ticks; footer **Cancel** · **Go live** on | Sam picks the spare number in the project |
| 3 | `…&dep=ready&panel=go-live&num=policy&fold=call-policy` | Call policy expanded: **Max duration** 10 with the min addon, **Max silence** 30 with the s addon, the group **Agent may end the session** with "When the conversation is complete" and "When the caller asks to end it" ticked, the fax and AI assistant rules unticked; the fold header carries the gray tick; Transfer still collapsed | Sam caps a session at 10 minutes or 30 seconds of silence and lets the agent end it |
| 4 | `…&dep=ready&panel=go-live&num=transfer&fold=transfer` | Transfer expanded: **Transfer to** `+1 415 555 0100`, **When to hand over** "The caller asks for a person, or the agent cannot help after two tries."; the fold ticked; Call policy collapsed reading "Ends after 10 min or 30 s of silence · 2 end rules" with its tick; Go live on | Sam adds the front desk number and says when to hand over |
| 5 | `…&dep=live&num=live-policy` | Toast "Live. +1 628 555 0110 answers with this agent." with the action **Dial it**; the header badge **Live**; **Numbers** lists `+1 628 555 0110`, the line "Spare · Ends after 10 min or 30 s of silence · Transfers to +1 415 555 0100", the line "Not reached yet. Dial it to hear the agent." with **Dial it** and **Carrier checklist**, the `…` menu, the footer **Add another number**; Readiness three ticks, the third "+1 628 555 0110 answers with this agent." | Sam goes live and dials the number from a phone |
| 6 | `…&dep=live&num=reached` | The same row with the third line "First session today, 14:12." and no links; no toast | Sam hears the agent answer and the row records the first session |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b | `…&dep=no-number&panel=go-live` | The sheet with no source rows: the line "The project has no numbers yet. Add one from your SIP trunk." with the link **Carrier checklist**; then Phone number, SIP host, SIP protocol (TLS), Username, Password, Allowed IPs; the two folds collapsed; the footer reason "Add the number and the SIP host to go live." and **Go live** off | Filling the fields turns Go live on (`…&num=sip` shows it filled); Go live sends `POST /numbers` with `inbound.agent` and `call_policy` in one save; the link opens the carrier docs in a new tab |
| .c 409 | `…&dep=no-number&panel=go-live&num=dup-409` | Phone number reads `+1 415 555 0142` with the `FieldError` "This number is already in the project (409). Pick it under A number in this project."; the other values kept; Go live on again once the field changes | Sam switches the source row and picks it, or types another number |
| .c host | `…&dep=no-number&panel=go-live&num=bad-host` | SIP host reads `sip:sip.carrier.com:5061` with the `FieldError` "Enter the host only, without sip:, a port or a path."; Go live off | Caught on blur before sending, and again from a 400 whose `errors[0].field` is `sip_trunk.hostname`; typing a bare host clears it |
| .d | `…&dep=ready&panel=go-live&num=move` | The Number select reading `+1 415 555 0142 · Answers with Front desk`, the warning line "Front desk answers this number now. Go live moves it to Clinic reception." (P0.8), and the `AlertDialog` "Move +1 415 555 0142 to Clinic reception?" with "Front desk answers this number now. After the move, callers to it reach Clinic reception, and Front desk has no number left." and **Cancel** · **Move number** | Move number sends the PATCH, fires `number_reassigned {fromAgentId: agent_frontdesk}`, toasts "Live. +1 415 555 0142 answers with this agent."; Front desk's list loses the number and its status reads Draft (P0.8's rule) |
| .e | `…&dep=ready&panel=go-live&num=e164&fold=transfer` | Transfer to reads `415 555 0100` with the `FieldError` "Enter the number in E.164: a plus, the country code, then the number, up to 15 digits."; Go live off | Typing `+14155550100` clears it. A line without a number reads "Add the number to transfer to."; a number without a line reads "Say when to hand over, up to 1000 characters." |
| .f | `…&dep=live&num=not-reached` | The live row an hour after Go live, no toast: "Not reached yet. Dial it to hear the agent." with **Dial it** and **Carrier checklist** | Dial it opens `tel:+16285550110`; the checklist opens the carrier docs; nothing arrives after a fix at the carrier: Remove and add the number again (editing the trunk in place is P3.2) |
| .g | `…&dep=ready&panel=go-live&num=idle&fold=call-policy` | Call policy expanded with the Max silence (i) open: "Ends the session after this much silence from everyone. The API has no idle timeout on a number; this is the nearest control." | Nothing to fix. From Advanced settings (P0.3, `…&tab=agent&section=voice-models&panel=advanced&row=session` on an inbound agent) the session line reads "Inbound sessions end after 30 s of silence. Set a silence limit on the number in Deployment." and its link lands here |
| .h | `…&dep=live&num=stalled` | The row three days on: "Not reached yet, 3 days after Go live. Dial it to hear the agent." with the two links | Same two doors; P1.8's strip on Overview names the number too. "Only Sam by day 14" is P1.8's (G2) |
| edit | `/v3?concept=a&view=agent&agent=agent_frontdesk&tab=deploy&panel=number&item=num_0142` | The sheet **Edit number**: the line `+1 415 555 0142 · Support line`, then Call policy collapsed reading "Ends after 10 min or 30 s of silence · 2 end rules" with its tick and Transfer reading "+1 415 555 0100" with its tick; `&fold=call-policy` expands it pre-filled; footer **Cancel** · **Save** off until a value changes | Save sends `PATCH /numbers/num_0142 { inbound: { agent: agent_frontdesk, call_policy } }`, toasts "Number saved.", the row summary updates |
| remove | P0.8's | Unchanged: the `…` menu's **Remove** sends `PATCH { inbound: null }`, toasts "{number} no longer answers with this agent." | Unchanged |

New search keys, validated in `store.tsx`: `panel` gains `number` (the edit sheet, with P0.5's `item` holding the number id); `fold` (`call-policy` \| `transfer`, expands that fold on open and moves focus to its first field); `num` (`picked` \| `policy` \| `transfer` \| `sip` \| `live-policy` \| `not-reached` \| `reached` \| `stalled` \| `dup-409` \| `bad-host` \| `move` \| `e164` \| `idle` \| `edit`, review only, never written to the store). `openAgent` and `toList` clear `fold`, `item` and `num`; `openPanel(undefined)` clears `fold` and `item` and leaves `num` (as P0.8's `dep`). P0.8's `panel=go-live` and `dep=` keep their meaning.

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Full detail in `00-data.md` section "What the prototype fixtures must contain".

- `EndCall`, `Transfer`, `InboundCallPolicy`, `SipProtocol`, `NumberDraft`; `ProjectNumber` gains `sip`, `inboundAgent`, `callPolicy`, `wentLiveAt`, `reachedAt`.
- `EMPTY_END_CALL`, `EMPTY_POLICY_DRAFT`, `SUGGESTED_TRANSFER_LINE`, `CARRIER_DOCS_URL`.
- `isE164`, `isSipHost`, `validateNumberDraft`, `callPolicyFromDraft`, `draftFromPolicy`, `callPolicyConfigured`, `transferConfigured`, `callPolicyLine`, `transferLine`, `numberSummary`, `reachLine`, `dialHref`, `numberCreateBody`, `numberBindBody`.
- `PROJECT_NUMBERS` per `00-data.md` item 8: `num_0142` with the Front desk policy, transfer, `wentLiveAt` and `reachedAt`; `num_0199` with `reachedAt` only; `num_0110` bare. No seed agent changes.
- Go live (project number) writes `PATCH /numbers/{id} { inbound: { agent, call_policy? } }`; Go live (SIP) writes `POST /numbers { number, sip_trunk: { hostname, transport, auth?, allowed_ips? }, inbound: { agent, call_policy? } }` with the password as typed and shown as `"••••"` in View last save; Edit writes the PATCH with `agent` unchanged and `transfer: null` when cleared; Remove is P0.8's. Design mode: the PATCH sets `inboundAgent`, `callPolicy` and `wentLiveAt` on the number and adds it to `agent.numbers`; the POST appends a `ProjectNumber` with a new `num_…` id; a typed number equal to an existing one answers 409; a host failing `isSipHost` answers 400 with `errors[0].field = "sip_trunk.hostname"`.
- `parts/events.ts` gains `phone_number_linked`, `number_reassigned`, `call_policy_opened`, and `cta_viewed` where absent.
- Tests as listed in `00-data.md` item 12.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Sheet | `GoLiveNumberSheet` on `FormSheet size="compact"`; title Go live, or Edit number in edit mode | `parts/deploy.tsx`, `src/components/console/form-sheet.tsx` |
| Source rows | `RadioGroup` with two `RadioGroupItem` label rows (P0.8, unchanged) | `src/components/ui/radio-group.tsx` |
| Number pick | `Select` of `{number} · {label}` or `{number} · Answers with {agent}` (P0.8, unchanged) | `src/components/ui/select.tsx` |
| Owner line | `text-xs text-warning` line under the select (P0.8, unchanged) | `parts/deploy.tsx` |
| SIP fields | `Field`, `FieldLabel` + `InfoTip`, `Input` (Phone number, SIP host, Username); `Select` (SIP protocol) | `src/components/ui/field.tsx`, `input.tsx`, `select.tsx`, `parts/common.tsx` |
| Password | P0.6's `SecretKeyField`: `Input type="password" autoComplete="off"` with its (i), no Save key button | `parts/model.tsx` |
| Allowed IPs, When to hand over | `Textarea` (one CIDR per line; the transfer line) | `src/components/ui/textarea.tsx` |
| Fold | P0.3's `AdvancedRow` (chevron `Button size="icon-xs"`, title button, value line, `Separator` above), the New run **Session limits** fold as the sibling | `parts/advanced.tsx`, `parts/deploy.tsx` `NewRunSheet` |
| Fold tick | `Tick` on `AgentBuilderTickGlyph`, gray, in the fold header's action slot (P0.3's group tick) | `parts/common.tsx`, `src/components/console/agent-builder/agent-builder-tick.tsx` |
| Numbers with units | `InputGroup` with `Input type="number"` and a trailing unit addon (min, s), `min` 1, `step` 1 (P0.3's number control) | `src/components/ui/input-group.tsx` |
| End rules | `Checkbox` list under a group label (P0.3's Skip patterns) | `src/components/ui/checkbox.tsx` |
| Field errors | `FieldError`, `aria-invalid` on the input | `src/components/ui/field.tsx` |
| Reason line, no-numbers line, (i) texts | `FieldDescription` muted text; P0.1's footer reason line | `field.tsx` |
| Suggested line | `Button variant="link" size="sm"` under When to hand over while empty (P0.4's Use a suggested line) | `src/components/ui/button.tsx` |
| Carrier checklist, Dial it | `Button variant="link" size="sm"` with `ExternalLink` for the docs; `asChild` around `<a href="tel:…">` for Dial it | `button.tsx`, lucide |
| Move confirm | `AlertDialog` (P0.1's blocked dialog as the sibling) | `src/components/ui/alert-dialog.tsx` |
| Failure with no field | `Alert variant="destructive"` above the footer with **Try again** (P0.1's error alert) | `src/components/ui/alert.tsx` |
| Row | `InboundNumbers`: the list box, `{number}` tabular, two `text-xs text-muted-foreground` lines, the `…` `DropdownMenu` (P0.5's row menu as the sibling) with **Edit** and **Remove**, the footer **Add another number** | `parts/deploy.tsx`, `src/components/ui/dropdown-menu.tsx` |
| Toast | P0.8's live toast, `toast(title, { action: { label: "Dial it", onClick } })` | `src/components/ui/sonner.tsx` |
| Readiness, Retention, header | P0.8's, unchanged | `parts/readiness.tsx`, `parts/common.tsx` |
| Last save | P0.3's View last save `CodeBlock` dialog | `src/components/ui/code-block.tsx` |

No new token, component, radius or font size. No stepper, no checklist card, no badge on the number, no green anywhere; the only colour on the row is the destructive tint on Remove, the only colour in the sheet is the warning line and the field errors.

## 4. The sheet and the row, piece by piece

### The Go live sheet (inbound)

Title **Go live**. With numbers in the project: the two source rows, then the Number select and the owner line (P0.8). With none (.b): no source rows; the no-numbers line with the **Carrier checklist** link, then the SIP form. With the SIP source picked: the SIP form under the rows. Then, in every case, the two folds.

| Field | Control | API | Default, rule (in the (i)) |
|---|---|---|---|
| Phone number | `Input` | `number` | none; E.164 |
| SIP host | `Input` | `sip_trunk.hostname` | none; the host only, no sip:, port or path |
| SIP protocol | `Select` TLS, TCP, UDP | `sip_trunk.transport` | TLS; port 5061 for TLS, 5060 for TCP and UDP, not shown |
| Username | `Input` | `sip_trunk.auth.username` | none |
| Password | `SecretKeyField` | `sip_trunk.auth.password` | none; sent once, never shown again; a `$secrets.<set>.<key>` reference works |
| Allowed IPs | `Textarea` | `sip_trunk.allowed_ips` | none; one IP or CIDR per line; empty allows any address |

Go live is on when Phone number and SIP host pass, and either Username and Password or Allowed IPs is filled, and no field has an error; otherwise the footer reason line says what is missing. `port` and `description` are not asked (P3.2 adds the label on the Numbers page).

```
───────────────────────────────────────────────────────────────────
  Call policy                  Ends when the caller hangs up.      ⌄
───────────────────────────────────────────────────────────────────
  Transfer                     None                                ⌄
───────────────────────────────────────────────────────────────────
```

**Call policy** expanded:

| Field | Control | API | Default, rule |
|---|---|---|---|
| Max duration | `InputGroup` number, min addon | `max_call_duration_seconds` (minutes times 60) | empty means no limit; whole minutes, 1 or more |
| Max silence | `InputGroup` number, s addon | `max_silence_duration_ms` (seconds times 1000) | empty means no silence limit; whole seconds, 1 or more; the (i) carries the .g line |
| Agent may end the session | four `Checkbox` rows | `end_call.on_conversation_complete`, `on_user_request`, `on_fax`, `on_ai_assistant` | all off |

**Transfer** expanded:

| Field | Control | API | Default, rule |
|---|---|---|---|
| Transfer to | `Input` | `transfer.phone_number` | none; E.164 |
| When to hand over | `Textarea min-h-16`; **Use a suggested line** under it while empty | `transfer.description` | none; 1 to 1000 characters; both fields together or neither |

The value line reads `callPolicyLine` and `transferLine`; the tick shows when `callPolicyConfigured` (limits or rules) and `transferConfigured`. Picking a number that already carries a policy pre-fills both folds and ticks them; picking another number replaces the draft. Footer **Cancel** · **Go live**; in edit mode **Cancel** · **Save**.

### The Edit number sheet

Same component, `mode="edit"`, opened from the row menu (`panel=number&item=<id>`). Title **Edit number**. Body: the line `{number} · {label}` (plain text, the SIP fields are P3.2's), then the two folds pre-filled from `Number.inbound.call_policy`. Save on only when the draft differs. Clearing both Transfer fields sends `transfer: null`.

### The Numbers row (live)

```
+1 628 555 0110                                                        …
Spare · Ends after 10 min or 30 s of silence · Transfers to +1 415 555 0100
Not reached yet. Dial it to hear the agent.      Dial it   Carrier checklist
─────────────────────────────────────────────────────────────────────────
                                                        Add another number
```

Line 1 the number, tabular. Line 2 `numberSummary`: the label (or `{host} · {PROTOCOL}` for a SIP number), then the policy summary and the transfer when set; a number with no policy shows the label alone. Line 3 `reachLine`: until the first inbound session, the sentence with **Dial it** and **Carrier checklist**; after it, "First session {date}, {time}." with no link; from three days after Go live with no session, the day count. A number Studio never recorded Go live for (`num_0199`, set through the API) shows line 3 only when `reachedAt` is set. The `…` menu: **Edit**, **Remove**.

### The move confirm (.d)

`AlertDialog` at the press of Go live when the picked number's `inboundAgent` is another agent: title "Move {number} to {this agent}?", body "{owner} answers this number now. After the move, callers to it reach {this agent}." plus ", and {owner} has no number left." when it is the owner's only number; buttons **Cancel** · **Move number**. The warning line under the select stays as the early notice (P0.8).

### The Max silence (i) and P0.3's session line (.g)

The (i) text is in section 6. In P0.3's Advanced sheet, the inbound session line becomes "Inbound sessions end after 30 s of silence. Set a silence limit on the number in Deployment." with **Set a silence limit on the number** as the link: on a draft agent it opens `tab=deploy&panel=go-live&fold=call-policy`; on a live agent `tab=deploy&panel=number&item=<first number>&fold=call-policy`; it closes the Advanced sheet first through P0.3's leave guard when dirty.

## 5. Behaviour

- **Open.** The row's Go live, Readiness's Add a number and Add another number open `panel=go-live` (P0.8) and fire `go_live_clicked` as P0.8 specifies; the sheet records `openedAt` for `wallMs`. With no numbers the sheet opens on the SIP form and focuses Phone number; otherwise focus is on the first source row. Edit opens `panel=number&item=<id>` with focus on the Call policy chevron.
- **Draft.** The sheet holds a `NumberDraft`; nothing writes the store until Go live or Save. A store change while open replaces the draft (P0.2 pattern). Cancel, Esc and the overlay close without a guard (the values are cheap to redo, as P0.1's sheet).
- **Folds.** The chevron and the title toggle; `fold=` opens one on load. The first expand of Call policy per sheet open fires `call_policy_opened {entryPoint: go_live | number_row | advanced}` (the third when the sheet was opened from P0.3's session line, carried as `fold=call-policy&from=advanced` for that navigation only). Transfer expanding fires nothing.
- **Validation.** On blur and on Go live with `validateNumberDraft`; `FieldError` under the field, `aria-invalid` on the input, values kept as typed. Any error keeps Go live and Save off; a fold with an error stays open. Whole-number fields round nothing: 7.5 minutes is "Enter a whole number of minutes."
- **Suggested line.** The link shows while When to hand over is empty; pressing it fills `SUGGESTED_TRANSFER_LINE` and the link disappears (P0.4's pattern).
- **Go live (project number).** Validates; when the number answers with another agent, opens the confirm first (.d). Sends `numberBindBody`, fires `phone_number_linked {source: project, entryPoint, wallMs, hasCallPolicy, hasTransfer, reassigned}`, `operation_succeeded {operation: telephony_phone_number_bind}` and, on a move, `number_reassigned {fromAgentId}`; sets `wentLiveAt`, adds the number to `agent.numbers`, sets `status: "live"`, toasts "Live. {number} answers with this agent." with **Dial it**, closes. The other agent's list loses the number (P0.8's rule).
- **Go live (SIP).** Validates; sends `numberCreateBody`; on 201 as above with `source: sip`; on 409 the Phone number error and `operation_failed {operation: telephony_phone_number_create, code: 409}`; on 400 the SIP host error when `errors[0].field` is `sip_trunk.hostname`, otherwise P0.1's `Alert` "The number was not added (400). {message}" with Try again; on a 5xx the `Alert` "The number was not added ({code}). Try again."
- **Save (edit).** Sends the PATCH with `agent` unchanged, fires `operation_succeeded {operation: telephony_phone_number_bind}` and `call_policy_opened` as above, toasts "Number saved.", closes. Never touches `wentLiveAt` or `reachedAt`.
- **Reach line.** Reads `reachLine(number, now)` on every render; in the port, `reachedAt` comes from `GET /sessions` (telephony, inbound, `to` = the number), fetched once per Deployment open and again on focus; design mode uses the fixture. Showing the not-reached line fires `cta_viewed {cta: dial_it}` once per mount. **Dial it** is an `<a href={dialHref(number)}>` and fires `external_link_opened {surface: tel}`; **Carrier checklist** opens `CARRIER_DOCS_URL` in a new tab and fires `external_link_opened {surface: carrier_docs}`.
- **Toast action.** **Dial it** on the live toast does what the row link does.
- **Remove.** P0.8's, from the menu; the number keeps its `callPolicy` on the project so re-pointing pre-fills it.
- **Review states.** `num=` never writes the store: each renders the sheet, the row or the dialog as section 1 describes, with `dep=ready`, `dep=live` and `dep=no-number` from P0.8 underneath.
- **Keyboard.** Sheet: source rows (one tab stop, arrows), Number select or the SIP fields in order, the Call policy chevron, its fields, the Transfer chevron, its fields, the suggested link, Cancel, Go live; Esc closes. Row: the `…` button, Dial it, Carrier checklist, then the footer link. `fold=` moves focus to the fold's first field; `panel=number` to the first chevron.
- **Events per action.** `go_live_clicked`, `go_live_blocked` (P0.8), `call_policy_opened`, `phone_number_linked`, `number_reassigned`, `operation_succeeded`, `operation_failed`, `cta_viewed`, `external_link_opened`; each logs once through `trackProto`. `channel_connected` and `agent_answered_production` are server events and are not logged.

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, spoken lines in quotes and italics (none here; a transfer line is read by the model, not spoken). Never: connect, disconnect, connection, line (for a number), DID, phone call, call (outside the API name Call policy), channel (alone), publish, deploy (verb), launch, activate, verified, healthy, ready (for a number), preview, prototype.

| Key | Text |
|---|---|
| Sheet title | Go live / Edit number |
| Source rows | A number in this project / A new number on your SIP trunk (P0.8) |
| Number label, placeholder, items, owner line | P0.8's, unchanged |
| No numbers line | The project has no numbers yet. Add one from your SIP trunk. |
| Carrier link | Carrier checklist |
| Phone number label | Phone number |
| Phone number (i) | In E.164: a plus, the country code, then the number. |
| Phone number error, empty | Enter the number. |
| Phone number error, format | Enter the number in E.164: a plus, the country code, then the number, up to 15 digits. |
| Phone number error, 409 | This number is already in the project (409). Pick it under A number in this project. |
| SIP host label | SIP host |
| SIP host (i) | The carrier's SIP host, without sip:, a port or a path. |
| SIP host error | Enter the host only, without sip:, a port or a path. |
| SIP protocol label | SIP protocol |
| SIP protocol options | TLS / TCP / UDP |
| SIP protocol (i) | Default TLS. Port 5061 for TLS, 5060 for TCP and UDP. |
| Username label | Username |
| Password label | Password |
| Password (i) | Sent to the carrier once and never shown again. A $secrets reference works too. |
| Allowed IPs label | Allowed IPs |
| Allowed IPs (i) | One IP or CIDR range per line, the addresses your carrier sends from. Empty allows any address. |
| Allowed IPs error | Enter one IP or CIDR range per line. |
| Footer reason, fields | Add the number and the SIP host to go live. |
| Footer reason, auth | Add the trunk's username and password, or its allowed IPs, to go live. |
| Fold titles | Call policy / Transfer |
| Call policy value line | Ends when the caller hangs up. / Ends after {n} min. / Ends after {n} s of silence. / Ends after {n} min or {n} s of silence. / … · {n} end rules / … · 1 end rule |
| Transfer value line | None / {number} |
| Max duration label | Max duration |
| Max duration (i) | Empty means no limit. Whole minutes; the session ends at this length however it is going. |
| Max silence label | Max silence |
| Max silence (i) | Ends the session after this much silence from everyone. The API has no idle timeout on a number; this is the nearest control. |
| Number errors | Enter 1 or more. / Enter a whole number of minutes. / Enter a whole number of seconds. |
| End rules label | Agent may end the session |
| End rules (i) | All off until you turn one on. Off, a session ends when the caller hangs up or a limit is reached. |
| End rules | When the conversation is complete / When the caller asks to end it / When a fax machine answers / When another AI assistant answers |
| Transfer to label | Transfer to |
| Transfer to (i) | A person's number in E.164. The agent hands the caller over when the line below applies. |
| Transfer to error, format | Enter the number in E.164: a plus, the country code, then the number, up to 15 digits. |
| Transfer to error, missing | Add the number to transfer to. |
| When to hand over label | When to hand over |
| When to hand over (i) | The agent decides from this line. 1 to 1000 characters. |
| When to hand over error | Say when to hand over, up to 1000 characters. |
| Suggested link | Use a suggested line |
| Suggested line | The caller asks for a person, or the agent cannot help after two tries. |
| Sheet footer | Cancel / Go live / Save |
| Live toast | Live. {number} answers with this agent. |
| Live toast action | Dial it |
| Saved toast | Number saved. |
| Move title | Move {number} to {agent}? |
| Move body | {owner} answers this number now. After the move, callers to it reach {agent}. |
| Move body, last number | {owner} answers this number now. After the move, callers to it reach {agent}, and {owner} has no number left. |
| Move buttons | Cancel / Move number |
| Failure alert | The number was not added ({code}). Try again. / The number was not added (400). {message} |
| Retry | Try again |
| Row summary | {label} · {call policy value line} · Transfers to {number} |
| Row summary, SIP number | {host} · {PROTOCOL} |
| Reach line, not reached | Not reached yet. Dial it to hear the agent. |
| Reach line, stalled | Not reached yet, {n} days after Go live. Dial it to hear the agent. |
| Reach line, reached | First session {date}, {time}. / First session today, {time}. |
| Reach links | Dial it / Carrier checklist |
| Row menu | Edit / Remove |
| Removed toast | P0.8's |
| Edit number line | {number} · {label} |
| Advanced session line, inbound (P0.3) | Inbound sessions end after 30 s of silence. Set a silence limit on the number in Deployment. |
| Advanced session door, inbound | Set a silence limit on the number |
| Last save entries | PATCH /numbers/{id} · 200 / POST /numbers · 201 / POST /numbers · 409 / POST /numbers · 400 / GET /sessions · 200 |
| Last save password | "password": "••••" |

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (connect, disconnect, connection, DID, phone call, channel, publish, deploy, launch, activate, verified, healthy, preview, prototype, simulated, mock, wireframe, arrows, em dashes; "call" allowed only in "Call policy" and "caller"). A grep of the changed files must find no SIP password in `sessionStorage` or `lastSave`. P0.1, P0.2, P0.4 to P0.7 routes unchanged; P0.3's session line and P0.8's row menu and toast touched only as declared. Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png` in flow order: 01 deployment-ready, 02 sheet-number-picked, 03 call-policy-set, 04 transfer-set, 05 live-not-reached, 06 reached, then rainy 07 b-no-numbers-sip-form, 08 b-sip-filled, 09 c-duplicate-409, 10 c-bad-host, 11 d-move-confirm, 12 e-transfer-e164, 13 f-not-reached-later, 14 g-max-silence-tip, 15 g-advanced-session-door, 16 h-stalled-3-days, 17 edit-number.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.9 · Let callers reach the agent` after P0.8's, child sections 1 JTBD, 2 Research (the 16 shots in `02-research.md` with their regions: the 8 files in `shots/` plus the 8 reused from `competitors/product/*` by path), 3 Flow (17 story frames), 4 Hero (the Go live sheet with the spare number picked and Call policy expanded, step 3; the live Numbers row with the policy summary and the reach line, step 5; the sheet with no numbers on the SIP form with the carrier link, .b), 5 Rationale with the three links. Owner ask of 26 Sep: add a child section **UI Explorations** with 3 to 5 native variations of the first hero screen (the Go live sheet at step 3: source rows, the number picked, Call policy expanded with 10 min, 30 s and two rules ticked, Transfer collapsed reading None, Cancel and Go live), each meticulously built from the kit on page 31:2 with variables bound, never detached, hero screens only, nothing interactive, grounded in Refero and tagged with its source per `explorations/brief.md` (Zendesk Talk flows 1358 and 1396 for the end-on-a-call idea; Polar `6a15e519-29fb-4056-bddb-677b5588de88` and Dock `37832ac7-0494-4d45-b433-edfb5cffc4db` for a compact side sheet with grouped controls; Fingerprint `4b844e0b-0d1e-4067-a812-aec62749fe88` for rule groups with boolean toggles; X `7cc96857-b010-4877-95ba-edb87fe78de7` and Typefully `8707db0a-550a-4967-b737-b3f10c5cabe2` for a dark checkbox rule list; Cursor `33c42658-b8ed-47d5-86bf-ab702d4b24a6` for a disclosure fold). Logos: none, since no vendor module or carrier is named on this screen (the API has no carrier field); lucide `PhoneIncoming`, `ChevronDown` and the tick are the only glyphs; a carrier wordmark may appear only in a variation that shows the .b carrier link, tagged as a logo. Load `figma:figma-use` first.
