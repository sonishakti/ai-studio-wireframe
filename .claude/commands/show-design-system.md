---
model: haiku
description: Display the ai-studio-console-redesign design system context
---

# Show Design System Command

## Purpose

Output the complete design system context including tokens, components, and patterns.

## Workflow

1. Run `buoy show all --json`
2. Format the output as a readable summary:
   - Color tokens with values
   - Spacing scale
   - Typography tokens
   - Available components
   - Known anti-patterns to avoid

## Output Format

### Colors
| Token | Value |
|-------|-------|
| --color-primary | #3b82f6 |
| --color-secondary | #6366f1 |
...

### Spacing
| Token | Value |
|-------|-------|
| --spacing-1 | 4px |
| --spacing-2 | 8px |
...

### Components
- Button (variants: primary, secondary, ghost)
- Card
- Input
...
