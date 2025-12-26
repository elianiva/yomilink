import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite";
import { LibsqlClient } from "@effect/sql-libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Effect, Layer } from "effect";
import { ServerConfig } from "@/config";

export type Db = LibSQLDatabase<Record<string, never>>;

const SqlLive = Layer.unwrapEffect(
	Effect.gen(function* () {
		const config = yield* ServerConfig;
		return LibsqlClient.layer({
			url: config.databaseUrl,
			authToken: config.dbAuthToken,
		});
	}),
);

const SqlTest = LibsqlClient.layer({
	url: "file::memory:?cache=shared",
});

// re-export for convenience when switching db
export const Database = SqliteDrizzle.SqliteDrizzle;

const DrizzleLive = SqliteDrizzle.layer.pipe(Layer.provide(SqlLive));
const DrizzleTest = SqliteDrizzle.layer.pipe(Layer.provide(SqlTest));

export const DatabaseLive = Layer.mergeAll(SqlLive, DrizzleLive);
export const DatabaseTest = Layer.mergeAll(SqlTest, DrizzleTest);
