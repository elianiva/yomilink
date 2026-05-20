import { Effect, Schema } from "effect";

export class StorageError extends Schema.TaggedError<StorageError>()("StorageError", {
	key: Schema.String,
	message: Schema.String,
}) {}

export class StorageService extends Effect.Service<StorageService>()(
	"app/StorageService",
	{
		effect: Effect.gen(function* () {
			const getBucket = Effect.promise(() =>
				import("cloudflare:workers").then(({ env }) => env.MATERIAL_IMAGES),
			);

			const get = (key: string) =>
				getBucket.pipe(
					Effect.flatMap((bucket) =>
						Effect.tryPromise({
							try: () => bucket.get(key),
							catch: (e) =>
								new StorageError({
									key,
									message: `R2 GET failed: ${String(e)}`,
								}),
						}),
					),
				);

			const put = (key: string, data: ArrayBuffer, contentType: string) =>
				getBucket.pipe(
					Effect.flatMap((bucket) =>
						Effect.tryPromise({
							try: () =>
								bucket.put(key, data, {
									httpMetadata: { contentType },
								}),
							catch: (e) =>
								new StorageError({
									key,
									message: `R2 PUT failed: ${String(e)}`,
								}),
						}),
					),
				);

			return { get, put } as const;
		}),
	},
) {}
