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
- **Package Manager**: Bun
- **Lint/Format**: oxlint + oxfmt
- **Testing**: Vitest + Testing Library + jsdom
- **Build**: Vite

## Quick Start

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your Turso and Cloudflare credentials

# Push database schema
bunx drizzle-kit push

# Seed sample data (optional)
bun run seed

# Start dev server
bun run dev
```

Visit http://localhost:5173

Seed data creates:
- `admin@yomilink.local` / `admin123`
- `teacher@yomilink.local` / `teacher123`
- `student@yomilink.local` / `student123`

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run deploy` | Deploy to Cloudflare Workers |
| `bun run test` | Run all tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run coverage` | Generate coverage report |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code |
| `bun run typecheck` | Run TypeScript checking |
| `bun run seed` | Seed database with sample data |
| `bun ui add <component>` | Add shadcn/ui component |

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

## License

See [LICENSE](./LICENSE)
