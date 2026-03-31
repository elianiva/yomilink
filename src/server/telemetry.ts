import { WebSdk } from "@effect/opentelemetry";
import { SentrySpanProcessor } from "@sentry/opentelemetry";

const resource = { serviceName: "yomilink" };

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
