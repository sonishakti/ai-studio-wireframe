# 17 · SIP trunk setup: learnings from five competitor environments

Evidence: `02-research/_docs.md` (public docs, fetched 2026-09-17) against `00-brief.md`'s eight tasks.
Vendors: Vapi · Retell · ElevenLabs · LiveKit, plus Twilio Elastic SIP Trunking, added because half of this
job happens in the carrier's console and Twilio is the console the other four's carrier guides are written
against.

## Learnings

1. **No vendor provisions a trunk from a carrier API key, so Quick connect has to be a named guided path
   rather than an auto path**: Vapi's Telnyx page walks the user through Telnyx's own portal and never calls a
   Telnyx API (https://docs.vapi.ai/advanced/sip/telnyx), Retell's Twilio and Telnyx guides do the same
   (https://docs.retellai.com/deploy/twilio), and the one credential flow that exists, ElevenLabs' four-field
   "Label · Phone Number · Twilio SID · Twilio Token", only "automatically configures the Twilio phone number
   with the correct settings" on a number that already exists
   (https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration), which
   settles open question 2 in `00-brief.md` before Engine answers it and means `sip-quick-connect.tsx`'s
   `setTimeout` provisioning stage is modelling a thing nobody ships.

2. **The carrier is prose at all four and a field at none, so fixing the disabled `twilio` select is a label on
   the trunk and not a wait for a `telnyx` enum value**: Vapi has one `byo-sip-trunk` credential behind five
   carrier doc pages (https://docs.vapi.ai/advanced/sip/sip-trunk), Retell one `termination_uri` behind four
   (https://docs.retellai.com/api-references/import-phone-number), LiveKit names seven tested providers against
   a single trunk object (https://docs.livekit.io/sip/), and ElevenLabs' only carrier-shaped path is Twilio,
   which means `phone-number-details-section.tsx:109` and the four disagreeing carrier lists in `00-brief.md`
   are a naming problem our own UI can close against the existing `byo | twilio` contract.

3. **The IP allowlist is an authentication mode with a stated alternative, and it only ever covers signalling**:
   ElevenLabs falls back to "Access Control List (ACL) authentication" when no digest credentials are given
   (https://elevenlabs.io/docs/agents-platform/phone-numbers/sip-trunking), LiveKit requires "either a username
   and password for authentication or the `allowed_addresses` parameter"
   (https://docs.livekit.io/sip/trunk-inbound/), and Vapi's `gateways[].ip` array is itself the allowlist while
   the same site calls US RTP media "dynamic" (https://docs.vapi.ai/advanced/sip/sip-networking), so
   `inbound_config.allowed_addresses` belongs beside Username and Password on the number form, its hardcoded
   `["1.1.1.1"]` (`phone-number-contracts.ts:85-94`) is an auth decision and not a placeholder, and the media
   half of 868kubvnp ships as Agora's published signalling IPs to paste at the carrier rather than a second
   CIDR box we cannot enforce.

4. **Gateway region is a property of the address you were handed, never a per-number dropdown, so 868kubh4r
   should record the customer's choice rather than invent a routing setting**: Vapi splits into `sip.vapi.ai`
   and `sip.eu.vapi.ai` and warns to "Keep the API region and SIP host in the same region", ElevenLabs sells
   `sip-static.rtc.<region>.residency.elevenlabs.io` as a plan feature, LiveKit's only region field is
   `destination_country`, "Two-letter country code for call termination routing" on the outbound trunk
   (https://docs.livekit.io/sip/api/), and Twilio ranks up to ten Origination URIs by priority and weight in
   the carrier console (https://www.twilio.com/docs/sip-trunking), which matches Agora's three SBC Origination
   URIs exactly: the field to add is which one the customer pasted, shown read-only next to the SIP trunk
   address.

5. **Only Retell turns the trunk ceiling into a control, and it queues instead of dropping, which gives D1 and
   feature 11's dead fix links a proven shape to copy**: "CPS (Calls Per Second) controls how many outbound
   calls you can initiate per second", outbound excess is "queued, not rejected", inbound at the ceiling waits
   about 40 seconds and then transfers to the number's `fallback_number` before ending with
   `concurrency_limit_reached`, and all of it is adjustable from Settings > Limits with a separate CPS card per
   telephony provider (https://docs.retellai.com/deploy/concurrency), whereas Vapi tells the customer to build
   a queue in Twilio with `<Enqueue>` and Redis (https://docs.vapi.ai/calls/call-queue-management) and LiveKit
   ships no CPS, queue or retry at all, so "Raise the CPS limit" (`lib/sip-trace.ts:195`) can point at a real
   per-provider limit row with a named exhaustion reason instead of a table with no CPS on it.
