# 22 · Usage, credits & concurrency · intake brief (2026-09-17)

Tracker: https://app.clickup.com/t/868m0mf7b · Tags `billing` · `P0-Sep` · status `added` to `clarified` once this lands.
Roadmap wave: **Wave 3 (Sep)** carries concurrency self-serve, managed metering and Archer; **Wave 4 (Oct)** carries the MLLM meter row; the **Wave 2 (Aug)** capacity SKU cards were scheduled and never built (`references/prd-q3-roadmap-execution-2026-07-29.html` lines 476, 485, 494 of the extracted text).

Design Tracker JTBD (868m0mf7b): "User wants to understand what they're paying for and buy more capacity themselves."

⚠ **PARTIAL LOCK.** Capacity SKUs and the CPS upsell were deliberately not built. This brief stops at stop 0 until the owner answers §Open questions. Two of those questions (the purchase path, and what Archer is) decide whether the feature is one surface or three.

## Scope

Ten roadmap tasks. Names are the ones on the Design Tracker row; the "what it asks for" column is expanded from the Q3 roadmap documents in `references/`, and every row says where. The Q3 export carries no acceptance-criteria column, so most rows say so rather than inventing one.

| Task | What it asks for | Acceptance criteria |
|---|---|---|
| **868kyr0ft** Model-level usage, credits and pricing breakdowns | Roadmap row: "Show model-level usage, credits, and pricing breakdowns in Studio" · Studio · P0 · no due month (`clickup-q3-roadmap-export-2026-09-03.tsv` :209). Backlog assigns it to the surface group "Usage · Billing · Managed mode", `where: /usage · /billing · concurrency-card · usage-spend-card` (`design-backlog-q3-roadmap-2026-09-03.html` :415–416). The research question filed against it: "What does 'usage' mean to a developer paying per minute across managed and BYO vendors?" (:235). The PRD gives it no "lands in" row. | **no acceptance criteria written.** |
| **868ka690p** Sell and allocate concurrency self-serve | Roadmap row: "Sell and allocate concurrency self-serve with capacity-aware safeguards" · Studio · P0 · 2026-09 · XL · Dev Experience (TSV :201). PRD Epic D splits it in two: "Self-service agent concurrency + capacity-aware safeguards" (P1, 2026-09) lands in "Concurrency card → purchase flow with guardrails", and "Package and sell capacity-based SKUs" (P0, 2026-08) lands in "Billing › Plans — capacity SKU cards" (PRD :334–341). Backlog note: "concurrency-card exists; capacity SKUs deliberately not built" (:417). | **no acceptance criteria written.** The PRD's goal sentence is the nearest thing: "Commerce is self-serve: numbers, concurrency, and capacity SKUs are purchasable in-console without a sales call" (PRD :160). |
| **868keb6r4** Self-service agent concurrency controls | Roadmap row: "[O3.4-T3.a] Add self-service agent concurrency controls" · **Engine** · P1 · 2026-09 · Reliable Infra (TSV :51). Engine-side work: the limit itself becomes settable, which is what the Studio purchase path in 868ka690p would write to. | **no acceptance criteria written.** |
| **868khza4m** Meter Studio usage on Engine | Roadmap row: "[O3.4-T3.b] Meter Studio usage on Engine" · **Engine** · P0 · 2026-09 · Reliable Infra (TSV :52). Engine becomes the meter of record for agent minutes started from Studio, rather than Studio counting its own. | **no acceptance criteria written.** |
| **868kadwjv** Studio managed mode using Engine reseller mode | Roadmap row: "Implement Studio managed mode using Engine reseller mode" · Studio · P0 · 2026-09 in the export, 2026-08 in the PRD · S · Reliable Infra (TSV :203, PRD :364). Lands in "Vendor credentials: 'Managed by Agora' vs BYO keys, per provider" (PRD :367). `TODO-Q3-ROADMAP.md` :79 marks it **shipped 2026-07-30 (Wave 2)** in the wireframe. Backlog: "Shipped Wave 2; API use-case + separate key subtasks remain (P1)" (:420). | **no acceptance criteria written.** The PRD files it as a blocking open question instead: "Managed-mode billing (PM/finance, blocking Wave 2): does reseller-mode usage bill through existing postpaid, or a new SKU? Determines what the credentials surface promises" (PRD :526). |
| **868kmghhk** Managed mode for Studio API use cases | Subtask of 868kadwjv, P1, no separate export row. Managed credentials have to work for agents started through the API and SDK, not only agents built in the Studio UI. | **no acceptance criteria written.** |
| **868kmghjc** Separate key / resource for usage tracking | Roadmap row: "Separate key/resource for usage tracking under Studio projects" · Studio · P1 · no due month (TSV :205). A usage-tracking identity distinct from the agent's provider credentials, so Studio traffic is attributable inside a project that also runs RTE. | **no acceptance criteria written.** |
| **868kbyqe9** MLLM vendors in the managed reseller catalog | Roadmap row: "Add MLLM vendors to the managed reseller catalog" · Studio · P1 · no due month · Reliable Infra (TSV :206). Lands in "Resources › model catalog" (PRD :368–371). | **no acceptance criteria written.** |
| **868keau65** Metering and SKU for MLLM | Roadmap row: "Metering and SKU for MLLM" · Studio · P1 · 2026-10 · Feature Request (TSV :207). Lands in "Billing › Usage: MLLM meter row" (PRD :342–345), scheduled in Wave 4 (PRD :494). | **no acceptance criteria written.** |
| **868khqb6d** Integrate Studio controls with Archer | Roadmap row: "Integrate Studio controls with Archer" · Studio · **P0** · 2026-09 · L · Feature Request (TSV :208). | **no acceptance criteria written, and no definition of Archer exists.** "Archer" appears three times in the entire design office and in zero places in `ng-console`: the export row (:208), the backlog list item (`design-backlog-q3-roadmap-2026-09-03.html` :199) and the backlog's own note "Find out what Archer is before designing" (:423). Nothing on docs.agora.io matches. |

