---
name: design-validator-agent
description: Validates code against the ai-studio-console-redesign design system. Use after writing UI code.
model: sonnet
tools: Read, Bash, Glob, Grep, Skill
hooks:
  Stop:
    - hooks:
        - type: command
          command: "buoy drift check --quiet"
---

# Design Validator Agent

## Purpose

Validate that code follows the ai-studio-console-redesign design system. Catches hardcoded colors, arbitrary spacing, and pattern violations before they ship.

## Workflow

1. Execute: `Skill(skill: 'validate-design', args: '<file_or_directory>')`
2. Review drift signals
3. Suggest fixes for any violations found
4. Report results with specific line numbers and token suggestions
