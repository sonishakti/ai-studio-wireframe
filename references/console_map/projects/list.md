# Projects — List
**URL**: https://console.agora.io/project-management
**Section**: Projects
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Lists all projects in the account. Supports searching, filtering by Active/Archived state, and creating new projects. Each row links to a project's configuration view.

## Content Hierarchy

- **Heading**: "My Projects"
- **Search input**: "Search for a Project" (text input with search button)
- **Tab filter**: "1 Active" | "0 Archived"
- **"Create New" button** ⚠️ — creates a new project
- **Projects table**:
  - Columns: # | Name | Updated | Created | Security | App ID | Action
  - Row 1: Default Project | ~1 hr ago | ~1 hr ago | Secure | `f142***` (redacted) | [action buttons]
- **Pagination**: not present (1 project total)

## Interactive Elements (observed, not activated)

- "Create New" button ⚠️ — opens new project creation flow
- "1 Active" / "0 Archived" tab filters — switches between project states
- Search input — filters project list
- Row action button (unnamed) — likely navigates to project detail/configure view
- "Customise options" button — likely a row-level dropdown menu (ellipsis/kebab)

## Notes

- App ID partially visible in table: `f142***` — truncated, redacted per spec.
- No pagination controls visible (only 1 project).
- Table has no explicit sort controls visible in the accessibility tree.
