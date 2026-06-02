import { describe, expect, it } from "vite-plus/test";

import {
	formatDate,
	formatDateTime,
	formatDuration,
	formatRelativeTime,
	parseDateInput,
} from "./date-utils";

describe("formatDate", () => {
	it("should format a timestamp", () => {
		const date = new Date("2025-06-15");
		const result = formatDate(date.getTime());
		expect(result).toBe("Jun 15, 2025");
	});

	it("should format a Date object", () => {
		const result = formatDate(new Date("2025-06-15"));
		expect(result).toBe("Jun 15, 2025");
	});

	it("should format a date string", () => {
		const result = formatDate("2025-06-15");
		expect(result).toBe("Jun 15, 2025");
	});
});

describe("formatDateTime", () => {
	it("should format with time", () => {
		const date = new Date("2025-06-15T14:30:00");
		const result = formatDateTime(date.getTime());
		expect(result).toMatch(/Jun 15, 2025 \d+:\d+ (AM|PM)/);
	});
});

describe("formatRelativeTime", () => {
	it("should return relative time", () => {
		const now = Date.now();
		const result = formatRelativeTime(now - 60000); // 1 minute ago
		expect(result).toContain("minute");
	});
});

describe("parseDateInput", () => {
	it("should parse valid date string", () => {
		const result = parseDateInput("2025-06-15");
		expect(result).toEqual(new Date("2025-06-15").getTime());
	});

	it("should return undefined for invalid date string", () => {
		expect(parseDateInput("not-a-date")).toBeUndefined();
	});

	it("should return undefined for undefined", () => {
		expect(parseDateInput(undefined)).toBeUndefined();
	});

	it("should return undefined for empty string", () => {
		expect(parseDateInput("")).toBeUndefined();
	});
});

describe("formatDuration", () => {
	it("should format seconds as m:ss", () => {
		expect(formatDuration(125)).toBe("2:05");
	});

	it("should pad seconds with zero", () => {
		expect(formatDuration(63)).toBe("1:03");
	});

	it("should handle zero", () => {
		expect(formatDuration(0)).toBe("0:00");
	});

	it("should handle only seconds", () => {
		expect(formatDuration(42)).toBe("0:42");
	});

	it("should handle large values", () => {
		expect(formatDuration(3661)).toBe("61:01");
	});
});
