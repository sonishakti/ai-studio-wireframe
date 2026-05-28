# Typography Tokens

## Font Definitions

| Token | Value |
|-------|-------|
| `--font-heading` | "DM Sans", ui-sans-serif, system-ui, sans-serif |
| `--font-sans` | "DM Sans", ui-sans-serif, system-ui, sans-serif |
| `--font-family-font-mono` | "Space Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace |
| `--agora-text-primary` | #fdfcfb |
| `--agora-text-secondary` | #b3b3b3 |
| `--agora-text-muted` | #626262 |
| `--agora-text-label` | #a3a3a3 |
| `--agora-text-placeholder` | #575757 |
| `--agora-text-icon` | #8a8a8a |
| `--agora-status-stopped-text` | #ffffff |
| `--agora-status-deployed-text` | #4caf50 |
| `--agora-extension-badge-text` | #e5feff |
| `--agora-extension-text-primary` | #fdfcfb |
| `--agora-extension-text-secondary` | #b3b3b3 |
| `--agora-extension-text-muted` | #b3b3b3 |
| `--agora-campaign-table-status-on-strong-text` | #ffffff |
| `--font-sans` | "Instrument Sans", sans-serif |
| `--font-instrument` | "Instrument Sans", sans-serif |
| `--font-mono` | var(--font-family-font-mono) |

## Usage Guidelines

- Use typography tokens for consistent text styling
- Avoid hardcoding font families or sizes
- Prefer text utility classes

## Common Mistakes

❌ Hardcoded fonts:
```tsx
style={{ fontFamily: 'Inter', fontSize: '16px' }}
```

✅ Typography tokens:
```tsx
className="text-body"
// or
style={{ ...tokens.textBody }}
```
