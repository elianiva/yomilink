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

| Role    | Sidebar                                               | Capabilities                                                              |
| ------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| student | My Assignments, My Forms                              | Take tests, build concept maps, view results, edit profile                |
| teacher | Dashboard, Assignments, Static Analyzer, Forms, Users | Create/manage goal maps, assignments, forms; view analytics; manage users |
| admin   | Same as teacher + whitelist import                    | All teacher capabilities + CSV whitelist import                           |

## Key Concepts

- **Goal Map**: The expert-created concept map representing correct understanding of the reading material
- **Kit**: The set of disconnected parts (concept nodes + connector nodes) extracted from the goal map
- **Learner Map**: The map constructed by the student using the provided kit
- **Proposition**: A single connection between two nodes (concept → connector → concept)
- **Diagnosis**: Automated comparison of learner map vs goal map to find correct, missing, and excessive propositions

## Experimental Flow

### For Students (Experiment Group)

1. **Sign Up** — 4-step registration (whitelist → personal → academic → consent)
2. **Pre-Test** — 20 MCQ baseline reading comprehension (same questions as post/delayed)
3. **Kit-Build Assignment** — Reconstruct the goal map from provided parts
4. **Post-Test** — Immediate reading comprehension test (same as pre-test)
5. **TAM Questionnaire** — 10-item Technology Acceptance Model (Likert 1-5)
6. **Feedback Questionnaire** — 3 open-ended questions about the experience
7. **Delayed Test** — Retention test after one week (same as pre/post-test)

### For Students (Control Group)

1. **Sign Up** — Same 4-step registration
2. **Pre-Test** — Same 20 MCQ baseline
3. **Summarizing Task** — Traditional summary writing instead of Kit-Build
4. **Post-Test** — Same reading comprehension test
5. **Delayed Test** — Same retention test

### Scoring

```
Score = (Matching Propositions / Total Goal Map Propositions) × 100%
```

- Matching links count toward score
- Missing/excessive links are reported but do not penalize

### Retention Decay

```
Immediate Index  = PostTest / MaxScore
Delayed Index    = DelayedTest / MaxScore
Retention Decay  = (Immediate - Delayed) / Immediate × 100%
```

## Documentation

| File                                  | Description                                                                |
| ------------------------------------- | -------------------------------------------------------------------------- |
| [Getting Started](getting-started.md) | Setup, installation, demo credentials, commands                            |
| [Architecture](architecture.md)       | Stack, patterns, routing, auth, database                                   |
| [Student Guide](student-guide.md)     | Full student flow: signup, assignments, forms, kit-build, profile          |
| [Teacher Guide](teacher-guide.md)     | Full teacher flow: dashboard, topics, assignments, forms, users, analytics |
| [Methodology](methodology.md)         | Scoring formulas, Bloom's taxonomy, TAM, retention decay                   |
