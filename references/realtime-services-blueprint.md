# Real-Time Services — Blueprint

**Generated:** 2026-05-26
**Source:** Live walk of `console.agora.io/project-management/aJgrWbVwY` + LEARNINGS §12 service blueprint + Studio_X wireframe state
**Method:** Drove Chrome via `claude-in-chrome` MCP, captured each service's config page, cross-referenced engineering service names from the Console code audit.
**Scope:** The 13 services exposed at Agora project-management level. Voice/Video/Interactive Live Streaming share the project App ID + Cert (no dedicated per-service page). Cloud Player is not exposed at project level.

---

## Service Inventory

| Service | Group | Console Path | Engineering Service | Sub-tabs | Primary Config | Quota / Constraint | Warning / Note | Wireframe Tab ID | Open Question |
|---|---|---|---|---|---|---|---|---|---|
| Chat | Core RTC | `/chat/basic-info` | AgoraChat | Basic Information | App Key (copy), Org Name (copy), Test User ID generator | DAU + message tiers (plan-gated) | Currently on Chat Free tier | `rts-chat` | Surface DAU usage in panel directly, or leave to Monitor? |
| Signaling | Core RTC | `/signaling/basic` | Signaling | Basic Information · Presence · Storage · Stream Channel | Subscription tier (view plan) | Peak concurrency + message tiers | — | `rts-signaling` | Each sub-tab needs its own config scaffold (4 to build) |
| Interactive Whiteboard | Core RTC | `/whiteboard-basic` | Whiteboard | Basic Information · Whiteboard Services | App Identifier, Access Key (AK), Secret Key (SK), SDK Token (generate), Allow Agent Read/Write toggles | Max 50 concurrent channels | Contact support for higher quota | `rts-whiteboard` (default active) | Whiteboard Services sub-tab content not yet scaffolded |
| Conversational AI Engine | Core RTC | `/conv-ai` | ConvoaiGlobal | — | Enable Conv AI toggle | (no quota shown) | Promo → Agent Studio | `rts-convai` | In Studio_X agents-first frame, should this be implicit instead of toggle? |
| Cloud Recording | Media Services | `/cloud-recording` | CloudRecording | — | Enable toggle, Docs button, Postman collection link | Default 20 PCW | — | `rts-cloud-recording` | Usage tiles currently hardcoded to 0 — wire to real telemetry |
| Media Push | Media Services | `/media-push` | MediaPush | — | Enable Server Side RESTful API toggle | Default 20 PCW | — | `rts-media-push` | Server-side RESTful sub-config (push destinations, stream profiles) not yet scaffolded |
| Media Pull | Media Services | `/media-pull` | MediaPull (inferred) | — | Enable Media Pull toggle | Default 20 PCW | — | `rts-media-pull` | Pull-from-URL source list not yet scaffolded |
| Media Gateway | Media Services | `/media-gateway` | MediaGateway | — | Enable Media Gateway toggle (default ON in test project) | — | Disabling requires support contact | `rts-media-gateway` | Phone number + SIP endpoint binding UI not scaffolded |
| Real-Time STT | Media Services | `/real-time-stt` | RealTimeSTT | — | Enable Real-Time STT toggle | Default 10 peak concurrent workers per project | — | `rts-rtstt` | Vendor selection (Deepgram vs others) not exposed yet |
| Video Screenshot Upload | Media Services | `/video-screenshot-upload` | VideoScreenshotUpload (inferred) | — | Enable toggle | (no quota in source) | — | `rts-vsu` | Interval + destination endpoint config not scaffolded |
| Cloud Proxy | Security & Infrastructure | `/cloud-proxy` | CloudProxy | — | Enable Cloud Proxy toggle | — | Additional charge starts at $500/mo · For higher PCU contact support | `rts-cloud-proxy` | Proxy mode picker (TCP 443 fallback vs full proxy) not scaffolded |
| Co-Host Authentication | Security & Infrastructure | `/cohost-authentication` | CohostAuth (inferred) | — | Enable toggle, Quickstart Docs button | Default 20 PCW | App logic change required — read docs before enabling | `rts-cohost-auth` | Token-role wiring docs link not real |
| Flexible Classroom | Vertical Solutions | `/flexible-classroom` | FlexibleClassroom (inferred) | — | Enable toggle + Launch button | — | Pre-built RTC solution — launches in new tab | `rts-flex-classroom` | Launcher target URL TBD |

---

## Cross-Service Dependencies

| Service | Depends On | Affects |
|---|---|---|
| Conversational AI Engine | Project App ID + Cert; Vendor Credentials (LLM / TTS / ASR) | Every Agent in this project |
| Real-Time STT | A live audio track; agent runtime | Agent ability to "hear" callers in real time |
| Media Gateway | Voice / Video RTC core; SIP / PSTN providers | Phone-reachable agents |
| Cloud Recording | A live RTC channel | Recording artefacts in customer S3 / GCS |
| Cloud Proxy | All RTC traffic from this project | Connectivity in restricted-network environments |
| Co-Host Authentication | Token issuance flow; client-side join logic | All publishers must present a host-role token |
| Whiteboard | Project App ID + Whiteboard AK/SK | Agent's ability to perceive / annotate visual artefacts |
| Chat | Chat App Key + Org Name | Private + group messaging in agent channels |
| Signaling | Project App ID; Signaling subscription | Real-time messaging at high concurrency |
| Media Push | Outbound RTMP / HLS endpoint | External streams of agent audio |
| Media Pull | External RTMP / HLS source URL | Injected media inside an agent channel |
| Video Screenshot Upload | A live video track; customer endpoint | Frames pushed to customer moderation pipeline |
| Flexible Classroom | All Core RTC (Voice, Video, Chat, Whiteboard) + Cloud Recording | Pre-built education flows |

