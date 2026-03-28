import { WebSdk } from "@effect/opentelemetry";
import { SentrySpanProcessor } from "@sentry/opentelemetry";
import * as Sentry from "@sentry/tanstackstart-react";

const resource = { serviceName: "yomilink" };

// Initialize Sentry for Cloudflare Workers environment
const env = globalThis.process?.env || (globalThis as unknown as Record<string, string>);

Sentry.init({
	dsn: env.SENTRY_DSN,
	sendDefaultPii: true,
	tracesSampleRate: 1.0,
	profilesSampleRate: 1.0,
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
		Sentry.captureConsoleIntegration({
			levels: ["log", "info", "warn", "error", "debug"],
		}),
		Sentry.httpIntegration(),
	],
});

/**
 * Effect OpenTelemetry layer for Cloudflare Workers environment.
 * Uses WebSdk since Workers runs in a V8 isolate (similar to browser).
 * Uses SentrySpanProcessor to send spans to Sentry.
 */
const SentryTelemetry = WebSdk.layer(() => ({
	resource,
	spanProcessor: new SentrySpanProcessor(),
}));

/**
 * Server-side telemetry layer for Cloudflare Workers.
 * Provide this in server entry points along with LoggerLive.
 *
 * @example
 * ```ts
 * Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive, ServerTelemetry))
 * ```
 */
export const ServerTelemetry = SentryTelemetry;

/**
 * Web/browser telemetry layer - used for client-side Effect programs.
 */
export const WebTelemetry = SentryTelemetry;

/**
 * Unified telemetry layer - Cloudflare Workers uses WebSdk for both environments.
 */
export const Telemetry = SentryTelemetry;
