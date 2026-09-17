# 17 · SIP trunk setup: intake brief (2026-09-17)

Tracker: https://app.clickup.com/t/868m0mf18 · status `added` to `clarified` once this lands · Tags telephony · P0-Sep · wave Sep 2026 (six of the eight rows are dated 2026-08 or 2026-09; ITSP automation is 2026-10, header customization and the media allowlist are undated P1).

Sibling, already shipped: **11 · SIP & latency diagnostics**: `studio_x_2/components/sip-ladder.tsx`, `sip-verdict.tsx`, `lib/sip-trace.ts`, plus the ng-console prototype on `origin/design/sip-diagnostics-prototype` and its Engine contract `docs/contracts/sip-diagnostics-payload-contract.md` (commit `94c2d573`). 11 answers "whose fault was this call". 17 is the setup half and must read as the same surface. Three of 11's fix links already point at pages 17 has to build.

## Scope

Roadmap task names come from the tracker; the columns below are expanded only from what `references/` actually documents. Priority, due month, size and customer are verbatim from `references/clickup-q3-roadmap-export-2026-09-03.tsv` (rows 249 to 264).

| Task | What it asks for | Acceptance criteria |
|---|---|---|
| **868kfdnxz** [Doc] Telnyx support from SIP manager · P0 · 2026-08 · size M-L · customer Entel | Telnyx as a first-class carrier in the SIP manager, not a name in a dropdown. Backlog note names the target surface: "sip-quick-connect provider list" (`references/design-backlog-q3-roadmap-2026-09-03.html`). The A3 card scopes it as "Twilio + Telnyx key → auto-provision Elastic SIP Trunk; validation + clear errors" (`references/roadmap-features-prd-2026-07-09.md:186`). | From A3: "Twilio/Telnyx key → connected trunk in ≤ 4 fields, no manual trunk config; invalid key → specific, recoverable error; success deep-links to 'deploy Aria here.'" (`references/roadmap-features-prd-2026-07-09.md:193`). Nothing more specific is written. |
| **868ka68vw** Automate SIP trunk and provider onboarding for customer ITSPs and regional telcos · P0 · 2026-10 | The A3 user story: "As Devan (agency), I paste my Twilio/Telnyx API key and Agora configures the SIP trunk for me. I don't hand-build termination/origination/whitelists" (`references/roadmap-features-prd-2026-07-09.md:179`). This task widens it past the two named carriers to ITSPs and regional telcos, where no key API exists. | Same A3 acceptance line. The card's own dependency note is the live risk: "Engine/SIP Manager for the auto-config API from a carrier key. Confirm it exists or is planned before designing the 'auto' path (else it degrades to guided-manual)" (`:191`). |
| **868kubh4r** Ability to select SIP gateway location based on number-level · P0 · 2026-09 | Backlog note: "Per-number region". Today the region choice is three Origination URIs the customer pastes into their carrier (see fact-check); Agora stores no record of which one they picked. | No acceptance criteria written. |
| **868khj9wx** SIP Direct Connect integration with Studio · P0 · 2026-09 | Bring SIP Direct Connect into Studio. Its two infrastructure siblings are already done: "SIP direct connection metering" (P0, 2026-08, customer Taiwan Survey, DELIVERED) and "SIP Direct Connect - Audio Quality Optimization" (P0, 2026-08, DELIVERED), TSV rows 257 and 258. The Studio row is the only one still open. | No acceptance criteria written. What "Direct Connect" means to a user, and how it differs from the Elastic SIP Trunk path, is not defined anywhere in `references/`. |
| **868kubvcy** Support SIP Header customization in SIP Invite · P1 · undated | Per-call header injection on the outbound INVITE. Listed in the July deck's shipped v2 set as "V7 Dynamic SIP Headers — Per-call SIP header injection on join" (`references/roadmap-features-prd-2026-07-09.md`, V-table), which conflicts with its presence as an open P1 here. | No acceptance criteria written. |
| **868kubvnp** Whitelist approach instead of wide-open connection for media ip subnet · P1 · undated | Constrain which media IP subnets may reach the number, instead of accepting anything. | No acceptance criteria written. The name is the only spec. Note the field it maps to already exists and is being written with a hardcoded literal (section 3). |
| **868kubh2w** SIP Transfer to direct-link (SIP Refer / Conference) must not affect customer · P0 · 2026-09 · customers Entel, Concentrix | A transfer done as SIP REFER or as a conference must not degrade or drop the caller. Adjacent shipped item: "V6 Transfer to SIP Address — SIP REFER to any destination". Adjacent open item: "[SIP] Warm Transfer w/ LLM-based in-call summary" (P1, 2026-08, TSV row 212). | No acceptance criteria written. |
| **868ka6b50** Throttle outbound dialing by SIP trunk capacity and queue retries instead of dropping calls · P1 · undated | D1 card: "IN: auto-adjust CPS to trunk capacity; queue + retry policy; visible throttle state. OUT: the concurrency purchase (A6); inbound queue (D3)" (`references/roadmap-features-prd-2026-07-09.md:225`). Backlog note: "Batch Calls setting". Data-model delta named in the card: "Batch deployment gains `throttle: { cps, retryPolicy }`; call records gain `queued|retried|dropped` status." | From D1: "Over-fast dialing no longer drops calls (queues+retries); user can see the campaign is throttled, not failed; completion rate measurably higher than un-throttled" (`:230`). Open questions the card leaves standing: "Auto-detect trunk CPS or user-set? Retry backoff defaults?" |

