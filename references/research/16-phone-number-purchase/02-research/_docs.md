# 16 · Phone number purchase — competitor teardown from public docs (2026-09-17)

Docs only. The signed-in product is captured separately from the shot list at the end of this file.
Question asked of every vendor: **can a developer get a working phone number without leaving the
product, and what does the product have to know about that number afterwards?**

Four references plus one. The fifth is **Twilio**, added because all four of the others resell or wrap
it, because the live Console's add sheet already hardcodes `source: "twilio"`
(`ng-console/src/lib/telephony/phone-number-contracts.ts:108`), and because it is the only public
reference for the per-country regulatory model Phase 2 needs. Bandwidth is the vendor Agora actually
picked; it plays Twilio's role in our stack, and Twilio's version of that role is documented in public.

---

## Vapi

**Surface.** Dashboard tab `Phone Numbers`, primary action `Create Phone Number`, which opens a chooser
whose first entry is `Free Vapi Number` and whose others import from Twilio, Telnyx, Vonage or DIDWW.
https://dashboard.vapi.ai/phone-numbers · https://docs.vapi.ai/phone-calling

**Shape of the control.** One field. The docs' own steps are: select `Create Phone Number`, then
`Free Vapi Number`, enter "a supported US area code" in `Area Code`, select `Create`. Vapi then assigns
"an available phone number with the area code you entered". The user never sees candidate digits and
never picks one. Assignment follows in a second block, `Inbound Settings`, where an Assistant or Squad
is chosen and saved. https://docs.vapi.ai/free-telephony

**Fields the number object carries** (`CreateVapiPhoneNumberDTO`): `assistantId`, `squadId`,
`workflowId`, `fallbackDestination`, `authentication` (SIP digest username, password, realm), `server`,
`hooks`, `name` ("This is the name of the phone number. This is just for your own reference").
No country, no price, no capability set, no order, no provisioning state.
https://docs.vapi.ai/api-reference/phone-numbers/create

**Limits.** "You get one free Vapi phone number". "Free Vapi phone numbers are only available for US
national use". "Outbound calling is not supported on free Vapi numbers at this time". Free numbers
cannot launch Outbound Campaigns; a campaign "require[s] an imported number". Activation is not
instant: "It can take a few minutes for the phone number to become active. Calls will not work until
activation is complete."

**What Vapi refuses.** It does not sell numbers. There is no paid tier of Vapi numbers, no
international inventory, no porting, and no release price, because the only number Vapi provisions is
free. Everything past one US inbound line is an import.

**The one line worth stealing.** "The number is free, but calls are not." One sentence separates the
resource fee from the usage fee, which is the exact separation `concurrency-card.tsx:34` already makes
in our prototype.

**Caller reputation is entirely outsourced.** https://docs.vapi.ai/calls/outbound-calling sends the user
to Twilio Trust Hub for STIR/SHAKEN ("5-7 business days"), to the CNAM portal ("3-5 business days") and
to Voice Integrity, then warns that propagation across carrier networks takes "2-4 weeks". None of it
happens in Vapi and none of its state is visible on a Vapi number.

Also: https://docs.vapi.ai/phone-numbers/import-twilio · https://docs.vapi.ai/tcpa-consent ·
https://docs.vapi.ai/server-url/spam-call-rejection

---

## Retell AI

**Surface.** Dashboard tab `Phone Numbers`. The doc is titled "Purchase a Retell-managed US or Canada
phone number" and its pitch is "no telephony provider account required, ready for inbound and outbound
calling". https://docs.retellai.com/deploy/purchase-number

