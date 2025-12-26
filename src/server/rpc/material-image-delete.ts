import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { env } from "cloudflare:workers";
import { authMiddleware } from "@/middlewares/auth";

const DeleteImageSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	imageId: Schema.NonEmptyString,
});

export const deleteMaterialImage = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(DeleteImageSchema)(raw))
	.handler(async ({ data }) =>
		Effect.gen(function* () {
			const key = `materials/${data.goalMapId}/${data.imageId}`;

			yield* Effect.tryPromise(() => env.MATERIAL_IMAGES.delete(key));

			return {
				success: true,
			} as const;
		}).pipe(Effect.runPromise),
	);
