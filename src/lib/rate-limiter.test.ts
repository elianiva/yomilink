import { Duration, Effect } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { RateLimiter } from "./rate-limiter";

const run = <A>(effect: Effect.Effect<A, never, never>) => Effect.runSync(effect);

describe("RateLimiter", () => {
	it("should allow requests under the limit", () => {
		const program = Effect.gen(function* () {
			const rl = yield* RateLimiter;
			return yield* rl.check("key1", 5, Duration.minutes(1));
		});
		expect(run(program.pipe(Effect.provide(RateLimiter.Default)))).toBe(true);
	});

	it("should block requests over the limit within a window", () => {
		const program = Effect.gen(function* () {
			const rl = yield* RateLimiter;
			// Consume all 5 slots
			const r1 = yield* rl.check("key2", 5, Duration.minutes(1));
			const r2 = yield* rl.check("key2", 5, Duration.minutes(1));
			const r3 = yield* rl.check("key2", 5, Duration.minutes(1));
			const r4 = yield* rl.check("key2", 5, Duration.minutes(1));
			const r5 = yield* rl.check("key2", 5, Duration.minutes(1));
			// 6th should be denied
			const r6 = yield* rl.check("key2", 5, Duration.minutes(1));
			return [r1, r2, r3, r4, r5, r6] as const;
		});
		const results = run(program.pipe(Effect.provide(RateLimiter.Default)));
		expect(results.slice(0, 5)).toEqual([true, true, true, true, true]);
		expect(results[5]).toBe(false);
	});

	it("should handle different keys independently", () => {
		const program = Effect.gen(function* () {
			const rl = yield* RateLimiter;
			// Exhaust key3
			const _1 = yield* rl.check("key3", 2, Duration.minutes(1));
			const _2 = yield* rl.check("key3", 2, Duration.minutes(1));
			const _3 = yield* rl.check("key3", 2, Duration.minutes(1));
			// key4 should still work
			const r4 = yield* rl.check("key4", 2, Duration.minutes(1));
			return [_3, r4] as const;
		});
		const results = run(program.pipe(Effect.provide(RateLimiter.Default)));
		expect(results[0]).toBe(false);
		expect(results[1]).toBe(true);
	});

	it("should reset window after expiry", async () => {
		const program = Effect.gen(function* () {
			const rl = yield* RateLimiter;
			// Exhaust with very short window
			const r1 = yield* rl.check("key5", 1, Duration.millis(10));
			const r2 = yield* rl.check("key5", 1, Duration.millis(10));
			// Wait for window to pass
			yield* Effect.sleep(Duration.millis(20));
			const r3 = yield* rl.check("key5", 1, Duration.millis(10));
			return [r1, r2, r3] as const;
		});
		const results = await Effect.runPromise(program.pipe(Effect.provide(RateLimiter.Default)));
		expect(results[0]).toBe(true);
		expect(results[1]).toBe(false);
		expect(results[2]).toBe(true);
	});

	it("should track count per key", () => {
		const program = Effect.gen(function* () {
			const rl = yield* RateLimiter;
			const r1 = yield* rl.check("key6", 3, Duration.minutes(1));
			const r2 = yield* rl.check("key6", 3, Duration.minutes(1));
			const r3 = yield* rl.check("key6", 3, Duration.minutes(1));
			const r4 = yield* rl.check("key6", 3, Duration.minutes(1));
			return [r1, r2, r3, r4] as const;
		});
		const results = run(program.pipe(Effect.provide(RateLimiter.Default)));
		expect(results).toEqual([true, true, true, false]);
	});
});
