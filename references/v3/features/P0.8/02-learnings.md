# P0.8 Confirm the agent is ready · Learnings

Research phase done 26 Sep (`02-research.md`, 9 shots). Order followed: the row's existing shots for Retell, ElevenLabs and LiveKit (reused, none re-captured), one new ElevenLabs product shot from the already signed-in research profile (no sign-in performed), Refero for the go-live checklist gap (Stripe's activation review), the prototype's own before shots. Vapi and Retell dashboards were login-gated, so both stay desk and docs evidence. No vendor and no Refero screen shows a readiness list that names a gap and still lets the person go live, a partial-readiness agent, or a retention control on one number or one run; those three are designed from the API shape and the row's own recovery text.

## 1. Nobody checks before Go live, and today we do not either

- ElevenLabs puts one **Publish** in the top bar and lists its deploy area as Channels with no step in between (`competitors/product/elevenlabs/elevenlabs-18-agent-channels.png`); Retell and Vapi autosave; LiveKit's Go live is the first deploy. Our own Runs tab lets a Draft agent start a real run from an empty state with no test and no check (`shots/before-02-runs-tab-survey-draft.png`), and the live Numbers tab shows a number and nothing about the version callers hear (`shots/before-01-numbers-tab-frontdesk-live.png`).
- **Change:** a Readiness row at the top of the Deployment tab, before Retention and before the type row that holds Go live, so the check is read on the way to the button. It is a list, not a gate: the KPI measures tests before Go live, the counter metric forbids slowing Go live down, so only a missing deployment type ever blocks.

## 2. One flagged line, one fix action; a clean item shows no colour

- Stripe's review step is the one real precedent: each section is either clean, with no colour and no check beyond the stepper's, or flagged with a red border, a warning icon, "Missing required information" and exactly one inline action, Edit, Update or Add (`shots/refero-stripe-01-activation-review.png`, region 298,258,394,142). The live Console's own Go live section already renders issues this way, a warning triangle, one sentence, one link.
- **Change:** each readiness item is one line with one link: **Test**, **Write the prompt**, **Add a number**. A done item carries the gray tick (you did this) and its fact, "Heard in a test at 14:02, after the last change."; an open item carries the amber triangle; a pending item (a number picked at Go live) carries neither. No red anywhere: nothing here is a failure. Stripe's hard gate across five steps is the half we do not copy (.b).

## 3. Retention is a standing setting everywhere, and never on a number or a run

- ElevenLabs holds three independent privacy controls under Settings, Zero Retention Mode off by default, Store Call Audio on, a numeric retention period, none of them near Publish (`shots/elevenlabs-01-zero-retention-privacy.png`, region 589,1260,1635,300), and hides in the docs that Zero Retention cannot combine with batch calling. Retell folds its three storage tiers into "Security & Fallback Settings" (`v3/02-research/monitoring/shots/retell-05-data-storage-settings.png`), a title that reads like failover. LiveKit's PII redaction is project-wide (`competitors/product/livekit/livekit-13-observability-settings-pii-redaction.png`). Vapi's HIPAA mode is organisation-wide by documentation.
- **Change:** the Retention row sits in Deployment, between Readiness and Go live, because the v3 API scopes `data_policy` to the session a deployment starts, not to the agent. Two options only, 30 days and Zero retention, named in the locked words. Where the API cannot carry it yet (inbound and batch, requirement 46) the option shows disabled with the reason in one sentence under it, the conflict ElevenLabs leaves to the docs surfaced inline; on code the pick flows into the snippet's `data_policy`. Retell's "row exists, fields empty" reading of the strictest tier is what Zero retention's line says.

## 4. Once the deployment exists, show it, not the form

- Our live Numbers and Runs tabs already show the deployment as the deployment: the number with its label, the runs with status, progress, success and start (`shots/before-01-numbers-tab-frontdesk-live.png`, `shots/before-03-runs-tab-payments-live.png`), and that is right; what is missing is any record of readiness, retention, or that a Go live moment happened at all.
- **Change:** the type row keeps today's list, table and snippet for a live agent (.e), with Remove and Add another number, New run, or the first session from software, and Readiness and Retention stay above it so a later edit reopens the test item (.h) and the next run still reads the check. "Connect" and "Disconnect" leave the copy: Go live, Add another number, Remove.

## 5. One sentence and the one control, nothing seeded

- LiveKit's disabled observability reads as one sentence and one button (`competitors/product/livekit/livekit-agents.png`, region 1576,1312,552,320), the empty-first shape; our own empty Runs row is the same shape today (`shots/before-02-runs-tab-survey-draft.png`).
- **Change:** a draft agent's type row is one line and **Go live**, "No number answers with this agent yet." or "No runs yet. A run dials one contact list with this agent."; a brand-new project with no numbers gets the same line plus the readiness item that says so with **Add a number**, and the Go live sheet opens on the SIP trunk form with one sentence instead of an empty picker. No seeded number, run or session anywhere.

## 6. Learnings that change the design

1. The third tab is named **Deployment** for every type (the locked area name, requirement 6); the type name moves to the row that holds the deployment, Numbers, Runs or Code, so P0.1's "third tab named for the type" survives as the first thing Sam reads inside the area. The tab exists for an untyped agent too, holding P0.1.c's alert (.f).
2. Readiness names gaps and never blocks; Go live stays on for .b and .c. Only a missing type blocks, and it blocks by asking for the type.
3. The header's primary action becomes **Go live** on a draft agent of any type and lands on the Deployment tab at the top, so Readiness is read before the sheet; on a live batch agent it stays **New run**; on a live inbound or code agent the header carries no primary (the row does).
4. The Go live sheet for inbound is today's number sheet retitled and rewritten without "connect"; P0.9 grows it. New run is the batch Go live as it is; P0.10 grows it. The code Go live is the snippet's own copy, no second button.
5. The save toast on a live agent gains the deployment line and a Test action (.h); nothing new is drawn for it.
