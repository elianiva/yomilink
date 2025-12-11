import { NodeSdk, WebSdk } from "@effect/opentelemetry";
import {
	BatchSpanProcessor,
	ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { SentrySpanProcessor } from "@sentry/opentelemetry";

const resource = { serviceName: "yomilink" };

const DebugTelemetry = NodeSdk.layer(() => ({
	resource,
	spanProcessor: new BatchSpanProcessor(new ConsoleSpanExporter()),
}));

const DebugWebTelemetry = WebSdk.layer(() => ({
	resource,
	spanProcessor: new BatchSpanProcessor(new ConsoleSpanExporter()),
}));

const SentryTelemetry = NodeSdk.layer(() => ({
	resource,
	spanProcessor: new SentrySpanProcessor(),
}));

const SentryWebTelemetry = WebSdk.layer(() => ({
	resource,
	spanProcessor: new SentrySpanProcessor(),
}));

export const ServerTelemetry =
	process.env.NODE_ENV === "development" ? DebugTelemetry : SentryTelemetry;

export const WebTelemetry =
	import.meta.env.MODE === "development"
		? DebugWebTelemetry
		: SentryWebTelemetry;

export const Telemetry =
	typeof window !== "undefined" ? WebTelemetry : ServerTelemetry;