Design Tracker JTBD (868m0mf18): "User wants to connect their own carrier once and never touch it again."

## What the product has today

Two codebases hold the answer. `studio_x_2/` is the wireframe the owner reviews; `ng-console/src/` is the real Console that will ship. They disagree, and the disagreement is the design problem.

### The real Console (ng-console, read-only)

**The number form is the whole of SIP setup.** `src/features/telephony/phone-numbers/phone-number-details-section.tsx` renders seven controls: Phone number (`:98–104`, permanently `disabled`), **Source** (`:105–128`), Display name (`:130–141`), SIP trunk address (`:143–164`), Transport protocol as three radios tcp · udp · tls (`:165–190`), Username and Password (`:192–217`). Strings live in `src/lib/i18n/resources/en/common.ts:3269–3320`; the only explanatory text in the section is a `title` on an info icon: "Domain or IP address for the outbound SIP trunk. Ports are supported." (`:3283`).

**Source is a dropdown with one option, and it is disabled.** `phone-number-details-section.tsx:109` renders `<Select disabled value={state.source || "twilio"}>` whose only item is `twilio`, labelled **"SIP Trunk"** (`:123–126`, i18n `:3307`). A stored value other than `twilio` is shown as a second item purely so the display does not go blank (`:118–122`). The create path is harder: `phone-number-quick-import-sheet.tsx:217` is `<Select disabled value="twilio">` with one item, and the submit hardcodes `source: "twilio"` at `:130`. `buildPhoneNumberBody` falls back the same way: `source: source || "twilio"` (`src/lib/telephony/phone-number-contracts.ts:108`). **There is no way to say Telnyx in the real Console, and nothing records which carrier a trunk belongs to.** The list table shows Phone number · Display name · SIP trunk address · Associated agent · Action (`phone-numbers-route-module.tsx:471–483`); carrier is not a column.

**The media IP allowlist field exists and is being written with a literal.** `phone-number-contracts.ts:85–94`:

```ts
const allowedAddresses =
  options.allowedAddresses && options.allowedAddresses.length > 0
    ? options.allowedAddresses
    : ["1.1.1.1"]
…
inbound_configs: { allowed_addresses: allowedAddresses },
```

The create path passes no options at all: `phone-numbers-route-module.tsx:232` is `buildPhoneNumberBody(input)`. So **every number created in the Console ships with `allowed_addresses: ["1.1.1.1"]`**. The edit path only preserves whatever is already stored, via `getPhoneNumberAllowedAddresses` (`phone-number-edit-session.ts:256–261`, helper at `:707–714`). No screen reads the value, no screen writes it. Task 868kubvnp does not need a new field. It needs the field it already has to stop being a constant.

