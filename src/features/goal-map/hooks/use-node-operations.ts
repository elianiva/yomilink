import { useReactFlow } from "@xyflow/react";
import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";

import type { TailwindColor } from "@/features/kitbuild/components/color-picker";

import { edgesAtom, nodesAtom } from "../lib/atoms";

export function useNodeOperations() {
	const [nodes, setNodes] = useAtom(nodesAtom);
	const setEdges = useSetAtom(edgesAtom);
	const { setCenter } = useReactFlow();

	const getNodeType = useCallback(
		(id?: string | null) => nodes.find((n) => n.id === id)?.type,
		[nodes],
	);

	const addTextNode = (
		label: string,
		color: TailwindColor,
		viewport?: { x: number; y: number; zoom: number },
	) => {
		if (!label.trim()) return;
		const id = crypto.randomUUID();
		const centerX = viewport ? -viewport.x / viewport.zoom + 400 : 200;
		const centerY = viewport ? -viewport.y / viewport.zoom + 300 : 200;

		setNodes((nds) => [
			...nds,
			{
				id,
				type: "text",
				position: {
					x: centerX + Math.random() * 50,
					y: centerY + Math.random() * 50,
				},
				data: { label: label.trim(), color: color.value },
			},
		]);
	};

	const addConnectorNode = (label: string, viewport?: { x: number; y: number; zoom: number }) => {
		if (!label.trim()) return;
		const id = crypto.randomUUID();
		const centerX = viewport ? -viewport.x / viewport.zoom + 400 : 300;
		const centerY = viewport ? -viewport.y / viewport.zoom + 300 : 250;

		setNodes((nds) => [
			...nds,
			{
				id,
				type: "connector",
				position: {
					x: centerX + Math.random() * 50,
					y: centerY + Math.random() * 50,
				},
				data: { label: label.trim() },
			},
		]);
	};

	const deleteSelected = () => {
		setNodes((nodes) => nodes.filter((n) => !n.selected));
		setEdges((edges) => edges.filter((e) => !e.selected));
	};

	const selectNode = (nodeId: string) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node) {
			// Center on the node
			setCenter(node.position.x + 75, node.position.y + 25, {
				zoom: 1.5,
				duration: 500,
			});
			// Select the node
			setNodes((nds) =>
				nds.map((n) => ({
					...n,
					selected: n.id === nodeId,
				})),
			);
		}
	};

	return {
		getNodeType,
		addTextNode,
		addConnectorNode,
		deleteSelected,
		selectNode,
	};
}
