# Yomilink

A modern educational assessment platform combining KitBuild concept mapping with customizable questionnaires for comprehensive student understanding evaluation.

## Overview

Yomilink enables teachers to create diverse learning assessments and students to demonstrate their understanding through interactive activities. The platform supports two main assessment modalities:

1. **KitBuild Concept Mapping** - Students reconstruct expert concept maps from disassembled components
2. **Form-based Assessments** - Customizable questionnaires with MCQ, text, and Likert scale questions

## Features

### For Teachers

- **Concept Map Editor**: Create expert concept maps with bi-directional and multi-link support
- **Kit Generation**: Auto-generate assignment kits with configurable layouts from goal maps
- **Form Builder**: Design questionnaires with multiple question types (MCQ, text, Likert scale)
- **Assignment Management**: Distribute activities with time limits and deadlines
- **Automated Diagnosis**: Compare learner maps against expert maps with detailed analysis
- **Analytics Dashboard**: Track student progress and performance metrics
- **Feedback System**: Provide personalized feedback with visibility controls

### For Students

- **Interactive Map Reconstruction**: Drag-and-drop interface for building concept maps from kits
- **Form Taking**: Complete questionnaires with various question types
- **Progress Tracking**: View immediate diagnostic feedback and attempt history
- **Assignment Access**: Centralized view of all assigned activities

## KitBuild Methodology

KitBuild is a pedagogical approach where students reconstruct concept maps from pre-defined components:

1. Teacher creates a **Goal Map** (expert concept map)
2. System generates a **Kit** with disassembled concepts and links
3. Students receive the kit and **reconstruct** the map
4. System performs **automatic diagnosis** by comparing with the expert map
5. **Feedback** is generated based on structural accuracy

This approach reduces cognitive load by focusing on structure rather than terminology, enabling precise assessment of understanding.

## Tech Stack

### Frontend

- **Framework**: TanStack Start (React 19 with SSR)
- **Routing**: TanStack Router (file-based)
- **State**: TanStack Query + Jotai atoms
- **UI**: shadcn/ui + Radix UI primitives + Tailwind CSS 4
- **Graphs**: @xyflow/react (React Flow)
- **Forms**: TanStack Form
- **Auth**: Better Auth

### Backend

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript (strict mode)
- **HTTP/Tele**: Effect-TS with OpenTelemetry
- **ORM**: Drizzle ORM with LibSQL/Turso
- **Storage**: Cloudflare R2 for images
- **Observability**: Sentry

### Development

- **Package Manager**: pnpm (managed by Vite+)
- **Toolchain**: Vite+ (`vp` CLI)
- **Lint/Format**: oxlint + oxfmt
- **Testing**: Vitest + Testing Library + jsdom
- **Build**: Vite

## Quick Start

```bash
# Install dependencies
vp install

# Configure environment
cp .env.example .env
# Edit .env with your Turso and Cloudflare credentials

# Push database schema
npx drizzle-kit push

# Seed sample data (optional)
vp run db:seed

# Start dev server
vp dev
```

Visit http://localhost:5173

Seed data creates:

- `admin@yomilink.local` / `admin123`
- `teacher@yomilink.local` / `teacher123`
- `student@yomilink.local` / `student123`

## Available Scripts

| Command                             | Description                    |
| ----------------------------------- | ------------------------------ |
| `vp dev`                            | Start development server       |
| `vp build`                          | Build for production           |
| `vp run deploy`                     | Deploy to Cloudflare Workers   |
| `vp test`                           | Run all tests                  |
| `vp test --watch`                   | Run tests in watch mode        |
| `vp test --coverage`                | Generate coverage report       |
| `vp lint`                           | Run linter with auto-fix       |
| `vp fmt`                            | Format code                    |
| `vp run typecheck`                  | Run TypeScript checking        |
| `vp run db:seed`                    | Seed database with sample data |
| `npx shadcn@canary add <component>` | Add shadcn/ui component        |