## What the product has today

Two codebases carry this feature. `studio_x_2/` is the wireframe where X1 (Usage & spend) and A6 (Concurrent lines) already shipped. `ng-console/src/` is the live Console, which already has a Usage page, a quota model, an estimate preview and a working reseller-credential mechanism. The design extends both; almost nothing here needs a new component.

### The wireframe's money model: one file, four constants

`studio_x_2/lib/campaign-data.ts` is the single source of truth and everything below derives from it.

- `AGORA_RATE_PER_MIN = 0.1` at :949, with the pricing fact written into the comment above it at :940–948: "Usage of ASR, LLM, and TTS providers is included in the unit price when using an Agora managed key", "First 300 minutes free", and the consequence, "MANAGED IS CHEAPER".
- `PAYG_RATE` at :1202 aliases it rather than repeating the literal, because two hand-written copies of the rate is how the builder once quoted $0.05 while billing ran on $0.10.
- `PLAN_USAGE` at :1184–1197: plan `Free`, `freeMinutesIncluded: 300`, `freeMinutesUsed: 150`, `freeMinutesUngated: 150`, `cardOnFile: false`, `defaultSpendCapUsd: 50`, `spendAlertPct: 0.75`, `paygSpendUsd: 0`, and a frozen period (`periodDaysElapsed: 9` of `31`) so projections are deterministic.
- `CONCURRENCY` at :1226–1232: `included: 10`, `purchased: 0`, `inUse: 2`, `queued: 0`, `pricePerLineMo: 8`. The interface comment at :1213–1214 admits the source: "Free lines every project starts with (wireframe value: no public ceiling is documented; docs sweep F8)", and :1224 admits the price: "$/line/month: wireframe placeholder (competitive w/ Retell's $8)". **Both numbers are invented.**
- Derivations: `concurrencyStats()` :1234, `freeMinutesStats()` :1249, `spendStats()` :1264, `SpendState = "free" | "payg" | "cap_warning" | "cap_hit"` :1257.
- `stackCost()` :985–1009 computes platform rate plus vendor rate per slot, and returns `allManaged` and `byoSlots`. It is the only per-model money in the product, and it is a **pre-commitment estimate**, not metered usage.

### `MANAGED_PROVIDERS` is wrong, and it is load-bearing

`studio_x_2/lib/campaign-data.ts` :1834–1839:

```
export const MANAGED_PROVIDERS: Record<string, number> = {
  OpenAI: 0.034,
  Anthropic: 0.029,
  Deepgram: 0.005,
  ElevenLabs: 0.046,
}
```

Its own comment at :1831–1833 states the rule it is meant to enforce: "A provider absent from this list is BYO-only, and the UI must say so rather than offering a mode it can't honour." Against the published managed list (see §Agora fact-check), **Anthropic and ElevenLabs are not resellable and MiniMax is missing**. Three consumers read it:

- `studio_x_2/components/wizard/stack-config.tsx` :83–93: `const resellable = vendor in MANAGED_PROVIDERS`; when false the slot renders "{vendor} is bring-your-own-key only. Agora doesn't resell it." When true it renders a managed/BYO toggle. So the wireframe today offers Agora-managed Anthropic and Agora-managed ElevenLabs, and refuses managed MiniMax.
- `studio_x_2/components/wizard/stack-config.tsx` :762 repeats the same check in the model sheet.
- `studio_x_2/lib/backup-providers.ts` :78: `backupManaged = (c) => c.vendor in MANAGED_PROVIDERS || !!c.agoraPool`, so feature 07's backup pool inherits the same error.

The rate values (0.034, 0.029, 0.005, 0.046) are per-vendor list prices used for the BYO "on top of Agora's rate" estimate. Under managed they are zeroed by `stackCost()` :1007–1009, which is correct. `VENDOR_CREDENTIALS` :1841–1846 carries `mode: "managed"` and `managedRatePerMin: 0.046` on the ElevenLabs row, rendered by `studio_x_2/components/vendor-credentials-panel.tsx` :114. `studio_x_2/app/(dashboard)/project/vendor-credentials/page.tsx` is a nine-line redirect to `/integrations?tab=credentials`.