---

## Frontstage / Backstage / Support Processes

| Service | Frontstage (User sees) | Backstage (Agora does) | Support Processes | Failure Mode |
|---|---|---|---|---|
| Chat | App Key + Org Name shown; Test User ID generator | Chat SDK provisioning per Org; DAU metering | AgoraChat backend, vendor billing tier checks | Wrong Org Name → SDK can't bind; need re-issue |
| Signaling | 4 sub-tab knobs; Subscription tier | Presence + Storage + Stream Channel infra | RTM cluster; peak concurrency throttle | Subscription downgrade → connection rejected at peak |
| Whiteboard | AK/SK copy + SDK Token; Configure button | Whiteboard service provisioning; channel quota tracking | Concurrent-channel meter | >50 channels → new sessions fail |
| Conv AI Engine | Enable toggle + Agent Studio CTA | ConvoaiGlobal runtime spin-up | Agent lifecycle manager; per-agent vendor key vault | Vendor key revoked → agent 401s mid-call |
| Cloud Recording | Quickstart Docs / Postman buttons + Usage tiles | Cloud Recording workers; S3 / GCS sink | Recording REST API; 20 PCW pool | PCW exhaustion → new recordings rejected, existing continue |
| Media Push | "Enable Server Side RESTful API" toggle | Push worker pool; encoder | Push REST API; 20 PCW pool | Destination URL down → push pauses, no auto-failover today |
| Media Pull | Enable toggle | Pull worker subscribing to external URL | Pull REST API; quota meter | Source URL down → pull session ends |
| Media Gateway | Enable (default ON) + warning | SIP / PSTN / WebRTC bridge | Telephony peering; carriage agreements | Bridge degraded → calls drop to RTC-only path |
| Real-Time STT | Enable toggle | STT worker (vendor ASR behind it) | 10-PCW pool; vendor-side latency | Worker pool full → transcript stream stalls |
| Video Screenshot Upload | Enable toggle | Frame-capture worker | Customer endpoint (HTTP POST) | Endpoint 5xx → frames dropped silently (no retry today) |
| Cloud Proxy | Enable + $500/mo warning | TCP 443 fallback / full-proxy edge | Per-PCU billing meter; capacity quota | Proxy edge regional outage → connectivity blocked in that region |
| Co-Host Auth | Warning + Enable + Docs button | Token validator at join time | Token issuance service; app-side role logic | App logic missed → all publishers rejected |
| Flexible Classroom | Enable + Launch button | Classroom launcher app | Classroom service composition (RTC + Whiteboard + Recording) | If any composed service fails → classroom launch fails |

---

## Structural risks (flag explicitly for review)

1. **Bundled Quota (20 PCW default for multiple services).** Cloud Recording, Media Push, Media Pull, Co-Host Auth all share the same default "20 PCW" semantics in different services. If they truly share a pool → cross-service starvation risk. If they're separate counters → why is the number identical? Engineering question to confirm.
2. **Disable-asymmetry on Media Gateway.** Enable is one click; disable requires a support ticket. Architecturally this is a Forced Continuity pattern (LEARNINGS §6 anti-pattern watchlist). Flag for ethics review — there may be a legitimate reason (active SIP routes, customer phone numbers in flight) but the asymmetry needs to be conscious, not default.
3. **Cloud Proxy $500/mo floor.** Hidden until the toggle is engaged. Could be moved to a pre-toggle disclosure to prevent surprise billing.
4. **No graceful degradation tiers documented** for any service. When Cloud Recording PCW pool is exhausted, what does the user see? Generic 5xx, or a "Quota reached" surface? Cross-state consistency check needed.
5. **Co-Host Auth requires app logic change** — warning is present but timing is unclear (does the toggle take effect immediately, or only after the app re-deploys with token logic?). Toggle without compatible app code likely breaks all sessions.
6. **Whiteboard 50-channel cap** is the only hard cap on a Core RTC service. Hitting it during a live demo would be silent failure.

---

## Open questions for the team

| # | Question | Blocks |
|---|---|---|
| RS-1 | Are the 20-PCW pools shared or per-service? | Quota UI accuracy, alerts |
| RS-2 | Why is Media Gateway disable gated by support? | Ethics review (Forced Continuity?) |
| RS-3 | What's the exact recovery path for each service's pool exhaustion? | Error surface design |
| RS-4 | Does Conv AI Engine need a toggle in Studio_X, or is it implicit? | Whether to keep `rts-convai` panel or absorb into Agents |
| RS-5 | Signaling sub-tabs (Presence / Storage / Stream Channel) — content per sub-tab? | 4 panels to scaffold |
| RS-6 | Cloud Recording Usage tile data source — which API? | Replace 0-placeholders |
| RS-7 | Co-Host Auth toggle apply-time — instant or after deploy? | Onboarding warning copy |
| RS-8 | Cloud Player — is it intentionally not exposed at project level, or a gap? | Decide whether to add a 14th service or leave out |
| RS-9 | Engineering ownership for each service — which team? | Org chart for handoffs |

---

## Migration note (Studio_X vs Console)

The Studio_X wireframe Real-Time Services screen now mirrors the Console's project-level service inventory with one IA difference: services are grouped into 4 sections (Core RTC · Media Services · Security & Infrastructure · Vertical Solutions) instead of the Console's flat list. This is a deliberate `/organize` decision — flat 14-item lists hit Hick's-law-level cognitive load and the grouping helps users locate "the service for my problem" faster.

If engineering pushes back, the fallback is a flat list — the visual structure can adapt without touching the underlying data model.
