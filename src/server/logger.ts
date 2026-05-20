import { Cause, HashMap, Logger } from "effect";

// Structured JSON logger for Cloudflare Workers.
// Outputs JSON lines parseable by wrangler tail.
// Avoids console.group (no-op in workerd) used by Logger.pretty.
const JsonLogger = Logger.make<unknown, void>(({ logLevel, message, cause, annotations }) => {
	const entry: Record<string, unknown> = {
		level: logLevel.label,
		message: String(message),
	};

	HashMap.forEach(annotations, (value, key) => {
		entry[key] = value;
	});

	Cause.match(cause, {
		onEmpty: () => () => {},
		onDie: (defect) => {
			entry.defect = String(defect);
			return () => {};
		},
		onInterrupt: () => {
			entry.interrupted = true;
			return () => {};
		},
		onFail: (error) => {
			entry.error = String(error);
			return () => {};
		},
		onSequential: (left, right) => {
			entry.cause = "sequential";
			entry.chain = [String(left), String(right)];
			return () => {};
		},
		onParallel: (left, right) => {
			entry.cause = "parallel";
			entry.chain = [String(left), String(right)];
			return () => {};
		},
	});

	console.log(JSON.stringify(entry));
});

export const LoggerLive = Logger.replace(Logger.defaultLogger, JsonLogger);
