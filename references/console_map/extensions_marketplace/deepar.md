# DeepAR
**URL**: https://console.agora.io/extensions-marketplace/deepar
**Section**: Extension Marketplace
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Detail page for the DeepAR third-party extension. Wraps DeepAR Web SDK to add AR face filters, virtual background removal, emotion detection, and shoe try-on features to Web apps via Agora Video SDK.

## Content Hierarchy

- **Breadcrumb**: Marketplace
- **Heading**: "DeepAR"
- **Tagline**: "Add 3D face masks, filters, background removal and other AR experiences to your app via Agora's Video SDK."
- **Metadata**:
  - Company Name: DeepAR.ai
  - Version: v1.0.1
  - Updated: 2023-11-10
  - Platform: Web
  - Core Features:
    1. AR face filters: Enable beauty, masks & other fun effects
    2. Virtual background: Allow for background removal and segmentation
    3. Emotion detection: Identify facial expressions as emotions
    4. Shoe try-on: Let users try on shoes with AR
- **Tab navigation**: User Guide | Download | Plans | Projects
- **User Guide tab** (active/default):
  - Overview: DeepAR Extension wraps DeepAR Web SDK for Agora RTC integration
  - Prerequisites: License key setup at developer.deepar.ai (create account, create project, add web app with domain)
  - Installation: npm/yarn (`deepar-agora-extension`, `agora-rtc-sdk-ng`)
  - Integration steps: imports, Webpack asset modules config for .wasm/.bin/.obj files, VideoExtension initialization, video processing pipeline setup
  - Core API pattern: `videoTrack.pipe(processor).pipe(videoTrack.processorDestination)`
  - Features: load face tracking model, load effects via `switchEffect`, background removal/blur, shoe try-on with foot tracking
  - License: https://developer.deepar.ai/customer-agreement
  - Reference: supported browsers (Chrome 66+, Safari 11.1+, Firefox 60+, Edge 42+, iOS Safari 11+, Android Chrome 66+)
  - Sample demo: https://github.com/DeepARSDK/quickstart-agora-web-extension ("free")
  - Official DeepAR docs: https://docs.deepar.ai/category/deepar-sdk-for-web
  - Free filter pack: https://docs.deepar.ai/deep-ar-studio/free-filter-pack
  - "View Support" link
- **Plans tab**:
  - "Please contact sales regarding pricing plans and/or activation of this extension."
  - "Contact Sales" button
- **Projects tab**: (not activated)
- **Download tab**: (not activated)

## Interactive Elements (observed, not activated)

- Tab buttons: User Guide, Download, Plans, Projects
- "View Support" link
- "Contact Sales" button (Plans tab)
- External links: developer.deepar.ai, GitHub quickstart, DeepAR docs, free filter pack

## Notes
- Third-party extension by DeepAR.ai.
- No free tier — requires contacting sales for activation.
- Platform is **Web only** — the integration guide uses npm packages and WebAssembly.
- The sample demo is described as free ("🔥 It is free! 🔥").
- Foot tracking config needed for shoe try-on feature (requires multiple .wasm/.bin model files).
