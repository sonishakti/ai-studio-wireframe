# 17 · SIP trunk setup: Before, and what is wrong with it

**Before:** `references/research/_before10-2026-09-17/before-17-18-channels.png`
Live: <https://ai-studio-console-redesign.vercel.app/integrations?tab=channels>
Source: `studio_x_2/components/channels-panel.tsx` is the shot. Its one button opens
`components/add-phone-number-sheet.tsx`, whose Quick connect branch is
`components/sip-quick-connect.tsx`. The only per-number surface is
`app/(dashboard)/deploy/phone-numbers/[id]/number-client.tsx`. The address 11 sends people to,
`app/(dashboard)/deploy/telephony/page.tsx`, is five lines of redirect. Everything but the redirect
was last touched 2026-09-12 (`0ac8422`); the redirect has not changed since the fork, 2026-06-24
(`89dbe05`). The same job in the real Console is
`ng-console/src/features/telephony/phone-numbers/phone-number-details-section.tsx` plus
`src/lib/telephony/phone-number-contracts.ts`.

What is on screen: one table with five columns, Channel · Type · Agent · Status, seven rows of which
three are phone numbers, and one primary button, "Connect a number (SIP)". The button opens a sheet
with two branches, Quick connect and Manual SIP. Nothing on the table says which carrier carries a
number, what its trunk address is, or whether a call has ever got through it.

Five of the eight roadmap tasks have no design at all in either codebase: gateway location per number,
the media IP allowlist, SIP header customization, trunk capacity and SIP Direct Connect have no screen,
no field and no row.

## What is wrong

