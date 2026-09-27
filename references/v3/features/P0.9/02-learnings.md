# P0.9 Let callers reach the agent · Learnings

Research phase done 26 Sep (`02-research.md`, 16 shots: 8 files in `shots/`, 8 reused from `competitors/product/*`). Order followed: the row's existing product shots for Vapi, Retell, ElevenLabs and LiveKit (reused, none re-captured), the SIP and number desk notes (`research/16-phone-number-purchase`, `research/17-sip-trunk-setup`), Refero for the one named gap (a first-session confirmation after pointing a number, found only in Zendesk Talk), one live capture of Twilio's SIP trunking doc page, and the prototype's own before shots. Refero has no authenticated screens for any of the four voice-AI vendors' number or SIP pages. No vendor and no Refero screen shows a call policy on a number, an agent-initiated transfer set at Go live, or a "not reached yet" line; those are designed from the API shape and the row's own recovery text.

## 1. Nobody ends number setup on a call; Zendesk Talk does, and so should we

- Every vendor's number flow ends on a saved row: Retell's import modal, ElevenLabs' SIP form, LiveKit's Create, Vapi's API call (`competitors/product/retell/retell-17-sip-trunk-form.png`, `elevenlabs-17-sip-trunk-form.png`, `livekit-17-inbound-trunk-form.png`). Zendesk Talk alone walks the person to a real inbound call and will not let the step pass without one: a checklist beside a live status card, then a simulated incoming call with Accept, then a ticket link (`shots/refero-zendesk-02-call-test-offline.png` region 720,286,240,269; `refero-zendesk-03-incoming-call-demo.png` region 720,252,240,437; `refero-zendesk-04-in-call-ticket.png`). The design office's own A3 rule says the same: the flow ends on a user-placed call, never a saved checkmark.
- **Change:** the row does not end on the toast. After Go live the number's row reads "Not reached yet. Dial it to hear the agent." with **Dial it** as a real `tel:` link and the carrier checklist beside it, and the line turns into "First session today, 14:12." when the first inbound session lands. The stepper and the presence toggle are not ported: a voice agent has no online state, and the Console has no wizard chrome.

## 2. The error belongs on the field, and the vendor that does it is LiveKit

- LiveKit's trunk editor is the one place in this research with a field-level SIP error, "Field 'name': Required", "Field 'numbers.0': Empty numbers are not allowed." (`competitors/product/livekit/livekit-17-trunk-json-editor-validation.png` region 2048,1720,1128,152); Vapi publishes one error string for three causes and no form at all (`research/17-sip-trunk-setup/02-research/_docs.md`); ElevenLabs shows a form error but under the form (`competitors/product/elevenlabs/sip-trunk-form-validation-error.png`).
- **Change:** a 409 on the number lands as a `FieldError` under Phone number and names the way out (pick it under A number in this project); a bad host lands under SIP host and is caught before sending with the spec's own pattern; an E.164 slip lands under Transfer to. No banner, no toast for a field's fault; P0.1's `Alert` only for a failure that has no field (a 5xx).

## 3. Name the allowlist, and say what empty means

- ElevenLabs names "Allowed Source IP Addresses (Optional)" with the default spelled out, "Leave as 0.0.0.0/0 to allow all addresses" (`competitors/product/elevenlabs/elevenlabs-17-sip-trunk-form.png` region 2016,1304,1160,456); LiveKit's "Allowed addresses" sits as a plain field beside "Numbers" (`competitors/product/livekit/livekit-17-inbound-trunk-form.png` region 2048,624,1128,368); Twilio's doc nav has an IP Access Control List page (`shots/twilio-01-sip-trunking-docs.png` region 24,296,456,1224). Our SIP form has no such field (`shots/before-03-sip-trunk-fields.png` region 2344,256,840,720) although `sip_trunk.allowed_ips` is in the spec.
- **Change:** **Allowed IPs** is the last SIP field, optional, one CIDR per line, with "Empty allows any address." in its (i). The spec makes `auth` optional too, so the footer reason line asks for a username and password or the allowed IPs, and lets either through.

## 4. Two doors in one sheet already; keep it, and disclose the gate early

- Our own sheet holds both sources as radio rows (`shots/before-02-connect-number-sheet.png` region 2344,96,840,272), tighter than Retell's two-item menu (`competitors/product/retell/retell-16-add-number-menu.png`). Retell also hides an identity gate until the moment a number is added (`retell-16-buy-number-identity-gate.png` region 1176,832,848,336), the pattern to avoid.
- **Change:** the source rows stay P0.8's. With no numbers in the project the sheet says so in one sentence, opens on the SIP form, and links the carrier checklist; nothing pretends a purchase exists, and nothing is discovered by trying.

## 5. A per-number state must be honest about what it knows

- Vapi's red "Unprovisioned" badge is the only per-number state in the market, and it is a provisioning flag, not proof that calls arrive (`competitors/product/vapi/sip-phone-number-unprovisioned.png` region 1448,109,192,35). The v3 API has no health field at all.
- **Change:** the row never says healthy, verified or ready. It says what Studio can read: the policy summary from `Number.inbound`, and "Not reached yet" or "First session {time}" from the sessions list. Gray text, no badge, no red; the only colour in the row is the destructive tint on Remove.

## 6. Every control gets the carrier's name for it, and the policy gets the API's

- Twilio's nav turns each control into a named page, Termination, Origination, Numbers, Codecs, Calls per Second, Call Recording, Secure Trunking (`shots/twilio-01-sip-trunking-docs.png`); our copy rules ask for the same discipline. No vendor has a per-number call policy (Retell's limits are workspace-level), so there is no vendor name to borrow for it; the v3 API calls it `call_policy` and the PRD row uses "call policy" throughout.
- **Change:** the fields read SIP host, SIP protocol, Username, Password, Allowed IPs; the folds read **Call policy** (the one place "call" appears, as the API name the vocabulary allows) and **Transfer**; the four end rules are written as the moments they name, "When the conversation is complete", "When the caller asks to end it", "When a fax machine answers", "When another AI assistant answers", all off until ticked, exactly as the spec defaults them.

## 7. Learnings that change the design

1. The Go live sheet grows two folds on the P0.3 fold row, Call policy and Transfer, collapsed and empty first; Go live saves the number and the policy in one PATCH or POST.
2. The Numbers row grows a second line (the policy summary) and a third (the reach line with Dial it and Carrier checklist) and a `…` menu with Edit and Remove, so a number that went live before this row can still get a policy, and P3.3 has its sheet.
3. The re-point warning becomes a confirm at the press, naming the agent that loses the number (.d).
4. P0.3's inbound session line stops saying "no per-number setting" and links to Max silence (.g).
5. Refero's contribution is a pattern, not a screen: the end-on-a-call idea from Zendesk Talk, and generic side-sheet and checkbox-rule layouts for the UI Explorations (`explorations/brief.md`).
