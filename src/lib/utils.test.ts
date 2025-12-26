import { describe, expect, it } from "vitest";
import { cn, randomString } from "./utils";

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
