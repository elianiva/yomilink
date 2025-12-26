import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { Context, Effect, Layer, Redacted } from "effect";
import { ServerConfig } from "@/config";

export type Db = LibSQLDatabase<Record<string, never>>;

export class Database extends Context.Tag("Database")<Database, Db>() {}

export const DatabaseLive = Layer.effect(
	Database,
	Effect.gen(function* () {
		const config = yield* ServerConfig;
		const client = createClient({
			url: config.databaseUrl,
			authToken: Redacted.value(config.dbAuthToken),
		});
		return drizzle({ client }) as Db;
	}),
);

export const DatabaseTest = Layer.effect(
	Database,
	Effect.sync(() => {
		const client = createClient({ url: "file::memory:?cache=shared" });
		return drizzle({ client }) as Db;
	}),
);
