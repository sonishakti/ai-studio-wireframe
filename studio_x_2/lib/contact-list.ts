"use client"

/**
 * Contact list — reading the file the builder actually chose, and substituting
 * its values into the sentence the caller hears. ONE module because three
 * surfaces have to agree on the same answers (direction C, 2026-09-17): the
 * list panel in Deployment, the batch pre-flight, and the Opening's "Callers
 * hear" line. Two of them computing coverage from two expressions is how the
 * panel came to print N/N.
 *
 * Why not extended: `lib/campaign-data.ts` is the fixture catalog and
 * `lib/wizard-draft.ts` is the draft shape — neither reads a file. Design mode
 * only: the File API plus localStorage under an `sx:` key, no network, no CSV
 * dependency. Storage goes through `readStored`/`writeStored`
 * (`hooks/use-stored-state.ts`) rather than a second try/catch of its own.
 *
 * The two column names and the two caps come from
 * <https://docs.agora.io/en/ai/studio/deploy/campaign>, the only authority for
 * any of them. Nothing here predicts what the Engine does with a row: every
 * count below is a fact about the file on disk.
 */

import { readStored, writeStored } from "@/hooks/use-stored-state"

// ─── The documented shape of a contact list ──────────────────────────────────

/** The one column Agora requires — a number in E.164. */
export const REQUIRED_COLUMN = "phone_number"

/** The documented optional column: it replaces the prompt for that row. */
export const OVERRIDE_COLUMN = "prompt_override"

/** Documented caps. Stated on the panel as facts about the chosen file, never
 *  used as a gate: a list with no `phone_number` cannot dial at all, a long
 *  one merely exceeds a published limit. */
export const MAX_ROWS = 50000
/** 25 MB. */
export const MAX_BYTES = 26214400

/** Rows kept for the preview table and the Opening's contact stepper. The
 *  counts are kept WHOLE — only the rows are trimmed, so nothing on screen
 *  claims a position the stepper cannot reach. */
export const ROWS_KEPT = 200

/** What the chosen file turned out to be. Every number is a count of rows in
 *  that file; none of them is a prediction. */
export interface ListChecks {
  /** Distinct numbers that appear on more than one row. */
  repeats: number
  /** Rows whose `phone_number` is not in E.164. */
  notE164: number
  /** Empty cells per column — a column with none is absent from the map. */
  blanksByColumn: Record<string, number>
  overCap: boolean
  hasKey: boolean
  hasOverride: boolean
}

export interface ParsedContactList {
  fileName: string
  /** The header row, in file order, de-duplicated. */
  columns: string[]
  /** Every data row the file holds, even once `saveList` has trimmed `rows`. */
  rowCount: number
  rows: Record<string, string>[]
  checks: ListChecks
}

const EMPTY_CHECKS: ListChecks = {
  repeats: 0,
  notE164: 0,
  blanksByColumn: {},
  overCap: false,
  hasKey: false,
  hasOverride: false,
}

/** A file we could not read, and a file with nothing in it, are the same state
 *  on screen: a name, no columns, and a list that refuses itself. */
function emptyList(fileName: string): ParsedContactList {
  return { fileName, columns: [], rowCount: 0, rows: [], checks: { ...EMPTY_CHECKS } }
}

// ─── Parsing ─────────────────────────────────────────────────────────────────

/** E.164 as the contact-list spec states it: a leading `+`, a non-zero country
 *  digit, 8 to 15 digits in all. */
export function isE164(v: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(v)
}

/** RFC 4180 cells: a quoted cell may hold commas, newlines and `""` escapes.
 *  Anything else is taken literally rather than rejected — a file the builder
 *  chose is data to describe, not input to validate. */
function parseGrid(text: string): string[][] {
  const grid: string[][] = []
  let row: string[] = []
  let cell = ""
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch !== '"') { cell += ch; continue }
      if (text[i + 1] === '"') { cell += '"'; i++; continue }
      quoted = false
      continue
    }
    if (ch === '"') { quoted = true; continue }
    if (ch === ",") { row.push(cell); cell = ""; continue }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cell)
      grid.push(row)
      row = []
      cell = ""
      continue
    }
    cell += ch
  }
  if (cell !== "" || row.length > 0) { row.push(cell); grid.push(row) }
  return grid
}

/** The counts the panel states, over the rows `parseContactCsv` read. */
function checkRows(columns: string[], rows: Record<string, string>[]): ListChecks {
  const hasKey = columns.includes(REQUIRED_COLUMN)
  const seen = new Map<string, number>()
  const blanksByColumn: Record<string, number> = {}
  let notE164 = 0

  for (const row of rows) {
    if (hasKey) {
      const number = row[REQUIRED_COLUMN] ?? ""
      seen.set(number, (seen.get(number) ?? 0) + 1)
      if (!isE164(number)) notE164 += 1
    }
    for (const col of columns) {
      if ((row[col] ?? "") === "") blanksByColumn[col] = (blanksByColumn[col] ?? 0) + 1
    }
  }

  let repeats = 0
  // A blank number is already counted as not-E.164; counting it again as a
  // repeat would state the same cell twice.
  for (const [number, count] of seen) if (number !== "" && count > 1) repeats += 1

  return {
    repeats,
    notE164,
    blanksByColumn,
    overCap: rows.length > MAX_ROWS,
    hasKey,
    hasOverride: columns.includes(OVERRIDE_COLUMN),
  }
}

