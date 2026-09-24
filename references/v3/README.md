# v3 knowledge base

Everything the v3 Studio redesign (mid-October 2026 launch: new Studio + v3 API + SuperNode, US East) is decided from.
Start here, then follow the order below. Owner rule: v3 fits the **existing** Console design system
(`ng-console/docs/design/DESIGN.md`); work lives on ng-console branch `design/v3`.

| Folder | File | What it is |
|---|---|---|
| 00-sources | `meetings/2026-09-24-digest-both-calls.md` | The two 24 Sep calls with Vineet: decisions and deciding quotes |
| 00-sources | `meetings/2026-09-24-call-A-notes-*.md`, `call-B-notes-*.md` | Granola notes, full |
| api (sibling) | `../api/v3/openapi-2026-09-24-ih7axj9zx.json` | Latest spec (evening 24 Sep); `openapi-3.0.0-2026-09-24.json` = morning |
| 01-product | `object-model.md` | Entities, graph, what changed in the spec, Studio-held data, naming map |
| 01-product | `requirements-register.md` | Requirements 1–52 with pillar, surface, P0–P3, API status, conflicts |
| 01-product | `api-parity.md` | Field-level diff: Create an agent, Start a session, Go live fields vs live Console and Concept A |
| 02-research | `observability-patterns.md` | Datadog, Honeycomb, Sentry, Langfuse et al. translated to agent page + session history |
| 02-research | `competitor-monitoring.md` | Vapi, Retell, ElevenLabs, LiveKit, Bland, Synthflow, a QA tool: monitoring, call detail, errors, retention, naming |
| 02-research | `builder-models-secrets.md` | Preset + Custom model pickers with logos, type-first creation, secrets UX |
| 02-research | `batch-retention-experiments.md` | Campaign › run › session across products, retention UX, A/B, ephemeral sessions, naming |
| 03-strategy | `product-strategy.md` | Four pillars, principles, IA, batch hierarchy, per-pillar design direction, risks |
| 03-strategy | `kpis.md` | North star + pillar inputs + counter-metrics + what must be instrumented |
| 03-strategy | `scope-of-work.md` | P0–P3 with days and review calls, compressed option, decisions needed |

Rules for keeping it true: re-download the spec before every review and diff it (`object-model.md` §3); never
renumber the register; tag everything v3 or future.
