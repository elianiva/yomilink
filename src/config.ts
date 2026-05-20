import { Config, ConfigProvider, Effect } from "effect";

const env = (
	typeof process !== "undefined" && process.env
		? process.env
		: typeof import.meta !== "undefined" && import.meta.env
			? import.meta.env
			: {}
) as Record<string, string>;

export const ClientConfig = Config.all({}).pipe(
	Effect.withConfigProvider(ConfigProvider.fromJson(env).pipe(ConfigProvider.nested("VITE_"))),
);

export const ServerConfig = Config.all({
	siteUrl: Config.string("SITE_URL"),
	databaseUrl: Config.string("TURSO_DATABASE_URL"),
	dbAuthToken: Config.redacted("TURSO_AUTH_TOKEN"),
	authSecret: Config.redacted("BETTER_AUTH_SECRET"),
	authUrl: Config.string("BETTER_AUTH_URL"),
}).pipe(Effect.withConfigProvider(ConfigProvider.fromJson(env)));
