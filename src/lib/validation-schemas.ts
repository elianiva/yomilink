import { Schema } from "effect";

export const messages = {
	required: (field: string) => `${field} is required`,
	minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
	maxLength: (field: string, max: number) => `${field} must be at most ${max} characters`,
	pattern: (field: string, description: string) => `${field} ${description}`,
	email: () => "Please enter a valid email address",
	password: {
		minLength: (min: number) => `Password must be at least ${min} characters`,
		uppercase: () => "Password must include at least one uppercase letter",
		lowercase: () => "Password must include at least one lowercase letter",
		numberOrSpecial: () => "Password must include at least one number or special character",
	},
	confirmPassword: () => "Passwords do not match",
	consent: () => "You must give consent to participate in this research",
} as const;

export const Email = Schema.String.pipe(
	Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
		message: () => messages.email(),
	}),
);

export const Password = (minLength = 8) =>
	Schema.String.pipe(
		Schema.minLength(minLength, {
			message: () => messages.password.minLength(minLength),
		}),
	);

export const NonEmpty = (fieldName: string) =>
	Schema.String.pipe(
		Schema.minLength(1, {
			message: () => messages.required(fieldName),
		}),
	);

export const MinLength = (fieldName: string, min: number) =>
	Schema.String.pipe(
		Schema.minLength(min, {
			message: () => messages.minLength(fieldName, min),
		}),
	);

export const MaxLength = (fieldName: string, max: number) =>
	Schema.String.pipe(
		Schema.maxLength(max, {
			message: () => messages.maxLength(fieldName, max),
		}),
	);

export const LengthBetween = (fieldName: string, min: number, max: number) =>
	Schema.String.pipe(
		Schema.minLength(min, {
			message: () => messages.minLength(fieldName, min),
		}),
		Schema.maxLength(max, {
			message: () => messages.maxLength(fieldName, max),
		}),
	);

export const RequiredString = Schema.String.pipe(
	Schema.minLength(1, { message: () => "This field is required" }),
);
