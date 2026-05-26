import { Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { WhitelistCsvRow, WhitelistImportFailedError } from "./whitelist-service.shared";

function assertParses(value: unknown) {
	return Schema.decodeUnknownSync(WhitelistCsvRow)(value);
}

function assertFails(value: unknown) {
	expect(() => Schema.decodeUnknownSync(WhitelistCsvRow)(value)).toThrow();
}

describe("WhitelistCsvRow schema", () => {
	it("should validate a valid CSV row", () => {
		const row = assertParses({ studentId: "s12345", name: "Alice" });
		expect(row.studentId).toBe("s12345");
		expect(row.name).toBe("Alice");
		expect(row.cohortId).toBeUndefined();
	});

	it("should reject row with empty studentId", () => {
		assertFails({ studentId: "", name: "Alice" });
	});

	it("should reject row with empty name", () => {
		assertFails({ studentId: "s12345", name: "" });
	});

	it("should accept row with optional cohortId", () => {
		const row = assertParses({ studentId: "s12345", name: "Alice", cohortId: "c1" });
		expect(row.cohortId).toBe("c1");
	});

	it("should accept row with null cohortId", () => {
		const row = assertParses({ studentId: "s12345", name: "Alice", cohortId: null });
		// nullable with optionalWith converts null to undefined
		expect(row.cohortId).toBeUndefined();
	});
});

describe("WhitelistImportFailedError", () => {
	it("should create error with message", () => {
		const error = new WhitelistImportFailedError({ message: "Failed to parse CSV" });
		expect(error._tag).toBe("WhitelistImportFailedError");
		expect(error.message).toBe("Failed to parse CSV");
	});
});
