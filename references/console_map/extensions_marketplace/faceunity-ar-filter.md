# FaceUnity AR Filter
**URL**: https://console.agora.io/extensions-marketplace/faceunity-ar-en
**Section**: Extension Marketplace
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Detail page for the FaceUnity AR Filter third-party extension. Provides AR portrait beautification, advanced beauty effects, and body/gesture detection for Android, iOS, Flutter, React Native, and Unity apps via Agora Video SDK.

## Content Hierarchy

- **Breadcrumb**: Marketplace
- **Heading**: "FaceUnity AR Filter"
- **Tagline**: "FaceUnity's AR technology provides video effects specializing in portrait beautification for Agora's Video SDK."
- **Metadata**:
  - Company Name: Hangzhou Xiangxin Technology Co.,Ltd
  - Version: v8.14.0
  - Updated: 2025-08-11
  - Platform: Android, iOS, Flutter, React Native, Unity
  - Core Features:
    - Basic beauty: skin beautification, whitening, rosy
    - Advanced beauty: Add video beauty effects for shape, face and skin
    - Number detection: Detects the number of faces, humans, or gestures
- **Tab navigation**: User Guide | Download | Plans | Projects
- **User Guide tab** (active/default):
  - Overview: Uses 3D vision, 3D graphics, deep learning; setExtensionProperty/key-value pattern
  - Prerequisites: Android Studio 4.1+, Android SDK API Level 24+, Android 4.1+ device
  - Project setup: Sample on GitHub (AgoraIO-Community/AgoraMarketPlace), contact Agora for authpack certificate
  - Integration steps: .aar files, certificate setup, model/prop resource files, build.gradle config, enableExtension before other APIs
  - Initialize: fuSetup (auth), fuLoadAIModelFromPackage (AI model)
  - Configure: load props, adjust beautification intensity, face/gesture/body recognition
  - Resource release: fuDestroyLibData key → destroy Agora Engine
  - Full key-value reference table:
    - Initialization keys: fuSetup, fuLoadAIModelFromPackage, fuReleaseAIModel
    - Prop package loading: fuCreateItemFromPackage, fuLoadTongueModel, fuItemSetParam
    - Destruction: fuDestroyItem, fuDestroyAllItems, fuOnDeviceLost, fuDestroyLibData
    - System: fuBindItems, fuUnbindItems, fuIsTracking, fuSetMaxFaces, fuSetDefaultRotationMode
    - Algorithm: fuFaceProcessorSetMinFaceRatio, fuSetTrackFaceAIType, fuSetFaceProcessorFov, fuHumanProcessorReset, fuHumanProcessorSetMaxHumans, fuHumanProcessorGetNumResults, fuHumanProcessorSetFov, fuHandDetectorGetResultNumHands
  - Callback keys: fuIsTracking, fuHumanProcessorGetNumResults, fuHandDetectorGetResultNumHands, fuDestroyLibData
  - API reference: setExtensionProperty, addExtension, enableExtension, onEvent
  - Error codes: enableExtension -3, setExtensionProperty -1/-2/-20
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
- GitHub link: AgoraIO-Community/AgoraMarketPlace

## Notes
- Third-party extension by Hangzhou Xiangxin Technology Co., Ltd (FaceUnity).
- No free tier — requires contacting sales for activation.
- Requires certificate file (authpack.java) from Agora tied to specific app package name.
- Most comprehensive key-value API documentation of all third-party extensions observed.
- Version v8.14.0 and updated 2025-08-11 — same recency as BytePlus Effects.
- Multi-platform: Android, iOS, Flutter, React Native, Unity.
