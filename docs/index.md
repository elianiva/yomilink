# KitBuild

> Japanese reading comprehension platform using the Kit-Build Concept Map framework.
> Live: [kb.elianiva.com](https://kb.elianiva.com)

---

## What is KitBuild?

KitBuild is a web application that implements the **Kit-Build Concept Map** framework — a close-ended concept mapping approach developed by Hirashima (2015) for automated diagnosis of learner understanding. Learners reconstruct an expert's "goal map" from provided parts (concept nodes and link nodes), and the system automatically compares their map against the goal map to identify correct, missing, and excessive propositions.

The platform is designed for **Japanese language reading comprehension** research, supporting the full experimental workflow:

```
Sign Up → Pre-Test → Reading Phase → Kit-Build → Post-Test → Delayed Test → Feedback
```

## User Roles

| Role | Sidebar | Capabilities |
|---|---|---|
| **student** | My Assignments, My Forms | Take tests, build concept maps, view results, edit profile |
| **teacher** | Dashboard, Assignments, Static Analyzer, Forms, Users | Create/manage goal maps, assignments, forms; view analytics; manage users |
| **admin** | Same as teacher + whitelist import | All teacher capabilities + CSV whitelist import |

## Key Concepts

- **Goal Map**: The expert-created concept map representing correct understanding of the reading material
- **Kit**: The set of disconnected parts (concept nodes + connector nodes) extracted from the goal map
- **Learner Map**: The map constructed by the student using the provided kit
- **Proposition**: A single connection between two nodes (concept → connector → concept)
- **Diagnosis**: Automated comparison of learner map vs goal map to find correct, missing, and excessive propositions

## Documentation

| File | Description |
|---|---|
| [Getting Started](getting-started.md) | Setup, installation, demo credentials, commands |
| [Architecture](architecture.md) | Stack, patterns, routing, auth, database |
| [Student Guide](student-guide.md) | Full student flow: login, signup, assignments, forms, kit-build, profile |
| [Teacher Guide](teacher-guide.md) | Full teacher flow: dashboard, topics, assignments, forms, users, analytics |
| [Methodology](methodology.md) | Scoring formulas, Bloom's taxonomy, TAM, retention decay |
