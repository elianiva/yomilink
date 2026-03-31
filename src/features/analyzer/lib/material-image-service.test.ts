import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { Effect, Either } from "effect";

import { uploadMaterialImage } from "./material-image-service";

// Use vi.hoisted to create mock before vi.mock hoisting
const { mockPut } = vi.hoisted(() => {
	return { mockPut: vi.fn() };
});

// Mock the cloudflare:workers module
vi.mock("cloudflare:workers", () => {
	return {
		env: {
			MATERIAL_IMAGES: {
				put: mockPut,
			},
		},
	};
});

beforeEach(() => {
	mockPut.mockClear();
	mockPut.mockResolvedValue(undefined);
});

// Mock crypto.randomUUID for deterministic tests
const mockUUID = "test-uuid-1234-5678-9012";
vi.spyOn(crypto, "randomUUID").mockReturnValue(mockUUID);

const createMockFile = (
	options: {
		name?: string;
		type?: string;
		size?: number;
		content?: string;
	} = {},
): File => {
	const {
		name = "test-image.png",
		type = "image/png",
		size,
		content = "fake image content",
	} = options;

	// Create array buffer for the file content
	let arrayBuffer: ArrayBuffer;
	if (size !== undefined) {
		arrayBuffer = new ArrayBuffer(size);
	} else {
		const encoder = new TextEncoder();
		arrayBuffer = encoder.encode(content).buffer as ArrayBuffer;
	}

	// Create a mock file with proper arrayBuffer method
	const blob = new Blob([arrayBuffer], { type });
	const file = new File([blob], name, { type });

	// Override size if specified (for File created from blob, size may differ)
	if (size !== undefined) {
		Object.defineProperty(file, "size", { value: size });
	}

	// Add arrayBuffer method that jsdom's File might not have
	Object.defineProperty(file, "arrayBuffer", {
		value: () => Promise.resolve(arrayBuffer),
	});

	return file;
};

describe("material-image-service", () => {
	describe("uploadMaterialImage", () => {
		describe("file type validation", () => {
			it("should accept valid PNG image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/png" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					expect(result.id).toBe(mockUUID);
					expect(result.type).toBe("image/png");
				}).pipe(Effect.runPromise));

			it("should accept valid JPEG image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/jpeg" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					expect(result.id).toBe(mockUUID);
					expect(result.type).toBe("image/jpeg");
				}).pipe(Effect.runPromise));

			it("should accept valid JPG image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/jpg" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					expect(result.id).toBe(mockUUID);
					expect(result.type).toBe("image/jpg");
				}).pipe(Effect.runPromise));

			it("should accept valid GIF image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/gif" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					expect(result.id).toBe(mockUUID);
					expect(result.type).toBe("image/gif");
				}).pipe(Effect.runPromise));

			it("should accept valid WebP image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/webp" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					expect(result.id).toBe(mockUUID);
					expect(result.type).toBe("image/webp");
				}).pipe(Effect.runPromise));

			it("should accept valid SVG image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/svg+xml" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					expect(result.id).toBe(mockUUID);
					expect(result.type).toBe("image/svg+xml");
				}).pipe(Effect.runPromise));

			it("should reject invalid file type with InvalidFileTypeError", () =>
				Effect.gen(function* () {
					const file = createMockFile({
						name: "document.pdf",
						type: "application/pdf",
					});
					const result = yield* Effect.either(
						uploadMaterialImage({
							goalMapId: "goal-map-123",
							file,
						}),
					);

					Either.match(result, {
						onLeft: (error) => {
							expect(error._tag).toBe("InvalidFileTypeError");
							if (error._tag === "InvalidFileTypeError") {
								expect(error.type).toBe("application/pdf");
								expect(error.allowed).toStrictEqual([
									"image/png",
									"image/jpeg",
									"image/jpg",
									"image/gif",
									"image/webp",
									"image/svg+xml",
								]);
							}
						},
						onRight: () => {
							throw new Error("Expected Left but got Right");
						},
					});
				}).pipe(Effect.runPromise));

			it("should reject text/plain file type", () =>
				Effect.gen(function* () {
					const file = createMockFile({
						name: "file.txt",
						type: "text/plain",
					});
					const result = yield* Effect.either(
						uploadMaterialImage({
							goalMapId: "goal-map-123",
							file,
						}),
					);

					Either.match(result, {
						onLeft: (error) => {
							expect(error._tag).toBe("InvalidFileTypeError");
							if (error._tag === "InvalidFileTypeError") {
								expect(error.type).toBe("text/plain");
							}
						},
						onRight: () => {
							throw new Error("Expected Left but got Right");
						},
					});
				}).pipe(Effect.runPromise));
		});

		describe("file size validation", () => {
			it("should accept file under 5MB", () =>
				Effect.gen(function* () {
					const file = createMockFile({
						size: 4 * 1024 * 1024, // 4MB
					});
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					expect(result.id).toBe(mockUUID);
				}).pipe(Effect.runPromise));

			it("should accept file exactly at 5MB limit", () =>
				Effect.gen(function* () {
					const file = createMockFile({
						size: 5 * 1024 * 1024, // 5MB exactly
					});
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					expect(result.id).toBe(mockUUID);
				}).pipe(Effect.runPromise));

			it("should reject file over 5MB with FileTooLargeError", () =>
				Effect.gen(function* () {
					const fileSize = 6 * 1024 * 1024; // 6MB
					const file = createMockFile({ size: fileSize });
					const result = yield* Effect.either(
						uploadMaterialImage({
							goalMapId: "goal-map-123",
							file,
						}),
					);

					Either.match(result, {
						onLeft: (error) => {
							expect(error._tag).toBe("FileTooLargeError");
							if (error._tag === "FileTooLargeError") {
								expect(error.size).toBe(fileSize);
								expect(error.maxSize).toBe(5 * 1024 * 1024);
							}
						},
						onRight: () => {
							throw new Error("Expected Left but got Right");
						},
					});
				}).pipe(Effect.runPromise));
		});

		describe("successful upload", () => {
			it("should return correct image metadata", () =>
				Effect.gen(function* () {
					const file = createMockFile({
						name: "my-image.png",
						type: "image/png",
						content: "image data here",
					});
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					expect(result.id).toBe(mockUUID);
					expect(result.name).toBe("my-image.png");
					expect(result.type).toBe("image/png");
					expect(result.size).toBe(file.size);
					expect(typeof result.uploadedAt).toBe("number");
					expect(result.url).toBe(
						`/api/materials/images/goal-map-123/${mockUUID}`,
					);
				}).pipe(Effect.runPromise));

			it("should return correct public URL format", () =>
				Effect.gen(function* () {
					const file = createMockFile();
					const goalMapId = "goal-map-abc";
					const result = yield* uploadMaterialImage({
						goalMapId,
						file,
					});

					expect(result.url).toBe(
						`/api/materials/images/${goalMapId}/${mockUUID}`,
					);
				}).pipe(Effect.runPromise));

			it("should call R2 put with correct key and metadata", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/jpeg" });
					const goalMapId = "goal-map-xyz";
					yield* uploadMaterialImage({
						goalMapId,
						file,
					});

					expect(mockPut.mock.calls.length).toBe(1);
					const [key, , options] = mockPut.mock.calls[0] as [
						string,
						ArrayBuffer,
						{ httpMetadata: { contentType: string } },
					];
					expect(key).toBe(`materials/${goalMapId}/${mockUUID}`);
					expect(options.httpMetadata.contentType).toBe("image/jpeg");
				}).pipe(Effect.runPromise));
		});
	});
});
