# Yomilink

A modern educational concept mapping platform designed to assess student understanding through structured learning activities using the KitBuild methodology.

## Overview

Yomilink enables teachers to create and distribute concept mapping assignments, and students to demonstrate their understanding by reconstructing expert concept maps from disassembled concept and link components. The platform provides automated diagnosis and scoring to help educators identify learning gaps and provide targeted feedback.

## KitBuild Methodology

KitBuild is a pedagogical approach where students reconstruct concept maps from pre-defined concepts and links. Instead of creating concept maps from scratch, students receive a "kit" containing all necessary concepts (nodes) and links (edges) from an expert's map. They must arrange and connect these components correctly, which:

- Reduces cognitive load by focusing on structure rather than terminology
- Allows precise assessment of structural understanding
- Enables automated comparison with expert maps
- Provides objective scoring based on correct connections

The workflow: Expert creates goal map → System generates kit with disassembled components → Students reconstruct the map → Automatic diagnosis evaluates accuracy → Feedback generated.

## Architecture

### System Workflow

```
Teacher                        Student                    System
   |                              |                           |
   |--Create Goal Map------------>|                           |
   |--Define Assignment---------->|                           |
   |                              |                           |
   |                              |--Receive Kit------------->|
   |                              |  (disassembled concepts) |
   |                              |                           |
   |                              |--Reconstruct Map--------->|
   |                              |                           |
   |<--View Diagnosis------------<---------------------------|
   |  (score & feedback)          |                           |
```

### Component Architecture

**Frontend (TanStack Start)**
- React 19 components with server-side rendering
- TanStack Router for file-based routing with nested layouts
- TanStack Query for server state management
- Jotai for client-side atomic state
- React Flow (@xyflow/react) for interactive graph visualization

**Backend (Cloudflare Workers)**
- Server functions for API endpoints
- Effect for functional programming and error handling
- Sentry integration for error tracking and observability
- OpenTelemetry for distributed tracing

**Data Layer**
- Drizzle ORM with LibSQL/Turso for relational database
- Cloudflare R2 for material image storage
- Schema includes: users, goal maps, kits, assignments, learner maps, diagnoses, feedback

### Key Features

**For Teachers**
- Create expert concept maps with bi-directional and multi-link support
- Generate assignment kits with configurable layouts
- Define time limits and deadlines
- Assign to individual students or entire cohorts
- View automated diagnosis with per-link analysis
- Provide personalized feedback with visibility controls
- Track progress through analytics dashboards

**For Students**
- Access assigned assignments with reading materials
- Interact with intuitive graph interface
- Submit concept maps with version control (attempts)
- View immediate diagnostic feedback
- Track personal progress over time

**For Administrators**
- Manage users and cohorts
- Monitor system-wide analytics
- Configure platform settings

## Tech Stack

### Frontend
- **Framework**: TanStack Start (React 19 SSR)
- **Routing**: TanStack Router with file-based routing
- **State Management**: TanStack Query + Jotai
- **UI Components**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS 4
- **Graph Visualization**: @xyflow/react (React Flow)
- **Forms**: TanStack Form
- **Notifications**: Sonner

### Backend
- **Runtime**: Cloudflare Workers with Node.js compatibility
- **API**: Server functions via TanStack Start
- **Functional Programming**: Effect
- **ORM**: Drizzle ORM
- **Database**: LibSQL (Turso)
- **File Storage**: Cloudflare R2
- **Authentication**: Better Auth
- **Observability**: Sentry + OpenTelemetry

### Development
- **Language**: TypeScript (strict mode)
- **Package Manager**: Bun
- **Linting/Formatting**: Biome
- **Testing**: Vitest + Testing Library + jsdom
- **Build**: Vite

## Prerequisites

- Node.js 18+ and Bun
- Turso account with a database instance
- Cloudflare account with Workers and R2 bucket configured
- Sentry account (optional, for production monitoring)

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Copy the environment example file:

```bash
cp .env.example .env
```

Configure the following variables:

```bash
# Database (Turso)
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# Sentry (optional)
VITE_SENTRY_DSN=your-sentry-dsn

# Application
SITE_URL=http://localhost:5173
NODE_ENV=development

# Authentication
BETTER_AUTH_URL=http://localhost:5173
BETTER_AUTH_SECRET=generate-random-secret-here
```

### 3. Initialize Database

Run database migrations:

```bash
bunx drizzle-kit push
```

### 4. Seed Data (Optional)

Populate the database with sample users and Japanese learning materials:

```bash
bun run seed
```

This creates:
- Admin user (admin@yomilink.local / admin123)
- Teacher user (teacher@yomilink.local / teacher123)
- Student user (student@yomilink.local / student123)
- Japanese learning materials (hiragana, greetings, self-intro, etc.)

### 5. Start Development Server

```bash
bun run dev
```

The application will be available at http://localhost:5173

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run serve` | Preview production build |
| `bun run test` | Run all tests |
| `bun run test <file>` | Run specific test file |
| `bun run test:watch` | Run tests in watch mode |
| `bun run test:ui` | Run tests with vitest UI |
| `bun run coverage` | Run tests and generate coverage report |
| `bun run coverage:ui` | Run tests and open coverage UI |
| `bun run lint` | Run Biome linter with auto-fix |
| `bun run format` | Format code with Biome |
| `bun run check` | Run all Biome checks (lint + format) |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run seed` | Seed database with sample data |
| `bun ui add <component>` | Add shadcn/ui component |

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication guards
│   ├── progress/       # Route progress indicators
│   ├── toolbar/        # Common toolbar components
│   └── ui/             # shadcn/ui components
├── features/           # Feature-specific modules
│   ├── analyzer/       # Goal map analysis and comparison
│   ├── goal-map/       # Teacher's concept map editor
│   ├── kitbuild/       # Kit creation and student interface
│   └── learner-map/    # Student submission handling
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
├── middlewares/        # Request middlewares
├── routes/             # File-based routing
│   ├── api/            # API endpoints
│   └── dashboard/      # Main application routes
└── server/             # Server-side code
    ├── db/             # Database schema and client
    ├── rpc/            # RPC handlers for features
    └── telemetry.ts    # OpenTelemetry configuration
```

### Code Style

- **Formatter/Linter**: Biome with tab indentation and double quotes
- **Import style**: Use `@/*` path aliases for imports from src
- **React imports**: `import type * as React from "react"`
- **Utility classes**: Use `cn()` helper for conditional Tailwind classes
- **Components**: Follow shadcn/ui patterns with class-variance-authority
- **Server functions**: Wrap with Sentry.startSpan for instrumentation
- **TypeScript**: Strict mode enabled, ensure proper typing throughout

### Testing

Run the full test suite:

```bash
bun run test
```

Run a specific test file:

```bash
bun run test src/features/analyzer/lib/edge-styles.test.ts
```

Run tests in watch mode:

```bash
bun run test:watch
```

Generate coverage report:

```bash
bun run coverage
```

Open coverage UI:

```bash
bun run coverage:ui
```

Tests use Vitest with jsdom environment and Testing Library for component testing. Coverage is powered by @vitest/coverage-v8.

## Deployment

### 1. Build Application

```bash
bun run build
```

### 2. Configure Cloudflare R2

Create an R2 bucket named `yomilink-materials` for storing material images. The bucket configuration is already defined in `wrangler.json`.

### 3. Deploy to Cloudflare Workers

```bash
bun run deploy
```

This uses Wrangler to deploy the application. Ensure your environment variables are configured in Cloudflare Workers dashboard or via Wrangler secrets.

## License

See [LICENSE](./LICENSE)
