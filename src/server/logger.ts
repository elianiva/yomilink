import { Logger } from "effect";

/**
 * Pretty logger for development - human readable colored output.
 * For production, swap to Logger.json or integrate with Sentry.
 */
export const LoggerLive = Logger.pretty;
