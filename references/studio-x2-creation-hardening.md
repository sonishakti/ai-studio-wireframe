# studio_x_2 — Agent-creation hardening (/fortify + /clarify)

> Produced 2026-07-02 by an 11-agent workflow (ground → 7 surface fortifications → clarify pass → synthesis + adversarial critic), grounded in the shipped wizard code. Scope: the whole create-an-agent flow — Home/first-run, Steps 1–5, the 4 Step-4 branches. Companion to `studio-x2-agent-creation-case-study.md`.

---

## 0. Headline — harden the DRAFT OBJECT, not the screens

The single most valuable finding. Six passes each hardened one *screen*; nobody audited the `AgentDraft`'s **identity and lifecycle**. It is one global mutable object shared across 5 drawers, 4 entry modes (`new` · `edit` · `?dc=` · `?artifact=`), and N browser tabs — and every surviving P0 lives in that gap. **Fix the draft's identity model (namespaced keys, derived channel, cross-tab reconcile, prune-on-switch) before shipping any per-surface copy.**

- `DRAFT_KEY = "sx:agent_draft"` is a **single global slot**.
- `publish()` calls `clearDraft()` **before** the (future) commit and has **no failure branch**.
- Edit mode hardcodes `type: "inbound"` in `agentToDraft()` and the `?dc=`-in-edit path never persists.
- `update({ type })` is a shallow patch — switching intent leaves the old branch's config live.

---

## 1. State-inventory matrix

`✓` handled today · `⚠` gap (designed here, not built) · `—` n/a.

| Surface | empty | loading | partial | error | success | offline | disabled | overflow |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Home** (GoLiveHome) | ⚠ | — | ⚠ | ⚠ | ✓ | ⚠ | ✓ | ⚠ |
| **Step 1 · Voice** | ⚠ | ⚠ | ✓ | ⚠ | ✓ | — | — | ✓ |
| **Step 2 · Type** | ⚠ | — | ✓ | ⚠ | ✓ | ⚠ | — | ⚠ |
| **Step 3 · Prompt+vars** | ⚠ | ✓ | ⚠ | ⚠ | ✓ | ⚠ | — | ⚠ |
| **Step 4 · Inbound phone** | ⚠ | — | ✓ | ⚠ | ✓ | ⚠ | — | — |
| **Step 4 · Web widget** | ⚠ | — | ✓ | ⚠ | ✓ | — | — | ⚠ |
| **Step 4 · Code** | ⚠ | — | ✓ | ⚠ | ✓ | ⚠ | — | ✓ |
| **Step 4 · Outbound** | ⚠ | ⚠ | ✓ | ⚠ | ✓ | ⚠ | — | ⚠ |
| **Step 5 · Test & publish** | ⚠ | ⚠ | ⚠ | ⚠ | ✓ | ⚠ | ✓ | ⚠ |

Reading it: `success` is solid (happy path ships). **Every `error` cell is a gap — that column is where the flow leaks.** `offline` is uniformly `⚠` because the app is mock (localStorage-only): design now, wire later. `disabled` is `✓`/`—` by design — the no-hard-locks decision means Publish is always clickable (a hint, not a disable).

---

## 2. Build list — P0 (data-loss · duplicate-publish · silent-bad-data-to-real-people)

### 2a. Draft-lifecycle bug class (fix first)

| # | Bug | Fix |
|---|---|---|
| P0-1 | **`publish()` clears the draft BEFORE commit, no failure branch.** Harmless while synchronous; guaranteed data-loss the moment a backend lands (failed commit = draft gone + nothing live). | Reorder: commit → on success `clearDraft()` + navigate; on failure keep draft + `Retry` toast. |
| P0-2 | **Edit-Aria publishes a DUPLICATE agent (most-embarrassing).** `agentToDraft()` hardcodes `type:"inbound"`; `?dc=`-in-edit never persists → editing Aria + publish always fires `publishDeployment({channel:"Inbound"})` regardless of her real channel → Aria now "live" twice + north-star `deployment_went_live` double-counts. And `clearDraft()` on publish nukes a *new-agent* draft open in another tab. | (a) In edit mode derive `channel`/`type` from the real deployment, not `"inbound"`; if unknown, block with "Confirm this agent's channel." (b) Guard `publishDeployment`: same `agentId`+channel already live → route to *update*, never mint a second. (c) `clearDraft()` only when `!isEdit`. |
| P0-3 | **One global draft key + clear-on-publish = cross-tab wipe; restore silently overwrites "Create new".** Tab A builds "Renewals Bot" (autosaved); Tab B publishes Aria → `clearDraft()` wipes A. Separately, `restoreDraft()` on every `/agents/new/edit` mount seeds a stale draft over a user who wanted a clean slate. | Namespace the key per target (`sx:agent_draft:new` vs `:<agentId>`); publish clears only its own key. On new-agent mount with an existing draft, don't auto-seed — show a Resume / Start-fresh row. Add a `storage`-event reconcile. |
| P0-4 | **Switching intent orphans the old branch into a real deployment.** `update({type})` is shallow → configure Outbound (CSV + caller-ID) → switch to Code → `publishBlockReason` (reads only the active branch) returns `null` → publishes as "Embed" while still holding a scarce caller-ID number out of the BYO-SIP pool, invisibly. | On `type` change, prune non-active branches into a session stash (toast "…set aside, not deleted · Undo"); `publishDeployment` serializes only the active channel's config. |

