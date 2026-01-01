import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { env } from "cloudflare:workers";
import { authMiddleware } from "@/middlewares/auth";
import { LoggerLive } from "../logger";
import { logRpcError } from "./handler";

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

const UploadImageSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	file: Schema.instanceOf(File),
});

export const uploadMaterialImage = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(UploadImageSchema)(raw))
	.handler(async ({ data }) =>
		Effect.gen(function* () {
			const allowedTypes = [
				"image/png",
				"image/jpeg",
				"image/jpg",
				"image/gif",
				"image/webp",
				"image/svg+xml",
			] as const;

			yield* Effect.succeed(data.file.type).pipe(
				Effect.filterOrFail(
					(type) => allowedTypes.includes(type as any),
					() =>
						InvalidFileTypeError.make({
							type: data.file.type,
							allowed: allowedTypes as any,
						}),
				),
			);

			const fileMaxSize = 5 * 1024 * 1024;
			yield* Effect.succeed(data.file.size).pipe(
				Effect.filterOrFail(
					(size) => size <= fileMaxSize,
					() =>
						FileTooLargeError.make({
							size: data.file.size,
							maxSize: fileMaxSize,
						}),
				),
			);

			const imageId = crypto.randomUUID();
			const key = `materials/${data.goalMapId}/${imageId}`;

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
		}).pipe(
			Effect.tapError(logRpcError("uploadMaterialImage")),
			Effect.catchTags({
				InvalidFileTypeError: () =>
					Effect.succeed({
						success: false,
						error: "Invalid file type. Allowed: PNG, JPG, GIF, WebP, SVG",
					} as const),
				FileTooLargeError: () =>
					Effect.succeed({
						success: false,
						error: "File too large. Maximum size is 5MB",
					} as const),
			}),
			Effect.provide(LoggerLive),
			Effect.runPromise,
		),
	);

export const MaterialImageRpc = {
	upload: () =>
		mutationOptions({
			mutationKey: ["material-image", "upload"],
			mutationFn: (data: { goalMapId: string; file: File }) =>
				uploadMaterialImage({ data }),
		}),
};
