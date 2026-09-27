# P0.1 Choose how people reach it · Directions

Track: **v3**. Constraints: Concept A is chosen (req 3, 4); existing design system only; reuse, do not redesign; empty first, quiet chrome; locked words.

## Five directions

### 1. Type cards in the create sheet (Concept A, corrected)
Keep the Concept A sheet: name, then three radio cards in PRD order (inbound, batch, code), one line each, **Create agent** in the footer. Fix the copy, add the rtc line, the empty name reason, and the error, saving and retry states. After create, the type shows as the header badge, and **Change type** lives in the header `…` menu.
Research: Synthflow's second gate (synthflowdeskonly-03), without its first gate.

### 2. Type in the Create split button
**Create agent** becomes a split button whose menu lists inbound, batch, code; picking one opens a sheet with only the name (Concept B's one-click menu).
Research: none of the five vendors does this.

### 3. Two-step sheet
Step 1 name, step 2 type, with Back and Next, Create on step 2.
Research: Synthflow's two gates (synthflowdeskonly-02, 03).

### 4. Name only, type at Go live
Create saves an untyped agent; the builder shows every section until Sam picks inbound, batch or code in Go live.
Research: ElevenLabs and Retell (channels and numbers later, elevenlabs-18-agent-channels, retell-02). This is the PRD fallback if the counter metric passes 20 %.

### 5. Templates grouped by type
Keep today's template rows, grouped under Inbound, Batch and Code headers; picking a row sets both type and starting prompt.
Research: ElevenLabs templates (elevenlabs-templates), today's Console.

## Audit

Scored 1 to 5 (5 best). Criteria from the owner rules and the PRD row.

| Criterion | 1 Cards in sheet | 2 Split button | 3 Two steps | 4 Type at Go live | 5 Templates by type |
|---|---|---|---|---|---|
| Fits the JTBD (type at create, builder trimmed) | 5 | 5 | 5 | 1 | 4 |
| Median 30 s or less (fewest decisions and clicks) | 5 | 4 | 3 | 5 | 3 |
| Reuse, one door (existing sheet, no new control) | 5 | 2 (new split button) | 4 | 4 | 3 |
| Empty first, quiet chrome | 5 | 4 | 4 | 3 | 1 (seeded prompts) |
| Locked words | 5 | 5 | 5 | 5 | 2 (template = never word) |
| Rainy coverage .b to .h in one place | 5 | 3 (name and type split across two surfaces, .d keeps less) | 4 | 2 (.b, .c become the norm) | 3 |
| API fit (POST /agents with labels) | 5 | 5 | 5 | 3 (unlabelled agents) | 3 (prompt seeding not in spec) |
| Concept A continuity | 5 | 2 | 3 | 1 | 2 |
| **Total / 40** | **40** | **30** | **33** | **24** | **21** |

Cut: 4 contradicts the PRD step and would make .c the default state; keep it as the documented fallback. 5 brings back templates and seeded content. 2 hides the most important choice in a menu and adds a control shape the Console does not ship. 3 costs a step for two fields.

## Pick: direction 1, type cards in the create sheet

1. **One decision, one surface.** Name and type sit together in the sheet Sam already opens today, so open to saved is two inputs and one press, which is how the 30 s median is reachable.
2. **Reuse, not redesign.** Same `FormSheet`, same door on the Agents toolbar, `RadioGroup` cards already on design/v3; no new token, component or control shape.
3. **Every rainy path lives in one known place.** Errors, the saving state and the re-read before retry stay in the sheet (.d, .f, .g, .h); the type change and the untyped API agent use the header badge and one `Alert` (.b, .c).
4. **Evidence backed.** Vapi and LiveKit split reach exactly three ways; Synthflow proves the one-line radio card at create; nobody documents a type change, so ours is the first to name the blocking number or run.
5. **Measurable and reversible.** `create_sheet_opened`, `deployment_type_selected` and `deployment_type_changed` fire from this one sheet and one menu item, so the counter metric can prove or disprove the type at create, and direction 4 stays a clean fallback.

## Questions for the owner (max 3)

1. Before the first deployment, should **Change type** keep the builder's configured values that the new type does not use (hidden), or clear them? The spec keeps them hidden.
2. For .f, may Studio add a fourth label `studio_create_ref` (a client id per sheet open) so the re-read matches exactly, instead of matching on name and creation time?
3. For .c, does "ask once" mean once per agent (a label is written when Sam answers or dismisses) or once per viewer? The spec writes the label.
