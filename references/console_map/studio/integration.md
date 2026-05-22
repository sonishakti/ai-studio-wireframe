# Studio Integration
**URL**: https://console.agora.io/studio/integration/credentials
**Section**: Studio (Build Agents)
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Manage external service credentials (LLM providers, TTS/STT services, etc.), knowledge bases, and MCP tool integrations for use by Agora voice AI agents.

## Content Hierarchy

### Integration sub-navigation: Credentials | Knowledge Bases | MCPs

---

### Credentials tab (`/studio/integration/credentials`)
- **"Add Credential"** button ⚠️
- **Filters**: Vendor: All | Type: All
- **Empty state**: "No credentials found. You haven't created any credentials yet. Start by adding your first credential."
- **"Add Credential"** button ⚠️ (body)

---

### Knowledge Bases tab (`/studio/integration/knowledge-bases`)
- **"Create Knowledge Base"** button ⚠️
- **Alpha notice**: "Feature currently in public alpha. It may change and is not yet recommended for production use."
- Empty state (no knowledge bases)

---

### MCPs tab (`/studio/integration/mcps`)
- Redirects to `/studio/agents` — not yet accessible

## Interactive Elements (observed, not activated)

- "Add Credential" button ⚠️
- Vendor / Type filter dropdowns
- "Create Knowledge Base" button ⚠️
- Credentials | Knowledge Bases | MCPs inner tab links

## Notes
- All Integration sections are empty (fresh account).
- Knowledge Bases is in public alpha.
- MCPs tab is not yet implemented (redirects to agents).
