import { useAtom } from "jotai";
import { atom } from "jotai";
import { useCallback } from "react";

import { randomString } from "@/lib/utils";

export type SaveMeta = {
	topicId: string;
	name: string;
	description: string;
};

export const saveMetaAtom = atom<SaveMeta>({
	topicId: "",
	name: "",
	description: "",
});

export const saveOpenAtom = atom(false);
export const saveAsOpenAtom = atom(false);
export const saveErrorAtom = atom<string | null>(null);
export const saveWarningsAtom = atom<string[]>([]);
export const lastSavedSnapshotAtom = atom<string | null>(null);

export function useSaveDialog() {
	const [saveMeta, setSaveMeta] = useAtom(saveMetaAtom);
	const [saveOpen, setSaveOpen] = useAtom(saveOpenAtom);
	const [saveAsOpen, setSaveAsOpen] = useAtom(saveAsOpenAtom);
	const [saveError, setSaveError] = useAtom(saveErrorAtom);
	const [saveWarnings, setSaveWarnings] = useAtom(saveWarningsAtom);
	const [lastSavedSnapshot, setLastSavedSnapshot] = useAtom(lastSavedSnapshotAtom);

	const updateMeta = useCallback(
		(updates: Partial<SaveMeta>) => {
			setSaveMeta((prev) => ({ ...prev, ...updates }));
		},
		[setSaveMeta],
	);

	const clearError = useCallback(() => {
		setSaveError(null);
	}, [setSaveError]);

	const clearWarnings = useCallback(() => {
		setSaveWarnings([]);
	}, [setSaveWarnings]);

	const addWarning = useCallback(
		(warning: string) => {
			setSaveWarnings((prev) => {
				const next = new Set([...prev, warning]);
				return Array.from(next);
			});
		},
		[setSaveWarnings],
	);

	const generateNewId = useCallback(() => {
		return randomString();
	}, []);

	return {
		saveMeta,
		updateMeta,
		saveOpen,
		setSaveOpen,
		saveAsOpen,
		setSaveAsOpen,
		saveError,
		setSaveError,
		clearError,
		saveWarnings,
		setSaveWarnings,
		clearWarnings,
		addWarning,
		lastSavedSnapshot,
		setLastSavedSnapshot,
		generateNewId,
	};
}
