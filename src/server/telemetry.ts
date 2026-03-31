import { Layer } from "effect";

/**
 * Placeholder telemetry layer.
 *
 * TODO: Implement @sentry/cloudflare integration for server-side error tracking.
 * The previous @sentry/opentelemetry + @sentry/tanstackstart-react setup
 * used Node.js-specific APIs that don't work in Cloudflare Workers.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/cloudflare/
 */
export const ServerTelemetry = Layer.empty;
export const WebTelemetry = Layer.empty;
export const Telemetry = Layer.empty;
