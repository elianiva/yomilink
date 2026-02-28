import "@testing-library/jest-dom/vitest";
import { Effect } from "effect";
import { beforeAll } from "vitest";

import { setupDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

beforeAll(async () => {
	await Effect.runPromise(setupDatabase.pipe(Effect.provide(DatabaseTest)));
});
