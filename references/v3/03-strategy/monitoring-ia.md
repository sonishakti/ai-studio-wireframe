# Monitoring IA · the prototype shape for P1 (and the P2 surfaces P1 lands on)

Track **v3**. Written 27 Sep 2026 from the owner's recap of the same day, `prd-v3.json` → `monitoring` (levels,
pivots, rules), the P1 rows and the live Console. Surface: concept A on `design/v3`, route `/v3?concept=a`.

## Before (live Console)

- OBSERVE → **Agent analytics** (`/agent-analytics`), three tabs: Monitor (project charts), Call history (telephony
  rows, custom columns), Session history (RTC rows). Call detail and session detail are two different sheets.
- The agent page has no health, no errors, no sessions of its own; the agents list has no cues.
- Error logs from the RTM stream reach no screen.

## After (one graph, four places)

| Place | URL state | Question it answers | Rows |
|---|---|---|---|
| Agents list | `view=list&range&sort` | Which agent needs me first? | P1.5, P1.7 |
| Agent page · Overview | `view=agent&tab=overview` | Is it healthy now, what is it doing? | P1.1, P1.2, P1.8 |
| Agent page · Analytics | `tab=analytics&range&status&override` | Better or worse over the range, did my change help? | P1.3 |
| Agent page · Logs and diagnostics | `tab=logs&severity&module&new&group` | What breaks, since when, new since my change? | P1.4 |
| Agent page · Agent (builder) | `tab=agent&section&panel&row&focus&back` | Which setting caused it, change it | P1.6, P1.9 |
| Sessions (unified history) | `view=sessions&agent&run&status&env&override&transport&q` | Which sessions match my clue? | P2.1, P2.2 (landing for every P1 count) |
| Session panel / full screen | `session&in&stab&t&log&full` | What happened in this one session? | P2.3 (opened from P1.2, P1.4) |
| Project Logs and diagnostics | `view=logs` | What breaks across the project, incl. no agent? | P1.4 |

Sidebar OBSERVE becomes **Sessions** and **Logs and diagnostics** (Agent analytics retires: its Monitor aggregate
moves onto the agent and the list, its two history tabs merge into Sessions). Agora analytics stays.

## Decisions (with the alternative each one beat)

1. **One agent page, five tabs: Overview · Analytics · Logs and diagnostics · Agent · Deployment.** Beat: a separate
   observe page with an Edit agent door (two pages per agent, a second door to the builder), and a global Monitor hub
   (Studio X 2; aggregates off the agent, which the team rejected). Live agents open on Overview, drafts on Agent.
   The Agent tab is Edit agent and the header Test is Talk to agent: one door each. Runs stay in Deployment (P0.10).
2. **Health line under the agent name, on every tab:** sessions in range · error groups · warning groups · new since
   the last change · last change. Each count is a link. Red only on error groups.
3. **One range control** on the agent page's tab row, in the URL (`range=24h|7d|30d`). Header counts, Overview lists,
   Analytics tiles and chart, Logs groups and the Sessions list all read it; switching tabs keeps it.
4. **Aggregate on the agent, drill down in Sessions.** Every count opens Sessions with the same range and filters and
   `env=production`; Sessions shows a row count only.
5. **One session list component** on Overview, error group, Sessions and runs; **one session panel** over any list
   (Esc closes, ↑ ↓ step, the list stays underneath) with Full screen.
6. **Modality-aware session card:** common header (status, start, end, duration, billed minutes, Status detail, agent
   chip = backlink to the agent's Overview), tabs Transcript · Logs · Latency · Analysis · Events, then one transport
   card: RTC (channel, UIDs, audio scenario, encryption), telephony (direction, from, to, number, SIP call ID, trunk
   host and protocol, hangup cause) or WhatsApp (business number, user, WhatsApp call ID; intent, no API yet).
7. **Overrides are a segment, never a silent mix** (ask 21): Analytics and Sessions count default sessions only; a line
   names how many ran with overrides and filters by type (prompt, LLM, ASR, TTS).
8. **Retention is a state, never an empty block** (ask 32): zero retention keeps the row, duration and billed minutes,
   says what was never stored; past 30 days reads Expired.
9. **Happy paths show the target data; launch gaps are rainy states** reachable by URL (`mon=`), named by gap
   (G4 attribution, G11 error stream, G12 filters, G13 session analytics). The owner's recap asks for the metrics
   (latency, Analysis results, week and month change), so they are designed populated, not deferred.
10. **Cost shows as billed minutes, never currency,** until pricing is public (open question).

## Recap → rows

| Owner recap (27 Sep) | Where | Rows |
|---|---|---|
| Unified Session History (session + call history), backlinks session ↔ agent real-time view | Sessions view; agent chip in every session; Overview rows open the panel | P2.1, P2.3, P1.2 |
| Modality-aware session cards (RTC, telephony, WhatsApp) | Session panel transport card | P2.3, P2.10 |
| Agent monitoring page: Analytics tab, Logs and diagnostics tab | Agent page tabs | P1.3, P1.4 |
| RTM error logs in the UI, error and warning badge | Logs and diagnostics; health line | P1.4, P1.1 |
| One date range drives sessions list and metrics | Range control in the URL | P1.10, P1.3 |
| Agent-level metrics: count, trends, week/month change, Analysis, latency | Analytics tiles and chart | P1.3, P1.9 |
| Monitoring overview on the agents list | List cues | P1.5 |
| Override segmentation | Analytics and Sessions filter | P1.3 (ask 21) |
| Retention states, zero retention | Row tags and panel states | P2.6, P1.2.i, P1.4.i |
| Defer custom output columns and A/B testing | Not built; noted | asks 20, 26 |

## Prototype keys (added to `ProtoSearch`)

`range` · `from` · `to` · `env` · `status` · `severity` · `module` · `new` · `override` · `transport` · `q` · `sort` ·
`group` · `session` · `in` · `stab` · `t` · `log` · `full` · `back` · `focus` · `mon` (review only, never written).
On `view=sessions` and `view=logs`, `agent` and `run` are filters.

## API truth (unchanged from the model)

Aggregates need G4 (saved agent id on sessions) and G12 (list filters); errors need G11 (the RTM stream wired);
transcript, logs, latency and Analysis results need G13; minutes left need G9. Overrides are not on Session create
in the current spec. WhatsApp is not in the spec.
