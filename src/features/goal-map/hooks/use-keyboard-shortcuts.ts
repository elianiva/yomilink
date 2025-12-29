import { useSetAtom } from "jotai";
import { useEffect } from "react";
import {
	contextMenuAtom,
	connectionModeAtom,
	saveOpenAtom,
} from "../lib/atoms";

export function useKeyboardShortcuts(
	saving: boolean,
	doSave: (meta: { topicId: string; name: string }) => void,
	saveName: string,
	saveTopicId: string,
	isNewMap: boolean,
) {
	const setContextMenu = useSetAtom(contextMenuAtom);
	const setConnectionMode = useSetAtom(connectionModeAtom);
	const setSaveOpen = useSetAtom(saveOpenAtom);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setContextMenu(null);
				setConnectionMode(null);
			}
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				if (saving) return;
				if (isNewMap || !saveName.trim()) {
					setSaveOpen(true);
				} else {
					doSave({ topicId: saveTopicId, name: saveName.trim() });
				}
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		setContextMenu,
		setConnectionMode,
		saving,
		doSave,
		saveTopicId,
		saveName,
		setSaveOpen,
		isNewMap,
	]);
}
