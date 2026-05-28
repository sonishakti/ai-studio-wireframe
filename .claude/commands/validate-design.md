---
model: sonnet
description: Validate code against the ai-studio-console-redesign design system
argument-hint: <file_or_directory>
---

# Validate Design Command

## Purpose

Check code for design system violations including hardcoded colors, arbitrary spacing, and deprecated patterns.

## Variables

TARGET: $ARGUMENTS (defaults to current directory if empty)

## Workflow

1. Run `buoy drift check ${TARGET} --json` to get drift signals
2. Parse the JSON output
3. For each violation, report:
   - File and line number
   - Type of violation (hardcoded-value, spacing, etc.)
   - Current value
   - Suggested token replacement
4. Summarize total violations by severity (critical, warning, info)

## Output Format

```
src/components/Button.tsx:24
  hardcoded-value: #3b82f6 → var(--color-primary)

src/components/Card.tsx:12
  spacing: padding: 17px → var(--spacing-4)

Summary: 2 violations (0 critical, 2 warning, 0 info)
```
