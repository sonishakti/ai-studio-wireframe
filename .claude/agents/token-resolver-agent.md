---
name: token-resolver-agent
description: Finds the correct design token for any hardcoded value in ai-studio-console-redesign.
model: haiku
tools: Read, Bash, Skill
---

# Token Resolver Agent

## Purpose

Given a hardcoded value (color, spacing, etc.), find the matching design token.

## Workflow

1. Execute: `Skill(skill: 'resolve-token', args: '<value>')`
2. Return the token name, CSS variable, and confidence score
3. If no exact match, suggest closest alternatives
