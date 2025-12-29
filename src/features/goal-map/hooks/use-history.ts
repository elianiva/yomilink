import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import {
	edgesAtom,
	historyAtom,
	historyPointerAtom,
	isApplyingHistoryAtom,
	nodesAtom,
	rfInstanceAtom,
} from "../lib/atoms";

export function useHistory() {
	const nodes = useAtomValue(nodesAtom);
	const edges = useAtomValue(edgesAtom);
	const [history, setHistory] = useAtom(historyAtom);
	const [pointer, setPointer] = useAtom(historyPointerAtom);
	const setIsApplying = useSetAtom(isApplyingHistoryAtom);
	const rfInstance = useAtomValue(rfInstanceAtom);

	const undo = useCallback(() => {
		if (pointer <= 0) return;
		const newPointer = pointer - 1;
		setPointer(newPointer);
		const snap = history[newPointer];
		setIsApplying(true);
		rfInstance?.setNodes(snap.nodes);
		rfInstance?.setEdges(snap.edges);
		requestAnimationFrame(() => {
			setIsApplying(false);
		});
	}, [pointer, history, setPointer, setIsApplying, rfInstance]);

	const redo = useCallback(() => {
		if (pointer >= history.length - 1) return;
		const newPointer = pointer + 1;
		setPointer(newPointer);
		const snap = history[newPointer];
		setIsApplying(true);
		rfInstance?.setNodes(snap.nodes);
		rfInstance?.setEdges(snap.edges);
		requestAnimationFrame(() => {
			setIsApplying(false);
		});
	}, [pointer, history, setPointer, setIsApplying, rfInstance]);

	const isApplying = useAtomValue(isApplyingHistoryAtom);

	useEffect(() => {
		if (isApplying) return;
		const current = { nodes, edges };
		const last = history[pointer];
		const same =
			JSON.stringify(current.nodes) === JSON.stringify(last?.nodes) &&
			JSON.stringify(current.edges) === JSON.stringify(last?.edges);
		if (same) return;
		const newHistory = history.slice(0, pointer + 1);
		newHistory.push({
			nodes: JSON.parse(JSON.stringify(nodes)),
			edges: JSON.parse(JSON.stringify(edges)),
		});
		setHistory(newHistory);
		setPointer(pointer + 1);
	}, [nodes, edges, history, pointer, isApplying, setHistory, setPointer]);

	return { undo, redo };
}
