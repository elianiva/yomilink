import { Layer } from "effect";

import { Auth } from "@/lib/auth";
import { RateLimiter } from "@/lib/rate-limiter";

import { DatabaseLive, DatabaseTest } from "./db/client";
import { LoggerLive } from "./logger";
import { StorageService } from "./storage/storage-service";

export const AppLayer = Layer.mergeAll(
	Layer.provideMerge(Auth.Default, DatabaseLive),
	StorageService.Default,
	RateLimiter.Default,
	LoggerLive,
);

export const AppLayerTest = Layer.mergeAll(
	Layer.provideMerge(Auth.Default, DatabaseTest),
	StorageService.Default,
	RateLimiter.Default,
	LoggerLive,
);
