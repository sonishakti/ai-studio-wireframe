# Extensions Marketplace
**URL**: https://console.agora.io/extensions-marketplace
**Section**: Extension Marketplace
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
A catalog of first- and third-party SDK extensions that can be added to Agora projects. Browseable by category. Each card opens a side-panel detail view with version info, platform support, and a "Continue" link to the full detail page. Also includes a "My Submissions" tab for developers who have submitted extensions.

## Content Hierarchy

- **Tab views**: Marketplace | My Submissions
- **Heading**: "Extensions Marketplace"
- **Image carousel** (5 slides — likely featured extensions/banners)
- **Agora Extensions** section (2 items):
  - Agora AI Noise Suppression (Agora) → /extensions-marketplace/agora-noise-suppression
  - Agora 3D Spatial Audio (Agora) → /extensions-marketplace/agora-spatial-audio
- **Other Extensions** section (7 items):
  - BytePlus Effects (BytePlus Pte Ltd) → /extensions-marketplace/byteplus-ar
  - Conversation Intelligence (Symbl.ai) → /extensions-marketplace/symbl
  - ActiveFence Video Content Moderation (Beta) (ActiveFence) → /extensions-marketplace/activefence-video-moderation
  - Synervoz Voice FX (Synervoz) → /extensions-marketplace/synervoz
  - DeepAR (DeepAR.ai) → /extensions-marketplace/deepar
  - FaceUnity AR Filter (Hangzhou Xiangxin Technology Co.,Ltd) → /extensions-marketplace/faceunity-ar-en
  - Banuba Face AR SDK (Banuba) → /extensions-marketplace/banuba
- **Side-panel detail** (shown when a card is clicked — currently "Agora AI Noise Suppression"):
  - Extension name, description, Company Name, Version, Updated date, Platform, Core Features
  - "Continue" link → individual extension detail page

## Interactive Elements (observed, not activated)

- "Marketplace" / "My Submissions" tab buttons
- Extension listing cards (click to reveal side-panel detail)
- Carousel Previous/Next slide buttons
- Carousel slide indicators (5)
- "Continue" button in side panel → navigates to full extension detail page

## Notes
- Extension cards use React click handlers (not `<a>` tags) to update the side panel — URL does not change on card click.
- "My Submissions" tab not yet explored — requires separate visit.
