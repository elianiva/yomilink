import * as Sentry from "@sentry/tanstackstart-react";
import { Cause, HashMap, Logger, LogLevel } from "effect";

/**
 * Sentry logger that captures error-level logs as Sentry events.
 * Only processes Error and Fatal level logs.
 */
const SentryLogger = Logger.make<unknown, void>(({ logLevel, message, cause, annotations }) => {
	// Only capture errors and above
	if (!LogLevel.greaterThanEqual(logLevel, LogLevel.Error)) {
		return;
	}

	// Convert annotations HashMap to plain object for Sentry tags
	const tags: Record<string, string> = {};
	HashMap.forEach(annotations, (value, key) => {
		tags[key] = String(value);
	});

	// Pattern match on the cause to handle defects, failures, or empty
	Cause.match(cause, {
		onEmpty: () =>
			Sentry.captureMessage(String(message), {
				level: logLevel === LogLevel.Fatal ? "fatal" : "error",
				tags,
			}),
		onDie: (defect) => {
			Sentry.captureException(defect, {
				level: logLevel === LogLevel.Fatal ? "fatal" : "error",
				tags,
				extra: { message: String(message) },
			});
			return undefined;
		},
		onInterrupt: () => {
			Sentry.captureMessage("Fiber interrupted", {
				level: logLevel === LogLevel.Fatal ? "fatal" : "error",
				tags,
				extra: { message: String(message) },
			});
			return undefined;
		},
		onFail: (typedError) => {
			// Extract underlying error if present (e.g., SqlError.cause = DrizzleQueryError)
			const exceptionToCapture =
				typeof typedError === "object" &&
				typedError !== null &&
				"cause" in typedError &&
				typedError.cause instanceof Error
					? typedError.cause
					: typedError;
			Sentry.captureException(exceptionToCapture, {
				level: logLevel === LogLevel.Fatal ? "fatal" : "error",
				tags,
				extra: {
					message: String(message),
					...(typeof typedError === "object" && typedError !== null
						? { originalError: JSON.stringify(typedError) }
						: {}),
				},
			});
			return undefined;
		},
		onSequential: (left, right) => {
			Sentry.captureMessage(`Sequential errors: ${String(message)}`, {
				level: logLevel === LogLevel.Fatal ? "fatal" : "error",
				tags,
				extra: { left, right },
			});
			return undefined;
		},
		onParallel: (left, right) => {
			Sentry.captureMessage(`Parallel errors: ${String(message)}`, {
				level: logLevel === LogLevel.Fatal ? "fatal" : "error",
				tags,
				extra: { left, right },
			});
			return undefined;
		},
	});
});

export const LoggerLive = Logger.replace(Logger.defaultLogger, SentryLogger);
