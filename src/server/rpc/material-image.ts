import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect } from "effect";

import {
	uploadMaterialImage,
	UploadMaterialImageInput,
} from "@/features/analyzer/lib/material-image-service";
import { authMiddleware } from "@/middlewares/auth";

import { AppRuntime } from "../app-runtime";
import { Rpc, logRpcError } from "../rpc-helper";

function parseUploadFormData(formData: FormData): UploadMaterialImageInput {
	const goalMapId = formData.get("goalMapId");
	const file = formData.get("file");

	if (typeof goalMapId !== "string" || goalMapId.length === 0) {
		throw new Error("goalMapId is required");
	}
	if (!(file instanceof File)) {
		throw new Error("file is required");
	}

	return { goalMapId, file };
}

export const uploadMaterialImageRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((data: unknown) => {
		if (!(data instanceof FormData)) {
			throw new Error("Expected FormData");
		}
		return data;
	})
	.handler(async ({ data }) => {
		const input = parseUploadFormData(data);

		return AppRuntime.runPromise(
			uploadMaterialImage(input).pipe(
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
		);
	});

export const MaterialImageRpc = {
	upload: () =>
		mutationOptions({
			mutationKey: ["material-image", "upload"],
			mutationFn: (data: { goalMapId: string; file: File }) => {
				const formData = new FormData();
				formData.append("goalMapId", data.goalMapId);
				formData.append("file", data.file);
				return uploadMaterialImageRpc({ data: formData });
			},
		}),
};