The one place the pricing fact is told correctly is the builder's cost chip, `studio_x_2/components/wizard/stack-config.tsx` :1291–1305: "$0.10/min included" when `allManaged`, with the tooltip "On an Agora Managed Key the speech, language and voice models are included in that price. Audio minutes are billed separately. Your first 300 agent minutes are free."

### Usage & spend (X1): `components/usage-spend-card.tsx`, 614 lines

Mounted on `/billing` through `components/billing-future-cards.tsx` :18–25, which since 2026-09-11 renders `UsageSpendCard` and `ConcurrencyCard` unconditionally (the old feature switch is gone; `CurrentPeriodCard` :28–73 is dead code kept for reference).

What it does:
- Local overlay state for card, cap and alert (:63–72), all derived through `freeMinutesStats()`/`spendStats()` at :80–81 so the lifecycle machine is never re-implemented.
- A banner stack in priority order: card added :155, cap raised :168, half-tier nudge :182, free minutes exhausted :202, cap warning :222, cap hit :241. Every banner states what stopped, what did not, and offers a first-class decline ("Keep my cap" :234, "Keep paused" :259).
- A hero that switches unit at the free-to-PAYG boundary: projected dollars when `paygPhase` :268–285, minutes used when free :286–303.
- A meter that switches with it: dollars-of-cap with an alert tick at :306–344, or a two-slice free-minutes bar (ungated half plus card-unlocked half) at :345–383.
- The projection is clamped to the cap on display (:86–87) and the clamp is disclosed (:279–284): "Run rate alone would be {x}. Your {cap} cap holds the invoice."
- The write path is one sheet, `SpendControlsSheet` :473–613: cap input with three quick caps, alert percent clamped 1 to 99 (:505), and a plain-language "At the cap:" block (:591–597).
- `StateBanner` :433–469 is exported and reused by `concurrency-card.tsx` :26, `batch-detail.tsx` :18, `sip-quick-connect.tsx` :17 and `eval-tests.tsx` :24. It is the product's shared money-tone component.

What it does not do: it knows nothing about models, vendors, credits or concurrency. Its only concurrency link is one sentence at :190–193 of `concurrency-card.tsx` saying the two do not interact.

### Concurrent lines (A6): `components/concurrency-card.tsx`, 366 lines

- `ConcurrencyCard` :49–217: a gauge of `inUse` of `totalLines` (:150–186) with a seam tick marking where included ends and purchased begins (:167–173), a wall banner in **primary** tone (:115–147) reading "All {n} lines are in use. New batch calls queue. Nothing drops or fails.", a "Keep queuing" decline (:138–143, tracked), and a footer stating "Line fees bill separately from usage: your spend cap governs per-minute spend only" (:190–193).
- `AddLinesSheet` :221–365 is exported and is the purchase path: quantity with +5 / +10 / "Remove all" quick picks, proration derived from `PLAN_USAGE.periodDays*` (:250), a queue-clearing estimate that shows its inputs (`queued × ~2 min ÷ lines`, :254–258, `AVG_CALL_MIN = 2` at :47), and the deepest rule in the card at :340–349: at full use the new line count burns `newTotal × $0.10`/min, so the sheet computes how long cap headroom lasts and warns when the cap would pause calls before the speed-up pays off.
- **The sheet has four doors and they do not share state.** `concurrency-card.tsx` :206, `app/(dashboard)/monitor/live/page.tsx` :208–215, `components/batch-detail.tsx` :238–245 (via `AddLinesSheetLauncher` :228), and `components/wizard/step-call-settings.tsx` :478–486 (via `CampaignCapacityNote` :456–489). Each holds its own `purchased` counter in local state, and two of them pass hardcoded stand-ins: `batch-detail.tsx` passes `purchased={0} totalLines={10}`, and both `monitor/live` and the wizard pass `capHeadroomUsd={null}`, so the cap-versus-speed-up warning that is the sheet's best idea cannot fire in three of its four doors. This is the "one door per action" problem in its literal form.
- The per-campaign concurrency input that triggers the wizard door is `components/wizard/step-call-settings.tsx` :229–237, "Max concurrent", defaulting to 10.

### Usage: `app/(dashboard)/billing/usage/page.tsx`, 442 lines

- `/usage` is a redirect to `/billing/usage` (`app/(dashboard)/usage/page.tsx` :1–6, "Usage moved into Billing: it's a commercial concern, not Insights").
- `METRICS` :39–52: six series, one `workload: "agent"` (Agent Minutes, 18,420) and five `workload: "rte"`. A perspective toggle All / Agents / RTE at :242–250 filters them.
- `UsageChart` :56–169: log-scale multi-series SVG with a screen-reader table at :150–166.
- `QUOTA_METERS` :175–188: seven meters. Only the first derives from the truth (`convoFree.used / convoFree.included`, :176); the other six are hardcoded. The comments at :181–186 record two deliberate separations: SIP direct connection sits adjacent to RTC so readers stop misreading one as the other, and "RTC concurrent channels" is named so it cannot be confused with agent concurrent lines. Near-limit meters link to `/billing/plans` (:369–376).
- `TOP_SERVICES` :190–197: a By Service table whose **Cost column is `"$0.00"` on every row**, including "Conversational AI Engine, 18,420 min". At $0.10 a minute that row is $1,842 minus the free tier. The table has columns Service · Usage · Share · Cost and no model, vendor or agent dimension.
- Export is disabled with a toast at :263–271. The empty state at :274–287 sends the user to `/deploy`.
- There is no concurrency meter on this page, no credits balance, and no per-model row.

