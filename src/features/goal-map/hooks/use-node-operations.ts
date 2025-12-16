import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import type { TailwindColor } from "@/features/kitbuild/components/color-picker";
import type {
	ConnectorNodeData,
	ImageNodeData,
	TextNodeData,
} from "@/features/kitbuild/types";
import { edgesAtom, nodesAtom, rfInstanceAtom } from "../lib/atoms";

export function useNodeOperations() {
	const [nodes, setNodes] = useAtom(nodesAtom);
	const setEdges = useSetAtom(edgesAtom);
	const rfInstance = useAtomValue(rfInstanceAtom);

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
				data: { label: label.trim(), color: color.value } as TextNodeData,
			},
		]);
	};

	const addConnectorNode = (
		label: string,
		viewport?: { x: number; y: number; zoom: number },
	) => {
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
				data: { label: label.trim() } as ConnectorNodeData,
			},
		]);
	};

	const addImageNode = (
		url: string,
		caption?: string,
		viewport?: { x: number; y: number; zoom: number },
	) => {
		if (!url) return;
		const id = crypto.randomUUID();
		const centerX = viewport ? -viewport.x / viewport.zoom + 600 : 600;
		const centerY = viewport ? -viewport.y / viewport.zoom + 240 : 240;

		setNodes((nds) => [
			...nds,
			{
				id,
				type: "image",
				position: {
					x: centerX + Math.random() * 50,
					y: centerY + Math.random() * 50,
				},
				data: { url, caption } as ImageNodeData,
			},
		]);
	};

	const deleteSelected = () => {
		setNodes((nds) => nds.filter((n) => !n.selected));
		setEdges((eds) => eds.filter((e) => !e.selected));
	};

	const selectNode = (nodeId: string) => {
		const node = nodes.find((n) => n.id === nodeId);
		if (node && rfInstance) {
			// Center on the node
			rfInstance.setCenter(node.position.x + 75, node.position.y + 25, {
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
		addImageNode,
		deleteSelected,
		selectNode,
	};
}
