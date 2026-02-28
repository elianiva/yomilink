import { NodeSdk, WebSdk } from "@effect/opentelemetry";
import { SentrySpanProcessor } from "@sentry/opentelemetry";

const resource = { serviceName: "yomilink" };

/**
 * Effect OpenTelemetry layer for Node.js environment.
 * Uses SentrySpanProcessor to send spans to Sentry.
 *
 * Note: This is used alongside Sentry's native SDK initialization
 * in instrument.server.mjs. The SentrySpanProcessor bridges Effect's
 * OpenTelemetry spans to Sentry's tracing system.
 */
const SentryTelemetry = NodeSdk.layer(() => ({
	resource,
	spanProcessor: new SentrySpanProcessor(),
}));

/**
 * Effect OpenTelemetry layer for Web/Browser environment.
 * Uses SentrySpanProcessor to send spans to Sentry.
 */
const SentryWebTelemetry = WebSdk.layer(() => ({
	resource,
	spanProcessor: new SentrySpanProcessor(),
}));

/**
 * Server-side telemetry layer - provide this in server entry points
 * along with LoggerLive for full observability.
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
export const WebTelemetry = SentryWebTelemetry;

/**
 * Auto-detects environment and provides appropriate telemetry layer.
 * Prefer using ServerTelemetry or WebTelemetry explicitly in production.
 */
export const Telemetry = typeof window !== "undefined" ? WebTelemetry : ServerTelemetry;