### The rest of Billing

`components/billing-nav.tsx` :7–15 defines seven tabs: Overview · Usage · Plans · Subscriptions · Invoices · Transactions · Payment Methods. `app/(dashboard)/billing/page.tsx` :38–53 shows Available Balance $1,286 and Reserved Balance $12 as static text.

`app/(dashboard)/billing/plans/page.tsx` :47–49 invents an Agent Studio subscription ladder: Free ($0, 300 min/month), **Pro ($99/month, 10,000 min/month)**, Enterprise (Custom). The comment at :44–46 shows the page was already corrected once (200 free minutes to 300) for exactly this reason. The Pro tier contradicts the pricing fact: Agora bills $0.10 per agent-minute, so a 10,000-minute allowance is a $1,000 allowance sold for $99. The RTC Pre-paid rows at :53–54 are the only place the word "credits" appears as a product noun, and they belong to RTC, not to Conversational AI.

### Free minutes, surfaced ambiently

`components/usage-ring.tsx` :29–81 `AvatarUsageRing` draws a progress ring around the avatar; `FreeMinutesBlock` :84–107 is the meter inside the account menu, linking to `/billing/usage`. Both read `freeMinutesStats()` so they cannot disagree. Mounted at `components/account-avatar-button.tsx` :59 and :119 and `components/account-sidebar.tsx` :104 and :129.

`components/free-minutes-nudge.tsx` :38–132 is the half-tier nudge (shown at 150 of 300 used, hidden once a card is on file, :53). `AddCardSheet` :138–240 is exported and is the **one** card-capture surface product-wide, reused by `usage-spend-card.tsx` :31. It carries a cap checkbox defaulted on (:208–219). Mounted on `/monitor` at `app/(dashboard)/monitor/page.tsx` :126.

### Events already in the taxonomy

`studio_x_2/lib/analytics.ts` :64–82 and :208–219: `free_minutes_halfway`, `card_captured`, `free_minutes_unlocked`, `spend_cap_set`, `spend_cap_raised`, `spend_cap_hit`, `projected_bill_viewed`, `concurrency_wall_viewed`, `lines_added` (negative qty means a reduction), `keep_queuing_clicked`, plus `usage_viewed` :136 and `quota_warning_clicked` :156. The comment at :71–72 states the counter-metric: `spend_alert_fired` must precede `spend_cap_hit` for the same cap. **No event exists for a purchase of capacity, a model-level usage view, or a managed-mode switch.**

### What the live Console already has (`ng-console/src/`)

This is where the design has to land, and it is further along than the wireframe on metering and further behind on self-serve.