**Transfer is one E.164 box.** `phone-number-transfer-section.tsx:58–67` is a single Transfer destination input, placeholder `+15551234567`, beside a checkbox **"Enforce E.164 format"** (`:69–83`, i18n `:3292`). Unchecking it is the only path to a SIP URI, because validation only runs the E.164 regex when `enforceTransferE164 !== false` (`phone-number-contracts.ts:333–339`). The wire shape is `transfer_config: { description, enabled, phone_number }` (`:156–162`). There is no REFER-versus-conference choice, no second destination, no fallback if the transfer fails, and nothing names SIP as an option. Task 868kubh2w has to live here, and the checkbox is the seam.

**Nothing else exists.** Grepping `src/` for `geofence` returns zero hits, so the six-region `geofence.area` primitive has no Console UI. `prefix` appears only as a React prop name in `call-history/session-detail-sheet.tsx`, never as the SIP `outbound_config.prefix`. There is no CPS control, no concurrency control, no header editor, no trunk object, and no "test this trunk" action. The write body is `{ config, description, inbound_agent_config, number, source, unbind_agent_uuid }` (`src/lib/telephony/telephony-api.ts:261–268`), with `config` typed `Record<string, unknown>`. The transport is open, the UI is not.

### The wireframe (studio_x_2)

**`SipQuickConnect` is the one component that already does part of 17's job**, and it is the thing to extend rather than sit beside. `components/sip-quick-connect.tsx:37` types `Provider = "twilio" | "telnyx"`; `:39–42` gives each a routing noun ("SIP trunk" for Twilio, "FQDN connection" for Telnyx) and a key location. The five-stage machine is `connect · validating · pick · provisioning · verify · done` (`:52`), driven by `connect()` (`:94`), `pick()` (`:111`) and `placeTestCall()` (`:127`). Its honesty contract is written into the file header (`:19–35`) and enforced in the UI: an append-only fact log instead of a spinner (`:222–235`), capability badges before the number choice with outbound-only rows dead not hidden (`:241–268`), and a flow that ends on a user-placed call rather than a saved checkmark (`:273–299`). `:304–315` shows the stored credential masked with a Disconnect that says plainly it does not revoke anything at the carrier. **This is where Telnyx already exists, and it is mock-only: the stage transitions are `setTimeout` calls.**

**It is mounted as one branch of the add-number sheet.** `components/add-phone-number-sheet.tsx:103–118` is a two-item toggle, Quick connect · Manual SIP, defaulting to quick (`:57`). The manual branch (`:131–198`) repeats the ng-console fields plus a Vendor select offering Twilio · Vonage · Bandwidth · Telnyx (`:136–146`), a fourth carrier list that matches neither the Console's one option nor the contract's two. The sheet has six mount points: `deploy/phone-numbers/page.tsx:57,72,88`, `components/channels-panel.tsx:80`, `components/channel-hero.tsx:95`, `components/defector-flow.tsx:344`, `components/wizard/channel-section.tsx:346`, `components/wizard/campaigns-card.tsx:483`. **Anything added to the sheet reaches every door at once.** That is the reuse argument for putting 17 inside it.

**The number detail page is the only per-number surface, and its SIP fields are decorative.** `app/(dashboard)/deploy/phone-numbers/[id]/number-client.tsx:113–147`: Vendor select (`:117`), SIP Trunk Address, Username, Password (`:119–121`) and a Transport toggle (`:122–146`), all gated by `locked` (`:53–59`, true when a campaign or agent uses the number). The three SIP inputs carry no state at all: they are literals. Sections below are Inbound settings (`:150`), Hang-up configuration (`:188`) and Post call analysis (`:206`). No region, no allowlist, no headers, no capacity.

**The data model has no trunk.** `lib/campaign-data.ts:393–403` is the whole of `PhoneNumber`: `id · number · label · vendor · assignedTo · assignedAgent · status`. There is no trunk id, no SIP address, no credential reference, no region and no CPS. The A3 card already specified the missing object: "Deployment/channel gains `sipTrunk: { provider, status, credentialRef }`" (`references/roadmap-features-prd-2026-07-09.md:190`). It was never built.

