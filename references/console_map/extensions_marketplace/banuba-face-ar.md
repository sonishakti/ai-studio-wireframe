# Banuba Face AR SDK
**URL**: https://console.agora.io/extensions-marketplace/banuba
**Section**: Extension Marketplace
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Detail page for the Banuba Face AR SDK third-party extension. Adds AR face filters, AI touch-up, and virtual backgrounds to video calls across Web, iOS, Android, Flutter, React Native, and Unity via Agora SDK.

## Content Hierarchy

- **Breadcrumb**: Marketplace
- **Heading**: "Banuba Face AR SDK"
- **Tagline**: "Banuba extension for Agora lets you add augmented reality features to video calls such as face filters, face touch up filters, virtual backgrounds and avatars."
- **Metadata**:
  - Company Name: Banuba
  - Version: v2.0.0
  - Updated: 2023-12-01
  - Platform: Web, iOS, Android, Flutter, React Native, Unity
  - Core Features:
    - Face masks: High-quality 3D face masks on par with TikTok and Snapchat
    - AI touch-up: Remove acne and wrinkles, whiten teeth, and change the shape of a face
    - Virtual backgrounds: Protect privacy and customize backgrounds
- **Tab navigation**: User Guide | Download | Plans | Projects
- **User Guide tab** (active/default):
  - Note: "This guide is provided by Banuba. Agora is planning a documentation upgrade program for all extensions on the marketplace."
  - Prerequisites: Banuba SDK archive, Extension files for Android, Banuba trial client token (get via banuba.com form or info@banuba.com)
  - Get Started steps: NDK/CMake requirements (NDK 21.1.6352462, CMake 3.9+), copy .aar/.jar/architecture files, configure tokens
  - Code examples (Kotlin): BanubaFiltersAgoraExtension imports, RtcEngineConfig setup, BanubaResourceManager init, enableExtension, initBanubaPlugin (setExtensionProperty for resources path, effects path, token), enable/disable effects via KEY_LOAD_EFFECT
  - Effects managing: `BanubaEffectsLoader(this).loadEffects()` → `List<ArEffect>` (name, preview bitmap)
  - Default effects included: ElvisUnleashed, EnglandEightPieceCap, FashionHistory1940_male, MorphingHatBow, Nerd, SnapBubblesGlasses, Space, StarGlow, TitanicJack
  - Run the demo: Demo app (public), Github repository
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
- Links: Demo app (public), Github repository

## Notes
- Third-party extension by Banuba.
- No free tier — requires contacting sales for activation; trial tokens available via form/email.
- Broadest platform support of all extensions: Web, iOS, Android, Flutter, React Native, Unity.
- Integration requires Android NDK and CMake (C++ sources).
- Demo includes 9 pre-bundled effect samples.
