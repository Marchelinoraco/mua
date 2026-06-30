# Tech Stack

## Core

- **React 19** with TypeScript (strict)
- **Vite** as build tool and dev server
- **TanStack Router** for file-based routing (auto code-splitting, generates `src/routeTree.gen.ts` — never edit by hand)
- **TanStack Query** for server state and data fetching
- **TanStack Table** for data tables

## UI & Styling

- **Tailwind CSS v4** (configured via `@tailwindcss/vite`, no JS config; styles in `src/styles/`)
- **shadcn/ui** (new-york style, base color slate) — primitives in `src/components/ui/`
- **Radix UI** primitives, **lucide-react** icons
- `cn()` helper (`src/lib/utils.ts`) for class merging via `clsx` + `tailwind-merge`

## State, Forms & Data

- **Zustand** for client/global state (`src/stores/`)
- **React Hook Form** + **Zod** (`@hookform/resolvers/zod`) for forms and validation
- **Axios** for HTTP
- **date-fns** for date handling
- **recharts** for charts, **sonner** for toasts, **cmdk** for the command menu

## Tooling

- **ESLint** (flat config, `eslint.config.js`) + **typescript-eslint**
- **Prettier** with import sorting (`@trivago/prettier-plugin-sort-imports`) and Tailwind class sorting
- **Knip** for unused-code detection
- **Vitest** with browser mode (Playwright/Chromium) for tests

## Common Commands

```bash
npm run dev            # Start dev server
npm run build          # Type-check (tsc -b) + production build
npm run preview        # Preview production build
npm run lint           # ESLint
npm run format         # Prettier write
npm run format:check   # Prettier check
npm run knip           # Detect unused files/exports
npm run test           # Run tests headless
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

Note: tests run in a real browser via Playwright. Run `npm run test:browser:install` once to install Chromium.

## Conventions

- Path alias `@/*` maps to `src/*`. Always import via `@/...` rather than long relative paths.
- Prettier enforced: single quotes, no semicolons, 2-space indent, 80 print width, `es5` trailing commas, single-quote JSX.
- Imports are auto-sorted per the order defined in `.prettierrc` — don't fight it.
