import { Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";

import {
	Email,
	NonEmpty,
	MinLength,
	MaxLength,
	LengthBetween,
	RequiredString,
	Password,
} from "./validation-schemas";

const assertFailure = <A>(schema: Schema.Schema<A>, value: unknown) => {
	const result = Schema.decodeUnknownEither(schema)(value);
	expect(result._tag).toBe("Left");
};

const assertSuccess = <A>(schema: Schema.Schema<A>, value: unknown) => {
	const result = Schema.decodeUnknownEither(schema)(value);
	expect(result._tag).toBe("Right");
};

describe("Email schema", () => {
	it("should accept valid emails", () => {
		assertSuccess(Email, "user@example.com");
		assertSuccess(Email, "user.name@example.co.id");
		assertSuccess(Email, "user+tag@example.com");
	});

	it("should reject invalid emails", () => {
		assertFailure(Email, "not-an-email");
		assertFailure(Email, "missing@");
		assertFailure(Email, "@missing.com");
		assertFailure(Email, "");
	});
});

describe("NonEmpty schema", () => {
	it("should accept non-empty string", () => {
		assertSuccess(NonEmpty("Field"), "hello");
	});

	it("should reject empty string", () => {
		assertFailure(NonEmpty("Field"), "");
	});
});

describe("RequiredString schema", () => {
	it("should accept non-empty string", () => {
		assertSuccess(RequiredString, "hello");
	});

	it("should reject empty string", () => {
		assertFailure(RequiredString, "");
	});

	it("should not accept null", () => {
		assertFailure(RequiredString, null);
	});
});

describe("MinLength schema", () => {
	it("should accept strings meeting minimum length", () => {
		assertSuccess(MinLength("Field", 5), "hello");
		assertSuccess(MinLength("Field", 5), "hello world");
	});

	it("should reject strings below minimum length", () => {
		assertFailure(MinLength("Field", 5), "hi");
	});
});

describe("MaxLength schema", () => {
	it("should accept strings within maximum length", () => {
		assertSuccess(MaxLength("Field", 10), "hi");
		assertSuccess(MaxLength("Field", 10), "1234567890");
	});

	it("should reject strings exceeding maximum length", () => {
		assertFailure(MaxLength("Field", 10), "12345678901");
	});
});

describe("LengthBetween schema", () => {
	it("should accept strings within range", () => {
		assertSuccess(LengthBetween("Field", 2, 5), "hello");
		assertSuccess(LengthBetween("Field", 2, 5), "ab");
		assertSuccess(LengthBetween("Field", 2, 5), "abcde");
	});

	it("should reject strings outside range", () => {
		assertFailure(LengthBetween("Field", 2, 5), "a");
		assertFailure(LengthBetween("Field", 2, 5), "abcdef");
	});
});

describe("Password schema", () => {
	const pwd = Password(8);

	it("should accept passwords meeting minimum length", () => {
		assertSuccess(pwd, "12345678");
		assertSuccess(pwd, "a".repeat(8));
	});

	it("should reject passwords below minimum length", () => {
		assertFailure(pwd, "1234567");
		assertFailure(pwd, "");
	});

	it("should use custom minimum length", () => {
		const short = Password(4);
		assertSuccess(short, "abcd");
		assertFailure(short, "abc");
	});
});