**Throttle exists as a readout, never as a setting.** `lib/campaign-data.ts:110–127` defines `BatchRuntime` with `pacing · linesInUse · linesTotal · queued · dispositions · retry{max, retrying} · cps{target, actual} · maxQueueSec · reason`, and the seeds hardcode `retry: { max: 3 }`, `cps: { target: 3 }` (`:1446`, `:1480`, `:1515`, `:1554`). `components/batch-detail.tsx:167–168` renders them as two tiles, Retrying and Dial rate. `PACING_META` (`lib/campaign-data.ts:356–364`) makes "Paced" primary and only "degraded" destructive, which is the D1 rule that a throttled batch reads as working. `batchEta()` (`lib/campaign-data.ts:382–391`) projects from `cps.actual`. **Every number on that screen is read-only. There is no control anywhere in either codebase that sets a CPS target, a trunk capacity or a retry policy.** The nearest purchasable control is `components/concurrency-card.tsx:49`, which sells concurrent lines at `pricePerLineMo: 8` (`lib/campaign-data.ts:1226–1232`) and states the wall as information, not alarm (`:115–128`). Lines are not CPS; `lib/sip-trace.ts:145–148` says so explicitly.

**Feature 11 already promises three destinations that do not exist.** In `lib/sip-trace.ts`:
- `:91–97`: a 403 says "Check the trunk credentials and confirm our signaling IP is allowlisted with your carrier" with `fixHref: "/deploy/telephony"`.
- `:188–196`: the CPS variant of 503 says "Slow the campaign pacing or raise the CPS limit; the carrier asked for a 12 s Retry-After" with `fixSecondary: { label: "Raise the CPS limit", href: "/deploy/telephony" }`.
- `components/batch-detail.tsx:122–124`: a degraded batch offers a **Check the trunk** button.

`app/(dashboard)/deploy/telephony/page.tsx` is six lines and all of them are `redirect("/integrations?tab=channels")`. That lands on `components/channels-panel.tsx`, a five-column table of channels (`:48–56`) whose every phone row links back to the number list (`:49–56`). So a user who clicks "Raise the CPS limit" arrives at a table with no CPS on it. The same is true of `/deploy/inbound` (redirects to `/monitor`) and `/deploy/inbound/new` (redirects to `/agents/new/edit?dc=inbound`). **17's first job is to give 11's fix links a place to land.**

**Events already defined for this flow** (`lib/analytics.ts:87–95`): `sip_quick_connect_started · credentials_validated · numbers_enumerated · number_picked · trunk_created · test_call_placed · test_call_connected · trunk_disconnected · manual_fallback_opened`, with the comment at `:85–86` naming `test_call_connected` as the success line, not `trunk_created`. `batch_fix_trunk_clicked` exists at `:100`. No event covers a region choice, an allowlist edit, a header edit or a capacity change.

**Competitor SIP-setup evidence already captured** (for 11, reusable at stop 2): `references/competitors/product/elevenlabs/sip-trunk-form-inbound.png`, `sip-trunk-form-auth-outbound.png`, `sip-trunk-form-validation-error.png`, `sip-phone-numbers-empty.png`; `references/competitors/product/livekit/sip-trunk-inbound-form.png`, `sip-trunks-list-empty.png`, `livekit-telephony.png`; `references/competitors/product/vapi/sip-phone-number-unprovisioned.png`; `references/competitors/public-docs/vapi-sip-trunking.png`, `elevenlabs-sip-trunking-setup.png`, `livekit-sip-overview.png`. No Retell trunk-setup shot exists yet; the folder has `retell-sip-get-call.png` only.

## Agora fact-check

Sources: `docs.agora.io/en/`, fetched 2026-09-17, and the installed SDK `agora-agents@2.4.0` at `ng-console/node_modules/agora-agents/dist/cjs/`. A missing field below is a finding, not a failure.

### The phone number contract

`api/resources/phoneNumbers/client/requests/AddPhoneNumbersRequest.d.ts` is the whole of trunk setup in the SDK. Endpoints are `GET · POST /v2/phone-numbers` and `GET · DELETE · PATCH /v2/phone-numbers/{phone_number}` (`api/resources/phoneNumbers/client/Client.js:111,181,238,298,364`).

| Field | Type | SDK doc comment |
|---|---|---|
| `provider` | enum, **required** | "Number provider: `byo`: BYO (Bring Your Own) · `twilio`: Twilio" |
| `phone_number` | string, required | "Telephone number in E.164 format." |
| `label` | string, required | "A label used to identify the number." |
| `inbound` · `outbound` | boolean | "Whether the number supports inbound/outbound calls." |
| `inbound_config.allowed_addresses` | `string[]` | "List of allowed IP addresses. For example `112.126.15.64/27`" |
| `outbound_config.address` | string | "SIP address. For example `xxx:xxx@sip.example.com`" |
| `outbound_config.transport` | string | "Transport protocol. For example `tls`" |
| `outbound_config.prefix` | string | "Number prefix. For example `6036`" |

