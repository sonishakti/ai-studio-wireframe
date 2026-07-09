# User test — 2026-07-09 · A6 concurrent lines + A1 fixes (commit `3aeccd6`)

> Session #4 (protocol: `references/user-testing-protocol.md`), 3 personas, live build.
> Focus: the Concurrent lines card, the wizard's at-the-wall unlock, and A1 session-3 fix
> verification. Fixes from this session ride the A3 commit.

## Headline results

- **The at-the-wall unlock landed exactly as designed** — D1: *"It's an upsell, but it's an
  upsell that admits the free path works. Nobody blocks me."* (sentiment +2 at the wall).
  The queue-not-drop disclosure converted the scariest moment into a choice.
- **The batch pre-flight is now praised** (was an S2 two sessions ago) — *"one click almost
  dialed 248 humans and it stopped to show me the bill. THANK you."*
- **The A1 named-default strip works** — *"that answers the exact question I was about to
  panic over — who's paying."*
- **The top remaining S2 is A3's exact brief** — *"'Agora doesn't sell numbers — telephony is
  bring-your-own'? It's 9pm and I don't have a SIP trunk. That line is where my night dies."*
  A3 (key → auto-configured trunk, ~1 minute) was mid-build when this session ran.

## Fix disposition

| Sev | Finding | Disposition |
|---|---|---|
| S2 | BYO-SIP wall kills the night (no fast trunk path) | **A3 ships it** (in build during this session) |
| S2 | Talk surface still evidence-free (3rd consecutive session) | **F-Eval cycle** — the test surface is its author-side scope; now a confirmed recurring top-2 |
| S3 | "Resources › Numbers" vs "› Channels" — two names for one door | **FIXED (A3 train)** — one name, one link, both steps |
| S3 | Voice-seeds-prompt ambiguity ("will switching stomp my prompt?") | **FIXED (A3 train)** — disclosure added to the Voice step |
| S3 | Double Talk button (rail → sheet → button again) | **F-Eval cycle** (talk surface rebuild) |
| S3 | Step 3↔4 variable yo-yo | Backlog (wizard ergonomics pass) |
| S3 | Monitor "15" badge unexplained on a fresh account | **D1 cycle** (first-run data gating is already its scope) |

## Latent needs recorded for upcoming cycles

- **"Call MY phone"** as a test — in-browser talk never proves the telephony leg (A3's
  verify stage + F-Eval).
- **Dry-run batch** — "call the first 5 contacts" before committing 248 (D1/F-Eval).
- First-run framing for Monitor's critical badge (D1).

## Trend

Three sessions of the protocol have now each: validated the prior commit's fixes, caught
1–2 one-line truth bugs before users would, and left a precise brief for the next cycle.
The recurring-finding mechanism works — the Talk-surface evidence gap has now survived three
sessions and is locked as F-Eval's primary acceptance criterion.
