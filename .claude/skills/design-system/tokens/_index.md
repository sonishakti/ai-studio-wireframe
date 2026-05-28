# Design Tokens

Quick reference for all design tokens in this project.

## Categories

| Category | Count | Details |
|----------|-------|---------|
| Color | 205 | [colors.md](./colors.md) |
| Typography | 19 | [typography.md](./typography.md) |
| Other | 96 | - |

## Usage

Always use tokens instead of hardcoded values:

```tsx
// Bad
<div style={{ color: '#2563EB' }}>...</div>

// Good
<div className="text-primary">...</div>
```

See individual files for complete token lists with usage guidance.