- **Usage page** `components/console/usage-page.tsx` (1,174 lines): product select, period select, granularity, CSV export, a feature-group filter, a multi-series chart and a sortable breakdown table. The dimensions are period · project · product · feature group. There is no model dimension and no agent dimension.
- **The Conversational AI rows in the catalog** `lib/usage/usage-catalog.ts` :560–593: `convo-ai` labelled "Conversational AI Engine" with `metrics: ["audioBasicDuration", "asrTaskDuration"]`, and `convoai-agent-call-minutes` labelled "ConvoAI Agent Call Minutes" with **`metrics: []`**, a row that exists and can chart nothing. Both sit in the `ai` category at :625–634 alongside AI Noise Suppression, Spatial Audio and Real-Time STT.
- **The quota model** `lib/subscriptions/subscriptions-model.ts` :1405–1408 and :1412–1460: Conversational AI has exactly **two** entitlements, `equityItemId: 19` labelled "Duration" and `equityItemId: 23` labelled "Ares ASR", both in minutes, each with `quota`, `usage`, `remains` and a risk tone. Rendered by `lib/subscriptions/usage-quota-rows.ts` :145–172 and `components/console/usage-quotas-card.tsx` :46–90. There is no concurrency entitlement and no per-model entitlement.
- **Balance, not credits** `lib/subscriptions/subscriptions-model.ts` :756–758: `balance = accountBalance - reservedBalance`. A grep for a credits concept across `ng-console/src/lib` and `src/components` returns nothing that is not a payment card. **The product has a balance and entitlements; it does not have credits.**
- **The pricing breakdown that already exists** `components/console/billing-estimate-preview-dialog.tsx` (583 lines), copy at `lib/i18n/resources/en/common.ts` :5130–5175. Columns Description · Usage · Unit price · Percent · Amount, sections Details · Discounts · Taxes · Notes, and the honest framing "This preview estimates charges generated so far in the current month" plus "The complete monthly bill is generated at the start of next month." It is per-project. Add a model dimension to this dialog and 868kyr0ft is largely answered without a new surface.
- **Reseller mode is already wired** `lib/agents/studio-resources-api.ts` :16–24 defines `StudioResellerCredentialAlias { externalCredentialId, managementResourceId, resourceId, source, status, typeKey, vendor }`, returned on `resellerAliases` from the Studio resources endpoint. `lib/agents/agent-provider-capability-catalog.ts` :24–30 holds the policy (`credentialBinding: "managed" | "required"`, `implicitManagedResourceId`, `resellerEligible`) and :66–69 gives ARES `implicitManagedResourceId: "ares-agora-managed"`, `credentialBinding: "managed"`. The UI: `components/console/agent-config-drawer.tsx` :3254–3295 `ByokOnlyVendorAlert` renders "{Vendor} only supports BYOK", mounted three times (:1519, :1737, :2008), and :3385–3398 filters the resource picker so a `source === "reseller"` resource is only offered when `resellerEligible`. `components/console/agent-publish-dialog.tsx` :536–584 `findResellerAlias` blocks publish-time reseller resolution for ineligible vendors. i18n label "Agora Managed Key" at `lib/i18n/resources/en/common.ts` :2444.
- **MLLM is excluded from reseller by default, in one line** `lib/agents/agent-provider-capability-catalog.ts` :892–893: `resellerEligible: modelSelectable && (policy.resellerEligible ?? typeKey !== "mllm")`. Every `mllm` vendor in the catalog (:141–154: openai, gemini, vertexai, xai) is therefore ineligible, and three of them set `resellerEligible: false` explicitly anyway. Task 868kbyqe9 is literally this default plus a catalog entry plus a rate.
- **Concurrency already exists, read-only** `lib/agents/studio-feature-access.ts` :1–44 reads `feature_flags.campaign_call_settings.max_concurrent_calls` and `min_outbound_call_interval_ms` from `GET /api/studio-v2/feature` (`lib/agents/studio-features-api.ts` :5). `features/telephony/campaigns/campaign-call-settings-limits.ts` :5–30 turns it into limits, defaulting to `DEFAULT_CAMPAIGN_CONCURRENCY_MAX = 15` when the flag is absent. The UI is a number input at `features/telephony/campaigns/campaign-surfaces.tsx` :4053–4089, labelled "Concurrency limit" with the helper "Up to {{count}} calls will run in parallel at any given time." and the error "Concurrency limit must be between {{min}} and {{max}}" (`lib/i18n/resources/en/common.ts` :3099–3103). The campaign detail shows it back as a `DetailField` at :1555–1561. **The ceiling is granted by a server-side feature flag. Nothing in the Console can raise it, and nothing shows the user what their ceiling is or why.**
- **Per-campaign concurrency is persisted** as `concurrency_max_limit` on the campaign write body (`lib/telephony/telephony-api.ts` :376) and read back as `concurrencyMaxLimit` (:69).
- **The existing answer to "I need more capacity" is a support ticket.** `lib/i18n/resources/en/common.ts` :4207–4209, on Cloud Transcoding: "Note: Cloud Transcoding has a" · "concurrency limit" · ". For a higher quota, please contact support." That sentence is the pattern 868ka690p exists to replace.

### What is missing, plainly

1. No per-model, per-vendor or per-agent usage anywhere. The finest grain in either codebase is a product feature row.
2. No credits object. Balance and entitlements exist; credits do not.
3. No way to see your concurrency ceiling, and no way to raise it without support.
4. No capacity SKU, no purchase path for capacity, no price for a line that is not a wireframe placeholder.
5. No MLLM managed mode, no MLLM meter row, no MLLM SKU.
6. No usage-tracking identity separate from the provider credential.
7. Nothing named Archer.

## Agora fact-check

Cited from docs.agora.io and from the installed SDK `agora-agents@2.4.0` at `ng-console/node_modules/agora-agents/dist/cjs/`.

### Pricing, confirmed, do not redo

https://docs.agora.io/en/conversational-ai/overview/pricing

- "Conversational AI Engine Audio Task: 0.10 USD / minute".
- "The unit price includes usage of selected ASR, LLM, and TTS models. You are charged the same price even if you bring your own key (BYOK)."
- "First 300 minutes are free."
- "At the end of each month, the free quota is subtracted from your total usage, and the remaining minutes are multiplied by the unit price to calculate your bill, rounded to two decimal places."
- The page says nothing about concurrency, credits, reseller mode or MLLM pricing.

Consequence for this feature: **model choice cannot move the Agora line of the bill.** A "model-level pricing breakdown" can only ever show either (a) minutes attributed per model, all at the same rate, or (b) the vendor's own bill under BYO, which Agora does not see. Both are real answers. Neither is a per-model price from Agora.

### Managed mode is the reseller contract, and it has a field