1. **There is no trunk.** The whole of `PhoneNumber` is `id · number · label · vendor · assignedTo ·
   assignedAgent · status` (`studio_x_2/lib/campaign-data.ts:393-403`): no SIP address, no credential
   reference, no allowlist, no region, no capacity, no last successful call. The A3 card named the
   missing object in July, "Deployment/channel gains `sipTrunk: { provider, status, credentialRef }`"
   (`references/roadmap-features-prd-2026-07-09.md:190`), and it was never built, so all eight tasks
   have nowhere to put their value. Fails JTBD rainy 23 ·
   [868ka68vw](https://app.clickup.com/t/868ka68vw).

2. **Feature 11 sends three fix links to this screen and there is nothing on it to fix.** The 403
   verdict points at `/deploy/telephony` (`studio_x_2/lib/sip-trace.ts:96`), "Raise the CPS limit"
   points at the same place (`:195`), and the degraded batch's "Check the trunk" button points at
   `/integrations?tab=channels` (`studio_x_2/components/batch-detail.tsx:123`).
   `app/(dashboard)/deploy/telephony/page.tsx` redirects to that same channels table, which is the
   Before shot: no trunk address on it, no credential, no CPS. Fails JTBD rainy 16 ·
   [868ka6b50](https://app.clickup.com/t/868ka6b50).

3. **Quick connect claims a capability no vendor in the market has, and the claim is four
   `setTimeout` calls.** The carrier card says "we configure the SIP trunk"
   (`studio_x_2/components/sip-quick-connect.tsx:158`), the fact log says "Creating SIP trunk"
   (`:116`) and "Routing configured · inbound to Agora edge, outbound to your trunk" (`:118`), and
   the work behind all of it is `:100-108` and `:117-124`. No vendor provisions a trunk from a carrier
   API key: Vapi and Retell walk the user through the carrier's own portal, and ElevenLabs' Twilio SID
   and Token only rewrite an existing number's webhook (`03-learnings.md` learning 1). Honesty floor.
   Fails JTBD rainy 4 · [868kfdnxz](https://app.clickup.com/t/868kfdnxz).

4. **The provisioning line prints a hostname Telnyx does not own.** `sip-quick-connect.tsx:116` builds
   `sip:agora-4f2a.pstn.${provider}.com`, so picking Telnyx logs `pstn.telnyx.com`. `.pstn.twilio.com`
   is Twilio's termination suffix and nobody else's; Telnyx's realm is `sip.telnyx.com`
   (`02-research/_docs.md`, Vapi and Retell's Telnyx guides). A user who copies that line into Telnyx
   support has been given a fabricated address. Fails JTBD rainy 4 ·
   [868kfdnxz](https://app.clickup.com/t/868kfdnxz).

5. **Connect Telnyx and the success screen says Twilio.** The Quick connect hand-back is
   `vendor: f.vendor || "Twilio"` (`studio_x_2/components/add-phone-number-sheet.tsx:125`) and nothing
   in the quick branch ever sets `f.vendor`, so the summary at `:216` reads Vendor · Twilio whichever
   carrier was connected. Two lines above it, `:215` prints SIP Domain · `sip.domain.com` and `:213`
   prints `+1 (555) 789-4734`: placeholders rendered as stored facts. Fails JTBD rainy 2 ·
   [868kfdnxz](https://app.clickup.com/t/868kfdnxz).

6. **Four carrier lists, and not one of them is the contract.** Quick connect offers two,
   `Provider = "twilio" | "telnyx"` (`sip-quick-connect.tsx:37`). Manual SIP offers four, Twilio ·
   Vonage · Bandwidth · Telnyx (`add-phone-number-sheet.tsx:140-143`). The number page offers the same
   four again (`number-client.tsx:117`). The real Console offers one, disabled, labelled "SIP Trunk"
   (`ng-console/src/features/telephony/phone-numbers/phone-number-details-section.tsx:109`), and its
   create path hardcodes `source: "twilio"`
   (`phone-number-quick-import-sheet.tsx:130`). The SDK enum is `byo | twilio`. The mock inventory
   carries Twilio, Vonage and Bandwidth and no Telnyx at all
   (`studio_x_2/lib/campaign-data.ts:1612-1650`). Fails JTBD rainy 2 and 3 ·
   [868kfdnxz](https://app.clickup.com/t/868kfdnxz).

7. **Every SIP field on the number page is decorative, and two of them are fiction.** `FieldInput`
   binds `defaultValue`, never `value` or `onChange`
   (`studio_x_2/app/(dashboard)/deploy/phone-numbers/[id]/number-client.tsx:272-279`). SIP Trunk
   Address is passed no `value` prop at all (`:119`), so the field is empty on every number that has
   one. Username renders the literal `user123` (`:120`) and Password renders sixteen bullet characters
   (`:121`) for every number in the product. Save says "Phone number saved (mock)" (`:76`). The
   address placeholder, `agora-us-swym-us.pstn…`, is none of the three hosts Agora publishes,
   `sbc-us-west-1.viblinx.com` · `sbc-sa-east-1.viblinx.com` · `sbc-ap-south.viblinx.com`. Fails JTBD
   rainy 12 and 23 · [868kubh4r](https://app.clickup.com/t/868kubh4r).

8. **Every number the real Console has ever created allows exactly one IP address, and it is nobody's
   carrier.** `buildPhoneNumberBody` falls back to `["1.1.1.1"]` when no allowed addresses are passed
   (`ng-console/src/lib/telephony/phone-number-contracts.ts:85-88`), and the create path passes no
   options (`phone-numbers-route-module.tsx:232`). No screen reads the value and no screen writes it.
   The SDK's own example for the field is a CIDR block, `112.126.15.64/27`, so 868kubvnp does not need
   a new field: it needs this one to stop being a constant. Fails JTBD rainy 7 and 8 ·
   [868kubvnp](https://app.clickup.com/t/868kubvnp).

9. **The status vocabulary has two words and neither is about the connection.** `PhoneNumber.status`
   is `"active" | "unassigned"` (`studio_x_2/lib/campaign-data.ts:402`) and the channels table adds
   only `scheduled` (`components/channels-panel.tsx:44`). Active means an agent is bound to the
   number. There is no word for connected but never called, for credentials the carrier now rejects,
   or for a password security rotated in January. Feature 11 can already name four attributions in the
   same product (`lib/sip-trace.ts:76`), so the ladder can explain a failure the inventory cannot
   report. Fails JTBD rainy 5 and 23.

10. **The Before shot prints a comma where an agent should be, and no row opens the thing it names.**
    The unassigned Toll-Free row is seeded `backs: ", "`
    (`studio_x_2/components/channels-panel.tsx:55`), which renders as a bare comma in the Agent column,
    visible in `before-17-18-channels.png`. All three phone rows link to `/deploy/phone-numbers`
    (`:49`, `:50`, `:55`), the list, so clicking Support Line does not open Support Line. Carrier is not
    a column, which on a bring-your-own-SIP platform is the one fact the inventory exists to carry.
    Fails JTBD rainy 2 and 11.

11. **The only in-product link to the setup instructions is a 404.** The help page offers "Setting up
    Twilio as a telephony vendor" at
    `https://docs.agora.io/en/conversational-ai/voice-call/sip-twilio`
    (`studio_x_2/app/(dashboard)/help/page.tsx:46`), which returned 404 when checked on 2026-09-17.
    The sheet's own help box links the docs root instead (`add-phone-number-sheet.tsx:193`). The page
    that carries the three Origination URIs and the per-country ACL,
    `/en/conversational-ai/studio/deploy/sip-trunk`, resolves and nothing in the product points at it,
    which is how a customer in Mumbai ends up pasting the US address. Fails JTBD rainy 9 ·
    [868kubh4r](https://app.clickup.com/t/868kubh4r).

12. **Manual SIP says "added successfully" having proved nothing.** `handleAdd` moves straight to the
    success phase off six filled fields (`add-phone-number-sheet.tsx:72-79`) and the banner reads
    "Phone number added successfully!" (`:209`). Quick connect earns that screen with a real call
    (`sip-quick-connect.tsx:127-139`); Manual SIP reaches the identical screen with an untested trunk,
    and A3 durable rule 1 is that provisioning success is not call success. Fails JTBD rainy 5 and 6 ·
    [868kfdnxz](https://app.clickup.com/t/868kfdnxz).

13. **The capacity number is a seed, and the one sentence that prices raising it is deleted on two of
    its three mounts.** `cps: { target: 3 }` and `retry: { max: 3 }` are hardcoded four times
    (`studio_x_2/lib/campaign-data.ts:1447`, `:1481`, `:1516`, `:1555`) and rendered as two read-only
    tiles (`components/batch-detail.tsx:167-168`); no control anywhere in either codebase sets a CPS
    target, a trunk capacity or a retry policy. `components/concurrency-card.tsx:340-343` shows the
    headroom line only when `capHeadroomUsd` is not null, and both
    `components/wizard/step-call-settings.tsx:484` and `app/(dashboard)/monitor/live/page.tsx:214`
    pass `capHeadroomUsd={null}`, so opening the same sheet from the builder or from Live loses it.
    Fails JTBD rainy 15 and 18 · [868ka6b50](https://app.clickup.com/t/868ka6b50).

14. **Transfer has one box, no method and no fallback.** The number page offers a single Transfer
    Destination input under the line "Detects automatically between Phone, E.164, and SIP"
    (`number-client.tsx:176-177`), and the real Console's wire shape is the flat
    `transfer_config: { description, enabled, phone_number }`
    (`ng-console/src/lib/telephony/phone-number-contracts.ts:156-162`) behind an "Enforce E.164
    format" checkbox. There is no REFER versus conference choice, no ringing timeout and nothing that
    says what happens to the caller when the destination does not answer, while LiveKit states the
    carrier precondition outright and Twilio ships it as a labelled toggle. Fails JTBD rainy 20 ·
    [868kubh2w](https://app.clickup.com/t/868kubh2w).

15. **The sheet says the same thing twice and highlights the same state two ways.** "Bring a number you
    already own. Agora routes it, and doesn't sell or port numbers."
    (`add-phone-number-sheet.tsx:95-97`) sits four rows above "You bring a number you already own.
    Agora doesn't sell or port numbers." (`sip-quick-connect.tsx:206-207`), both on screen at once in
    Quick connect. In the same sheet the mode toggle marks selection with a tint and no ink border
    (`add-phone-number-sheet.tsx:112`, `:115`) while the carrier cards use `border-primary/60`
    (`sip-quick-connect.tsx:154`). Two sentences and two selected states for one surface, against the
    standing rule that things that belong together look the same.

## What is right, and must survive any redesign

- **One door.** `AddPhoneNumberSheet` is mounted eight times across six files
  (`deploy/phone-numbers/page.tsx:57`, `:72`, `:88`, `components/channels-panel.tsx:80`,
  `components/channel-hero.tsx:95`, `components/defector-flow.tsx:344`,
  `components/wizard/channel-section.tsx:346`, `components/wizard/campaigns-card.tsx:483`), so
  anything added inside it reaches every entry point at once. 17 gets no second door.
- **The flow ends on a call the user places**, not a saved checkmark (`sip-quick-connect.tsx:272-299`).
  Not one of the five vendors does this (`02-research/_docs.md`, Verification, in one line).
- **The append-only fact log instead of a spinner** (`:222-235`), and capability stated before the
  choice, with the outbound-only row dead rather than hidden (`:241-268`).
- **Disconnect is not revocation**, said in words (`:313-315`).
- **Scoped key preferred, Auth Token labelled as the weaker fallback** (`:194-199`).
- **Paced is not failed**: `PACING_META` keeps Paced primary and only degraded destructive
  (`lib/campaign-data.ts:356-364`), and the wall is information, not alarm
  (`components/concurrency-card.tsx:37-38`).
- **Agora sells no numbers**, and the copy already says so.
