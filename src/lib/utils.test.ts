import { Effect, Exit, Schema } from "effect";
import { describe, expect, it } from "vitest";

import { cn, parseJson, safeParseJson, randomString } from "./utils";

describe("cn", () => {
	it("should merge class names correctly", () => {
		const result = cn("px-4", "py-2");
		expect(result).toBe("px-4 py-2");
	});

	it("should handle conflicting tailwind classes", () => {
		const result = cn("px-4", "px-2");
		expect(result).toBe("px-2");
	});

	it("should handle conditional classes", () => {
		const result = cn("px-4", false && "py-2", true && "bg-red-500");
		expect(result).toBe("px-4 bg-red-500");
	});

	it("should handle undefined and null values", () => {
		const result = cn("px-4", null, undefined, "py-2");
		expect(result).toBe("px-4 py-2");
	});

	it("should handle arrays", () => {
		const result = cn(["px-4", "py-2"], "bg-red-500");
		expect(result).toBe("px-4 py-2 bg-red-500");
	});

	it("should handle objects with boolean values", () => {
		const result = cn({
			"px-4": true,
			"py-2": false,
			"bg-red-500": true,
		});
		expect(result).toBe("px-4 bg-red-500");
	});

	it("should handle empty input", () => {
		const result = cn();
		expect(result).toBe("");
	});

	it("should handle mixed inputs", () => {
		const result = cn("px-4", ["py-2", "bg-red-500"], {
			"text-white": true,
			"font-bold": false,
		});
		expect(result).toBe("px-4 py-2 bg-red-500 text-white");
	});

	it("should remove duplicate classes", () => {
		const result = cn("px-4", "px-4", "py-2");
		expect(result).toBe("px-4 py-2");
	});
});

describe("randomString", () => {
	it("should generate string of default length 32", () => {
		const result = randomString();
		expect(result).toHaveLength(32);
	});

	it("should generate string of specified length", () => {
		const result = randomString(10);
		expect(result).toHaveLength(10);
	});

	it("should generate different strings on multiple calls", () => {
		const result1 = randomString(10);
		const result2 = randomString(10);
		expect(result1).not.toBe(result2);
	});

	it("should only contain alphanumeric characters", () => {
		const result = randomString(100);
		expect(result).toMatch(/^[a-zA-Z0-9]+$/);
	});

	it("should handle large lengths", () => {
		const result = randomString(1000);
		expect(result).toHaveLength(1000);
	});
});

describe("parseJson", () => {
	it("should parse valid JSON string", () => {
		const result = Effect.runSync(parseJson('{"key":"value"}'));
		expect(result).toEqual({ key: "value" });
	});

	it("should return input if already parsed", () => {
		const input = { key: "value" };
		const result = Effect.runSync(parseJson(input));
		expect(result).toEqual(input);
	});

	it("should fail on invalid JSON string", () => {
		const result = Effect.runSyncExit(parseJson("invalid json"));
		expect(Exit.isFailure(result)).toBe(true);
	});

	it("should parse and validate with schema", () => {
		const schema = Schema.Struct({
			name: Schema.String,
			age: Schema.Number,
		});
		const result = Effect.runSync(parseJson('{"name":"John","age":30}', schema));
		expect(result).toEqual({ name: "John", age: 30 });
	});

	it("should fail with schema validation error", () => {
		const schema = Schema.Struct({
			name: Schema.String,
			age: Schema.Number,
		});
		const result = Effect.runSyncExit(parseJson('{"name":"John","age":"thirty"}', schema));
		expect(Exit.isFailure(result)).toBe(true);
	});

	it("should handle nested objects with schema", () => {
		const schema = Schema.Struct({
			user: Schema.Struct({
				name: Schema.String,
				email: Schema.String,
			}),
		});
		const result = Effect.runSync(
			parseJson('{"user":{"name":"John","email":"john@example.com"}}', schema),
		);
		expect(result).toEqual({
			user: { name: "John", email: "john@example.com" },
		});
	});

	it("should handle arrays with schema", () => {
		const schema = Schema.Array(Schema.String);
		const result = Effect.runSync(parseJson('["a","b","c"]', schema));
		expect(result).toEqual(["a", "b", "c"]);
	});

	it("should handle null input", () => {
		const result = Effect.runSync(parseJson(null));
		expect(result).toBeNull();
	});

	it("should handle number input", () => {
		const result = Effect.runSync(parseJson(123));
		expect(result).toBe(123);
	});
});

describe("safeParseJson", () => {
	it("should parse valid JSON string", () => {
		const result = Effect.runSync(safeParseJson('{"key":"value"}', null));
		expect(result).toEqual({ key: "value" });
	});

	it("should return defaultValue on invalid JSON", () => {
		const result = Effect.runSync(safeParseJson("invalid json", { default: true }));
		expect(result).toEqual({ default: true });
	});

	it("should parse and validate with schema successfully", () => {
		const schema = Schema.Struct({
			name: Schema.String,
			age: Schema.Number,
		});
		const result = Effect.runSync(
			safeParseJson('{"name":"John","age":30}', { name: "", age: 0 }, schema),
		);
		expect(result).toEqual({ name: "John", age: 30 });
	});

	it("should return defaultValue on schema validation error", () => {
		const schema = Schema.Struct({
			name: Schema.String,
			age: Schema.Number,
		});
		const result = Effect.runSync(
			safeParseJson('{"name":"John","age":"thirty"}', { name: "", age: 0 }, schema),
		);
		expect(result).toEqual({ name: "", age: 0 });
	});

	it("should handle null input directly", () => {
		const result = Effect.runSync(safeParseJson(null, "default"));
		expect(result).toBeNull();
	});

	it("should handle already parsed object", () => {
		const input = { key: "value" };
		const result = Effect.runSync(safeParseJson(input, null));
		expect(result).toEqual(input);
	});

	it("should handle undefined input directly", () => {
		const result = Effect.runSync(safeParseJson(undefined, "default"));
		expect(result).toBeUndefined();
	});

	it("should handle arrays with schema and default", () => {
		const schema = Schema.Array(Schema.String);
		const result = Effect.runSync(safeParseJson('["a","b","c"]', [], schema));
		expect(result).toEqual(["a", "b", "c"]);
	});

	it("should return default array on invalid input", () => {
		const schema = Schema.Array(Schema.String);
		const result = Effect.runSync(safeParseJson(123, [], schema));
		expect(result).toEqual([]);
	});
});
