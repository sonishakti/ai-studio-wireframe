# P0.5 Connect other systems to the agent · Learnings

Research phase done 26 Sep (`02-research.md`, 21 shots). Order followed: existing product shots for Retell, ElevenLabs and LiveKit (reused, never re-captured), Refero for the rainy gaps (Zapier's step error was the one real analog), vendor docs for Vapi (signed out) and Retell's knowledge base failure; no sign-in. Vapi Partial, the rest Done.

## 1. One list beats three rows and a fourth page

- Retell splits Functions, Knowledge Base and MCPs into three accordion rows on the agent and keeps an Integrations page above them (`shots/retell-agent-editor.png`, `shots/retell-19-integrations-available.png`); Vapi makes tools a workspace tab beside the assistant (`shots/vapi-assistant-model.png`); ElevenLabs gives tools three Add buttons (`shots/elevenlabs-19-tools-list.png`).
- Our row already holds every kind in one list with an icon and a tooltip per kind (`shots/before-01-context-row-populated.png`, `shots/before-02-add-menu.png`), which is team ask 10 and requirement 10. **Change:** keep the one list and the one Add menu; rename the row **Integrations**; drop the hint line under each menu item so the kind is an icon and a name (the tooltip on the row's icon carries the meaning); reuse across agents stays P3.4.

## 2. Saved is not tested, and every kind gets the same proof

- ElevenLabs gates **Add Server** behind an "I trust this server" checkbox and a **Test Connection** button on MCP (`shots/elevenlabs-19-custom-mcp-server-form.png`) but its webhook tool has no test at all (`shots/elevenlabs-19-webhook-tool-form.png`). Our sheet's **Connect** always succeeds with the same four tools (`shots/before-04-mcp-connected-tools.png`), so a saved server looks proven when nothing has been proven.
- The KPI counts integrations that a test used without an error. **Change:** saving never claims anything: the row reads **Not checked** until a test uses it, then **Worked in last test** or **Failed in last test** with the time, for MCP servers and tools alike; **Save and test** in the sheet footer (the P0.3 and P0.4 button) is the shortest path from `integration_added` to `agent_audio_heard`.

## 3. Name the failure on the object, with a code and a way out

- Zapier's step card names the failure, prints the raw reason and offers two recoveries on the step that failed (`shots/refero-zapier-01-step-error-troubleshoot.png`); Vapi's troubleshoot page gives four plain-language failure names (`shots/vapi-docs-01-troubleshoot-tools.png`). ElevenLabs shows an unexplained red dot (`shots/elevenlabs-20-agent-knowledge-base-sources.png`).
- **Change:** the transcript line carries the integration name and the code (`sendTrackingLink · 502`, `Orders · MCP server 401`, `timed out after 10 s`), the row carries **Failed in last test** and the time, and the recoveries are the doors that already exist: Edit (re-enter the header, raise Timeout) and Remove. Unlike Zapier the session never stops: the agent answers without the tool.

## 4. Write-only means write-only, and the same control everywhere

- LiveKit's MCP form has optional headers with no way to see them again (`shots/livekit-19-mcp-server-form.png`); our sheet uses a bespoke `SecretKeyField` for one Authorization header (`shots/before-03-mcp-sheet.png`), while P0.3 already set the Console pattern for write-only headers: a textarea, one `Name: value` per line, and "n headers set · Replace" once saved.
- **Change:** MCP servers and tools use P0.3's Headers control, so .e (a saved value is never shown) and .i (re-enter and save) are one door, and the (i) says plainly that `$secrets` references are not supported in headers yet.

## 5. The sparse form is not the honest form

- LiveKit's MCP form has no timeout, no allowed tools and no test (`shots/livekit-19-mcp-server-form.png`); ours has no timeout either and a Name placeholder copied from the knowledge sheet (`shots/before-03-mcp-sheet.png`). The v3 API has `timeout_ms` on both kinds, `allowed_tools` on MCP, and `body` on a tool, and it enforces name patterns and a limit of 32 tools.
- **Change:** every API field gets its control with the default and range in the (i) (P0.3's rule), the name rules become `FieldError`s (.c), and the 32nd tool closes the Tool item in Add with one line. LiveKit's Silent toggle (`shots/livekit-19-http-tool-form.png`) is not copied: the API has no field for it.

## 6. A knowledge base that cannot save never ships; when it can, copy Retell's failure vocabulary

- Retell documents the only knowledge base failure in the market: partial failure keeps the sources that worked, total failure reads **Failed** with the error, and re-adding after fixing the cause is the recovery (`shots/retell-docs-01-kb-source-fails-to-process.png`). Our sheet is a name and a drop zone with no state at all, offered unconditionally (`shots/before-06-knowledge-sheet.png`), and the v3 API has no knowledge base.
- **Change:** the kind sits behind a flag; with the flag on, the sheet says it cannot save yet and shows the file states (uploading, indexing, ready, rejected, too large, unsupported, indexing failed) with a reason and a way out per file. Knowledge bases and HubSpot from the current Console are named in one muted line under the list (`shots/before-08-old-console-integrations-gated.png`), never hidden.
