import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite";
import { LibsqlClient } from "@effect/sql-libsql";
import { Config, ConfigProvider, Effect, Layer } from "effect";

import { ServerConfig } from "@/config";

const SqlRemote = Layer.unwrapEffect(
	Effect.gen(function* () {
		const config = yield* ServerConfig;
		return LibsqlClient.layer({
			url: config.databaseUrl,
			authToken: config.dbAuthToken,
			concurrency: 10,
		});
	}),
);

const SqlLocal = Layer.unwrapEffect(
	Effect.gen(function* () {
		const databaseUrl = yield* Config.string("TURSO_DATABASE_URL");
		const dbPath = databaseUrl.startsWith("file:") ? databaseUrl.slice(5) : databaseUrl;
		return LibsqlClient.layer({ url: dbPath });
	}).pipe(Effect.withConfigProvider(ConfigProvider.fromEnv())),
);

const SqlTest = LibsqlClient.layer({
	url: "file:test.db",
});

const SqlLive = Layer.unwrapEffect(
	Effect.gen(function* () {
		const mode = yield* Config.string("DATABASE_MODE").pipe(
			Effect.orElseSucceed(() => "remote"),
			Effect.withConfigProvider(ConfigProvider.fromEnv()),
		);
		if (mode === "local") {
			yield* Effect.log("Using local SQLite database");
			return SqlLocal;
		}
		yield* Effect.log("Using remote Turso database");
		// Libsql client handles connection internally, no layer-level retry needed
		return SqlRemote;
	}),
);

const DrizzleLive = SqliteDrizzle.layer.pipe(Layer.provide(SqlLive));
const DrizzleTest = SqliteDrizzle.layer.pipe(Layer.provide(SqlTest));

export const DatabaseLive = Layer.mergeAll(SqlLive, DrizzleLive);
export const DatabaseTest = Layer.mergeAll(SqlTest, DrizzleTest);

export const Database = SqliteDrizzle.SqliteDrizzle;
