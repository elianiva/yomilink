import * as Sentry from "@sentry/tanstackstart-react";
import { Cause, HashMap, Logger, LogLevel, Option } from "effect";

/**
 * Sentry logger that captures error-level logs as Sentry events.
 * Only processes Error and Fatal level logs.
 */
const SentryLogger = Logger.make<unknown, void>(
	({ logLevel, message, cause, annotations }) => {
		// Only capture errors and above
		if (!LogLevel.greaterThanEqual(logLevel, LogLevel.Error)) {
			return;
		}

		// Convert annotations HashMap to plain object for Sentry tags
		const tags: Record<string, string> = {};
		HashMap.forEach(annotations, (value, key) => {
			tags[key] = String(value);
		});

		// Check if cause contains an actual defect (Die = unexpected exception)
		const defect = Cause.dieOption(cause);

		if (Option.isSome(defect)) {
			// We have an actual exception - capture it
			Sentry.captureException(defect.value, {
				level: logLevel === LogLevel.Fatal ? "fatal" : "error",
				tags,
				extra: { message: String(message) },
			});
		} else {
			// Just a log message without exception - capture as message
			Sentry.captureMessage(String(message), {
				level: logLevel === LogLevel.Fatal ? "fatal" : "error",
				tags,
			});
		}
	},
);

export const LoggerLive =
	process.env.NODE_ENV === "production"
		? Logger.replace(Logger.defaultLogger, SentryLogger)
		: Logger.pretty;
