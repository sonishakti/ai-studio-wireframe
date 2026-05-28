---
model: haiku
description: Find the design token for a hardcoded value
argument-hint: <value>
---

# Resolve Token Command

## Purpose

Given a hardcoded value, find the matching design token from the ai-studio-console-redesign design system.

## Variables

VALUE: $ARGUMENTS

## Workflow

1. Run `buoy show tokens --json`
2. Search for tokens matching the value:
   - Exact match (100% confidence)
   - Close match for colors (>90% similarity)
   - Nearest spacing value
3. Return results

## Output Format

```
Value: #3b82f6
Match: --color-primary (100% match)
Usage: var(--color-primary)

Alternative:
  --color-blue-500 (98% match)
```

## Color Matching

For colors, use perceptual similarity:
- Convert to LAB color space
- Calculate deltaE distance
- Threshold: <5 = excellent match, <10 = good match
