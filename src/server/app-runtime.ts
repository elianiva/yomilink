import { ManagedRuntime } from "effect";

import { AppLayer } from "./app-layer";

/**
 * Shared application runtime - built once at module initialization.
 * Eliminates per-request layer provisioning overhead in Cloudflare Workers.
 *
 * This singleton runtime contains all dependencies (Database, Logger, Config, etc.)
 * and is shared across all server function invocations.
 *
 * IMPORTANT: ManagedRuntime keeps the scope open for the application lifetime.
 * The DB connection remains alive until explicitly disposed.
 */
export const AppRuntime = ManagedRuntime.make(AppLayer);
