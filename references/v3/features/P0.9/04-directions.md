# P0.9 Let callers reach the agent · Directions

Track: **v3**. Constraints: extend P0.8's Go live sheet and Numbers row, do not redraw; existing design system only; one door per action; no control for what Agora does by default (every limit empty means none, every end rule off, port hidden); empty first, quiet chrome; locked words (number, deployment, Go live, session, SIP protocol, transfer; "call" only inside the API name call policy; never connect, disconnect, line, DID, phone call, publish, activate); the v3 API's `Number.inbound { agent, call_policy }` with `end_call` and `transfer`, `sip_trunk` with `auth` and `allowed_ips`, no health field, no lifecycle on a number, no purchase; the KPI (a first answered call within 10 minutes of Go live) and its counter (stalled deployments); P3.2 and P3.3 will reuse whatever sheet this row makes.

## Three directions

### 1. One sheet, two folds (the extension)
Keep P0.8's sheet as the one door and grow it under the number pick: two collapsed folds on P0.3's fold row, **Call policy** (Max duration in minutes, Max silence in seconds, four end-rule checkboxes) and **Transfer** (the E.164 number and one line saying when to hand over), each with a value line when collapsed, a gray tick when configured, and nothing pre-filled. Go live saves the number and the policy in one request; a number that already has a policy pre-fills the folds when picked. The SIP form gains Allowed IPs and field errors; with no numbers the sheet opens on the SIP form with one sentence and the carrier checklist link. After Go live the Numbers row carries the policy summary and the reach line with Dial it, and its `…` menu reopens the same sheet as Edit number. The confirm for a moved number sits at the press. Nothing new in the design system; P3.3's per-number edit is this sheet already.
Research: `shots/before-02-connect-number-sheet.png` (both doors in one sheet today), `competitors/product/elevenlabs/elevenlabs-17-sip-trunk-form.png` and `livekit-17-inbound-trunk-form.png` (the allowlist as a plain named field), `livekit-17-trunk-json-editor-validation.png` (the error on the field), `shots/refero-zendesk-03-incoming-call-demo.png` (the flow ends on a real inbound call, ported as the row's reach line).

### 2. Policy rows on the Deployment tab (Readiness · Retention · Call policy · Transfer · Numbers)
Give the call policy and the transfer their own rows in P0.8's tab, in the Agent tab's row style, set before Go live like Retention, and send them with the PATCH when the number is picked. Everything is visible without opening a sheet, and the Deployment tab reads as one page of decisions. But the policy lives on the number, not the agent: before a number exists Studio would hold the values as its own state and replay them at Go live, a second source of truth the API cannot read back; every inbound agent grows two more rows whether or not Sam wants a policy, against quiet chrome; a second number on the same agent could carry a different policy and the rows could not show two; and P3.3 would need a separate sheet for the per-number edit, so the same fields would be drawn twice.
Research: `shots/before-01-inbound-deploy-tab.png` (the tab as a list of rows), PRD P0.8 (Retention as a row that also cannot yet live on the number, requirement 46), PRD P3.3 (the per-number edit reuses this row's sheet).

### 3. Go live first, policy after (the Zendesk stepper)
Point the number with P0.8's sheet as it is, then make the policy a second step after Go live: the Numbers row shows the number with **Set call policy** and a checklist, in the shape of Zendesk Talk's numbered setup, ending on the dial prompt. The first Go live is as short as today and the KPI's active part cannot grow. But it is two doors and two saves for one job the PRD writes as one (steps 1 to 3 before step 4); a number goes live with no end rule and no transfer by default and most will stay that way, since the second step is optional; the Console has no stepper chrome and a checklist card under a row is a new pattern; and the confirm and the field errors still have to be built in the first sheet, so the split saves nothing.
Research: `shots/refero-zendesk-01-number-assigned.png` and `refero-zendesk-02-call-test-offline.png` (the numbered stepper and the checklist card), `competitors/product/retell/retell-17-sip-trunk-form.png` (a number saved first, its agents assigned later, as Retell does).

## Audit

Scored 1 to 5 (5 best).

| Criterion | 1 One sheet, two folds | 2 Policy rows | 3 Go live first |
|---|---|---|---|
| Extend, do not redraw (P0.8's sheet and row) | 5 | 3 | 3 |
| One door per action (Go live, Edit, Dial it, Carrier checklist) | 5 | 3 | 2 |
| API fit (policy on `Number.inbound`, one request, reads back) | 5 | 2 | 4 |
| Empty first, quiet chrome | 5 | 2 | 4 |
| Rainy .b to .h in one place | 5 | 3 | 3 |
| KPI: first answered call within 10 min, without slowing the active part | 4 | 3 | 5 |
| Room for P3.2 and P3.3 (every number, per-number edit) | 5 | 2 | 3 |
| Touches P0.3 to P0.8 (in review) | 4 (P0.3's session line, P0.8's row menu and toast) | 3 | 4 |
| **Total / 40** | **38** | **21** | **28** |

Cut: 2 puts the policy where the API cannot keep it and draws the fields twice; 3 splits one job into two doors and ships most numbers with no policy.

## Pick: direction 1, one sheet, two folds

1. **The policy lives on the number, so it is set where the number is picked.** `POST` and `PATCH /numbers` carry `inbound.call_policy` beside `inbound.agent` (ih7axj9zx snapshot, requirement 48); one sheet, one request, and `Number.inbound` reads it back for the row summary and the edit sheet. No Studio-held state, no replay.
2. **Collapsed, empty, honest.** The API defaults every limit to none and every end rule to off, so the folds open empty with "Ends when the caller hangs up." and "None" as their value lines, tick gray only once Sam sets something, and pre-fill only from a number that already has a policy; the fold row, the tick and the checkbox list are P0.3's (`parts/advanced.tsx`, New run's Session limits fold as the sibling).
3. **The error shows on the field.** LiveKit is the one vendor with a field-level SIP error (`competitors/product/livekit/livekit-17-trunk-json-editor-validation.png`); a 409 lands under Phone number and names the way out, a bad host is caught before sending with the spec's own pattern, an E.164 slip lands under Transfer to (.c, .e).
4. **The row ends on a call, not a checkmark.** Only Zendesk Talk walks the person to a real inbound call (`shots/refero-zendesk-03-incoming-call-demo.png`), and the design office's A3 rule already says the flow ends on a user-placed call; with no health field in the API, the row says what Studio knows, "Not reached yet. Dial it to hear the agent." with a `tel:` link and the carrier checklist, then "First session today, 14:12." from the sessions list (.f, .h, the KPI's first answered call).
5. **Named like the carrier names it, and the allowlist is a field.** SIP host, SIP protocol, Username, Password, Allowed IPs with "Empty allows any address." (`competitors/product/elevenlabs/elevenlabs-17-sip-trunk-form.png`, `livekit-17-inbound-trunk-form.png`, `shots/twilio-01-sip-trunking-docs.png`); with no numbers the sheet says Agora has none to sell in one sentence and links the checklist, instead of a gate found by trying (`competitors/product/retell/retell-16-buy-number-identity-gate.png`).

## Questions for the owner (max 3)

1. **Which spec ships in October?** The `ih7axj9zx` snapshot has `call_policy` on `Number.inbound` and the PRD says Ready; the `3.0.0` snapshot, byte-identical to the live docs on 24 Sep, has `agent` alone. The build follows ih7axj9zx; the fallback (both folds as one line each, "Not on a number yet.", no row summary) is specified. Confirm, or the folds ship dark.
2. **Where does the carrier checklist link go?** The v3 docs have a Numbers reference and no carrier walkthrough (Twilio, Telnyx) yet. The link targets the Numbers reference until one exists; should docs write the checklist before 16 Oct, and should it be a fold inside the sheet rather than a link?
3. **Units and the row menu.** Max duration is shown in whole minutes and Max silence in whole seconds (the API stores seconds and milliseconds; P3.3.c), and the Numbers row gets a `…` menu with Edit and Remove in place of P0.8's lone Remove button so a number that went live before this row can get a policy. Keep both, or keep P0.8's button and defer Edit to P3.3?
