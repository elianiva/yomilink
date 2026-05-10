import { useCallback, useEffect, useState, useRef } from "react";

const DRAFT_PREFIX = "form-";
const DRAFT_SUFFIX = "-draft";

function draftKey(formId: string): string {
	return `${DRAFT_PREFIX}${formId}${DRAFT_SUFFIX}`;
}

function tryRead<T>(formId: string): T | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(draftKey(formId));
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

function tryWrite(formId: string, data: unknown): boolean {
	if (typeof window === "undefined") return false;
	try {
		localStorage.setItem(draftKey(formId), JSON.stringify(data));
		return true;
	} catch {
		return false;
	}
}

function tryRemove(formId: string): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.removeItem(draftKey(formId));
	} catch {
		// Ignore
	}
}

export function useFormDraft(formId: string | null) {
	const [answers, setAnswers] = useState<Record<string, string | number>>({});
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const answersRef = useRef(answers);

	// Keep ref in sync
	answersRef.current = answers;

	// Restore draft from localStorage when formId changes
	useEffect(() => {
		if (!formId) {
			setAnswers({});
			return;
		}
		const saved = tryRead<Record<string, string | number>>(formId);
		setAnswers(saved ?? {});
	}, [formId]);

	// Steady-interval auto-save (does not reset on every answer change)
	useEffect(() => {
		if (!formId) return;
		const interval = setInterval(() => {
			const current = answersRef.current;
			if (Object.keys(current).length > 0) {
				tryWrite(formId, current);
				setLastSaved(new Date());
			}
		}, 5000);
		return () => clearInterval(interval);
	}, [formId]);

	const clearDraft = useCallback(() => {
		if (formId) tryRemove(formId);
	}, [formId]);

	const updateAnswer = useCallback((questionId: string, value: string | number) => {
		setAnswers((prev) => ({ ...prev, [questionId]: value }));
	}, []);

	return { answers, lastSaved, setAnswers, updateAnswer, clearDraft };
}
