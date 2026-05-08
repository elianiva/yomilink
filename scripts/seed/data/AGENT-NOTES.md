# Agent Notes — Seeder Update

## What was extracted from images

1. **`extracted-students.ts`** — 47 real students from 2 whitelists:
   - 2A Business Administration: 27 students (Image 1)
   - 2B Business Administration: 20 students (Image 2)

2. **`material-watashi-no-uchi.md`** — New concept map material (Image 3):
   - Title: わたしのうち
   - 14 nodes, 14 edges (e1–e14)
   - Spatial location tree: home → park/library/coffee → post office/bank → supermarket → flower shop/bakery
   - Content includes furigana in parentheses

3. **`extracted-questions.ts`** — 20 new MCQs for the passage:
   - L1×5, L2×4, L3×3, L4×3, L5×2, L6×3
   - Same export shape as existing `questions.ts`

## What needs to be done

### Remove
- `material-japan-islands-cities.md`
- `whitelist-accounts.ts` seeder
- `whitelist-flow.ts` data file

### Update
- **`cohorts.ts`** — Replace "Demo Class 2025" with "2A Business Administration" and "2B Business Administration"
- **`whitelist.ts`** — Replace 20 fake entries with 47 real students from `extracted-students.ts`
- **`materials.ts`** — Update `TOPICS` and remove `GOAL_MAP_TO_MATERIAL` for Japan material
- **`questions.ts`** — Replace with contents from `extracted-questions.ts`
- **`users.ts`** — Remove `DEMO_STUDENTS` and `WHITELIST_FLOW_ACCOUNTS` refs; keep `DEFAULT_USERS` only
- **`demo-data.ts`** — Update cohort refs, goal map title, kit name, assignment title
- **`forms.ts`** — Update `buildReadingMaterialSections` to reference new material title
- **`submissions.ts`** — Update imports to use `DEMO_STUDENTS` (5 remaining demo accounts)
- **`responses.ts`** — Update score keys to use remaining demo student emails
- **`learner-maps.ts`** — Update edge IDs (e1–e14) and node references for new material
- **`index.ts`** (seeders) — Remove `whitelist-accounts` export
- **`index.ts`** (seed root) — Remove `seedWhitelistAccounts` call

### Keep
- 5 demo student accounts for test submissions (with updated material/edge IDs)
- Admin + teacher default users
- TAM / feedback forms
- Pre-test / post-test / delayed-test forms (with new questions)
