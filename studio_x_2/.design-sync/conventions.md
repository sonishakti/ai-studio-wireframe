# studio-x — Agora Studio_X design system

studio-x is the **React 19 + Tailwind v4 + shadcn/ui** design system for the Agora Studio_X
console: oklch design tokens, **cyan** primary, **DM Sans**, light + dark. Build screens by
composing the real components in this library — every component renders from `window.StudioX.*`,
and every design you produce should be made of these parts so it maps 1:1 onto shippable code.

## Setup & wrapping

- Styling loads entirely from `styles.css` (tokens + DM Sans + component CSS). Nothing else is
  needed to make components look right.
- A few components require a context provider — wrap the app root (or the subtree that uses them):
  - **`TooltipProvider`** — required around any `Tooltip`; a bare `Tooltip` renders nothing.
  - **`SidebarProvider`** — required around any `Sidebar` (holds open/collapsed state).
  - **`ThemeProvider`** — optional light/dark; dark mode is the `.dark` class on an ancestor
    (every token flips automatically — never hardcode dark colors).
  - **`Toaster`** — render one at the root; call `toast(...)` from anywhere for notifications.

## Styling idiom — Tailwind utilities bound to tokens

Style with Tailwind v4 utility classes that map to the DS tokens. **Always use the token utilities
below instead of raw hex/rgb** so brand color and light/dark stay correct:

- Surfaces: `bg-background`/`text-foreground`, `bg-card`/`text-card-foreground`, `bg-popover`,
  `bg-muted`/`text-muted-foreground`, `bg-accent`/`text-accent-foreground`, `bg-sidebar`.
- Brand & intent: `bg-primary`/`text-primary-foreground` (cyan), `bg-secondary`/`text-secondary-foreground`,
  `bg-destructive`/`text-destructive`, `text-warning`, `text-success`.
- Lines & focus: `border-border`, `bg-input`, `ring-ring`. Charts: `text-chart-1` … `text-chart-5`.
- Radius: `rounded-md`/`rounded-lg`/`rounded-xl` (scale from `--radius` = 0.625rem). Type: `font-sans`
  (DM Sans, the default), `font-heading`.

Layout/spacing use ordinary Tailwind utilities (`flex`, `grid`, `gap-*`, `p-*`, `w-*`, …). Don't
hardcode colors or arbitrary `px` for color/spacing — use the token utilities and the spacing scale.

## Where the truth lives

- `styles.css` — the full token/font/component-CSS closure; read it for the exact `--*` token names.
- Per component: `<Name>.d.ts` is the prop contract; `<Name>.prompt.md` is the usage doc with
  examples. Read both before composing a component.

## Idiomatic example

```tsx
<Card className="w-80">
  <CardHeader>
    <CardTitle>Aria — Inbound Support</CardTitle>
    <CardDescription>Handles billing questions 24/7.</CardDescription>
    <CardAction><Badge variant="secondary">Live</Badge></CardAction>
  </CardHeader>
  <CardContent className="text-muted-foreground">1,284 calls this week · 92% resolved.</CardContent>
  <CardFooter className="gap-2">
    <Button>Open</Button>
    <Button variant="outline">Configure</Button>
  </CardFooter>
</Card>
```
