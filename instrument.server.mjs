import * as Sentry from "@sentry/tanstackstart-react";

// Cloudflare Workers uses global env vars, not process.env
const env = globalThis.process?.env || globalThis;

Sentry.init({
	dsn: env.NODE_ENV !== "production" ? undefined : env.SENTRY_DSN,
	sendDefaultPii: true,
	spotlight: env.NODE_ENV !== "production",
	tracesSampleRate: env.NODE_ENV !== "production" ? 1.0 : 0.1,
	profilesSampleRate: env.NODE_ENV !== "production" ? 1.0 : 0.1,
	beforeSend(event) {
		// Filter out health check requests
		if (event.request?.url?.includes("/health")) {
			return null;
		}
		// Redact sensitive headers
		if (event.request?.headers) {
			const headers = event.request.headers;
			delete headers["authorization"];
			delete headers["cookie"];
			delete headers["x-auth-token"];
		}
		return event;
	},
	beforeSendTransaction(event) {
		// Filter out health check transactions
		if (event.contexts?.trace?.data?.url?.includes("/health")) {
			return null;
		}
		return event;
	},
	integrations: [
		Sentry.spotlightIntegration(),
		Sentry.captureConsoleIntegration({
			levels: ["log", "info", "warn", "error", "debug"],
		}),
		Sentry.httpIntegration(),
	],
});
