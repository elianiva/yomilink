import { Config, ConfigProvider, Effect } from "effect";

let env: Record<string, string | undefined> = (process.env ?? import.meta.env) as Record<
    string,
    string | undefined
>;

async function initEnv() {
    try {
        const cloudflare = (await import("cloudflare:workers")) as unknown as {
            env?: Record<string, string | undefined>;
        };
        const cfEnv = cloudflare?.env;
        if (cfEnv) {
            env = cfEnv;
        }
    } catch (err) {
        console.log(
            "[CONFIG] Not in Cloudflare Workers runtime, using process.env:",
            err instanceof Error ? err.message : String(err),
        );
    }
}

await initEnv();

export const ClientConfig = Config.all({
    sentryDsn: Config.redacted("SENTRY_DSN"),
}).pipe(
    Effect.withConfigProvider(ConfigProvider.fromJson(env).pipe(ConfigProvider.nested("VITE_"))),
);

export const ServerConfig = Config.all({
    siteUrl: Config.string("SITE_URL"),
    databaseUrl: Config.string("TURSO_DATABASE_URL"),
    dbAuthToken: Config.redacted("TURSO_AUTH_TOKEN"),
    nodeEnv: Config.string("NODE_ENV"),
    authSecret: Config.redacted("BETTER_AUTH_SECRET"),
    authUrl: Config.string("BETTER_AUTH_URL"),
}).pipe(Effect.withConfigProvider(ConfigProvider.fromJson(env)));
