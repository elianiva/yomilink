import { Config, ConfigProvider, Effect } from "effect";

// these are not available on workers runtime so we can use it to check if we are on local or not
const IS_LOCAL = import.meta.env.DEV || process.env;
const env = IS_LOCAL ? process.env || import.meta.env : (await import("cloudflare:workers")).env;

export const ClientConfig = Config.all({
    sentryDsn: Config.redacted("SENTRY_DSN"),
}).pipe(
    Effect.withConfigProvider(ConfigProvider.fromJson(env).pipe(ConfigProvider.nested("VITE_"))),
);

export const ServerConfig = Config.all({
    siteUrl: Config.string("SITE_URL"),
    databaseUrl: Config.string("TURSO_DATABASE_URL"),
    dbAuthToken: Config.redacted("TURSO_AUTH_TOKEN"),
    authSecret: Config.redacted("BETTER_AUTH_SECRET"),
    authUrl: Config.string("BETTER_AUTH_URL"),
}).pipe(Effect.withConfigProvider(ConfigProvider.fromJson(env)));