### 2b. Silent bad data reaching real callers

| # | Bug | Fix |
|---|---|---|
| P0-5 | **`extractVars` regex `/\{\{\s*([\w.]+)\s*\}\}/g` is ASCII-only + exact-case column match.** `{{société}}` `{{名前}}` `{{الاسم}}` never match → never flagged "missing" → publish succeeds → agent reads literal `{{名前}}` aloud to every contact. `{{Name}}` vs `name`, BOM `﻿name` also silently "missing." | Unicode regex `/\{\{\s*([\p{L}\p{N}_.]+)\s*\}\}/gu`; match CSV columns NFC-normalized, BOM-stripped, case-insensitive. |
| P0-6 | **Malformed / unclosed `{{vars}}`** (`{{name`, `{{first name}}`, `{{}}`) undetected → literal braces voiced. | Sibling malformed-var detector beside `extractVars` (leave the strict regex intact); amber non-blocking inline warning naming the broken token + example. |
| P0-7 | **CSV integrity: no phone-number column / empty (header-only) CSV pass validation** → empty campaign launches / nothing to dial. | Parse-and-validate in `attachCsv`; reject bad file, **preserve the prior CSV**; add a distinct publish block ("no phone-number column to dial"). |

---

## 3. Build list — P1 (dead-ends · honesty · recovery)

