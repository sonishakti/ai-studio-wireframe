# Teams and Members
**URL**: https://console.agora.io/settings/teams-members
**Section**: Settings
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
Manage team role definitions with permission levels, and manage member accounts. Controls access rights for sub-users across Usage, Finance, Teams, Projects, XLA, Agora Analytics, and Data modules.

## Content Hierarchy

- **Tab navigation**: Account | Teams and Members (active) | Notifications Preferences | SSO Management
- **Inner tab navigation**: Teams | Members

### Teams tab (default)
- **Section heading**: "Teams & Permissions"
- **"Add New Team"** button ⚠️
- **Table**: Team Name | Usage | Finance | Teams and Members | Project | XLA | Agora Analytics | Data | Action
  - **Finance**: Usage=None, Finance=View, Teams and Members=None, Project=None, XLA=None, Analytics=None, Data=All Projects
  - **Engineer**: Usage=None, Finance=None, Teams and Members=None, Project=Edit, XLA=None, Analytics=Call Inspector/Data Insights/Live Data, Data=All Projects
  - **CS/Maintenance**: Usage=None, Finance=None, Teams and Members=None, Project=None, XLA=None, Analytics=Call Inspector/Data Insights/Live Data, Data=All Projects
  - **Product/Operation**: Usage=View, Finance=None, Teams and Members=None, Project=None, XLA=None, Analytics=None, Data=All Projects
  - **Admin**: Usage=View, Finance=View, Teams and Members=Edit, Project=Edit, XLA=View, Analytics=Call Inspector/Data Insights/Live Data, Data=All Projects

### Members tab
- **Section heading**: "Member Management"
- **"Add New Member"** button ⚠️
- Empty state (no members listed beyond owner)

## "Add New Member" Inline Form (observed)

Clicking "Add New Member" expands an inline form within the Members tab (no modal):

- **Section heading**: "Member Management"
- **Fields**:
  - Member Email (text input, `name="email"`)
  - Team selector (combobox `role="combobox"`, no default value)
- **Table columns appear**: Member Email | Team | Creation Time | Action
- **Actions**: "Cancel" | "Save" ⚠️
- **Close control**: "Close Add Member" button collapses the form

## Interactive Elements

- "Add New Team" button ⚠️ — not tested (state-changing)
- "Add New Member" button — expands inline form (described above)
- Action buttons on each team row — not activated
- Teams / Members inner tab buttons

## Notes
- 5 pre-defined team roles with varying permissions across 7 modules.
- Analytics permissions use specific named products (Call Inspector, Data Insights, Live Data) rather than View/Edit/None.
- No members listed — account is single-user (owner only).
