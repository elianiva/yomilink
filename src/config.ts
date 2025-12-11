import { Config, ConfigProvider, Effect } from "effect";

const env = process.env || import.meta.env;

export const ClientConfig = Config.all({
	sentryDsn: Config.redacted("SENTRY_DSN"),
}).pipe(
	Effect.withConfigProvider(
		ConfigProvider.fromJson(env).pipe(ConfigProvider.nested("VITE_")),
	),
);

export const ServerConfig = Config.all({
	siteUrl: Config.string("SITE_URL"),
	databaseUrl: Config.string("TURSO_DATABASE_URL"),
	dbAuthToken: Config.redacted("TURSO_AUTH_TOKEN"),
	nodeEnv: Config.string("NODE_ENV"),
	authSecret: Config.redacted("BETTER_AUTH_SECRET"),
	authUrl: Config.string("BETTER_AUTH_URL"),
}).pipe(Effect.withConfigProvider(ConfigProvider.fromJson(env)));
