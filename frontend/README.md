# Shadcn Admin

A responsive, accessible admin dashboard template built with React 19, shadcn/ui, and TanStack. Designed as a clean, extensible starting point for building admin panels and internal tools.

## Features

- **Authentication flows** — Sign In, Sign Up, Forgot Password, OTP
- **Dashboard** — overview with charts and metrics
- **Users** — full data table with filtering, sorting, pagination, bulk actions, and CRUD dialogs
- **Tasks** — task management with status tracking and data table
- **Settings** — Profile, Account, Appearance, Notifications, Display
- **Theming** — light/dark mode, RTL/LTR direction, configurable fonts (Inter, Manrope, System)
- **Error pages** — 401, 403, 404, 500, 503
- **Global command menu** — `⌘K` search and navigation
- **Reusable data table** — column visibility, faceted filters, URL-synced state

## Tech Stack

| Category     | Libraries                              |
| ------------ | -------------------------------------- |
| Framework    | React 19 + TypeScript                  |
| Build        | Vite                                   |
| Routing      | TanStack Router (file-based)           |
| Server state | TanStack Query                         |
| Tables       | TanStack Table                         |
| Styling      | Tailwind CSS v4 + shadcn/ui (new-york) |
| Icons        | lucide-react                           |
| State        | Zustand                                |
| Forms        | React Hook Form + Zod                  |
| HTTP         | Axios                                  |
| Charts       | Recharts                               |
| Toasts       | Sonner                                 |
| Testing      | Vitest + Playwright (browser mode)     |

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Install Playwright browser for tests (once)
npm run test:browser:install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Project Structure

```
src/
├── routes/           # File-based routes (thin wrappers)
│   ├── _authenticated/   # Protected pages
│   ├── (auth)/           # Auth pages (sign-in, sign-up, etc.)
│   └── (errors)/         # Error pages
├── features/         # Feature modules (main application logic)
├── components/
│   ├── ui/           # shadcn/ui primitives
│   ├── layout/       # App shell and sidebar
│   └── data-table/   # Reusable table building blocks
├── context/          # Theme, font, direction, layout providers
├── stores/           # Zustand stores
├── hooks/            # Shared hooks
├── lib/              # Utilities (cn, cookies, error handling)
└── styles/           # Tailwind + CSS theme tokens
```

Each feature in `src/features/<name>/` is self-contained with its own `index.tsx`, `components/`, and `data/` (Zod schemas, mock data).

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Type-check + production build
npm run preview          # Preview production build
npm run lint             # ESLint
npm run format           # Prettier (write)
npm run format:check     # Prettier (check)
npm run knip             # Detect unused exports/files
npm run test             # Run tests (headless)
npm run test:watch       # Run tests (watch mode)
npm run test:coverage    # Coverage report
```

## Adding a New Feature

1. Create `src/features/<name>/` with `index.tsx`, `components/`, and `data/schema.ts`
2. Add a route file in `src/routes/_authenticated/<name>/index.tsx`
3. TanStack Router auto-regenerates `src/routeTree.gen.ts` on next dev/build
4. Add a sidebar entry in `src/components/layout/data/sidebar-data.ts`

## Customization

### Theme

Edit `src/styles/theme.css` to adjust colors, radius, shadows, and fonts. All values use CSS custom properties (OKLCH color space) and are automatically applied to both light and dark modes.

### Fonts

Add a font in three steps:

1. Add the font name to `src/config/fonts.ts`
2. Add a `<link>` in `index.html` (Google Fonts or similar)
3. Add the CSS variable in `src/styles/index.css` under `@theme inline`

### shadcn/ui Components

Add new primitives via the shadcn CLI:

```bash
npx shadcn@latest add <component>
```

Components are added to `src/components/ui/`.

## Code Style

- **Path alias** — use `@/` for all imports (`@/components/ui/button`, not `../../components/ui/button`)
- **Formatting** — Prettier with single quotes, no semicolons, 2-space indent
- **Imports** — auto-sorted by Prettier; don't manually reorder
- **Naming** — files and folders in `kebab-case`, components as `PascalCase` exports
- **Tests** — co-located as `*.test.ts(x)` next to the file under test

## License

MIT
