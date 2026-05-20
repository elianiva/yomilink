import { Config } from "effect";

export const ServerConfig = Config.all({
	siteUrl: Config.string("SITE_URL"),
	databaseUrl: Config.string("TURSO_DATABASE_URL"),
	dbAuthToken: Config.redacted("TURSO_AUTH_TOKEN"),
	authSecret: Config.redacted("BETTER_AUTH_SECRET"),
	authUrl: Config.string("BETTER_AUTH_URL"),
});
