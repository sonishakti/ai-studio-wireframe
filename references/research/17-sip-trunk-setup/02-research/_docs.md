# 17 · SIP trunk setup: the four vendors from their public docs (2026-09-17)

Docs only. The signed-in product is captured separately against the shot list at the end of this file.
Existing shots that already cover part of this ground: `references/competitors/product/livekit/livekit-17-{sip-trunks-list,inbound-trunk-form,outbound-trunk-form,dispatch-rule-form,trunk-json-editor-validation}.png`,
`references/competitors/product/elevenlabs/sip-trunk-form-{inbound,auth-outbound,validation-error}.png`,
`references/competitors/product/vapi/sip-phone-number-unprovisioned.png`. Retell has no 17 shot yet.

Six questions were put to every vendor, one per open question in `00-brief.md`:
is the carrier a field or a doc page · where does setup actually happen · is inbound auth a password or an IP
allowlist · is there a gateway region per number · can you set headers on the INVITE · what is the outbound
ceiling and what happens when you hit it. Transfer is handled once, below the table, because at every vendor it
is a precondition rather than a control.

---

## Vapi

**What the surface is called.** There is no trunk object in the Vapi dashboard. A trunk is a **credential** of
provider type `byo-sip-trunk`, and a number is a separate object of provider type `byo-phone-number` that
points at it by `credentialId`. Both are created with `curl` against the Vapi API using a Vapi private key. The
only carrier flow in the dashboard is **Import number from Twilio**, which takes a Twilio Account SID and Auth
Token.

**The fields.** Credential: `name`, `gateways[]` (each `ip` plus `inboundEnabled`),
`outboundAuthenticationPlan.authUsername` and `.authPassword`, `outboundLeadingPlusEnabled`. Number: `number`,
`credentialId`, `name`, `numberE164CheckEnabled`. The number's SIP URI is region-shaped:
`sip:YOUR_PHONE_NUMBER@<credential_id>.sip.vapi.ai` in the US, `@<credential_id>.sip.eu.vapi.ai` in the EU.

**The allowlist is the gateway array.** Vapi states it plainly: "Please ensure that you provide all the
signaling IP addresses when creating the SIP trunk. Failure to do so will prevent proper whitelisting, which
may result in encountering unauthorized 401 errors for inbound calls." There is no separate allowlist control,
because `gateways[].ip` *is* the allowlist.

**What it refuses.** "Use IP addresses in `gateways`. FQDNs like `sip.telnyx.com` return a `400 Bad Request`."
Inbound gateways must be IPv4. `inboundEnabled` defaults to `true`, and that default is one of the three
documented causes of the single error string Vapi publishes: "Couldn't validate SIP trunk credential. SIP
gateway creation failed." There is no validation action, no test call and no dashboard form for any of it.

**Signalling and media are published as two different things.** Signalling: `sip.vapi.ai` at
`44.229.228.186/32` and `44.238.177.138/32` (US), `sip.eu.vapi.ai` at `63.182.83.170/32` (EU), ports 5060 and
5061. RTP media in the US is "dynamic": "Vapi does not use static IP addresses for RTP media." In the EU it is
`63.182.83.170` with UDP 40000 to 60000, and "the entire range must be open for reliable media flow."

**Region.** Two of them, expressed as a host pair, with an instruction not to cross them: "Keep the API region
and SIP host in the same region." Nothing per number.

**Headers.** Inbound only, and only as a variable source: "To fill template variables, send custom SIP headers
with your call." Nothing sets headers on an outbound INVITE.

**Ceiling.** `subscriptionLimits` on the call response carries `concurrencyBlocked`, `concurrencyLimit` and
`remainingConcurrentCalls`; lines are bought at Settings > Billing under "Reserved Concurrency (Call Lines)".
No CPS anywhere. No queue either: the call-queue guide tells you to build one yourself in Twilio with
`<Enqueue>` and a Redis capacity counter.

**Carrier pages, all of them walkthroughs of the carrier's own portal.** Twilio, Telnyx, Zadarma, Amazon Chime
SDK, DIDWW. The Telnyx page is the tell: the user creates the trunk, the credential and the outbound voice
profile inside Telnyx, sets the Translated Number to `sip:<unique-id>@sip.vapi.ai`, then pastes Telnyx's
gateway IPs, username, password and realm `sip.telnyx.com` into Vapi. Vapi never calls a Telnyx API.

