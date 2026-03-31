import { Config, ConfigProvider, Effect } from "effect";

// Log initial state for debugging
console.log("[CONFIG] Initializing env, process.env available:", typeof process !== "undefined" && !!process.env);
console.log("[CONFIG] import.meta.env available:", typeof import.meta.env !== "undefined");

let env: Record<string, string | undefined> = (process.env ?? import.meta.env) as Record<string, string | undefined>;
console.log("[CONFIG] Initial env keys:", Object.keys(env || {}).slice(0, 10));

async function initEnv() {
	try {
		const cloudflare = await import("cloudflare:workers") as unknown as { env?: Record<string, string | undefined> };
		const cfEnv = cloudflare?.env;
		console.log("[CONFIG] cloudflare:workers module loaded:", !!cloudflare);
		console.log("[CONFIG] cfEnv available:", !!cfEnv);
		if (cfEnv) {
			env = cfEnv;
			console.log("[CONFIG] Switched to Cloudflare env, keys:", Object.keys(cfEnv).slice(0, 10));
		}
	} catch (err) {
		console.log("[CONFIG] Not in Cloudflare Workers runtime, using process.env:", err instanceof Error ? err.message : String(err));
	}
}

await initEnv();
console.log("[CONFIG] Final env keys:", Object.keys(env || {}).slice(0, 10));

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
