import { describe, expect, it } from "vite-plus/test";

import { normalizeStudentId, studentIdToAuthEmail } from "./student-id-auth";

describe("normalizeStudentId", () => {
	it("should trim whitespace", () => {
		expect(normalizeStudentId("  ABC123  ")).toBe("abc123");
	});

	it("should convert to lowercase", () => {
		expect(normalizeStudentId("ABC123")).toBe("abc123");
	});

	it("should handle mixed case and spaces", () => {
		expect(normalizeStudentId("  AbC 123  ")).toBe("abc 123");
	});

	it("should handle already normalized string", () => {
		expect(normalizeStudentId("abc123")).toBe("abc123");
	});

	it("should handle empty string", () => {
		expect(normalizeStudentId("")).toBe("");
	});

	it("should handle string with only spaces", () => {
		expect(normalizeStudentId("   ")).toBe("");
	});
});

describe("studentIdToAuthEmail", () => {
	it("should normalize and append domain", () => {
		expect(studentIdToAuthEmail("ABC123")).toBe("abc123@kitbuild.mail");
	});

	it("should trim and normalize", () => {
		expect(studentIdToAuthEmail("  Student_01  ")).toBe("student_01@kitbuild.mail");
	});

	it("should handle lowercase input", () => {
		expect(studentIdToAuthEmail("s12345")).toBe("s12345@kitbuild.mail");
	});
});