Four findings from that table:

1. **There is no `telnyx` provider value.** The enum is `byo | twilio`, repeated on `GetPhoneNumbersResponse.d.ts` and `ListPhoneNumbersResponseItem.d.ts`. The docs nonetheless say Studio "supports providers such as Twilio, Exotel, and Telnyx" (https://docs.agora.io/en/conversational-ai/studio/overview). Both can be true: Telnyx works as a `byo` trunk. What is not true is that the contract names it, and the Console's disabled `twilio` select (`phone-number-details-section.tsx:109`) makes it unsayable. **868kfdnxz is a naming and credentials problem, not a routing one.**
2. **`allowed_addresses` takes CIDR.** The SDK's own example is `112.126.15.64/27`. The Console writes `["1.1.1.1"]`. That is the design gap in 868kubvnp stated exactly.
3. **`outbound_config.prefix` exists and no surface uses it.** Neither codebase has a Number prefix field.
4. **`inbound` and `outbound` booleans exist and no surface uses them.** `SipQuickConnect:46–50` invents the same distinction in mock data ("inbound+outbound" versus "outbound-only") without writing it anywhere.

`UpdatePhoneNumbersRequest.d.ts` narrows on PATCH to `inbound_config.pipeline_id` and `outbound_config.pipeline_id` only, so the Engine binds a number to a **pipeline**. The Console binds it to an **agent** through its own endpoint (`buildPhoneNumberAgentBindingBody`, `phone-number-contracts.ts:112–164`). Two different attachment models sit under one screen; 17 should not deepen the split without an owner call.

### Gateway location per number (868kubh4r)

**Requires Engine.** No field in the SDK carries a gateway, region or SBC choice: not on `AddPhoneNumbersRequest`, not on `CallTelephonyRequest.Sip`, not on the phone-number responses. The region choice is real but it happens outside Agora. https://docs.agora.io/en/conversational-ai/studio/deploy/sip-trunk tells the customer to paste one of three Origination URIs into their carrier:

- United States: `sip:sbc-us-west-1.viblinx.com:5061` (TLS) or `:5060` (TCP/UDP)
- Americas, Europe, Oceania and Brazil: `sip:sbc-sa-east-1.viblinx.com:5061` or `:5060`
- Asia-Pacific, India and Africa: `sip:sbc-ap-south.viblinx.com:5061` or `:5060`

So there are exactly three gateway locations today, the customer already picks one, and **Agora stores no record of which**. The nearest primitive in the contract is agent-scoped, not number-scoped: `properties.geofence.area` on `StartAgentsRequest.d.ts:124–139`, enum `GLOBAL · NORTH_AMERICA · EUROPE · ASIA · INDIA · JAPAN`, documented as "Regional access restriction configuration. Use this to limit which Agora servers the Conversational AI Engine can access based on geographic regions." It restricts Engine servers, not the SIP gateway, its granularity is the agent, and its six values do not map onto the three SBCs. Designing the number-level picker against `geofence` would be a wish, not a spec.

### Media IP allowlist (868kubvnp)

Two allowlists exist and they point in opposite directions. The design must not merge them.

- **Carrier accepts Agora**: the same docs page says "create an Access Control List (ACL) containing the Agora SIP outgoing IPs for your phone number's country code", listed per country code in accordions. This is configured at the carrier, per country, and Agora has no UI obligation beyond publishing the list.
- **Agora accepts the carrier**: `inbound_config.allowed_addresses`, CIDR, in the contract and already wired (badly) in the Console.

The task name says "media ip subnet". `allowed_addresses` sits under `inbound_config` and the SDK calls it "SIP inbound call configuration", which reads as signalling, not media. Whether one allowlist covers both planes is unanswered by the docs and is an open question below.

### SIP headers in the INVITE (868kubvcy)

**Requires Engine.** `CallTelephonyRequest.Sip` carries exactly four fields: `to_number`, `from_number`, `rtc_uid`, `rtc_token` (`api/resources/telephony/client/requests/CallTelephonyRequest.d.ts`). There is no header map, no `P-*` or `X-*` passthrough, no trunk id. The only per-call metadata channel is `properties.labels`, documented in release notes v2.1 (December 5, 2025) as "In SIP outbound call scenarios, you can pass a custom label in the `properties.labels` field when calling the outbound call interface to mark the call" (https://docs.agora.io/en/conversational-ai/overview/release-notes). A label is not a header: it is returned in webhook payloads, not put on the wire.

The other direction is already designed. 11's contract, `ng-console` commit `94c2d573`, `docs/contracts/sip-diagnostics-payload-contract.md` §3.1, specifies the read path for custom headers: "`P-*`, `X-*` custom headers — internal: full · customer: **pass through only if the customer set them**." That sentence presupposes a place to set them, and no such place exists. 17 is that place, and the two must agree on naming or the ladder will show headers the setup screen cannot name.

### Transfer to direct-link (868kubh2w)

**Requires Engine.** No REFER, conference, transfer-leg or warm-transfer field appears anywhere in the SDK, and no release note on either https://docs.agora.io/en/ai/release-notes or https://docs.agora.io/en/conversational-ai/overview/release-notes mentions REFER. The wire shape the Console owns is the flat `transfer_config: { description, enabled, phone_number }` (`phone-number-contracts.ts:156–162`): one destination, no transport, no method. 11's contract does model the runtime side: legs are "discovered, not enumerated", carry `parent_leg_id` so "the diagram can show a leg spawning from another", and `role_hint` includes `customer_trunk` and `carrier` (§3.2). So the diagnostics half can already draw a transfer it cannot be configured to make.

### Throttle and capacity (868ka6b50)

**Requires Engine for the ceiling; the evidence shape is already agreed.** The SDK has no CPS, concurrency, queue or retry field, and the call record returns none: `GetTelephonyResponse.d.ts` is `to_number · from_number · pipeline_id · type · agent_id · channel · reason · create_ts · state · stop_ts`, with `reason` limited to `request | hangup | failed` and no SIP response code, no `Call-ID`, no post-dial delay. But 11's contract §4 already specifies the quota object Engine must emit:

| Field | Type | Notes |
|---|---|---|
| `limit_type` | `"cps" \| "concurrent_calls"` | |
| `limit` | int | "The configured ceiling" |
| `observed` | int | "What was attempted" |
| `window_seconds` | int | cps only |
| `rejected_count` | int | "Calls dropped in this window" |
| `occurred_at` | int (epoch ms) | |

with the rule "A quota failure sets `attribution: 'customer_quota'`. This is the one failure class where the badge should offer an action (raise the limit), so it needs the numbers, not just a code." **The badge 11 shipped is already wired to offer that action, and 17 owns the screen it opens.** Note `limit` is described as "the configured ceiling", which implies something configures it and nothing in the product does.

### The price does not move

Conversational AI Engine is a flat **$0.10 per agent-minute**, charged identically on a BYO key; audio RTC bills separately at about $0.00099 per participant-minute (project standing fact, LEARNINGS). Concurrent lines are a separate line item at $8 per line per month (`lib/campaign-data.ts:1231`). **Choosing Telnyx over Twilio, choosing a gateway region, or raising a CPS target does not change what Agora charges per minute.** No control in 17 may be framed as a cost lever. Throughput, reach and reliability are the honest axes.

### Docs reachability, recorded

Working: `/en/conversational-ai/studio/deploy/sip-trunk` · `/en/conversational-ai/studio/overview` · `/en/conversational-ai/overview/release-notes` · `/en/ai/release-notes` · `/en/conversational-ai/studio/deploy/connect-agent`. Returning 404: `/en/conversational-ai/rest-api/phone-number/import` and `/en/conversational-ai/rest-api/telephony/start` (the latter is indexed by search but not served). **The phone-number management REST reference is not reachable, so `AddPhoneNumbersRequest.d.ts` is currently the only readable spec for the eight fields above.**

## Already decided

- **Agora sells no numbers.** LEARNINGS §20, 2026-07-09 fact-check F2: Agora "does not provision or sell numbers — telephony is BYO SIP trunk (Twilio, Telnyx, Exotel named)". The 2026-07-29 roadmap read reverses this for a future Phone Number Resell, but that is a separate P0 (TSV rows 241 to 247) and is not in 17. Copy in place already says it: "You bring a number you already own. Agora doesn't sell or port numbers." (`sip-quick-connect.tsx:206–207`).
- **The flow ends on a real call.** LEARNINGS §20, 2026-07-09, A3 durable rule 1: "the flow ENDS on a user-placed test call, never a 'saved' checkmark — provisioning success ≠ call success." Anything 17 adds to setup inherits this. A region picker, an allowlist or a header set that reports "saved" and nothing else fails the rule.
- **Scoped key over Auth Token.** A3 durable rule 2: "scoped API key preferred, Auth Token the labeled less-secure fallback (Twilio's own guidance)." Built at `sip-quick-connect.tsx:194–199`.
- **Disconnect is not revocation.** A3 durable rule 4: "stored credential masked + Disconnect ≠ carrier revocation." Built at `sip-quick-connect.tsx:313–315`.
- **It folds into the existing sheet.** A3 durable rule 5: "folds into the EXISTING add-phone-number-sheet as a Quick|Manual toggle so all entry points inherit it — manual form survives verbatim." Six mount points depend on this.
- **Paced is not failed.** D1, LEARNINGS §20 2026-07-09 and `lib/campaign-data.ts:87–90`: "a batch dialing at its concurrency/CPS ceiling is working as designed, NOT failing. It is DISTINCT from 'degraded'." A capacity control must not make the ceiling look like an error.
- **The wall is information, not alarm.** `components/concurrency-card.tsx:37–38`: "at capacity, batch calls queue; nothing drops. 'Keep queuing' is a first-class choice."
- **Reuse, don't redesign** (owner rule, 2026-09-12): things that belong together live together and look the same; one door per action; no control for what Agora does by default. 17 has one door already (`AddPhoneNumberSheet`) and one detail page already (`number-client.tsx`). It gets no third.
- **Honesty floor.** "Not supported by <vendor>" is a real state. Telnyx as `byo` and Exotel with no enum value at all are states to render, not to hide.
- **Copy discipline** (CLAUDE.md, standing 2026-08-10): never add UI text without asking; one short line under a control at most; explanations behind `title` or a tooltip. Every new control in 17 needs its exact strings proposed before build.
- **Control strokes** (CLAUDE.md, P0 2026-08-10): every input, select and switch boundary uses `--stroke`, checked in both themes.
- **ng-console mechanics** (from 03 and 07): every string through `useTranslation("common")` plus `common.ts`; the prototype pattern is `src/lib/telephony/<feature>.ts` plus test, `src/components/console/<feature>-row.tsx` plus test, a mount of eight lines or fewer, one i18n block; API-less draft state lives in `sessionStorage` per record.
- **Never push to `main`, `preprod`, `staging`**; `design/sandbox` is the one scratch branch (memory rule, `ng-console/docs/design/SANDBOX.md`).

## Open questions for the owner

Six of the eight tasks have no acceptance criteria, so these are not clarifications. They set the scope.

1. **Which codebase does 17 get built in?** 11's diagnostics prototype went to ng-console (`origin/design/sip-diagnostics-prototype`, 415 files), while its wireframe lives in `studio_x_2`. The setup surface exists in **both**, differently: ng-console has a real, wired six-field form; `studio_x_2` has the Quick connect machine the owner reviewed.
   - *ng-console:* real data models, real Vercel preview, and 17 lands where it will ship. Cost: the Quick connect flow does not exist there and would have to be ported before anything can be added to it.
   - *studio_x_2:* extends `SipQuickConnect` directly, six mount points inherit it for free. Cost: it stays a wireframe and ng-console's disabled `twilio` select ships unchanged.
   - *Both, split:* setup in ng-console, the automation story in `studio_x_2`. Cost: two surfaces to keep in sync, which is the rule against.

2. **Is there an auto-config API from a carrier key, or is Quick connect guided-manual?** The A3 card flagged this in July and it was never answered: "Confirm it exists or is planned before designing the 'auto' path (else it degrades to guided-manual)." `SipQuickConnect` is currently `setTimeout` calls.
   - *It exists for Twilio and Telnyx:* the built flow becomes real and 868kfdnxz is mostly credentials plus copy.
   - *It does not exist:* Quick connect must be redesigned as a guided checklist that tells the user exactly what to paste where, with the three Origination URIs and the country-code ACL from the docs page inlined. That is a different design, and it is also the honest one for 868ka68vw, because ITSPs and regional telcos will never have a key API.
   - *Twilio only:* Telnyx ships as the guided path and is labelled as such. Nothing pretends.

3. **What is SIP Direct Connect to a user, and how does it differ from the Elastic SIP Trunk path?** (868khj9wx, P0 Sep.) Its metering and audio-quality siblings are DELIVERED; nothing in `references/` says what the Studio integration exposes.
   - *A different connection type:* it becomes a third option beside Quick connect and Manual SIP, and the number form needs a type field the contract does not have.
   - *A property of an existing trunk:* it becomes a badge and a metering row, no new door.
   - *Sales-led, not self-serve:* it is a status the Console reports and never a thing the user turns on. Each answer changes whether 17 adds a door or a label.

4. **Does one allowlist cover signalling and media, or two?** The contract has one field, `inbound_config.allowed_addresses`, under "SIP inbound call configuration". The task says "media ip subnet".
   - *One field covers both:* the design is a CIDR list editor on the number, replacing the `["1.1.1.1"]` literal. Smallest honest slice, and it closes the task.
   - *Media is a separate plane with no field:* the allowlist ships for signalling and the media half is marked Requires Engine, with the carrier-side ACL from the docs shown as the thing the customer must still do.
   Related and needed either way: **what does `1.1.1.1` mean to the backend today?** If it is a sentinel meaning "accept anything", the current state is literally the wide-open connection the task names, and the copy for the new control changes completely.

5. **Gateway location: record the customer's choice, or make it a setting?** There are three SBCs and the customer already picks one inside their carrier.
   - *Record it:* the number form gains a Gateway location field whose value is stored and shown next to the SIP trunk address, so support and the 11 ladder can name it. No Engine work; it is metadata, and it is honest as long as the copy never implies Agora routes on it.
   - *Make it a setting:* Agora selects the SBC per number. Requires Engine, no field exists, and the P0 Sep date is not credible.
   - *Derive it:* infer the region from the number's country code and show it read-only. Cheapest, and wrong whenever a customer deliberately homes a number elsewhere.

6. **Trunk capacity: who supplies the number?** D1 left this open ("Auto-detect trunk CPS or user-set?") and 11's contract calls `limit` "the configured ceiling" without saying who configures it.
   - *User-set per trunk:* a CPS field on the number or trunk, and `batch-detail`'s Dial rate tile finally has a source. Nothing to buy, so the pricing rule is safe.
   - *Auto-detected from the carrier:* no control at all, which satisfies "no control for what Agora does by default", but then the 503 fix link must point at an explanation rather than a setting.
   - *Purchasable, like concurrent lines:* it becomes a sibling of `ConcurrencyCard`. The TSV has a matching row, "Self-service phone number CPS", P0 2026-09 (backlog note "Calls-per-second purchase"), which suggests this is the intent. If so, say it now, because it is a different screen from a trunk setting and it lands in Billing, not Deploy.

7. **Do SIP headers ship as inert, or wait?** (868kubvcy, P1, undated.) No field exists, but 11's contract already promises to display customer-set `P-*` and `X-*` headers.
   - *Ship inert now:* a key-value editor saved to `sessionStorage`, labelled Requires Engine, so the ladder and the setup screen agree on naming from day one. Precedent: 07's Backup providers row shipped with the caption "Requires Engine failover · Nov".
   - *Wait:* 11 keeps a read path for a value nothing can produce, and the two features drift.

8. **Where does 11's "Raise the CPS limit" link go on the day 17 ships?** Today it is `/deploy/telephony`, which is a redirect to a table with no CPS on it (`lib/sip-trace.ts:195`, `app/(dashboard)/deploy/telephony/page.tsx`). Whatever the answer to question 6, this link, the 403's "Check the trunk credentials" link (`:96`) and the batch detail "Check the trunk" button (`components/batch-detail.tsx:123`) all need a real destination, and they should all be the same one.