https://docs.agora.io/en/conversational-ai/overview/release-notes, v2.9 (July 1, 2026): new parameters `properties.asr.credential_mode`, `properties.llm.credential_mode`, `properties.tts.credential_mode`. "Set `credential_mode` to `\"managed\"` within the `asr`, `llm`, or `tts` block". "Managed mode replaces the deprecated `preset` parameter." The v2.5 (March 31, 2026) `preset` parameter is "Deprecated in favor of setting `credential_mode`".

https://docs.agora.io/en/ai/build/custom-model-integration/managed-mode: categories that omit the setting "default to `\"byok\"`, which requires you to bring your own provider credentials." Supported under managed mode:

| Slot | Vendor | Models |
|---|---|---|
| ASR | ARES | built-in engine |
| ASR | Deepgram | `nova-2`, `nova-3` |
| LLM | OpenAI | `gpt-4o-mini`, `gpt-4.1-mini`, `gpt-5-nano`, `gpt-5-mini` |
| TTS | MiniMax | `speech-2.6-turbo`, `speech-2.8-turbo` |
| TTS | OpenAI | `tts-1` |

That is the whole managed catalog: three vendors plus ARES. It matches the pricing page's list exactly. **Anthropic and ElevenLabs are not on it**, which makes `MANAGED_PROVIDERS` in `studio_x_2/lib/campaign-data.ts` :1834 wrong in two of its four entries and short by one (MiniMax).

**The installed SDK does not have the field.** `grep -r credential_mode` over `ng-console/node_modules/agora-agents/dist/cjs/` returns nothing. `api/resources/agents/client/requests/StartAgentsRequest.d.ts` still documents the deprecated `preset` with the same three lists ("Available presets: ASR: `deepgram_nova_2`, `deepgram_nova_3`; LLM: `openai_gpt_4o_mini`, `openai_gpt_4_1_mini`, `openai_gpt_5_nano`, `openai_gpt_5_mini`; TTS: `minimax_speech_2_6_turbo`, `minimax_speech_2_8_turbo`, `openai_tts_1`"), and "When a preset is specified, you do not need to provide the endpoint URL, API key, or model for the preset providers." The typed wrappers `api/types/Asr.d.ts`, `Tts.d.ts` and `Llm.d.ts` carry no `credential_mode`; `Llm.d.ts` :48 has `[key: string]: any`, so the field passes through untyped. The Console does not use the Engine field at all: it models managed as its own `credentialBinding: "managed"` plus a reseller alias (`agent-provider-capability-catalog.ts` :66–69, `studio-resources-api.ts` :16).

### MLLM managed mode does not exist

https://docs.agora.io/en/conversational-ai/studio/build/customize-agent, verbatim: "No MLLM vendor-models are currently available under Agora Managed Key. Add your own credential, then select it from the **Credentials** dropdown." The managed-mode page lists no MLLM slot. The SDK's `api/types/Mllm.d.ts` :5–33 has `vendor: "openai" | "gemini" | "vertexai" | "xai"` and requires `api_key` (or `adc_credentials_string` + `project_id` + `location` for Vertex AI) on every one of them.

So 868kbyqe9 (MLLM in the managed catalog) and 868keau65 (metering and SKU for MLLM) are both **Requires Engine**: there is no `mllm.credential_mode`, no MLLM preset, and no MLLM entry in the reseller catalog to meter. "Not available under Agora Managed Key" is the true state to design for today.

### Concurrency: one documented number, no field

https://docs.agora.io/en/conversational-ai/overview/release-notes, v1.0 Private Beta (February 18, 2025): "The number of Peak Concurrent Users (PCU) allowed to call the server API under a single App ID is limited to 20." The same sentence is on https://docs.agora.io/en/conversational-ai/rest-api/agent/join. No later release note revises it.

The contract exposes no concurrency field to read or set. The only concurrency surface in the SDK is an error: `api/types/AgentErrorResponse.d.ts` lists `ConcurrencyLimitExceeded`, `ResourceQuotaLimitExceeded` and `AccountSuspended` among `Reason`, and maps HTTP 422 to "Access limit exceeded". **You can be told you hit the wall. You cannot ask where the wall is.**

The nearest readable ceiling is not Engine at all: it is the Console's own `feature_flags.campaign_call_settings.max_concurrent_calls` (`ng-console/src/lib/agents/studio-feature-access.ts` :24–26), granted server-side per customer ID. That is what the Console clamps campaign concurrency to today, defaulting to 15 when absent.

Both halves of the ask are therefore **Requires Engine**: 868keb6r4 (make it settable) and the write half of 868ka690p (sell it).

### Metering: minutes are derived from two timestamps

`api/resources/agents/types/GetAgentsResponse.d.ts` returns `start_ts`, `stop_ts`, `status` (IDLE · STARTING · RUNNING · STOPPING · STOPPED · FAILED) and `agent_id`. `StartAgentsResponse.d.ts` returns `agent_id`, `create_ts`, `status`. `ListAgentsResponse.d.ts` returns `data.count`, `data.list[]` of `{ start_ts, status, agent_id }` and `meta.total`.

