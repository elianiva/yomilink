import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Runtime, Schema } from "effect";

import {
	uploadMaterialImage,
	UploadMaterialImageInput,
} from "@/features/analyzer/lib/material-image-service";
import { authMiddleware } from "@/middlewares/auth";

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError } from "../rpc-helper";

export const uploadMaterialImageRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(UploadMaterialImageInput)(raw))
	.handler(({ data }) =>
		Runtime.runPromise(
			AppRuntime,
			uploadMaterialImage(data).pipe(
				Effect.map(Rpc.ok),
				Effect.withSpan("uploadMaterialImage"),
				Effect.tapError(logRpcError("uploadMaterialImage")),
				Effect.catchTags({
					InvalidFileTypeError: (e) =>
						Rpc.err(`Invalid file type: ${e.type}. Allowed: ${e.allowed.join(", ")}`),
					FileTooLargeError: (e) =>
						Rpc.err(`File too large: ${e.size} bytes. Max: ${e.maxSize} bytes`),
					UnknownException: () => Rpc.err("Failed to upload image"),
				}),
				Effect.catchAll((error) =>
					Effect.gen(function* () {
						yield* Effect.logError("Upload failed", error);
						return yield* Rpc.err("Failed to upload image", undefined, error);
					}),
				),
			),
		),
	);

export const MaterialImageRpc = {
	upload: () =>
		mutationOptions({
			mutationKey: ["material-image", "upload"],
			mutationFn: (data: UploadMaterialImageInput) => uploadMaterialImageRpc({ data }),
		}),
};