| # | Surface · state | Fix (copy in §6) |
|---|---|---|
| P1-8 | Step 5 · double-click Publish → double `deployment_went_live` | `publishing` state guard; button → "Publishing…" |
| P1-9 | Step 5 · **inert block reasons** — name a step, don't link | Map each reason → its step; render a **"Fix this →"** button (two for the vars case) |
| P1-10 | Home · **draft invisible** — `hasDraft()` exported but unused | Restore row: "Unfinished agent draft · left off at Step N" + Resume/Discard/Undo |
| P1-11 | Step 1 · `?artifact=` not found → **silent** blank Step 1 | Toast + dismissible inline note + strip dead `?artifact` from URL; do NOT auto-pick a preset |
| P1-12 | Step 1 · abandon playground discards unsaved voice, no warning | Dirty-guard AlertDialog on Cancel/Back |
| P1-13 | Step 2 · deep-link `?dc=` clobbers existing `numberId`, jumps to Step 4 | Merge (don't drop siblings); land on Step 2 with "phone setup saved · Switch back" |
| P1-14 | Step 2 · "Save & continue" with `type===null` → advances into empty Step 4 | Inline hint + stay on Step 2 (aria-live), or Step-4 routing empty-state |
| P1-15 | Step 4 outbound · **no unassigned numbers** | Zero-state card w/ two live exits (Connect a number / Embed a web widget); add missing outbound BYO-SIP hint (parity w/ inbound) |
| P1-16 | All CodeBlocks · clipboard write fails but UI shows "Copied" (false success) | Gate success on `writeText` resolving; on fail "select and copy manually"; keep `<pre>` selectable |
| P1-17 | Step 3 · KB attached while indexing looks identical to ready; connector attach fail has no state | Carry "· indexing" onto the chip + footnote; failed attach → amber chip + Retry; auth-fail → "needs credentials · Open in Resources" |
| P1-18 | Steps 2/3 · autosave failure swallowed → "saves as you go" is a lie | `saveDraft` returns boolean; footer flips to "Couldn't save… keep this tab open" |
| P1-19 | Step 4 outbound · settings (window/concurrency/retry) are local `useState`, never persisted | Lift into `draft.config.outbound` so autosave preserves them |
| P1-20 | Step 5 · going-live is instant `router.push`, no provisioning state | ~1.2s "Publishing…" interim; Monitor pill "Spinning up" → "Live" |
| P1-21 | Home · mic denied / unreachable (wired) | "Connecting…" interim; mic-blocked inline note + Edit-agent fallback; never render Aria as broken |
| P1-22 | Step 4 web/code · **provisional `agentId:"new"` copyable + shippable** with no warning; web/code have **no `publishBlockReason` gate** (can go "live" but structurally can't carry traffic) | Placeholder token `<your-agent-id>` + "real ID appears on publish" note; add minimal channel-proof gates for web (widget added) and code (SDK acknowledged) |
| P1-23 | i18n · no `dir="auto"` on prompt/greeting textareas + badge row (RTL mangles) | `dir="auto"` on textareas + badge container |
| P1-24 | IDs · `Date.now().toString(36)` collides across two tabs publishing in the same ms | counter + random suffix |

---

## 4. Build list — P2/P3 (polish, one line each)

- P2 progress+naming: relabel rail "Customize Aria" / drop the 2/5-capped fraction or wire predicates.
- P2 preview honesty: "This is a preview. Live audio starts when you test the finished agent." + degrade to the written line.
- P2 prompt volume: char counter `{n}/4,000` + latency/cost note; never truncate.
- P2 replace-CSV: confirm before discarding a validated file; toast the column delta.
- P2 encoding/large CSV: "doesn't look like UTF-8" + "Reading contacts…"; off-thread/stream parse; store only name+columns+count, never rows.
- P2 import error split: JSON-syntax vs missing-`name`, each with an example.
- P2 edit-mode channel: "Confirm how this agent runs — we couldn't detect its current channel."
- P2 overflow: `+{n} more` badge collapse; "Talk to agent" fallback >18 chars; `title` tooltips.
- P2 import lands on wrong surface: `onImported` routes to `/agents/playground` but the on-screen promise says "drop you back **here**" — fix the copy or route to `/agents/new/edit?artifact=`.
- P3: empty-`AGENTS` guard zero-state; per-artifact specific toasts; low-number scarcity note; two-tab draft race (handoff note, don't build).

---

## 5. First-run fix — make the wall a ramp

**The tension (resolved):** two "live" objects the UI conflates in the user's head but not in state — **Aria** (auto-provisioned, `status:"live"`, on Home; value-first, works) vs **a blank new draft** (`/agents/new/edit`, NOT live, gated by `publishBlockReason`). The dead-end is the seam: a first-timer meets a live agent, then clicks Create / deep-links `?step=5` and lands on a *different* object where every row is "—" and Publish throws inert blockers, with nothing explaining why the "live" thing is now "unfinished."

**Fix (three moves, in order):**
1. **Make the wall actionable.** On a blank draft at Step 5, each `publishBlockReason` maps to its step and renders a **"Fix this →"** button, under one orient line: *"You're at the last step. A few things still need input before you can publish {agentName}."* Converts the dead-end into guided backfill — highest-value first-run gain.
2. **Never lose the starting point.** `?artifact=` not-found recovers with a toast + inline note (P1-11); fix the import-lands-in-playground broken promise (P2).
3. **Surface the draft where they return** — the Home restore row (P1-10).

Net: Aria delivers the believe-first moment; the fix closes the three seams where the *second* action (create / import / publish) drops the user into a silent or inert dead-end.

---

## 6. Final microcopy (P0/P1 rows; ~30 P2/P3 polish rows omitted)

Reconciliation spine: the **action** is always **Publish** (button `Publish agent`); the **state** is **live** ("is live," `Live` pill — a state, not the label, so it doesn't collide with the "never Go live" lock).

| Location | State | Final copy |
|---|---|---|
| **HOME** | | |
| Progress rail heading | Aria live | `Customize Aria` (or `Set up Aria` if counter wired) |
| Draft restore row | returning w/ draft | title `Unfinished agent draft` · detail `You left off at Step {n}: {stepTitle}` · `Resume draft` / `Discard draft` |
| Discard confirm | — | `Discard this draft? Your unsaved agent setup will be deleted. This can't be undone.` · `Discard draft` / `Keep editing` |
| Post-discard / undo | — | `Draft discarded` · `Undo` → `Draft restored` |
| Import success | config carried | `{name} imported` / `Its voice and system prompt are ready in the builder.` |
| Import success | name-only | `We imported the name "{name}". Add its voice and system prompt in the builder.` |
| Talk button | default / long name | `Talk to Aria` · (>18 chars) `Talk to agent` |
| Mic denied | wired | `Your browser is blocking microphone access. Allow the mic to talk to Aria — or edit the agent instead.` · `Edit agent` |
| **IMPORT SHEET** | | |
| Invalid — JSON syntax | — | `This isn't valid JSON yet. Check for a missing comma or bracket, then validate again. Example: {"name": "Support agent"}` |
| Invalid — missing name | — | `Add a "name" field — it's the only thing we need to import. Example: {"name": "Support agent"}` |
| **STEP 1 · VOICE** | | |
| Artifact not found | dead-end | toast `That custom voice isn't available` / `It may have been cleared from this browser. Pick a voice below to keep going.` · inline `We couldn't find the custom voice you were building. Choose one below, or open the playground to rebuild it.` |
| Playground discard | abandon | `Discard this voice?` / `You haven't saved it yet, so this custom voice won't be kept.` · `Discard voice` / `Keep editing` |
| Missing-voice block | ships | `Choose a voice first.` |
| **STEP 2 · TYPE** | | |
| Advance with none | aria-live | `Choose Inbound, Outbound, or Code to keep going.` |
| Intent-switch set-aside | orphan fix | `Switched to Inbound` / `Your Outbound setup — contacts CSV and caller-ID number — was set aside, not deleted.` · `Undo` |
| Restore chip | stashed | `Restore your earlier Outbound setup? contacts.csv · +1 (415) 555-0198` · `Restore` / `Start fresh` |
| Deep-link preset | overwrite | `Opened as a web widget` / `Your earlier phone number setup is saved — switch back anytime in Configure.` · `Switch back` |
| Empty Step-4 fallback | unselected | `Nothing to configure yet — choose how your agent runs in Step 2 first.` · `Back to Step 2` |
| Autosave failed | quota | `We couldn't save your draft automatically. Keep this tab open so you don't lose it.` |
| **STEP 3 · PROMPT + VARS** | | |
| Malformed brace | broken var | `Looks like an unfinished variable near "{{name…". Wrap dynamic values in {{double_braces}} with no spaces.` |
| Outbound vars uncovered | footnote | `{n} variables aren't in your contacts CSV yet: {{first_name}}, {{invoice_id}}. You'll map them before you publish.` |
| KB indexing | chip + note | `{name} · indexing` / `Still indexing — this agent won't answer from this source until indexing finishes.` |
| Connector fail | wired | `{name} — couldn't connect` · `Retry` — or `{name} — needs credentials` · `Open in Resources` |
| Autosave failed (prompt) | quota | `We couldn't save your draft — your browser storage may be full. Copy your prompt somewhere safe.` |
| **STEP 4 · CONFIGURE** | | |
| Zero numbers | dead-end | `No phone numbers available yet` / `Agora doesn't sell numbers. Bring your own carrier number and route it over SIP.` · `Connect a number` / `Embed a web widget instead` |
| BYO-SIP hint | both branches | `No number free? Agora routes your own carrier number — connect one over SIP in Resources › Numbers.` |
| CSV parsing | loading | `Reading contacts…` |
| CSV — empty | P0 | `{filename} has no contacts — just a header row. Add at least one contact, then upload again.` |
| CSV — malformed | — | `We couldn't read {filename} as a CSV. Check it's comma-separated with a single header row.` |
| CSV — encoding | — | `{filename} doesn't look like UTF-8. Re-save it as a UTF-8 CSV and try again.` |
| CSV — no phone column | P0 | `{filename} has no phone-number column. Add a column of numbers to dial (for example, "phone"), then upload again.` |
| Vars missing, fix hint | — | `Fix it either way: add these as columns to your CSV, or edit the prompt to remove them.` · `Edit prompt →` (Step 3) · `Re-upload CSV →` (Step 4) |
| Outbound settings helper | — | `Call window, concurrency, and retries apply to this deployment.` |
| Provisional ID (web) | new draft | `This is a preview snippet. Your real agent ID appears the moment you publish — copy it again then.` · token `data-agent-id="<your-agent-id>"` |
| Provisional ID (code) | new draft | `Preview snippet — this agent isn't published yet. Publish to get your real agent ID, then copy it again.` · token `agentId: "<your-agent-id>"` |
| Copy failure | — | `Couldn't copy automatically. Select the code and copy it manually.` |
| **STEP 5 · TEST & PUBLISH** | | |
| Footer ready | replaces "ready to go live 🎉" | `Everything's set — ready to publish.` |
| Orient line | blank draft | `You're at the last step. A few things still need input before you can publish {agentName}.` |
| Block — voice | actionable | `Choose a voice first.` · `Pick a voice →` (Step 1) |
| Block — type | — | `Pick an agent type first.` · `Choose type →` (Step 2) |
| Block — prompt | — | `Add a system prompt.` · `Write the prompt →` (Step 3) |
| Block — inbound number | — | `Attach a phone number for the agent to answer.` · `Set up the channel →` (Step 4) |
| Block — outbound number | — | `Attach a caller-ID phone number.` · `Set up calls →` (Step 4) |
| Block — outbound CSV | — | `Upload a contacts CSV.` · `Add contacts →` (Step 4) |
| Block — no phone column | — | `Your contacts CSV has no phone-number column to dial.` · `Fix the CSV →` (Step 4) |
| Missing-vars banner | ships | `Your contacts CSV is missing {n} variable{s}: {{account}}, {{due_date}}.` · `Fix it either way: add these columns to your CSV, or drop the variables from your system prompt.` · `Edit prompt →` · `Re-upload CSV →` |
| Publish while blocked | ships | `A couple of things to finish first` · {block reason} |
| Publish button | replaces "Publish & go live" | `Publish agent` → committing `Publishing…` · sub-hint `Setting up {channel} — this takes a few seconds.` |
| Publish success | ships | `{name} is live` / `{agentName} is now answering on {channel}.` |
| Monitor arrival | wired | pill `Spinning up` → `Live` |
| Publish failure | wired/P0 | `Couldn't publish — nothing went live` / `Your setup is safe and still here. Check your connection and try again.` · `Retry` |
| Summary rows unset | — | `Not set yet` (replaces bare `—`) |

---

## 7. Glossary — canonical terms (enforce one, kill the rest)

| Concept | Canonical | Never |
|---|---|---|
| The publish action | **Publish** (`Publish agent`) | Go live, Deploy, Launch, Ship |
| The published state | **Live** ("is live," `Live` pill) | Deployed, Running, Active (as label) |
| The 5th step | **Test & publish** | Go live, Deploy |
| Answering/dialing number | **Phone number** | Number (bare), available number, DID |
| Outbound origin number | **Caller-ID phone number** (first mention only) | Caller ID (alone), from-number |
| The people called | **Contacts** | Recipients, leads, list members |
| The uploaded file | **Contacts CSV** | Contact list, CSV file (bare), spreadsheet |
| Behavior definition | **System prompt** | Instructions, Prompt (bare), Brain |
| Dynamic placeholder | **Variable** / shown as `{{variables}}` | Template var, token, merge field |
| Tuning a working default | **Customize** | — |
| First-time required input | **Set up** | Configure (in prose), Build |
| Changing existing values | **Edit** | Update, Modify |
| The thing itself | **Agent** | Assistant, bot, AI |
| Outbound send | **Batch calls** | Campaign, blast, broadcast |

**Two hardest reconciles to make in code:** `channel-configs.tsx:190` `label="Go live"` and `step-publish.tsx:90` `Publish & go live` → `Publish agent`; `step-configure.tsx:45` `contact list` → `contacts`, every `caller-ID number` → `caller-ID phone number` (first mention only).

---

## 8. Correction log (what the workflow got wrong — verified)

- **DEBUNKED:** the Home pass's headline P0 "import silently drops the config" is **false**. Actual `onImported` mints a voice artifact (`saveVoiceArtifact`) and routes to the playground. The real (smaller) defect: it lands on `/agents/playground`, contradicting the on-screen promise "drop you back **here**" → fix the copy or route to `/agents/new/edit?artifact=` (now P2, §4).
- **UPGRADED:** "switch intent orphans CSV" was filed P0-orphan by one pass but its *publish* consequence (leaks a scarce number into a live deployment) was missed → it's a true P0 (P0-4).
- **UPGRADED:** the ASCII-only `extractVars` regex silently ships literal non-English variables to real callers → treated as P0 (P0-5), not a polish item.

---

## Files touched (build map)

`studio_x_2/lib/wizard-draft.ts` (draft keys, `saveDraft`/`clearDraft`, `agentToDraft` hardcoded type, `publishBlockReason` web/code gaps, `outboundMissingVars`/`extractVars` regex) · `lib/campaign-data.ts` (`extractVars`, `PHONE_NUMBERS`) · `components/wizard/{agent-wizard,step-voice,step-type,step-build,step-configure,channel-configs,step-publish}.tsx` · `components/code-block.tsx` · `components/go-live-home.tsx` · `components/import-agent-sheet.tsx` · `app/(dashboard)/agents/playground/page.tsx`.
