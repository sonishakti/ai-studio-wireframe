# 07 · JTBD + success metric

**JTBD.** When a model vendor is slow, down or blocked in my region *(situation)*, I want my live agents to
keep talking without me being paged *(motivation)*, so a vendor outage never becomes my outage *(outcome)*.

**Personas.** P1 hustler — wants zero-config ("just keep it up"); P2 platform engineer — wants to see and
override the pool and prove it works before go-live.

**Success event (activation-linked).** `failover_triggered` already exists in the event taxonomy
(roadmap-activation-strategy §Retain: `deployment_active_d7`, `failover_triggered`, `alert_fired`).
Add `fallback_tested` (simulation run from the builder). North-star link: a live deployment that survives a
vendor incident keeps consuming minutes → protects paid usage. Rejected KPIs: time on page, DAU.

**Agora primitives.** `credential_mode` per asr/llm/tts (managed | byo) · `properties.geofence.area` ·
Engine failover contract (868kyqzfy, P1 Nov) · session diagnostics (Wave 1/2 payloads, SIP ladder).
