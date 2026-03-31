import { Effect } from "effect";

import { setupDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

export default async function () {
	await Effect.runPromise(setupDatabase.pipe(Effect.provide(DatabaseTest)));
}
