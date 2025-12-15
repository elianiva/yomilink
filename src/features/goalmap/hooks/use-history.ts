import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import {
	historyAtom,
	historyPointerAtom,
	isApplyingHistoryAtom,
	nodesAtom,
	edgesAtom,
} from "../lib/atoms";

export function useHistory() {
	const nodes = useAtomValue(nodesAtom);
	const edges = useAtomValue(edgesAtom);
	const [history, setHistory] = useAtom(historyAtom);
	const [pointer, setPointer] = useAtom(historyPointerAtom);
	const isApplying = useAtomValue(isApplyingHistoryAtom);

	// Track changes and build history
	useEffect(() => {
		if (isApplying) return;
		const current = { nodes, edges };
		const last = history[pointer];
		const same =
			JSON.stringify(current.nodes) === JSON.stringify(last.nodes) &&
			JSON.stringify(current.edges) === JSON.stringify(last.edges);
		if (same) return;
		const newHistory = history.slice(0, pointer + 1);
		newHistory.push({
			nodes: JSON.parse(JSON.stringify(nodes)),
			edges: JSON.parse(JSON.stringify(edges)),
		});
		setHistory(newHistory);
		setPointer(pointer + 1);
	}, [nodes, edges, history, pointer, isApplying, setHistory, setPointer]);
}
