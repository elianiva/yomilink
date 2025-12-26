import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { env } from "cloudflare:workers";
import { authMiddleware } from "@/middlewares/auth";

const UploadImageSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	file: Schema.instanceOf(File),
});

export const uploadMaterialImage = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(UploadImageSchema)(raw))
	.handler(async ({ data }) =>
		Effect.gen(function* () {
			// Validate file type
			const allowedTypes = [
				"image/png",
				"image/jpeg",
				"image/jpg",
				"image/gif",
				"image/webp",
				"image/svg+xml",
			];

			if (!allowedTypes.includes(data.file.type)) {
				return {
					success: false,
					error: "Invalid file type. Allowed: PNG, JPG, GIF, WebP, SVG",
				} as const;
			}

			// Validate file size (5MB max)
			const maxSize = 5 * 1024 * 1024;
			if (data.file.size > maxSize) {
				return {
					success: false,
					error: "File too large. Maximum size is 5MB",
				} as const;
			}

			// Generate unique key for R2
			const imageId = crypto.randomUUID();
			const key = `materials/${data.goalMapId}/${imageId}`;

			// Upload to R2
			const arrayBuffer = yield* Effect.tryPromise(() =>
				data.file.arrayBuffer(),
			);
			yield* Effect.tryPromise(() =>
				env.MATERIAL_IMAGES.put(key, arrayBuffer, {
					httpMetadata: {
						contentType: data.file.type,
					},
				}),
			);

			// Construct public URL
			const publicUrl = `/api/materials/images/${data.goalMapId}/${imageId}`;

			const imageMetadata = {
				id: imageId,
				url: publicUrl,
				name: data.file.name,
				size: data.file.size,
				type: data.file.type,
				uploadedAt: Date.now(),
			};

			return {
				success: true,
				image: imageMetadata,
			} as const;
		}).pipe(Effect.runPromise),
	);
