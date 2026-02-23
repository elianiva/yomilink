import { NodeSdk, WebSdk } from "@effect/opentelemetry";
import { SentrySpanProcessor } from "@sentry/opentelemetry";

const resource = { serviceName: "yomilink" };

const SentryTelemetry = NodeSdk.layer(() => ({
	resource,
	spanProcessor: new SentrySpanProcessor(),
}));

const SentryWebTelemetry = WebSdk.layer(() => ({
	resource,
	spanProcessor: new SentrySpanProcessor(),
}));

export const ServerTelemetry = SentryTelemetry;

export const WebTelemetry = SentryWebTelemetry;

export const Telemetry =
	typeof window !== "undefined" ? WebTelemetry : ServerTelemetry;
