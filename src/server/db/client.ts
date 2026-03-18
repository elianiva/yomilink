import * as SqliteDrizzle from "@effect/sql-drizzle/Sqlite";
import { LibsqlClient } from "@effect/sql-libsql";
import { Config, ConfigProvider, Effect, Layer } from "effect";
import { ServerConfig } from "@/config";

// Remote Turso/LibSQL (production)
const SqlRemote = Layer.unwrapEffect(
    Effect.gen(function* () {
        const config = yield* ServerConfig;
        return LibsqlClient.layer({
            url: config.databaseUrl,
            authToken: config.dbAuthToken,
        });
    }),
);

// Local file-based SQLite (Docker/self-hosted)
const SqlLocal = Layer.unwrapEffect(
    Effect.gen(function* () {
        const databaseUrl = yield* Config.string("TURSO_DATABASE_URL");
        // Extract path from file: URL or use as-is for local paths
        const dbPath = databaseUrl.startsWith("file:")
            ? databaseUrl.slice(5) // Remove "file:" prefix
            : databaseUrl;
        return LibsqlClient.layer({ url: dbPath });
    }).pipe(Effect.withConfigProvider(ConfigProvider.fromEnv())),
);

// In-memory SQLite (tests)
const SqlTest = LibsqlClient.layer({
    url: "file::memory:?cache=shared",
});

// Select layer based on DATABASE_MODE env var
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
        return SqlRemote;
    }),
);

const DrizzleLive = SqliteDrizzle.layer.pipe(Layer.provide(SqlLive));
const DrizzleTest = SqliteDrizzle.layer.pipe(Layer.provide(SqlTest));

// Combined layers for different environments
export const DatabaseLive = Layer.mergeAll(SqlLive, DrizzleLive);
export const DatabaseTest = Layer.mergeAll(SqlTest, DrizzleTest);

// re-export for convenience when switching db
export const Database = SqliteDrizzle.SqliteDrizzle;
