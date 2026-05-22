# License Management
**URL**: https://console.agora.io/license-management
**Section**: License Management
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: true

## Purpose
License management section covering pre-authorization, purchase history, quota management, and usage queries. Routes discovered via build manifest.

## Access Behavior

All license-management sub-routes redirect to the console Overview (`/`) for this account. The section appears to be gated behind a plan or feature that is not active on this account.

## Routes (from build manifest, all redirect to Overview)

- `/license-management` → redirects to `/license-management/purchase-history` then to `/`
- `/license-management/pre-authorization` → redirects to `/`
- `/license-management/purchase-history` → redirects to `/`
- `/license-management/quota-management` → not visited (assumed same behavior)
- `/license-management/usages-query` → not visited (assumed same behavior)

## Notes
- Section is not accessible with the current account/plan.
- No sidebar link observed in main navigation for this section.
- Discovered via Next.js build manifest (`_buildManifest.js`), not visible navigation.
