// scripts/seed.ts
// Usage:
//   tsx --env-file=.env.local scripts/seed.ts
//   tsx --env-file=.env.local scripts/seed.ts ./seed-users.json
//
// Seeds initial data directly via Drizzle (Turso libSQL)

import { readFile } from "node:fs/promises";
import { createDb } from "@/server/db/client";
import { env } from "@/env";
import { goalMaps, kits } from "@/server/db/schema";

type SeedUser = {
  email: string;
  password: string;
  name?: string;
  roles?: ("admin" | "teacher" | "student")[];
};

const DEFAULT_USERS: SeedUser[] = [
  { email: "admin@yomilink.local", password: "admin123", name: "Admin", roles: ["admin"] },
  { email: "teacher@yomilink.local", password: "teacher123", name: "Teacher One", roles: ["teacher"] },
  { email: "student@yomilink.local", password: "student123", name: "Student One", roles: ["student"] },
];

async function loadUsersFromArg(): Promise<SeedUser[] | null> {
  const fileArg = process.argv[2];
  if (!fileArg) return null;
  const raw = await readFile(fileArg, "utf8");
  const json = JSON.parse(raw);
  if (!Array.isArray(json)) throw new Error("Expected an array of users");
  return json as SeedUser[];
}

async function main() {
  const db = createDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);

  // Seed a demo goal map and kit
  const goalMapId = "demo-goalmap";
  const demoNodes = [
    { id: "t1", type: "text", position: { x: 100, y: 100 }, data: { label: "Photosynthesis" } },
    { id: "c1", type: "connector", position: { x: 300, y: 100 }, data: { label: "is" } },
    { id: "t2", type: "text", position: { x: 500, y: 100 }, data: { label: "Chemical Process" } },
  ];
  const demoEdges = [
    { id: "e1", source: "t1", target: "c1" },
    { id: "e2", source: "c1", target: "t2" },
  ];

  await db
    .insert(goalMaps)
    .values({
      id: goalMapId,
      goalMapId,
      teacherId: "seed-teacher",
      title: "Demo Goal Map",
      description: "Seeded goal map",
      nodes: JSON.stringify(demoNodes),
      edges: JSON.stringify(demoEdges),
      updatedAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: goalMaps.goalMapId,
      set: {
        title: "Demo Goal Map",
        description: "Seeded goal map",
        nodes: JSON.stringify(demoNodes),
        edges: JSON.stringify(demoEdges),
        updatedAt: Date.now(),
      },
    })
    .run();

  const conceptIds = new Set(["t1", "t2"]);
  const kitNodes = demoNodes.filter((n) => n.type === "text");
  const kitEdges = demoEdges.filter((e) => conceptIds.has(e.source) && conceptIds.has(e.target));

  await db
    .insert(kits)
    .values({
      id: goalMapId,
      goalMapId,
      createdBy: "seed-teacher",
      nodes: JSON.stringify(kitNodes),
      edges: JSON.stringify(kitEdges),
      constraints: null,
      version: 1,
      createdAt: Date.now(),
    })
    .onConflictDoUpdate({
      target: kits.goalMapId,
      set: {
        nodes: JSON.stringify(kitNodes),
        edges: JSON.stringify(kitEdges),
        updatedAt: Date.now(),
      } as any,
    })
    .run();

  // Users are Better Auth-managed; keep placeholder for future adapter seeding.
  const users = (await loadUsersFromArg()) ?? DEFAULT_USERS;
  console.log(`Loaded ${users.length} seed users (auth adapter seeding not implemented).`);

  console.log("Seed completed.");
}

void main();