URLs: https://docs.vapi.ai/advanced/sip · https://docs.vapi.ai/advanced/sip/sip-trunk ·
https://docs.vapi.ai/advanced/sip/sip-networking · https://docs.vapi.ai/advanced/sip/telnyx ·
https://docs.vapi.ai/advanced/sip/troubleshoot-sip-trunk-credential-errors ·
https://docs.vapi.ai/phone-numbers/import-twilio · https://docs.vapi.ai/calls/call-concurrency ·
https://docs.vapi.ai/calls/call-queue-management

---

## Retell AI

**What the surface is called.** "Import Phone Number." There is no trunk object at all: the number carries the
trunk. Retell's own position is one sentence and it is the most useful sentence any vendor writes on this job:
"Retell does not have a termination SIP URI of its own. `sip:sip.retellai.com` is Retell's only SIP address."

**The fields.** `phone_number` (E.164), `termination_uri` ("The termination uri to uniquely identify your
elastic SIP trunk. This is used for outbound calls. For Twilio elastic SIP trunks it always end with
'.pstn.twilio.com'."), `sip_trunk_auth_username`, `sip_trunk_auth_password`, `nickname` ("This is for your
reference only."), `inbound_webhook_url`, and `inbound_agents[]` / `outbound_agents[]` whose members carry
`agent_id`, `agent_version` and `weight`.

**Transport is a suffix, not a radio group.** `sip:sip.retellai.com;transport=tcp` is the recommended form; udp
and tls are the alternatives.

**The allowlist is published, not edited.** Retell gives CIDR blocks for the customer to allowlist at their
carrier: `18.98.16.120/30`, `3.42.144.0/23`, `153.57.128.0/18` (All regions), `143.223.88.0/21` and
`161.115.160.0/19` (certain United States traffic). Retell's own inbound auth is either that carrier-side
whitelist or the username and password on the import form.

**What it refuses.** If you connect by the "Dial to SIP URI" method rather than an elastic SIP trunk, "you will
not be able to use Retell's transfer call feature." That is a capability stated as lost, on the setup page, at
the moment of the choice that loses it.

**Headers, both directions, as an ordinary control.** Outbound: a key and value editor in the UI on the
outbound call, "Each must start with `X-`", and dynamic variables are allowed as values. Inbound: headers
"starting with `X-` or `x-`" are "received and extracted automatically into `call.custom_sip_headers`" and are
also exposed as dynamic variables with the prefix stripped. No configuration needed on the inbound side. The
page also names the practical size limit: "Many SIP parsers and middleboxes assume 1024 bytes is a reasonable
maximum for a header line."

**Ceiling, and the only real answer in the market.** Settings > Limits carries "Adjust Concurrency", a per
telephony provider card with "Adjust Limit" for CPS, a concurrency burst toggle, and
`reserved_inbound_concurrency` ("outbound calls can use at most your concurrency limit minus the reserved
amount"). "CPS (Calls Per Second) controls how many outbound calls you can initiate per second." Outbound
excess is "queued, not rejected." Inbound at the ceiling waits about 40 seconds for a slot, then transfers to
the number's `fallback_number` if one is set, and otherwise ends with `concurrency_limit_reached` or
`no_concurrency_fallback`. Pay-as-you-go workspaces start at 20 concurrent calls.

**Carriers with their own guide.** Twilio, Telnyx, Vonage, plus contact-centre platforms Avaya, Genesys Cloud,
Five9 and Amazon Connect. Every one of them is a walkthrough of that platform's portal.

URLs: https://docs.retellai.com/deploy/custom-telephony · https://docs.retellai.com/deploy/twilio ·
https://docs.retellai.com/deploy/telnyx · https://docs.retellai.com/deploy/vonage ·
https://docs.retellai.com/api-references/import-phone-number · https://docs.retellai.com/build/telephony/sip-headers ·
https://docs.retellai.com/deploy/concurrency · https://docs.retellai.com/deploy/inbound-call ·
https://docs.retellai.com/build/single-multi-prompt/transfer-call

---

## ElevenLabs (Agents Platform)

**What the surface is called.** Phone numbers, with two import paths side by side: **Twilio** (native
integration) and **SIP trunk**.

**Twilio native, the closest thing to a carrier key in this market.** Four fields: "Label", "Phone Number",
"Twilio SID", "Twilio Token", with API keys recommended over account-wide credentials. "ElevenLabs
automatically configures the Twilio phone number with the correct settings." It also reads capability off the
number: "Inbound + Outbound: Numbers purchased through Twilio" and "Outbound Only: Numbers verified as caller
IDs in Twilio", and if the number is neither it returns an error asking you to verify it exists in the Twilio
account. What it configures is the existing number's voice webhook. It does not create a trunk, and no
equivalent exists for any carrier other than Twilio.

**SIP trunk, the manual path.** Fields: "Label", "Phone Number", "Transport Type" (TCP, TLS, UDP), "Media
Encryption" (Disabled, Allowed, Required), an outbound "Address" that is a hostname or IP "without `sip:`
prefix", "SIP Trunk Username" and "SIP Trunk Password", and custom headers through an "Add Header" control.

**Auth is a two-mode choice, stated as such.** "Digest Authentication is strongly recommended." Without
credentials the trunk falls back to "Access Control List (ACL) authentication" by allowlisted IP address.

**Endpoints and region.** `sip.rtc.elevenlabs.io:5060` (TCP) and `:5061` (TLS). Enterprise gets
`sip-static.rtc.elevenlabs.io`, and regional residency gets `sip-static.rtc.<region>.residency.elevenlabs.io`.
Follow-up connections arrive from `<ip>.hosts.rtc.elevenlabs.io` under a wildcard certificate, which is why the
docs warn that "SIP requests may come from different IP addresses." Region is a hostname you are given on a
plan, never a per-number picker.

**Media.** G711 at 8 kHz, G722 at 16 kHz. TLS 1.2 minimum, both sides sharing a modern cipher suite. UDP is
"experimental; use TCP or TLS for production."

**Headers.** X- prefixed custom headers, User-to-User per RFC 7433 exposed as `{{sip_uui_raw}}` and
`{{sip_uui_data}}`, and BYE headers through an attributes-to-headers mapping.

**Ceiling.** Concurrency is a plan number, and queueing is a real object: `AgentQueueingConfig` with `enabled`
and `wait_timeout_seconds` up to 1800, default 180, holding the caller with hold audio instead of rejecting.
Burst pricing lets an agent run up to three times the workspace concurrency at double the rate. Batch calling
self-throttles to the lesser of 50 percent of workspace concurrency and 70 percent of agent concurrency, unless
a maximum simultaneous calls value is set on the batch. There is no calls-per-second control.

**What it does not do.** No test call or verification step after the trunk is saved. Troubleshooting is prose
under three headings: connection issues, TLS and encryption issues, and no audio or one-way audio ("Verify that
your firewall allows UDP traffic for the RTP media stream", and try disabling media encryption).

**Carriers named on the SIP trunk page.** Twilio, Vonage, RingCentral, Sinch, Infobip, Telnyx, Exotel, Plivo,
Bandwidth. All in prose. None is a field.

URLs: https://elevenlabs.io/docs/agents-platform/phone-numbers/sip-trunking ·
https://elevenlabs.io/docs/eleven-agents/phone-numbers/sip-reference ·
https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration ·
https://elevenlabs.io/docs/agents-platform/phone-numbers/batch-calls ·
https://elevenlabs.io/docs/eleven-agents/guides/burst-pricing · https://elevenlabs.io/docs/api-reference/phone-numbers/create

---

## LiveKit (Agents)

**What the surface is called.** Telephony > SIP trunks, at
https://cloud.livekit.io/projects/p_/telephony/trunks, alongside the `lk` CLI and the API. LiveKit is the only
one of the four with three objects instead of one: an **inbound trunk**, an **outbound trunk**, and a
**dispatch rule** that does the routing and "can also be used to add custom participant attributes to SIP
participants."

**The shape of the control is a text box.** The documented dashboard path is: Create new trunk, choose the
**JSON editor** tab, pick Inbound or Outbound, paste the configuration, Create. The form is the JSON.

**Inbound trunk fields.** `sip_trunk_id`, `name`, `numbers`, `allowed_addresses` ("IP addresses or CIDR blocks
that are allowed to use the trunk"), `allowed_numbers`, `auth_username`, `auth_password`, `headers` ("Custom
SIP X-* headers to include in the 200 OK response"), `headers_to_attributes`, `ringing_timeout`,
`max_call_duration`, `krisp_enabled`, and `media` (SIPMediaConfig: codecs, encryption, media timeout).

**Outbound trunk fields.** `sip_trunk_id`, `name`, `metadata`, `address`, `destination_country` ("Two-letter
country code for call termination routing"), `transport` (auto, TCP, UDP, TLS), `numbers` (wildcard `*`
accepted), `auth_username`, `auth_password`, `headers`, `headers_to_attributes`, `media`.

**The auth rule is written as a rule.** "When you use an empty `numbers` parameter, you must set either a
username and password for authentication or the `allowed_addresses` parameter." And the allowlist is gated:
"The `allowed_addresses` field must be enabled for your project before you can use it."

**Region.** `destination_country`, a two-letter code on the outbound trunk, used "to originate calls from the
same region as the destination phone number." It is a routing hint about where the call leaves from, not a
gateway the customer picks.

**Ceiling.** None. No CPS, no concurrency object, no queue and no retry policy anywhere in the SIP
documentation. `max_call_duration` and `ringing_timeout` are the only limits, and both are per call.

**Providers.** "LiveKit SIP is designed to work with all SIP providers", with "compatibility testing is limited
to the listed providers": Twilio, Telnyx, Exotel, Plivo, Wavix, Sinch, didlogic. Prose again, not a field.

**Testing is its own page.** "Validate the setup with a test call and verify the resulting room, SIP
participant, and logs."

URLs: https://docs.livekit.io/sip/ · https://docs.livekit.io/sip/trunk-inbound/ ·
https://docs.livekit.io/sip/trunk-outbound/ · https://docs.livekit.io/sip/api/ ·
https://docs.livekit.io/sip/quickstarts/configuring-sip-trunk/ · https://docs.livekit.io/sip/transfer-cold/ ·
https://docs.livekit.io/telephony/testing/

---

## Fifth vendor: Twilio Elastic SIP Trunking

**Why it is here.** Half of this job does not happen in the AI vendor's product at all. Every Telnyx, Vonage
and Exotel guide at all four vendors above is a walkthrough of the carrier's console, and Agora's own
`/conversational-ai/studio/deploy/sip-trunk` page is the same thing: paste one of three Origination URIs into
your carrier. Twilio owns that console for most of our customers, and it owns the vocabulary the other four
borrow. It is the only place in this research where the controls our eight tasks describe already exist as
controls.

**The controls, by their exact names.** *Termination SIP URI*, "Configure a SIP Domain Name to uniquely
identify your Termination SIP URI for this trunk", shaped `{example}.pstn.twilio.com`, with localized regional
options. *Origination SIP URI*, "which identifies the network element entry point into your communications
infrastructure": up to ten of them, each with a priority (0 to 65535, lowest is most important) and a weight (1
to 65535, higher takes more load). *Credential Lists*, digest auth answered by a 407 challenge. *IP Access
Control Lists*, which "specifies which IP addresses can reach your SIP Domain", recommended in addition to
credentials rather than instead of them. *Call Transfer (SIP REFER)*, an explicit toggle: "When Call Transfer
is enabled, Twilio will consume an incoming SIP REFER from your communications infrastructure and create an
INVITE message." *Secure Trunking* (TLS 1.2+, SRTP with `AES_CM_128_HMAC_SHA1_80` or `_32`). *Symmetric RTP*,
which detects where the remote RTP is actually coming from instead of trusting the SDP. *CNAM Lookup*, which
"inserts the Caller ID Name in the SIP INVITE". *Call Recording* with six modes.

**What it does not state.** No CPS number and no concurrent-call ceiling in the trunking docs. Capacity is
expressed as bandwidth: "Max Simultaneous Calls x 100 kbps" for G711.

URL: https://www.twilio.com/docs/sip-trunking

---

## The comparison, on the six dimensions this job turns on

| | Vapi | Retell | ElevenLabs | LiveKit | Twilio (carrier side) |
|---|---|---|---|---|---|
| **Is the carrier a field?** | No. One `byo-sip-trunk` credential; carriers are five doc pages | No. One `termination_uri`; carriers are four doc pages | Two paths, and only one is a carrier: **Twilio** native versus generic **SIP trunk** | No. Seven providers named as "tested", one trunk object | n/a, it is the carrier |
| **Where setup happens** | API only (`curl`), plus a Twilio import in the dashboard | Dashboard import form, after portal work at the carrier | Dashboard form, both paths | Dashboard **JSON editor**, CLI or API | The carrier console |
| **Inbound auth** | `gateways[].ip` list, which is the allowlist; no password-only mode | Carrier-side whitelist of Retell's published CIDRs, or `sip_trunk_auth_username`/`password` | Digest "strongly recommended", ACL by IP as the stated fallback | Either `auth_username`/`auth_password` or `allowed_addresses` (CIDR), and the allowlist needs enabling per project | IP Access Control Lists and Credential Lists, recommended together |
| **Gateway region** | Two hosts, `sip.vapi.ai` and `sip.eu.vapi.ai`, must match the API host | One host; IP blocks tagged "All regions" or "certain United States traffic" | Hostname on a plan: `sip-static.rtc.<region>.residency.elevenlabs.io`, Enterprise | `destination_country`, a two-letter routing hint on the outbound trunk | Localized Termination URI, and up to ten Origination URIs with priority and weight |
| **Headers on the INVITE** | Inbound only, as template variables | Set outbound in the UI (`X-` required, dynamic values), parsed inbound into `call.custom_sip_headers` | "Add Header" on the outbound form, plus UUI per RFC 7433 | `headers`, `headers_to_attributes` on both trunks | CNAM inserts the caller name into the INVITE |
| **Outbound ceiling, and what happens at it** | Concurrency lines bought in Billing; build your own queue in Twilio | **CPS per provider and concurrency, both adjustable**; outbound excess "queued, not rejected"; inbound waits ~40 s then `fallback_number`, else `concurrency_limit_reached` | Plan concurrency, inbound queue with hold audio (`wait_timeout_seconds`, default 180), burst at 3x for double rate | Nothing | Not stated; capacity is bandwidth |

### Transfer, in one place

At every vendor, transfer is a precondition at the carrier that the AI product can only report on. LiveKit says
it outright: "In order to successfully transfer calls, you must configure your provider trunks to allow call
transfers", and when the destination does not answer inside `ringing_timeout` "the request returns an error and
the caller stays in the room, letting you decide how to handle the failed transfer." Retell states the inverse
as a loss at the moment of the setup choice: pick Dial to SIP URI and "you will not be able to use Retell's
transfer call feature." ElevenLabs carries UUI through the REFER via the transfer rule's `uui` setting. Twilio
makes it a labelled toggle called Call Transfer (SIP REFER). Nobody asks the user to choose between REFER and a
conference, because nobody offers the choice.

### Verification, in one line

Vapi has none. ElevenLabs has none after save. Retell has web-call and phone-call testing, but on the agent,
not on the trunk. LiveKit has a separate Testing page. **Not one of the five ends trunk setup on a call.**

---

## What nobody does

Nobody sells a carrier. Every one of the four takes a SIP address, a username and a password, names Twilio and
Telnyx and Exotel in prose, and then hands the user back to the carrier's own console to finish. The one
credential flow that exists, ElevenLabs pasting a Twilio SID and Token, rewrites the voice webhook on a number
that already exists and creates no trunk at all. So there is no "paste your key, get a trunk" anywhere in this
market, and the whitespace is not automation: it is a **named, honest guided path**, one screen per carrier
that says which values to paste where, in the carrier's own words, with Agora's Origination URIs and signalling
IPs inline and the trunk recording which carrier it belongs to. The second gap sits next to it: nobody ends
setup on a call. Four products let you save a trunk and walk away believing it works, and the only feedback
loop offered is a 401 on the first real caller. Our durable rule, that the flow ends on a user-placed test
call, is a differentiator against all five, not a nicety. The third gap is the ceiling as a *trunk* property:
Retell has CPS and a queue, but they hang off the workspace and the telephony provider account, not off the
trunk the user just configured, so nobody can answer "what is this trunk good for" on the screen where the
trunk lives. Not whitespace, and worth saying so: custom SIP headers are ordinary at three of four, so shipping
17 without a header control is a gap in our product rather than a bet on an unproven idea.