/** Header names are kept VERBATIM (trimmed, BOM stripped). Lower-casing them
 *  would quietly accept a header Agora does not document, and `hasKey` is the
 *  one check a deploy is blocked on. Two columns of the same name collapse to
 *  one: the later cell wins, the way a JSON object would. */
function toList(fileName: string, text: string): ParsedContactList {
  const grid = parseGrid(text.replace(/^﻿/, ""))
  const header = (grid.shift() ?? []).map((h) => h.trim())
  const columns: string[] = []
  for (const name of header) if (name !== "" && !columns.includes(name)) columns.push(name)

  const rows: Record<string, string>[] = []
  for (const cells of grid) {
    // A trailing newline leaves one empty cell behind. That is not a contact.
    if (cells.every((c) => c.trim() === "")) continue
    const row: Record<string, string> = {}
    header.forEach((name, i) => {
      if (name !== "") row[name] = (cells[i] ?? "").trim()
    })
    rows.push(row)
  }

  return { fileName, columns, rowCount: rows.length, rows, checks: checkRows(columns, rows) }
}

/** Read the chosen file in the browser. Total: an unreadable or empty file
 *  comes back as a named list with no columns, so the panel renders its own
 *  refusal instead of a thrown promise. */
export async function parseContactCsv(file: File): Promise<ParsedContactList> {
  try {
    return toList(file.name, await file.text())
  } catch {
    return emptyList(file?.name ?? "")
  }
}

// ─── Substitution ────────────────────────────────────────────────────────────

export interface ResolvedText {
  /** The sentence with every value substituted; a gap keeps its braces. */
  text: string
  /** The same sentence in order, so a gap can be drawn differently from the
   *  words around it. */
  parts: { kind: "text" | "gap"; value: string }[]
  /** The tokens no column on this row supplies, in the order they appear. */
  gaps: string[]
}

/**
 * Substitute one row's values into a line of prompt text. TWO arguments: there
 * is no fallback map, because a word typed into one would reach no agent —
 * `llm.template_variables` is a Start-call field and the Console makes no
 * start call.
 *
 * A null row (inbound, or before any upload) returns the text untouched, which
 * is how the Opening stays honest about a call it cannot preview. A key that
 * IS on the row substitutes even when its value is the empty string: that is
 * plain string substitution, and the blank cell is counted on the list panel.
 * A key the row does not carry is left as the literal `{{token}}` — Agora
 * documents no behaviour for an unfilled variable, so the braces say we do not
 * know without pretending we do.
 */
export function resolveText(text: string, row: Record<string, string> | null): ResolvedText {
  if (!row) return { text, parts: [{ kind: "text", value: text }], gaps: [] }

  const parts: ResolvedText["parts"] = []
  const gaps: string[] = []
  let out = ""
  let buffer = ""
  let last = 0

  // Same Unicode-aware token as `extractVars` (campaign-data.ts): \w is
  // ASCII-only and would miss {{société}} / {{名前}}.
  for (const m of text.matchAll(/\{\{\s*([\p{L}\p{N}_.]+)\s*\}\}/gu)) {
    const key = m[1]
    const at = m.index ?? 0
    buffer += text.slice(last, at)
    last = at + m[0].length

    if (Object.prototype.hasOwnProperty.call(row, key)) {
      buffer += row[key]
      continue
    }
    if (buffer !== "") { parts.push({ kind: "text", value: buffer }); out += buffer; buffer = "" }
    const literal = `{{${key}}}`
    parts.push({ kind: "gap", value: literal })
    out += literal
    if (!gaps.includes(key)) gaps.push(key)
  }

  buffer += text.slice(last)
  if (buffer !== "") { parts.push({ kind: "text", value: buffer }); out += buffer }
  if (parts.length === 0) parts.push({ kind: "text", value: "" })

  return { text: out, parts, gaps }
}

// ─── Storage — one list per agent per run ────────────────────────────────────

/** `firstRun` is why there is one list and not two: the key carries the run's
 *  id so Deployment and Go live read the same file. */
export function listKey(agentId: string, runId: string): string {
  return `sx:contact_list:${agentId}:${runId}`
}

/** Broadcast so a surface outside the panel re-reads. The Opening lives in
 *  section 3 and the upload happens in section 2, both mounted at once on the
 *  one-pager (same idiom as `sx:widget-changed`). */
export const LIST_EVENT = "sx:contact-list"

export function saveList(agentId: string, runId: string, list: ParsedContactList): void {
  // Rows are trimmed, `rowCount` and `checks` are not: the summary bar counts
  // the file, the preview shows what is held.
  writeStored(listKey(agentId, runId), { ...list, rows: list.rows.slice(0, ROWS_KEPT) })
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(LIST_EVENT, { detail: { agentId, runId } }))
}

/** null when nothing was uploaded for this run, on the server, and for a blob
 *  written by an older shape — the caller's empty state is the honest answer
 *  in all three cases. */
export function loadList(agentId: string, runId: string): ParsedContactList | null {
  const held = readStored<ParsedContactList | null>(listKey(agentId, runId), null)
  if (!held || !Array.isArray(held.rows) || !Array.isArray(held.columns)) return null
  return { ...held, checks: { ...EMPTY_CHECKS, ...(held.checks ?? {}) } }
}
