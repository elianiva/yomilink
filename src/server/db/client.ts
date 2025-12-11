import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { Effect, Redacted } from "effect";
import { ServerConfig } from "@/config";

export class Database extends Effect.Service<Database>()("Database", {
	effect: Effect.gen(function* () {
		const config = yield* ServerConfig;
		const client = createClient({
			url: config.databaseUrl,
			authToken: Redacted.value(config.dbAuthToken),
		});
		return drizzle({ client });
	}),
}) {}
