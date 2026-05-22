# BytePlus Effects
**URL**: https://console.agora.io/extensions-marketplace/byteplus-ar
**Section**: Extension Marketplace
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Detail page for the BytePlus Effects third-party extension. Provides integration guide for AR effects, filters, and visual algorithms via Agora Video SDK v4.x using the setExtensionProperty key-value pattern.

## Content Hierarchy

- **Breadcrumb**: Marketplace
- **Heading**: "BytePlus Effects"
- **Tagline**: "BytePlus Effects combines over 80,000 AR effects and filters, with a simple integration via Agora's Video SDK."
- **Metadata**:
  - Company Name: BytePlus Pte Ltd
  - Version: v4.6.2
  - Updated: 2025-08-11
  - Platform: iOS, Android, Flutter
  - Core Features:
    - Library of effects: Choose from over 80,000 high-quality visual effects (https://creativestore.byteplus.com/mall/cv/effect)
    - Creator tool: Make creating AR filters and effects easier than ever
    - Visual algorithms: Integrate leading visual algorithms for unrivaled accuracy
- **Tab navigation**: User Guide | Download | Plans | Projects
- **User Guide tab** (active/default):
  - Overview: Extension encapsulates BytePlus Effects SDK core APIs via setExtensionProperty/setExtensionPropertyWithVendor
  - Note: Only a part of the SDK APIs are encapsulated; see key-value overview
  - Prerequisites: Android Studio 4.1+, physical Android 5.0+ device
  - Preparation: Requires Video SDK v4.x integration
  - Integration steps: Download package, add .aar files, contact Agora for resource package, add to build.gradle, import classes
  - Call sequence: enableExtension, setExtensionProperty (check_license, ai_init, set_composer, etc.)
  - Sample project: GitHub — AgoraIO-Community/AgoraMarketPlace (ByteDance/android)
  - API reference: addExtension, enableExtension, setExtensionProperty, onChannelMediaRelayEvent
  - Key-value overview table covering: check_license, ai_init, set_composer, composer_remove_nodes, set_orientation, composer_set_nodes, composer_update_node, set_effect, set_color_filter_v2, set_intensity
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
- External link: https://creativestore.byteplus.com/mall/cv/effect

## Notes
- Third-party extension by BytePlus Pte Ltd (ByteDance group).
- No free tier — requires contacting sales for activation.
- Documentation note: "Agora is planning a documentation upgrade program for all extensions on the marketplace."
- Platform limited to mobile (iOS, Android, Flutter) — no Web or desktop.
- Most recent version date (2025-08-11) of all extensions observed.
