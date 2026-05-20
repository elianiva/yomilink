import { Config, ConfigProvider, Effect, Layer, Logger } from "effect";
import * as Sentry from "@sentry/effect";

export const ServerTelemetry = Layer.unwrapEffect(
	Effect.gen(function* () {
		const sentryDsn = yield* Config.string("VITE_SENTRY_DSN").pipe(
			Effect.withConfigProvider(ConfigProvider.fromEnv()),
		);

		return Layer.mergeAll(
			Sentry.effectLayer({
				dsn: sentryDsn,
				tracesSampleRate: 0.1,
				enableLogs: true,
			}),
			Layer.setTracer(Sentry.SentryEffectTracer),
			Logger.replace(Logger.defaultLogger, Sentry.SentryEffectLogger),
			Sentry.SentryEffectMetricsLayer,
		);
	}),
);

export const WebTelemetry = Layer.empty;

export const Telemetry = Layer.empty;
