# Yomilink

A modern reimplementation of the **KitBuild Concept Map** system for educational research. This was made as part of my bachelor thesis.

---

## What is Yomilink?

Yomilink is a modern, researcher-friendly rebuild of the [KitBuild Concept Map](https://collab.kit-build.net/) platform originally developed by the [Learning Engineering Laboratory at Hiroshima University](https://lel.main.jp/kb/).

The original KitBuild system (operational since 2009) pioneered automatic diagnosis of concept maps for formative assessment. Yomilink aims to:

- Provide a cleaner, more accessible interface for researchers and educators. Everything is managed in a single place: pre-test, post-test, delayed-test, questionnaires, so there's no need for an external platform like google forms needed anymore.
- Run on modern web infrastructure. The system is deployed on Cloudflare Workers and uses Turso as the database. This makes it easy for anyone to deploy without needing to have a VPS.

All core assessment methods like automatic map diagnosis, kit generation algorithms, and feedback frameworks come directly from the original KitBuild research. Yomilink **does not** introduce new pedagogical approaches; it reimplements the proven ones in a more maintainable, extensible form. All credits belongs to the original researchers.

---

## About KitBuild

KitBuild is a pedagogical approach developed by Tsukasa Hirashima and colleagues at Hiroshima University. The original system has been used across 1700+ institutions worldwide for:

- Automatic diagnosis of student understanding through concept map reconstruction
- Formative assessment in large classroom settings
- Visualizing gaps between instructor expectations and student comprehension

### Original System

- Live System: [collab.kit-build.net](https://collab.kit-build.net/)
- Homepage: [lel.main.jp/kb](https://lel.main.jp/kb)

### Foundational Research

The KitBuild methodology is backed by extensive peer-reviewed research:

| Paper | Authors | Year |
|-------|---------|------|
| [Framework of Kit-Build Concept Map for Automatic Diagnosis](https://telrp.springeropen.com/articles/10.1186/s41039-015-0018-9) | Hirashima et al. | 2015 |
| [The Practical Use of Kit-Build Concept Map on Formative Assessment](https://telrp.springeropen.com/articles/10.1186/s41039-017-0060-x) | Pailai et al. | 2017 |
| [Collaborative Concept Mapping with Reciprocal Kit-Build](https://link.springer.com/article/10.1186/s41039-020-00136-6) | Hayashi & Hirashima | 2020 |
| [Evaluating the Kit-Build Process Using Sub-Map Scoring](https://rptel.apsce.net/index.php/RPTEL/article/view/2024-19021) | Rismanto et al. | 2024 |

---

## How It Works

The KitBuild method follows a 4-step cycle:

1. Goal Map: Instructor creates an expert concept map showing correct relationships
2. Kit Generation: System disassembles the goal map into components (concepts + links)
3. Reconstruction: Students rebuild the map from the kit, demonstrating their understanding
4. Automatic Diagnosis: System compares student maps against the goal map and identifies misconceptions

This approach reduces cognitive load on students (no need to invent terminology) while giving instructors precise, actionable data about understanding gaps.

---

## Features

Yomilink reimplements the core KitBuild workflow with modern tooling:

| Feature | Description |
|---------|-------------|
| Concept Map Editor | Visual editor for creating goal maps with bi-directional/multi-link support |
| Automatic Kit Generation | Disassembles goal maps into student-ready activity kits |
| Map Diagnosis | Automatic comparison of learner maps against goal maps |
| Extended Assessments | Quiz builder for MCQ, text, and Likert-scale questions (research extension) |
| Assignment Management | Deadlines, time limits, access controls |
| Research Dashboard | Analytics and exportable data for research analysis |
| Feedback System | Targeted feedback based on diagnosis results |

---

## Quick Start (Development)

```bash
# Install dependencies
vp install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Push database schema
vpx drizzle-kit push

# Start development server
vp dev
```

Visit http://localhost:5173

This project is using these tech stack, so check their respective documentations for further information:
- [Tanstack Start](https://tanstack.com/start/latest)
- [Vite+](https://viteplus.dev)
- [Drizzle](https://orm.drizzle.team/)
- [TailwindCSS](https://tailwindcss.com/)
- [Effect](https://effect.website)

---

## Deploying to Cloudflare Workers

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Turso database](https://turso.tech) (SQLite at the edge)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) authenticated

### 1. Create Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login

# Create database
turso db create yomilink

# Get connection details
turso db show yomilink --url
turso db tokens create yomilink
```

### 2. Configure Environment

Create `.env`:

```bash
DATABASE_MODE=remote
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-turso-token
BETTER_AUTH_SECRET=your-random-secret-min-32-chars
BETTER_AUTH_URL=https://your-domain.com
SITE_URL=https://your-domain.com
VITE_SENTRY_DSN=https://your-sentry-dsn  # optional
```

### 3. Configure Wrangler

Edit `wrangler.json`:

```json
{
  "name": "yomilink",
  "compatibility_date": "2025-09-02",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry",
  "r2_buckets": [
    {
      "binding": "MATERIAL_IMAGES",
      "bucket_name": "yomilink-materials"
    }
  ]
}
```

### 4. Create R2 Bucket & Deploy

```bash
# Create storage bucket
wrangler r2 bucket create yomilink-materials

# Push database schema
export DATABASE_MODE=remote
export TURSO_DATABASE_URL=libsql://your-db.turso.io
export TURSO_AUTH_TOKEN=your-turso-token
vpx drizzle-kit push

# Deploy
vp run deploy
```

### Environment Reference

| Variable | Type | Purpose |
|----------|------|---------|
| `DATABASE_MODE` | env | `remote` (Turso) or `local` (SQLite file) |
| `TURSO_DATABASE_URL` | env | Database connection string |
| `TURSO_AUTH_TOKEN` | secret | Turso authentication |
| `BETTER_AUTH_SECRET` | secret | Session signing key (32+ chars) |
| `BETTER_AUTH_URL` | env | Auth callback URL |
| `SITE_URL` | env | Canonical site URL |
| `MATERIAL_IMAGES` | R2 binding | Image storage bucket |

---

## Attribution

- Original research and algorithms: Tsukasa Hirashima and colleagues
- Original system: [collab.kit-build.net](https://collab.kit-build.net/)

If you use Yomilink for research, please cite the original KitBuild papers to acknowledge the foundational work.

## License

See [LICENSE](./LICENSE)
