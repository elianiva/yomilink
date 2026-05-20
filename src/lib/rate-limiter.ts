import { Duration, Effect, Ref } from "effect";

type WindowEntry = { count: number; windowStart: number };

export class RateLimiter extends Effect.Service<RateLimiter>()(
	"app/RateLimiter",
	{
		effect: Effect.gen(function* () {
			const store = yield* Ref.make(new Map<string, WindowEntry>());

			const check = (key: string, maxRequests: number, window: Duration.Duration) =>
				Ref.modify(store, (map) => {
					const now = Date.now();
					const windowMs = Duration.toMillis(window);
					const entry = map.get(key);

					if (!entry || now - entry.windowStart >= windowMs) {
						map.set(key, { count: 1, windowStart: now });
						return [true, map];
					}

					if (entry.count >= maxRequests) return [false, map];
					entry.count++;
					return [true, map];
				});

			return { check } as const;
		}),
	},
) {}