There is **no duration field, no cost field, no usage object** anywhere in the agent API. Billable minutes are `stop_ts - start_ts`, and a live concurrency count is the number of `RUNNING` rows from List. `StartAgentsRequest.Properties.idle_timeout` notes "the maximum runtime of a single task is 72 hours, after which the agent automatically exits", which is the upper bound on a single billable session.

For 868khza4m (meter Studio usage on Engine), the join that ties a session to a Studio agent already exists: `StartAgentsRequest.pipeline_id`, "The unique ID of a published agent in AI Studio. When provided, the saved agent configuration is used as the base configuration." That is the attribution key Engine would meter on. Whether Engine returns anything keyed by it is **Requires Engine**.

### Usage tracking identity: `labels` is the only carrier

`StartAgentsRequest.Properties.labels`, added in v2.1 (December 5, 2025): "Custom labels in key-value pair format, where the key is the label name and the value is the label value. Enables agents to carry custom business information. These labels are bound to the agent and returned in the `payload` field of all message notification callbacks from the conversational AI engine."

Labels come back on **callbacks**, not on a usage report, and there is no documented usage query that filters by them. For 868kmghjc (separate key or resource for usage tracking) the contract offers a tagging mechanism and no reporting mechanism. **Requires Engine.**

### What the Console's own usage API can slice by

`ng-console/src/lib/usage/usage-api.ts` :13–40 `UsageMetadataItem` carries `modelId`, `packageType` and `fetchParams: { aggregate, aggregateSettingValue, business, model }`. That `model` is the Agora usage model (it defaults to the string `"duration"` at :289 and :351), not an LLM model. The request is built at :304–330 from `business`, `model`, `modelId` and the feature-group keys. **There is no vendor or LLM-model dimension in the Console usage API today.** Adding one is Engine plus billing-platform work, not a Console change.

### Where the docs are silent

- No credits endpoint, object or concept on docs.agora.io for Conversational AI. **Requires Engine**, and probably requires a product decision first.
- No capacity SKU, no per-line price, no concurrency purchase. **Requires Engine.**
- No MLLM managed mode or MLLM rate. **Requires Engine.**
- "Archer" returns nothing on docs.agora.io and appears nowhere in either codebase. **Unknown, blocks 868khqb6d entirely.**

## Already decided

From `CLAUDE.md`, `LEARNINGS.md` and the features that shipped before this one. Do not reopen these.

- **The pricing fact.** `AGORA_RATE_PER_MIN` comment, `studio_x_2/lib/campaign-data.ts` :944–947: "The consequence is the single most important pricing fact in the product and it is the inverse of every competitor: MANAGED IS CHEAPER. Same platform rate either way, and under managed the vendor bill is absorbed." Never design a control whose premise is that model choice moves the Agora bill.
- **X1's six money rules** (LEARNINGS §20, 2026-07-09): the projection on display never exceeds the cap and the clamp is disclosed; the meter switches primary unit at the free-to-PAYG boundary; the cap pauses new calls while in-flight calls finish and "keep paused" is first-class; a cap can be set before a card and arms at capture; `spend_alert_fired` must precede `spend_cap_hit`; every figure derives from `PLAN_USAGE`.
- **A6's five rules** (LEARNINGS §20, 2026-07-09): "lines vs cap are separate: line fees are subscription, the cap governs per-minute usage, and the UI says so"; "the wall is designed behavior: primary tone, 'batch calls queue, nothing drops', **'Keep queuing' is a first-class decline** (tracked: a healthy decline rate proves no dark pattern)"; estimates show their inputs and commit buttons carry exact amounts; "the cap can bite before a speed-up pays off" and the sheet says so; "ONE capacity-communication component per surface (a split select-suffix + note = drift)".
- **Cost by vendor was already killed once.** `CLAUDE.md` open tension 6: "Cost in Analytics: Cost tab was deleted 2026-05-26 after audit (Agora doesn't have per-vendor cost data). Pre-commitment estimates live in Deploy modal; platform spend in Billing › Overview." `references/usage-rebuild.md` repeats it. 868kyr0ft is asking for the surface that audit deleted, so the brief has to name what changed.
- **Usage is a commercial concern.** `app/(dashboard)/usage/page.tsx` :3 and `CLAUDE.md`: Usage lives under Billing, not under Monitor. `CLAUDE.md` open tension 5 records that the Figma still shows it as a standalone project item and calls the decision pending.
- **RTE is usage, not sessions** (`CLAUDE.md`): Realtime Services has "View usage" links only. A concurrency meter for agents must not be mistaken for RTC concurrent channels; `app/(dashboard)/billing/usage/page.tsx` :184–186 already renamed the RTC row for exactly this reason.
- **The free tier is 300 minutes, not 10,000** (LEARNINGS §20, 2026-07-09 fact-check 1). The 10,000 is core RTC.
- **Billing is postpaid** (same entry): "billing is postpaid $0.10/min managed, so spend caps matter".
- **Reuse, don't redesign.** `AddCardSheet`, `AddLinesSheet` and `StateBanner` are already the shared surfaces. A new capacity control that is not one of them is drift.
- **Copy discipline** (`CLAUDE.md`): no new UI text beyond the reference without asking; one short line under a control; explanations behind progressive disclosure.
- **Honesty floor.** "Not supported by {vendor}" is a real state. The Console already ships the idiom as `ByokOnlyVendorAlert`.

