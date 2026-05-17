import { useCallback, useEffect, useState, useRef } from "react";

const DRAFT_PREFIX = "form-";
const DRAFT_SUFFIX = "-draft";

function draftKey(userId: string, formId: string): string {
	return `${DRAFT_PREFIX}${userId}-${formId}${DRAFT_SUFFIX}`;
}

function tryRead<T>(key: string): T | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

function tryWrite(key: string, data: unknown): boolean {
	if (typeof window === "undefined") return false;
	try {
		localStorage.setItem(key, JSON.stringify(data));
		return true;
	} catch {
		return false;
	}
}

function tryRemove(key: string): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.removeItem(key);
	} catch {
		// Ignore
	}
}

export function useFormDraft(userId: string | undefined, formId: string | null) {
	const [answers, setAnswers] = useState<Record<string, string | number>>({});
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const answersRef = useRef(answers);

	const effectiveKey = userId && formId ? draftKey(userId, formId) : null;

	// Keep answersRef in sync during render so interval callback has latest.
	answersRef.current = answers;

	// Restore draft from localStorage when key changes
	useEffect(() => {
		if (!effectiveKey) {
			setAnswers({});
			return;
		}
		const saved = tryRead<Record<string, string | number>>(effectiveKey);
		setAnswers(saved ?? {});
	}, [effectiveKey]);

	// Steady-interval auto-save
	useEffect(() => {
		if (!effectiveKey) return;
		const key = effectiveKey;
		const interval = setInterval(() => {
			const current = answersRef.current;
			if (Object.keys(current).length > 0) {
				tryWrite(key, current);
				setLastSaved(new Date());
			}
		}, 5000);
		return () => clearInterval(interval);
	}, [effectiveKey]);

	const clearDraft = useCallback(() => {
		if (effectiveKey) tryRemove(effectiveKey);
	}, [effectiveKey]);

	const updateAnswer = useCallback((questionId: string, value: string | number) => {
		setAnswers((prev) => ({ ...prev, [questionId]: value }));
	}, []);

	return { answers, lastSaved, setAnswers, updateAnswer, clearDraft };
}
