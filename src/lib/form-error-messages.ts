export function extractFormErrorMessages(errors: unknown): string[] {
	const toMessages = (value: unknown): string[] => {
		if (typeof value === "string") return [value];
		if (typeof value === "number" || typeof value === "boolean") {
			return [String(value)];
		}
		if (Array.isArray(value)) return value.flatMap(toMessages);
		if (!value || typeof value !== "object") return [];

		const obj = value as Record<string, unknown>;
		const direct = typeof obj.message === "string" ? [obj.message] : [];
		const nested = [obj.error, obj.errors, obj.issue, obj.issues].flatMap(toMessages);
		return [...direct, ...nested];
	};

	const source =
		errors && typeof errors === "object" && !Array.isArray(errors)
			? Object.values(errors as Record<string, unknown>)
			: errors;
	const messages = toMessages(source).filter(Boolean);
	return messages.length > 0 ? Array.from(new Set(messages)) : [];
}
