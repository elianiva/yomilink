import { existsSync, unlinkSync } from "node:fs";
import type { TestProject } from "vitest/node";
import { Effect } from "effect";

import { resetDatabase, setupDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

export async function setup(project: TestProject) {
	// Delete old test.db if exists for clean slate
	const dbPath = "test.db";
	if (existsSync(dbPath)) {
		unlinkSync(dbPath);
	}

	// Setup fresh database with schema
	await Effect.runPromise(setupDatabase.pipe(Effect.provide(DatabaseTest)));
}
