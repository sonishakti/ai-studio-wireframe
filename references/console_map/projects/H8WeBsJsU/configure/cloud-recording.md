# Configure — Cloud Recording
**Project**: Default Project (`H8WeBsJsU`)
**URL**: https://console.agora.io/project-management/H8WeBsJsU/cloud-recording
**Section path**: Configure > Cloud Recording
**Accessed**: 2026-05-21T00:00:00Z

## Features in this section

### Cloud Recording — Basic Information
- **State**: disabled (badge: "Inactive")
- **Toggle**: present ("Enable Cloud Recording", currently off, interactive)
- **Plan gate**: none visible
- **Description**: none
- **Child settings**: none visible (gated behind toggle)

### Quickstart
- **How do I use Cloud Recording?** — informational heading
  - Docs → https://docs.agora.io/en/cloud-recording/get-started/getstarted
- **Test API with Postman**
  - Open Postman → https://documenter.getpostman.com/view/6319646/SVSLr9AM#d3952ff0-9cd7-4a82-abec-29b63735cb4f

### Usage (inline summary)
- "View More" link → /usage
- Metrics shown (current period, all zero):
  - Voice: 0 min
  - Audio: 0 min
  - Video HD: 0 min
  - Video HD+: 0 min

## Sidebar Security Buttons (present on all configure pages)

The configure sidebar always shows Basic Settings with two security buttons:

- **"Generate Temp Token"** ⚠️ — generates a temporary channel token. **State-changing. Not activated.**
- **"Add a Certificate"** ⚠️ — **no modal; generates Primary + Secondary certificates immediately on click.**

### "Add a Certificate" Behavior (observed)

⚠️ **Mapping note**: This button was clicked during the modal-discovery pass. It generates a certificate **immediately without any confirmation dialog**. After clicking, the "Add a Certificate" button disappears and is replaced by masked "Primary Certificate ••••••••••" and "Secondary Certificate ••••••••••" fields. The project now has certificates enabled.

## Interactive Elements

- "Enable Cloud Recording" toggle ⚠️ — enables the feature (not activated)
- "Generate Temp Token" ⚠️ — generates a temp token immediately (not activated)
- "Add a Certificate" ⚠️ — was **accidentally triggered** during observation; generated certificates project-wide
- "Docs" link — external docs
- "Open Postman" link — external Postman collection
- "View More" (Usage) → /usage
- "contact support" → https://www.agora.io/en/talk-to-us/

## Notes
- Default quota: 20 PCW. Sidebar note: "For a higher quota, please contact support."
- Inline usage mini-chart shows current billing cycle stats.
- ⚠️ The Default Project (`H8WeBsJsU`) now has Primary and Secondary certificates set (result of accidental trigger noted above).