## Project Structure

```
src/
├── components/          # Reusable UI components
├── features/           # Feature modules
│   ├── analyzer/       # Map comparison and diagnosis
│   ├── assignment/     # Assignment management
│   ├── form/           # Form taking and components
│   ├── form-builder/   # Form creation interface
│   ├── goal-map/       # Concept map editor (teachers)
│   ├── kit/            # Kit generation logic
│   ├── kitbuild/       # Student kit interface
│   ├── learner-map/    # Student map submissions
│   └── profile/        # User profile management
├── hooks/              # Custom React hooks
├── lib/                # Utilities
├── routes/             # TanStack Router file-based routes
└── server/             # Server-side code
    ├── db/             # Drizzle schema and client
    ├── rpc/            # Feature RPC handlers
    └── telemetry.ts    # OpenTelemetry config
```

## Docker Deployment

The Docker setup uses **Nitro** with `node-server` preset running on Node.js runtime. This provides a self-contained container that can use either local SQLite or Turso.

### Quick Start

```bash
# Build the image (automatically uses Node/Nitro target)
docker build -t yomilink .

# Run with local SQLite (self-contained)
docker run -p 3000:3000 \
  -e DATABASE_MODE=local \
  -e TURSO_DATABASE_URL=file:/app/data/yomilink.sqlite \
  -e BETTER_AUTH_SECRET=your-secret-key-min-32-characters \
  -v $(pwd)/data:/app/data \
  yomilink

# Run with Turso (cloud database)
docker run -p 3000:3000 \
  -e DATABASE_MODE=remote \
  -e TURSO_DATABASE_URL=libsql://your-db.turso.io \
  -e TURSO_AUTH_TOKEN=your-token \
  -e BETTER_AUTH_SECRET=your-secret-key \
  yomilink
```

### Docker Compose

Use docker-compose for easier local development:

```bash
# Create environment file
cp .env.example .env.docker

# Run with local SQLite
docker-compose up

# Run database migrations (if needed)
docker-compose --profile migrate run --rm migrate
```

### Build Configuration

The Docker build uses `BUILD_TARGET=node` which configures:

- **Vite**: Uses Nitro plugin with `node-server` preset instead of Cloudflare
- **Runtime**: Node.js
- **Output**: `.output/server/index.mjs` (Nitro standard)

| Build Target | Use Case                  | Command                      |
| ------------ | ------------------------- | ---------------------------- |
| `cloudflare` | Edge deployment (default) | `vp build`                   |
| `node`       | Container deployment      | `BUILD_TARGET=node vp build` |

## Local SQLite (Self-Hosted)

To use a local SQLite file instead of Turso:

1. Set `DATABASE_MODE=local` in your environment
2. Set `TURSO_DATABASE_URL=file:./data/yomilink.sqlite` (or any path)
3. Run migrations: `DATABASE_MODE=local npx drizzle-kit migrate`

This is useful for:

- Local development without Turso credentials
- Self-hosted deployments
- Offline-first environments
- Testing and CI/CD

### Database Mode Configuration

| Mode   | `DATABASE_MODE`    | `TURSO_DATABASE_URL` | Description               |
| ------ | ------------------ | -------------------- | ------------------------- |
| Remote | `remote` (default) | `libsql://...`       | Uses Turso cloud database |
| Local  | `local`            | `file:./path/to/db`  | Uses local SQLite file    |

## CI/CD

GitHub Actions workflows are configured for:

- **CI** (`.github/workflows/ci.yml`): Runs lint, format check, and typecheck on push/PR
- **Docker** (`.github/workflows/docker.yml`): Builds and pushes Docker images to GitHub Container Registry

## License

See [LICENSE](./LICENSE)
ENSE)
LICENSE)
E)
NSE)
E)
Container Registry

## License

See [LICENSE](./LICENSE)
ENSE)
LICENSE)
E)
