# Getting Started

## Prerequisites

- Node.js 20+
- pnpm
- Turso database URL (or local SQLite for development)

## Installation

```bash
# Clone
git clone <repo>
cd kitbuild

# Install dependencies
pnpm install

# Environment
cp .env.example .env
# Edit .env with your database credentials

# Seed database
vp run db:seed

# Start dev server
vp dev
```

## Demo Credentials

| Role           | Email                   | Password   |
| -------------- | ----------------------- | ---------- |
| Teacher        | dicha@kitbuild.mail     | dicha12345 |
| Teacher        | banni@kitbuild.mail     | banni12345 |
| Teacher        | helmy@kitbuild.mail     | helmy12345 |
| Admin          | admin@kitbuild.mail     | admin123   |
| Student (demo) | tanaka@kitbuild.mail    | demo12345  |
| Student (demo) | suzuki@kitbuild.mail    | demo12345  |
| Student (demo) | yamamoto@kitbuild.mail  | demo12345  |
| Student (demo) | watanabe@kitbuild.mail  | demo12345  |
| Student (demo) | takahashi@kitbuild.mail | demo12345  |

## Commands

```bash
vp dev              # Development server
vp check            # Format + lint + typecheck
vp check --fix      # Auto-fix formatting/lint
vp test             # Run tests
vp test --watch     # Watch mode
vp build            # Production build
vp run deploy       # Deploy to Cloudflare
vp run db:seed      # Seed database
vp run db:reset     # Reset database
```

## Environment Variables

| Variable             | Description                | Required             |
| -------------------- | -------------------------- | -------------------- |
| `TURSO_DATABASE_URL` | Turso database URL         | Yes                  |
| `TURSO_AUTH_TOKEN`   | Turso auth token           | For remote DB        |
| `BETTER_AUTH_SECRET` | Auth encryption secret     | Yes                  |
| `BETTER_AUTH_URL`    | App URL for auth redirects | Yes                  |
| `DATABASE_MODE`      | `remote` or `local`        | No (default: remote) |