## Open questions for the owner

This section is the point of the brief. Nothing past stop 0 should start until 1, 2 and 3 are answered.

**1. What is Archer?** (blocks 868khqb6d, a P0 due this month)
It appears three times in the design office, all of them the same roadmap row, and nowhere in `ng-console`. Possible answers and what each would mean:
- *An internal Agora billing or entitlement system.* Then "integrate Studio controls with Archer" means the concurrency and quota controls in this feature read and write Archer, and Archer's data model decides whether credits, SKUs and capacity are real objects. This feature would be blocked on its schema.
- *A partner or customer platform.* Then it is an integration surface like a connector, and it belongs with feature 19 (Tools & connectors), not here.
- *A codename for an internal admin console.* Then the Studio-side work is an export or an API, and there is no user-facing design at all.
Until this is answered the task cannot be scoped, and P0 · Sep is not achievable.

**2. Is the capacity purchase path in scope, or does the wall still end in "contact support"?** (blocks 868ka690p, and decides whether `AddLinesSheet` ships or is deleted)
- *Self-serve purchase is in scope.* Then Engine must expose a settable concurrency limit (868keb6r4) and finance must set a real per-line price. The wireframe's $8/line/month is a placeholder copied from Retell (`campaign-data.ts` :1224) and the 10 included lines are invented (:1213). Neither can ship as a number a customer is charged.
- *Capacity stays sales-assisted.* Then the honest design is the opposite of what exists: show the ceiling the feature flag already grants (`max_concurrent_calls`), show how close the account is to it, and route to sales. `AddLinesSheet` and its four doors come out, and the wall banner keeps its "Keep queuing" decline.
- *Half: show and request, do not charge.* A "Request more capacity" path that files the ask and shows the pending state. Cheapest to ship, and it makes the ceiling visible, which nothing does today.

**3. What does "credits" mean here?** (blocks 868kyr0ft)
There is no credits object in either codebase or in any Agora doc. The nearest real things are three different nouns:
- *Account balance* (`ng-console/src/lib/subscriptions/subscriptions-model.ts` :756, `accountBalance - reservedBalance`). If credits means balance, the work is surfacing balance and reserved funds next to usage, and the word "credits" should not be used.
- *Free-tier entitlements* (`ConvoaiQuotaEntitlement`, equity items 19 "Duration" and 23 "Ares ASR"). If credits means the free 300 minutes plus any granted quota, the work is showing entitlement burn-down, and the existing `QuotasCard` already does most of it.
- *A new prepaid credit product.* Then it is a finance decision, not a design one, and it needs the same answer as question 2.

**4. What grain does "model-level usage" mean, given that every model costs the same $0.10?**
- *Minutes per model.* Attribution only: which models carried the traffic. Honest, and derivable if Engine meters `pipeline_id` plus the model in the session (868khza4m). No money per row, or the same money per row.
- *Money per model under BYO.* Agora does not see the customer's vendor invoices. This can only ever be an estimate from list prices, which is exactly what the 2026-05-26 audit deleted the Cost tab for. If the owner wants it back, the brief needs to say what changed since that audit.
- *Both, split.* One column "Minutes" that is metered, one column "Estimated vendor cost" that is labelled an estimate and only appears for BYO slots. This is the only version that is both useful and true, and it is the most work.

**5. Does reseller-mode usage bill through existing postpaid, or as a new SKU?**
This is the PRD's own blocking question (`prd-q3-roadmap-execution-2026-07-29.html` :526) and it is still open. It decides what the credentials surface is allowed to promise. If it is postpaid, managed mode changes nothing on the invoice and the UI should say "included". If it is a SKU, managed and BYO produce different invoice lines and the Usage page needs to show both.

**6. Do we fix `MANAGED_PROVIDERS` now, or wait for the catalog task?**
The list at `studio_x_2/lib/campaign-data.ts` :1834 offers Agora-managed Anthropic and Agora-managed ElevenLabs, neither of which Agora resells, and refuses managed MiniMax, which it does. It is a three-line fix and it changes what the builder offers on three surfaces. It is also a violation of the honesty floor sitting in the live wireframe today. Options: fix it in this feature's first slice; fix it in feature 07 where the backup pool reads the same list; or fold it into 868kbyqe9 when the catalog gets its MLLM entries.

**7. Do the four `AddLinesSheet` doors collapse to one?**
Today the sheet is mounted in `concurrency-card.tsx` :206, `monitor/live/page.tsx` :208, `batch-detail.tsx` :238 and `wizard/step-call-settings.tsx` :478, each with its own local purchase counter and three of them passing `capHeadroomUsd={null}` or hardcoded line counts, so the sheet's cap-versus-speed-up warning cannot fire where it matters most. Either the state lifts to one shared source, or the extra doors become links to the one card. This is a "one door per action" call, and it should be made before anything new is added to the sheet.
