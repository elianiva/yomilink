import { env } from "cloudflare:workers";
import { Effect, Schema } from "effect";

class InvalidFileTypeError extends Schema.TaggedError<InvalidFileTypeError>()(
	"InvalidFileTypeError",
	{
		type: Schema.String,
		allowed: Schema.Array(Schema.String),
	},
) {}

class FileTooLargeError extends Schema.TaggedError<FileTooLargeError>()(
	"FileTooLargeError",
	{
		size: Schema.Number,
		maxSize: Schema.Number,
	},
) {}

export const UploadMaterialImageInput = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	file: Schema.instanceOf(File),
});

export type UploadMaterialImageInput = typeof UploadMaterialImageInput.Type;

export const uploadMaterialImage = Effect.fn("uploadMaterialImage")(
	(input: UploadMaterialImageInput) =>
		Effect.gen(function* () {
			const allowedTypes = [
				"image/png",
				"image/jpeg",
				"image/jpg",
				"image/gif",
				"image/webp",
				"image/svg+xml",
			];

			yield* Effect.succeed(input.file.type).pipe(
				Effect.filterOrFail(
					(type) => allowedTypes.includes(type),
					() =>
						InvalidFileTypeError.make({
							type: input.file.type,
							allowed: allowedTypes,
						}),
				),
			);

			const fileMaxSize = 5 * 1024 * 1024;
			yield* Effect.succeed(input.file.size).pipe(
				Effect.filterOrFail(
					(size) => size <= fileMaxSize,
					() =>
						FileTooLargeError.make({
							size: input.file.size,
							maxSize: fileMaxSize,
						}),
				),
			);

			const imageId = crypto.randomUUID();
			const key = `materials/${input.goalMapId}/${imageId}`;

			const arrayBuffer = yield* Effect.tryPromise(() =>
				input.file.arrayBuffer(),
			);
			yield* Effect.tryPromise(() =>
				env.MATERIAL_IMAGES.put(key, arrayBuffer, {
					httpMetadata: {
						contentType: input.file.type,
					},
				}),
			);

			const publicUrl = `/api/materials/images/${input.goalMapId}/${imageId}`;

			const imageMetadata = {
				id: imageId,
				url: publicUrl,
				name: input.file.name,
				size: input.file.size,
				type: input.file.type,
				uploadedAt: Date.now(),
			};

			return {
				success: true,
				image: imageMetadata,
			} as const;
		}),
);
