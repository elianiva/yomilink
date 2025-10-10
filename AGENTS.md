# Repository Guidelines

## Project Structure & Module Organization
- `src/` houses the client app: `src/routes` is the file-based TanStack Router tree, `src/components` contains reusable UI, and `src/lib` stores shared utilities. Keep route loaders and mutations close to their route files.
- `convex/` holds Convex functions and schema definitions. `_generated/` code is auto-created—do not edit manually.
- `public/` serves static assets. Tailwind tokens and global styles live in `src/styles.css`. Config files (`vite.config.ts`, `wrangler.json`, `biome.json`) sit at the project root for quick audit.

## Build, Test, and Development Commands
- `bun install` installs dependencies; run after pulling new changes.
- `bun run dev` starts Vite on port 3000. Add `-- --host` when testing across devices.
- `bun run build` produces the optimized worker bundle; `bun run serve` previews that build locally.
- `bun run test` executes the Vitest suite in CI mode.
- `bun run lint`, `bun run format`, and `bun run check` apply Biome rules; run `bun run check` before opening a PR.
- `npx convex dev` boots the Convex backend; `bun run deploy` publishes via Wrangler once Cloudflare credentials are configured.

## Coding Style & Naming Conventions
- Biome enforces tab indentation and double quotes (`biome.json`). Avoid hand-formatting; rely on `bun run format`.
- Prefer TypeScript’s strict types, `camelCase` for variables/functions, and `PascalCase` for React components.
- Route files mirror URL segments (e.g., `src/routes/dashboard/index.tsx` → `/dashboard`). Keep shared hooks under `src/hooks`.

## Testing Guidelines
- Unit and component tests use Vitest with Testing Library. Name files `<feature>.test.ts` or `.test.tsx` beside the code they validate.
- Exercise route loaders/actions with integration-style tests that mount the relevant component.
- Aim for meaningful coverage on new features; tests should assert UI states and data contracts, not implementation details.

## Commit & Pull Request Guidelines
- Follow Conventional Commit prefixes (`feat:`, `fix:`, `chore:`). Keep subjects imperative and under 72 characters (e.g., `feat: add link analyzer route`).
- Each PR should describe scope, include screenshots or terminal output for UI/CLI changes, mention required env vars, and link any Convex/Cloudflare updates.
- Ensure CI scripts (`bun run test` and `bun run check`) pass before requesting review.

## Environment & Configuration Tips
- Populate `.env.local` with `VITE_CONVEX_URL` and `CONVEX_DEPLOYMENT`. Never commit secrets; share via your team’s secret manager.
- Update `convex/schema.ts` first when introducing new tables, then regenerate types through `npx convex dev`.
- Review `wrangler.json` before deploying to confirm the target Cloudflare environment.
