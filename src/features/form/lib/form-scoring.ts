export type ScorableMcqOptions = {
	type: "mcq";
	correctOptionIds: ReadonlyArray<string>;
};

export function normalizeSelectedAnswerIds(answer: unknown): string[] {
	if (Array.isArray(answer)) {
		return answer.map((value) => String(value));
	}

	if (typeof answer === "string" || typeof answer === "number") {
		return [String(answer)];
	}

	return [];
}

export function isCorrectMcqAnswer(
	options: ScorableMcqOptions | null | undefined,
	answer: unknown,
): boolean | null {
	if (!options || options.correctOptionIds.length === 0) {
		return null;
	}

	const selectedAnswerIds = normalizeSelectedAnswerIds(answer);
	if (selectedAnswerIds.length === 0) {
		return false;
	}

	return selectedAnswerIds.some((selected) => options.correctOptionIds.includes(selected));
}
