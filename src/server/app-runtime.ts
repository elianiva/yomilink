import { Effect, Layer } from "effect";

import { AppLayer } from "./app-layer";

/**
 * Shared application runtime - built once at module initialization.
 * Eliminates per-request layer provisioning overhead in Cloudflare Workers.
 *
 * This singleton runtime contains all dependencies (Database, Logger, Config, etc.)
 * and is shared across all server function invocations.
 */
export const AppRuntime = Effect.runSync(Layer.toRuntime(AppLayer).pipe(Effect.scoped));
