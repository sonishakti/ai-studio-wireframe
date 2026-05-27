# Studio_X — measure spec

> Lock-in for what success looks like. Mirrors `/measure` skill output:
> goals → KPIs → events → query → review cadence.

## Why this exists

Studio_X is a **funnel rescue project**. LEARNINGS §2 puts the drop at the
Console↔Studio seam around 93%. The whole point of merging Console and
Studio_X into one surface is to make a developer's first agent feel like
the path of least resistance — not a separate product hunt.

So every metric below maps back to the same question: **can a new developer
publish their first voice agent, and how fast?**

---

## Product north star

**Activation = a new project published its first agent within 7 days of signup.**

This is one binary outcome per project. Either they crossed the line or
they didn't. It's not a vanity metric — it's the moment the product
proves it works for that user.

### Why this and not "DAU" or "time on page"

Rejected per CLAUDE.md "Don't re-litigate":
- **Time on page** — high time-on-page often means *confused*, not engaged
- **Session length** — same reason
- **DAU/WAU** — a logged-in user with no agent is a churn risk, not a win

Activation passes the **rip-it-out test**: if we removed it from the
dashboard, would anyone notice? Yes — finance, sales, and product would
all scream. That's a real metric.

---

## KPIs — what we look at every week

| KPI | Target | Why |
|---|---|---|
| **Activation rate** | 40% of signups in 7d | The north star, scoped to a week |
| **Time to first agent (TTFA)** | p50 ≤ 30 min · p90 ≤ 24 h | Speed of the activation moment |
| **Insights cohesion rate** | ≥ 60% of sessions touching Monitor also touch Calls or Usage | Validates the IA grouping work |
| **Project-switch success rate** | ≥ 95% of switches end in a page load on the target project | Validates ProjectSwitcher |
| **Quota → Plans clickthrough** | ≥ 30% of users seeing >75% quota click the "View plans" CTA | Validates the cross-link |
| **Destructive-action cancel rate** | ≥ 5% of confirm dialogs canceled | Confirms the dialog is doing real work, not just rubber-stamping |
| **Command palette use** | ≥ 25% of WAU open ⌘K at least once / week | Power-user signal, predicts retention |

### Counter-metrics (what we DON'T want to optimize)

- Time on Monitor / Calls / Usage going UP — signals confusion, not value
- ⌘K closed without command — UI is wasting the user's keystroke
- AlertDialog confirm rate hitting 100% — the dialog isn't preventing real errors

---

## Event taxonomy

Defined in `studio-x/lib/analytics.ts`. Naming convention: `object_verb_past_tense`.

### Activation funnel (highest priority)
```
signup_completed
  ↓
project_created
  ↓
agent_template_browsed
  ↓
agent_template_selected   ← drop-off here = template gallery copy fail
  ↓
agent_created
  ↓
agent_test_started        ← drop-off here = editor friction
  ↓
agent_published           ★ NORTH STAR — fires once per agent_id
```

Each event carries `agent_id` + `template_id` (if applicable) so we can
attribute activation back to source templates. `agent_published` also
carries `time_to_first_agent_ms` computed in `analytics.ts`.

### Wayfinding events (validates IA work)
```
monitor_viewed · calls_viewed · usage_viewed
insights_cross_link_clicked { from, to }
project_switcher_opened · project_switched · all_projects_viewed
account_menu_opened
quota_warning_clicked { meter, pct_used }
command_palette_opened · command_executed { command, surface }
```

### Resilience events (validates `/fortify` work)
```
page_error_rendered · not_found_rendered
form_validation_failed { form, field, error }
destructive_action_confirmed · destructive_action_canceled
```

---

## Query patterns

### Activation rate (weekly cohort)
```
% of signups in week W who fire agent_published within 7d of signup_completed
```

### TTFA percentiles
```
For each agent_published with time_to_first_agent_ms set, compute p50/p90 by week
```

### Insights cohesion
```
Among sessions containing monitor_viewed:
  share that also contain calls_viewed OR usage_viewed
```

### Drop-off in the funnel
```
For each consecutive pair (e.g. agent_template_selected → agent_created):
  conversion = downstream_users / upstream_users
```

---

## Review cadence

| Cadence | Who | Looking at |
|---|---|---|
| Daily (squad standup) | PM + tech lead | New errors, validation failures, palette-zero-result spikes |
| Weekly | Squad | Activation rate, TTFA, drop-off in funnel |
| Monthly | Cross-functional | All KPIs vs targets; counter-metrics review |
| Quarterly | Leadership | North star trend, IA experiments shipped, cohort retention |

---

## How `/fortify` decisions changed the numbers we can collect

The state-coverage layer (`error.tsx`, `not-found.tsx`, AlertDialog,
toasts, form validation) is what makes the resilience events trackable
in the first place. Without it, we have nothing to measure.

The `/journey` decisions (Insights grouping, avatar dropdown, Usage→Plans
link) generated the cross-link events — `insights_cross_link_clicked`,
`quota_warning_clicked`, `account_menu_opened`.

This means **every commit in the last several sessions has a query
attached to it**. Nothing was shipped on vibes.

---

## Open instrumentation gaps

- Page-level timing (largest contentful paint, time to interactive) —
  routed to Vercel Analytics rather than the product event stream
- Cohort retention beyond activation — needs identity stitching
- Heatmaps / replays — out of scope for v1, revisit Q3 if the funnel
  numbers still don't move

---

_Last updated: 2026-05-27._
