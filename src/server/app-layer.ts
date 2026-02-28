import { Layer } from "effect";

import { DatabaseLive, DatabaseTest } from "./db/client";
import { LoggerLive } from "./logger";
import { ServerTelemetry } from "./telemetry";
/**
 * Centralized application layer that combines all server-side dependencies.
 *
 * Use this for all Effect programs in the server context instead of
 * manually merging layers with Layer.mergeAll.
 *
 * Includes:
 * - DatabaseLive (SQLite/Drizzle)
 * - LoggerLive (Sentry error logging)
 * - ServerTelemetry (OpenTelemetry/Sentry tracing)
 *
 * @example
 * ```ts
 * import { AppLayer } from "@/server/app-layer";
 *
 * const program = Effect.gen(function* () {
 *   // your effect code
 * }).pipe(
 *   Effect.provide(AppLayer)
 * );
 * ```
 */
export const AppLayer = Layer.mergeAll(DatabaseLive, LoggerLive, ServerTelemetry);
/**
 * Test variant of AppLayer - uses in-memory database.
 * Use in tests where you don't want to hit the real database.
 */
export const AppLayerTest = Layer.mergeAll(DatabaseTest, LoggerLive, ServerTelemetry);
