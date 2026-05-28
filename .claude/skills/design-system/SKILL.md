---
name: design-system
description: Use when building UI components, styling, or layouts for ai-studio-console-redesign
triggers:
  - building UI
  - styling components
  - adding colors
  - creating layouts
  - form design
  - component creation
---

# ai-studio-console-redesign Design System

This skill provides design system context for AI code generation.

## Quick Start


2. **For styling**, use tokens from `tokens/_index.md`
3. **For patterns**, see `patterns/_common.md`

## Rules

1. NEVER hardcode colors - use tokens from `tokens/colors.md`
3. NEVER hardcode fonts - use tokens from `tokens/typography.md`

## Progressive Loading

- Start with `_index.md` files for quick reference
- Load specific files when you need details
- The `anti-patterns/_avoid.md` file lists what NEVER to do

## Feedback Loop

If you create something not in the design system:
1. Check if a similar component exists
2. If truly new, flag for design system team review
3. Use closest existing pattern as base

## Validation

Run `buoy drift check` before committing to validate compliance.

```bash
buoy drift check           # Quick validation
buoy show drift     # Detailed drift analysis
```
