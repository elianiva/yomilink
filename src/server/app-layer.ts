import { Layer } from "effect";

import { Auth } from "@/lib/auth";
import { RateLimiter } from "@/lib/rate-limiter";

import { DatabaseLive, DatabaseTest } from "./db/client";
import { StorageService } from "./storage/storage-service";
import { LoggerLive } from "./logger";

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
