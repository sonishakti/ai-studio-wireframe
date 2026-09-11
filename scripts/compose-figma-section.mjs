#!/usr/bin/env node
// prints `const PLAN = {...}` + the runner for one feature — paste into use_figma.
import { readFileSync } from "node:fs"; import { dirname, resolve } from "node:path"; import { fileURLToPath } from "node:url"
const root = resolve(dirname(fileURLToPath(import.meta.url)), ".."); const n = process.argv[2]
const plan = readFileSync(resolve(root, `references/tracker-board/figma/plans/${n}.json`), "utf8")
process.stdout.write(`const PLAN = ${plan}\n` + readFileSync(resolve(root, "scripts/figma-section-runner.js"), "utf8"))
