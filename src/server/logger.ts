import { Cause, HashMap, Logger, LogLevel } from "effect";

/**
 * Simple logger that only logs to console.
 * Sentry integration is disabled for Cloudflare Workers due to
 * @sentry/tanstackstart-react using Node.js-specific APIs (setInterval().unref()).
 *
 * To re-enable Sentry:
 * 1. Wait for @sentry/tanstackstart-react to fix workerd/worker export conditions
 *    (see: https://github.com/getsentry/sentry-javascript/issues/20038)
 * 2. Or switch to @sentry/cloudflare for server-side error tracking
 */
const SentryLogger = Logger.make<unknown, void>(({ logLevel, message, cause, annotations }) => {
	// Only capture errors and above
	if (!LogLevel.greaterThanEqual(logLevel, LogLevel.Error)) {
		return;
	}

	// Convert annotations HashMap to plain object for extra context
	const tags: Record<string, string> = {};
	HashMap.forEach(annotations, (value, key) => {
		tags[key] = String(value);
	});

	// Pattern match on the cause to log errors
	Cause.match(cause, {
		onEmpty: () => {
			console.error("[Error]", String(message), tags);
		},
		onDie: (defect) => {
			console.error("[Defect]", String(message), defect, tags);
			return undefined as unknown as () => void;
		},
		onInterrupt: () => {
			console.error("[Interrupt]", String(message), tags);
			return undefined as unknown as () => void;
		},
		onFail: (typedError) => {
			const exceptionToCapture =
				typeof typedError === "object" &&
				typedError !== null &&
				"cause" in typedError &&
				typedError.cause instanceof Error
					? typedError.cause
					: typedError;
			console.error("[Failure]", String(message), exceptionToCapture, tags);
			return undefined as unknown as () => void;
		},
		onSequential: (left, right) => {
			console.error("[Sequential Errors]", String(message), { left, right }, tags);
			return undefined as unknown as () => void;
		},
		onParallel: (left, right) => {
			console.error("[Parallel Errors]", String(message), { left, right }, tags);
			return undefined as unknown as () => void;
		},
	});
});

export const LoggerLive = Logger.replace(Logger.defaultLogger, SentryLogger);
