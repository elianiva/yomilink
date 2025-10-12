// scripts/seed.ts
// Usage:
//   tsx --env-file=.env.local scripts/seed.ts
//   tsx --env-file=.env.local scripts/seed.ts ./seed-users.json
//
// Calls a Convex mutation directly (no HTTP action route).

import { readFile } from "node:fs/promises";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

type SeedUser = {
  email: string;
  password: string;
  name?: string;
  roles?: ("admin" | "teacher" | "student")[];
};

type SeedResult =
  | { email: string; created: true; userId: string }
  | { email: string; created: false; error: string };

const BASE_URL =
  process.env.VITE_CONVEX_URL ||
  process.env.CONVEX_SITE_URL ||
  process.env.CONVEX_URL;

if (!BASE_URL) {
  console.error(
    "Missing Convex URL. Set VITE_CONVEX_URL or CONVEX_SITE_URL in .env.local",
  );
  process.exit(1);
}

const SEED_SECRET = process.env.SEED_SECRET;

// Default users if no file provided
const DEFAULT_USERS: SeedUser[] = [
  {
    email: "admin@yomilink.local",
    password: "admin123",
    name: "Admin",
    roles: ["admin"],
  },
  {
    email: "teacher@yomilink.local",
    password: "teacher123",
    name: "Teacher One",
    roles: ["teacher"],
  },
  {
    email: "student@yomilink.local",
    password: "student123",
    name: "Student One",
    roles: ["student"],
  },
];

async function loadUsersFromArg(): Promise<SeedUser[] | null> {
  const fileArg = process.argv[2];
  if (!fileArg) return null;
  try {
    const raw = await readFile(fileArg, "utf8");
    const json = JSON.parse(raw);
    if (!Array.isArray(json)) {
      throw new Error("Expected an array of users");
    }
    return json as SeedUser[];
  } catch (err) {
    console.error(`Failed to read seed file "${fileArg}":`, err);
    process.exit(1);
  }
}

async function main() {
  const users = (await loadUsersFromArg()) ?? DEFAULT_USERS;

  try {
    const client = new ConvexHttpClient(BASE_URL!);
    const data = (await client.mutation(api.seed.seedUsers, {
      key: SEED_SECRET,
      users,
    })) as {
      ok: boolean;
      results: SeedResult[];
    };

    if (!data.ok) {
      console.error("Seeding did not complete successfully:", data);
      process.exit(1);
    }

    // Pretty print results
    const created = data.results.filter((r) => r.created) as Extract<
      SeedResult,
      { created: true }
    >[];
    const failed = data.results.filter((r) => !r.created) as Extract<
      SeedResult,
      { created: false }
    >[];

    console.log("Seed completed.");
    console.log(
      `Created: ${created.length}, Failed: ${failed.length}, Total: ${data.results.length}`,
    );

    if (created.length) {
      console.log("Created users:");
      for (const c of created) {
        console.log(` - ${c.email} (userId: ${c.userId})`);
      }
    }
    if (failed.length) {
      console.log("Failed users:");
      for (const f of failed) {
        console.log(` - ${f.email}: ${f.error}`);
      }
    }
  } catch (e) {
    console.error("Seed mutation failed:", e);
    process.exit(1);
  }
}

void main();
