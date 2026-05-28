---
model: sonnet
description: Fix design drift issues automatically
argument-hint: <file_or_directory>
---

# Fix Drift Command

## Purpose

Automatically fix design system violations by replacing hardcoded values with tokens.

## Variables

TARGET: $ARGUMENTS (defaults to current directory if empty)

## Workflow

1. Run `buoy drift fix ${TARGET} --dry-run --json` to preview fixes
2. Show the user what will be changed
3. If confirmed, run `buoy drift fix ${TARGET} --auto` to apply safe fixes
4. For fixes requiring review, present options to the user
5. Re-run `buoy drift check` to verify fixes were applied correctly
6. Report results

## Safety

- Only apply fixes with high confidence (>90%)
- Never modify files outside the target directory
- Always show diff before applying changes