**Shape of the control.** A purchase form, not an import form. The API mirrors it one to one
(https://docs.retellai.com/api-references/create-phone-number):

| Field | What it takes |
|---|---|
| `country_code` | enum `US` · `CA` |
| `number_provider` | enum `twilio` · `telnyx`, "Default to twilio" |
| `toll_free` | boolean, "Toll-free numbers incur higher costs" |
| `area_code` | "3 digit integer. Currently only supports US area code" |
| `nickname` | "This is for your reference only" |
| `inbound_agents[]` / `outbound_agents[]` | agent id plus a `weight`, "total weights must add up to 1" |
| `allowed_inbound_country_list` / `allowed_outbound_country_list` | ISO 3166-1 alpha-2 codes |
| `inbound_webhook_url`, `fallback_number`, `transport` | routing and overflow |

**The field our contract does not have.** Every number comes back stamped
`phone_number_type: retell-twilio | retell-telnyx | custom`. Provenance is a property of the row, not a
separate page, and "bought here" and "brought here" sit in one list telling each other apart.

**Price, in the docs, before anyone clicks.** US $2/month, Canada $2/month, toll-free $5/month, Telnyx
US $2/month, toll-free inbound $0.06 per minute. Monthly fees bill at the end of the cycle and prorate
for a mid-month purchase on credit accounts. Releasing stops the fee.

**Identity gates money.** KYC "unlock[s] outbound calling, phone number purchases, and SMS on your
Retell account". Three paths: automatic from registration details, else Persona with a government ID,
else manual review, which "takes longer". Verification is supported "in 83 countries", and "Each person
can verify only one account". The entry point is the giveaway: "go to 'Phone Numbers', click on any of
your numbers, and you'll see the interface where you can start the KYC process". The user discovers the
gate by poking a number they already have. https://docs.retellai.com/accounts/kyc

**Verified and branded calling is a second object with its own states.** A business profile comes first:
business registration number "exactly as it appears on your official documents", a verified business
address, a contact number that must be "a physical phone line (VoIP numbers are not accepted)", and a
website whose "content accurately reflects your business name and operations". Only then can a number be
submitted for a verified phone number or a branded call. Applications run `Pending` · `Active` ·
`Rejected`, "Allow 1-2 weeks", US numbers only. Brand names are cut per carrier: T-Mobile and AT&T 32
characters, Verizon 15. Rejection cascades across objects: "If the number also has SMS, a rejected
business profile marks its A2P brand and campaigns rejected as well. Fix the profile first."
https://docs.retellai.com/build/telephony/business-profile ·
https://docs.retellai.com/build/telephony/verified-phone ·
https://docs.retellai.com/build/telephony/branded-call ·
https://docs.retellai.com/build/telephony/branded-call-rejection

**What Retell refuses.** Purchase outside US and CA ("Currently we only support purchase of US and
Canada numbers and support making calls to 15 countries"). Porting: the docs point at
https://docs.retellai.com/deploy/custom-telephony instead, where elastic SIP trunking is "The
recommended option" and Twilio, Telnyx, Vonage, Avaya, Genesys, Five9 and Amazon Connect each get their
own page. BYO is a peer path, kept fully documented, not demoted.

**The honest sentence about spam.** "Phone carriers may mark certain phone numbers as 'Spam Likely'.
This lowers your outbound call pickup rate, and can sometimes lead telephony providers to ban your
number or account." Third-party spam checks "aren't exact, since each carrier has its own rules and
database." https://docs.retellai.com/build/telephony/call_efficiency_overview

---

## ElevenLabs (Agents Platform)

**Surface.** `Phone Numbers` tab in the ElevenAgents dashboard. The API endpoint that creates one is
titled **"Import phone number"**. https://elevenlabs.io/docs/api-reference/phone-numbers/create

**Shape of the control.** Three request variants, one per provider: `twilio`, `exotel`, `sip_trunk`.
Common fields are `phone_number`, `label` ("Label for the phone number") and an optional `agent_id`
("Agent ID to assign the phone number to"). The rest is credentials: Twilio `sid` and `token`
(API keys recommended over the account auth token), Exotel `account_sid` · `api_key` · `api_token` ·
`api_subdomain` · `app_id`, or a full SIP inbound and outbound trunk config.

**What it knows about capability.** Nothing the user types. `supports_inbound` and `supports_outbound`
are marked "deprecated and will be removed in the future"; instead, "ElevenLabs automatically detects the
capabilities of your number based on its configuration in Twilio". Capability is read from the provider,
never declared.

**What ElevenLabs refuses.** It sells nothing. The Twilio page states the precondition plainly: the
number "must be purchased through Twilio and appear in your 'Phone Numbers' section". A verified caller
ID is outbound only, and the docs say so as a capability, not a footnote: inbound is "Not supported ·
Cannot receive calls or be assigned to agents".
https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration ·
https://elevenlabs.io/docs/agents-platform/phone-numbers/sip-trunking

**Why it matters to us.** This is Agora's contract today with three providers instead of two. Same seven
fields, same absence of country, price, ownership and state. ElevenLabs is the control group: it shows
what our phone-number surface looks like if the purchase never lands.

---

## LiveKit (Agents · Cloud telephony)

**Surface.** `LiveKit Phone Numbers`, dashboard path `Telephony` then `Phone Numbers` at
https://cloud.livekit.io/projects/p_/telephony/phone-numbers. It "lets you purchase and manage US phone
numbers for voice applications" and "provides the telephony infrastructure and phone number inventory,
without requiring separate SIP trunk configuration". https://docs.livekit.io/telephony/ ·
https://docs.livekit.io/sip/cloud/phone-numbers/

**Shape of the control, and the verb.** The button says **`Rent a number`**, the row action says `Rent`,
the confirm says `Confirm rental`. Search takes a country code (required) and an area code, and returns a
list of real numbers the user picks from. The CLI is the same two steps:
`lk number search --country-code US --area-code 415` then `lk number purchase --numbers +14155550100`.

**The number has a lifecycle.** `lk number list --status` accepts `active` · `pending` · `released` ·
`offline`. A LiveKit number can be owned and not yet usable, and the product has a word for that.
Assignment is a separate write against a dispatch rule:
`lk number update --id <PHONE_NUMBER_ID> --sip-dispatch-rule-id <DISPATCH_RULE_ID>`.

**Price, and the one honest clause nobody else writes.** All Cloud plans include 1 free US local number;
Scale adds more at "$1.00/month per number"; toll-free is "$2.00/month per number" and exists only on
Scale and Enterprise; inbound is $0.01 per minute local and $0.02 toll-free; Build includes 50 free
inbound minutes. Then: **"If you release a phone number before the end of the month, you are still
billed for the entirety of the month."** https://livekit.com/pricing

**Limits, verbatim.** "Available only in the US". "Only inbound calling is supported", with outbound
"coming soon". Forwarding "using the TransferSIPParticipant API is not yet supported". A number you rent
from LiveKit today cannot dial out, and the docs say so on the page where you rent it.

**No compliance surface at all.** No KYC, no business profile, no verified or branded calling, no
address requirement anywhere in the telephony docs.

**BYO stays a peer.** Third-party SIP is documented beside the rental, naming Twilio, Telnyx, Exotel,
Plivo, Wavix, Sinch and didlogic, with the caveat "compatibility testing is limited to the listed
providers".

---

## Twilio (the fifth, docs only)

**Why it is here.** It is the substrate under Vapi's imports, Retell's purchases, ElevenLabs' only
native integration and LiveKit's peer path, and it is the only one of the five that documents what a
regulated country actually asks for. Phase 1 as written spans US, Canada, Peru, Brazil and Chile across
three regulatory regimes; nothing in the four voice vendors shows that screen.

**The object Agora does not have.** Purchase is gated by a **Regulatory Bundle**, created with three
values before any search happens: `IsoCountry`, `NumberType`, `EndUserType`. The bundle is built in
`Phone Numbers` then `Regulatory Compliance`, verified, and only then does `Buy a Number` let you map a
new number to it. https://www.twilio.com/docs/phone-numbers/regulatory/getting-started ·
https://www.twilio.com/docs/phone-numbers/regulatory/getting-started/console-create-new-bundle ·
https://www.twilio.com/docs/phone-numbers/regulatory/api/bundles

**The address rule that will bite Phase 2.** The holder's physical location "must be within locality or
region covered by the phone numbers prefix", and "a PO Box is not acceptable where a local address is
required". Some countries and number types need only a valid address; others need documents, and the
requirement differs for citizens, foreign individuals and businesses, and again by number type.
https://www.twilio.com/docs/phone-numbers/regulatory/faq

**What this tells our design.** The regulatory object is per country and per number type, it is created
before the search, and it is reusable across purchases. That is a different placement from Retell's
account-level KYC, and the two are not interchangeable: one proves who the account is, the other proves
who is allowed to hold this specific kind of number in this specific country.

---

## The five, side by side

| | **Vapi** | **Retell** | **ElevenLabs** | **LiveKit** | **Twilio** |
|---|---|---|---|---|---|
| **Sells a number in-product** | One, free, US | Yes, US and CA | **No** | Yes, US, first one free | Yes, ~100 countries |
| **What you choose** | Area code only; digits assigned | Country, provider, toll-free, area code; digits assigned | Nothing, you paste a number you own | Country and area code, then pick the digits from a list | Country, capabilities, pattern, then pick the digits |
| **Direction it can serve** | Inbound only on the free number | Inbound and outbound | Inherits the provider's | **Inbound only**, outbound "coming soon" | Both |
| **Identity check, and where** | None in Vapi; Trust Hub at Twilio, 5-7 days | **KYC gates purchase, outbound and SMS**, entered from a number row | None | None | **Regulatory Bundle per country and number type, before search** |
| **What the row knows** | assistant, name | `phone_number_type: retell-twilio \| retell-telnyx \| custom`, price, agents, allowed countries | label, provider credentials | `active \| pending \| released \| offline`, dispatch rule | bundle, capabilities, address |
| **Release semantics** | n/a | Fee stops on release | Delete removes the import, not the number | **Full month billed even if released early** | Released, returns to inventory |
| **Verified or branded calling** | Sent to Twilio, no state in Vapi | Business profile plus per-number application, `Pending \| Active \| Rejected`, 1-2 weeks, US only | None | None | Trust Hub, CNAM, Voice Integrity |

Read the row that matters for the ⚠ lock: **three of five sell a number, none of them sells one outside
North America, and only ElevenLabs is where Agora is today.**

---

## What nobody does

**Nobody sells an international number self-serve.** LiveKit is US only and says so on the rental page,
Vapi is "US national use" only, Retell is US and Canada, ElevenLabs sells nothing. The 2026-07-09 finding
holds unchanged: self-serve domestic is table stakes, self-serve international is 0 of 5. Phase 1 as
written already names Peru, Brazil and Chile, so the first country that is not the US is the whole
differentiator, and the only public model for its screen is Twilio's Regulatory Bundle, not a competitor.

**Nobody puts the identity step in front of the money.** Retell is the only vendor that checks identity
at all, and its own docs tell you to find that check by clicking a number you already own. Nobody shows
what a country requires before the user has spent anything, and nobody shows a number they cannot sell
you and says why. Every product either sells with no questions or sends you to a provider's console.

**Nobody ends a purchase on a call.** Every documented flow ends on a saved row: Vapi saves Inbound
Settings, Retell assigns an inbound agent, LiveKit confirms the rental and points at a dispatch rule. Our
own A3 rule already says the opposite, that the flow "ENDS on a user-placed test call, never a 'saved'
checkmark" (LEARNINGS.md:518), and no competitor does it. A bought number that has never rung is the
single most likely place for our north star to leak.

**Nobody runs one verification workflow across bought and brought numbers.** Retell's branded calling is
documented against Retell-managed US numbers and never says whether an imported number qualifies; Vapi
sends the whole problem to Twilio Trust Hub. Ticket 868kykk8y asks for exactly the thing nobody ships:
"one Studio workflow for numbers purchased through Studio and eligible imported numbers".

**Nobody reconciles a rented number with a spend cap.** LiveKit bills a released number for the full
month and says so, which is the most honest money sentence in the set, but no vendor tells a user what
happens to a rented number when the account hits its limit. Our cap already governs per-minute usage only
(`concurrency-card.tsx:34`), and a customer who hits it must not lose a number they are renting.
