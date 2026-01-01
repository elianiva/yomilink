import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";
import { authMiddleware } from "@/middlewares/auth";
import {
	uploadMaterialImage,
	UploadMaterialImageInput,
} from "@/features/analyzer/lib/material-image-service";
import { LoggerLive } from "../logger";
import { logRpcError } from "./handler";

export const uploadMaterialImageRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(UploadMaterialImageInput)(raw),
	)
	.handler(({ data }) =>
		uploadMaterialImage(data).pipe(
			Effect.tapError(logRpcError("uploadMaterialImage")),
			Effect.provide(LoggerLive),
			Effect.withSpan("uploadMaterialImage"),
			Effect.runPromise,
		),
	);

export const MaterialImageRpc = {
	upload: () =>
		mutationOptions({
			mutationKey: ["material-image", "upload"],
			mutationFn: (data: UploadMaterialImageInput) =>
				uploadMaterialImageRpc({ data }),
		}),
};
