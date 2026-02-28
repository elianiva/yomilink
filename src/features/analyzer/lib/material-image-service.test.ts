import { assert, describe, it, beforeEach } from "@effect/vitest";
import { Effect, Either } from "effect";
import { vi } from "vitest";

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
			it.effect("should accept valid PNG image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/png" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					assert.strictEqual(result.success, true);
					assert.strictEqual(result.image.type, "image/png");
				}),
			);

			it.effect("should accept valid JPEG image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/jpeg" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					assert.strictEqual(result.success, true);
					assert.strictEqual(result.image.type, "image/jpeg");
				}),
			);

			it.effect("should accept valid JPG image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/jpg" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					assert.strictEqual(result.success, true);
					assert.strictEqual(result.image.type, "image/jpg");
				}),
			);

			it.effect("should accept valid GIF image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/gif" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					assert.strictEqual(result.success, true);
					assert.strictEqual(result.image.type, "image/gif");
				}),
			);

			it.effect("should accept valid WebP image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/webp" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					assert.strictEqual(result.success, true);
					assert.strictEqual(result.image.type, "image/webp");
				}),
			);

			it.effect("should accept valid SVG image", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/svg+xml" });
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					assert.strictEqual(result.success, true);
					assert.strictEqual(result.image.type, "image/svg+xml");
				}),
			);

			it.effect("should reject invalid file type with InvalidFileTypeError", () =>
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
							assert.strictEqual(error._tag, "InvalidFileTypeError");
							if (error._tag === "InvalidFileTypeError") {
								assert.strictEqual(error.type, "application/pdf");
								assert.deepStrictEqual(error.allowed, [
									"image/png",
									"image/jpeg",
									"image/jpg",
									"image/gif",
									"image/webp",
									"image/svg+xml",
								]);
							}
						},
						onRight: () => assert.fail("Expected Left but got Right"),
					});
				}),
			);

			it.effect("should reject text/plain file type", () =>
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
							assert.strictEqual(error._tag, "InvalidFileTypeError");
							if (error._tag === "InvalidFileTypeError") {
								assert.strictEqual(error.type, "text/plain");
							}
						},
						onRight: () => assert.fail("Expected Left but got Right"),
					});
				}),
			);
		});

		describe("file size validation", () => {
			it.effect("should accept file under 5MB", () =>
				Effect.gen(function* () {
					const file = createMockFile({
						size: 4 * 1024 * 1024, // 4MB
					});
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					assert.strictEqual(result.success, true);
				}),
			);

			it.effect("should accept file exactly at 5MB limit", () =>
				Effect.gen(function* () {
					const file = createMockFile({
						size: 5 * 1024 * 1024, // 5MB exactly
					});
					const result = yield* uploadMaterialImage({
						goalMapId: "goal-map-123",
						file,
					});

					assert.strictEqual(result.success, true);
				}),
			);

			it.effect("should reject file over 5MB with FileTooLargeError", () =>
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
							assert.strictEqual(error._tag, "FileTooLargeError");
							if (error._tag === "FileTooLargeError") {
								assert.strictEqual(error.size, fileSize);
								assert.strictEqual(error.maxSize, 5 * 1024 * 1024);
							}
						},
						onRight: () => assert.fail("Expected Left but got Right"),
					});
				}),
			);
		});

		describe("successful upload", () => {
			it.effect("should return correct image metadata", () =>
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

					assert.strictEqual(result.success, true);
					assert.strictEqual(result.image.id, mockUUID);
					assert.strictEqual(result.image.name, "my-image.png");
					assert.strictEqual(result.image.type, "image/png");
					assert.strictEqual(result.image.size, file.size);
					assert.strictEqual(typeof result.image.uploadedAt, "number");
				}),
			);

			it.effect("should return correct public URL format", () =>
				Effect.gen(function* () {
					const file = createMockFile();
					const goalMapId = "goal-map-abc";
					const result = yield* uploadMaterialImage({
						goalMapId,
						file,
					});

					assert.strictEqual(
						result.image.url,
						`/api/materials/images/${goalMapId}/${mockUUID}`,
					);
				}),
			);

			it.effect("should call R2 put with correct key and metadata", () =>
				Effect.gen(function* () {
					const file = createMockFile({ type: "image/jpeg" });
					const goalMapId = "goal-map-xyz";
					yield* uploadMaterialImage({
						goalMapId,
						file,
					});

					assert.strictEqual(mockPut.mock.calls.length, 1);
					const [key, , options] = mockPut.mock.calls[0] as [
						string,
						ArrayBuffer,
						{ httpMetadata: { contentType: string } },
					];
					assert.strictEqual(key, `materials/${goalMapId}/${mockUUID}`);
					assert.strictEqual(options.httpMetadata.contentType, "image/jpeg");
				}),
			);
		});
	});
});
