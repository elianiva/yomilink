import { Cause, HashMap, Logger, LogLevel } from "effect";

const SentryLogger = Logger.make<unknown, void>(({ logLevel, message, cause, annotations }) => {
	if (!LogLevel.greaterThanEqual(logLevel, LogLevel.Error)) return;

	const tags: Record<string, string> = {};
	HashMap.forEach(annotations, (value, key) => {
		tags[key] = String(value);
	});

	Cause.match(cause, {
		onEmpty: () => {
			console.error("[Error]", String(message), tags);
		},
		onDie: (defect) => {
			console.error("[Defect]", String(message), defect, tags);
			return () => {};
		},
		onInterrupt: () => {
			console.error("[Interrupt]", String(message), tags);
			return () => {};
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
			return () => {};
		},
		onSequential: (left, right) => {
			console.error("[Sequential Errors]", String(message), { left, right }, tags);
			return () => {};
		},
		onParallel: (left, right) => {
			console.error("[Parallel Errors]", String(message), { left, right }, tags);
			return () => {};
		},
	});
});

export const LoggerLive = Logger.replace(Logger.defaultLogger, SentryLogger);
