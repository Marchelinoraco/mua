---
inclusion: always
---

# Design System

## UI Foundation

- **shadcn/ui** with "new-york" style and "slate" base color — primitives in `src/components/ui/`
- **Radix UI** primitives for accessibility (dialog, dropdown, popover, etc.)
- **lucide-react** for icons — use named imports: `import { Moon, Sun } from 'lucide-react'`
- **class-variance-authority (cva)** for component variants (see `button.tsx` for pattern)

## Theming

- CSS custom properties in `src/styles/theme.css` using OKLCH color space
- Light/dark themes via `.dark` class on `<html>` element (managed by `ThemeProvider`)
- Theme tokens: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`, `--sidebar-*`
- Chart colors: `--chart-1` through `--chart-5` for data visualization

### Token Usage — Mandatory

**Always use the tokens defined in `src/styles/theme.css` for all colors, radii, and shadows.** Never hardcode raw color values.

| Need | Use |
|------|-----|
| Page background | `bg-background` |
| Card / surface | `bg-card`, `bg-popover` |
| Subtle fill | `bg-muted`, `bg-muted/40` |
| Hover fill | `bg-accent` |
| Primary action | `bg-primary`, `text-primary` |
| Destructive / error | `bg-destructive`, `text-destructive` |
| Body text | `text-foreground` |
| Secondary text | `text-muted-foreground` |
| Dividers / outlines | `border-border`, `border-input` |
| Focus ring | `ring-ring` |
| Chart series | `text-chart-1` … `text-chart-5` |

Opacity modifiers are allowed (e.g. `bg-primary/10`, `text-foreground/60`) but the base must always be a theme token.

## Typography

- Font families: `--font-sans` (Inter), `--font-serif` (Source Serif 4), `--font-mono` (JetBrains Mono)
- Available fonts configured in `src/config/fonts.ts` — currently: `inter`, `manrope`, `system`
- Use Tailwind font utilities: `font-sans`, `font-serif`, `font-mono`

## Spacing & Radius

- Base spacing unit: `--spacing: 0.25rem` (4px)
- Border radius: controlled by `useLayout().borderRadius` context — **never hardcode a `rounded-*` scale; always use the semantic tokens** `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` which resolve through `--radius` → `--radius-base`.
- Available values (set by the user in the Config Drawer): `0` | `0.25` | `0.5` | `0.75` | `1` (rem)
- `--radius-base` is written to `<html>` style by `LayoutProvider` on mount and on every change.
- `--radius` in `theme.css` is `var(--radius-base, 0.5rem)` — the fallback matches the default.
- Shadows: `--shadow-2xs` through `--shadow-2xl` — subtle elevation pattern

## Component Patterns

### Class Merging

Always use the `cn()` helper from `@/lib/utils` for conditional and merged classes:

```tsx
import { cn } from '@/lib/utils'

<div className={cn('base-classes', condition && 'conditional-class', className)} />
```

### Component Variants

Use `cva` for variant-based components. Pattern from `button.tsx`:

```tsx
const buttonVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', outline: '...', ghost: '...' },
    size: { default: '...', sm: '...', lg: '...' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})
```

### shadcn/ui Components

- All primitives are in `src/components/ui/` — import via `@/components/ui/<name>`
- **Always check `src/components/ui/` first before creating any new component.** If a primitive already exists (e.g. `button`, `dialog`, `card`, `badge`, `skeleton`), use or extend it — never duplicate it.
- Components use `data-slot` attributes for identification in tests
- Variants exposed via `buttonVariants`, `badgeVariants`, etc. for composition
- Use `asChild` prop when composing with other elements (Radix pattern)

### Form Components

- Built on `react-hook-form` + `zod` + `@hookform/resolvers`
- Use `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` from `@/components/ui/form`
- Validation schemas in feature's `data/schema.ts`

## Data Table Pattern

- Reusable building blocks in `src/components/data-table/`
- Components: `ColumnHeader`, `FacetedFilter`, `Pagination`, `Toolbar`, `ViewOptions`, `BulkActions`
- Built on `@tanstack/react-table` with URL state sync
- Column definitions in feature's `data/schema.ts` or component file

## Accessibility

- Radix primitives handle keyboard navigation, focus management, and ARIA
- Always provide accessible labels for interactive elements
- Use `data-slot` for test selectors instead of test IDs when possible
- Form errors displayed via `FormMessage` component

## Tailwind Usage

- Prefer semantic tokens (`bg-primary`, `text-muted-foreground`) over arbitrary values
- Use `cn()` for conditional classes — avoid template literals
- Responsive modifiers: `sm:`, `md:`, `lg:`, `xl:` — mobile-first approach
- Dark mode: use CSS variables (automatic via `.dark` class), not `dark:` prefix in most cases

---

## Visual Style — General Admin Dashboard

This template targets a **modern, clean, premium SaaS admin** aesthetic. Apply these rules consistently when building new pages, features, or components.

### Do ✅

- **Semantic color palette** — use `--primary` for key actions and highlights; use `--muted`, `--accent` for secondary surfaces; reserve `--destructive` for errors and deletions only
- **Soft, layered shadows** — use `shadow-sm` or `shadow-md` from the theme to create depth; let cards appear to float above the page background
- **Consistent card styling** — use `rounded-xl` or `rounded-2xl` with `border` and `shadow-sm` for all cards, stat panels, and widgets:
  ```tsx
  className="rounded-xl border bg-card p-6 shadow-sm"
  ```
- **Clean backgrounds** — keep page backgrounds `bg-background`; use `bg-card` or `bg-muted/40` for surface elevation
- **Breathable layouts** — use generous, consistent padding (`p-6` for cards, `gap-4` or `gap-6` for grids); avoid cramped content
- **Tinted icon containers** — wrap icons in a small rounded container with a muted tint for visual hierarchy:
  ```tsx
  className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary"
  ```
- **Subtle gradients** — use light gradients sparingly on hero sections or stat card accents:
  ```tsx
  className="bg-gradient-to-br from-primary/10 to-transparent"
  ```
- **Loading states** — all async data must show a `Skeleton` component while loading; never show empty UI without feedback
- **Consistent spacing scale** — stick to the Tailwind spacing scale (4, 6, 8, 12, 16…); avoid one-off values

### Don't ❌

- Don't hardcode colors with arbitrary Tailwind values (`bg-[#1a2b3c]`) — use semantic tokens or extend the theme
- Don't use hard borders as the only depth cue — always pair `border` with a shadow or background difference
- Don't mix border-radius scales within the same visual group — pick `rounded-xl` or `rounded-2xl` and be consistent within a section
- Don't skip empty states — every list, table, or data section must have a meaningful empty state UI
- Don't build data tables without a toolbar — all tables must include at minimum a search/filter and pagination
- Don't use multiple competing accent colors on the same page — limit decorative color use to 1–2 tones per view
- Don't render placeholder or lorem ipsum text in components — use realistic, domain-appropriate labels and values
- Don't ignore dark mode — always verify that new components look correct in both light and dark themes using the theme token system
- Don't create a custom component if a shadcn/ui primitive in `src/components/ui/` already covers the use case — always check there first
