import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import type { Connection, MarkerType, NodeMouseHandler } from "@xyflow/react";
import { addEdge } from "@xyflow/react";
import type {
	ConnectorNodeData,
	TextNodeData,
} from "@/features/kitbuild/types";
import {
	connectionModeAtom,
	contextMenuAtom,
	directionEnabledAtom,
	editNodeAtom,
	edgesAtom,
	nodesAtom,
} from "../lib/atoms";

export function useContextMenu() {
	const [nodes, setNodes] = useAtom(nodesAtom);
	const setEdges = useSetAtom(edgesAtom);
	const [contextMenu, setContextMenu] = useAtom(contextMenuAtom);
	const [connectionMode, setConnectionMode] = useAtom(connectionModeAtom);
	const [editNode, setEditNode] = useAtom(editNodeAtom);
	const directionEnabled = useAtomValue(directionEnabledAtom);

	const handleContextMenuEdit = useCallback(() => {
		if (!contextMenu) return;

		const node = nodes.find((n) => n.id === contextMenu.nodeId);
		if (!node) return;

		if (contextMenu.nodeType === "text") {
			const data = node.data as TextNodeData;
			setEditNode({
				id: node.id,
				type: "text",
				label: data.label,
				color: data.color,
			});
		} else {
			const data = node.data as ConnectorNodeData;
			setEditNode({
				id: node.id,
				type: "connector",
				label: data.label,
			});
		}
		setContextMenu(null);
	}, [contextMenu, nodes, setEditNode, setContextMenu]);

	const handleContextMenuDelete = useCallback(() => {
		if (!contextMenu) return;

		setNodes((nds) => nds.filter((n) => n.id !== contextMenu.nodeId));
		setEdges((eds) =>
			eds.filter(
				(e) =>
					e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId,
			),
		);
		setContextMenu(null);
	}, [contextMenu, setNodes, setEdges, setContextMenu]);

	const handleConnectTo = useCallback(() => {
		if (!contextMenu || contextMenu.nodeType !== "connector") return;

		setConnectionMode({
			active: true,
			linkNodeId: contextMenu.nodeId,
			direction: "to",
		});
		setContextMenu(null);
	}, [contextMenu, setConnectionMode, setContextMenu]);

	const handleConnectFrom = useCallback(() => {
		if (!contextMenu || contextMenu.nodeType !== "connector") return;

		setConnectionMode({
			active: true,
			linkNodeId: contextMenu.nodeId,
			direction: "from",
		});
		setContextMenu(null);
	}, [contextMenu, setConnectionMode, setContextMenu]);

	const handleEditNodeConfirm = useCallback(
		(data: { label: string; color?: string }) => {
			if (!editNode) return;

			setNodes((nds) =>
				nds.map((n) => {
					if (n.id !== editNode.id) return n;

					if (editNode.type === "text") {
						return {
							...n,
							data: {
								...n.data,
								label: data.label,
								color: data.color,
							},
						};
					}
					return {
						...n,
						data: {
							...n.data,
							label: data.label,
						},
					};
				}),
			);
			setEditNode(null);
		},
		[editNode, setNodes, setEditNode],
	);

	const onNodeClick: NodeMouseHandler = useCallback(
		(_event, node) => {
			if (connectionMode?.active) {
				const clickedType = node.type;

				if (clickedType !== "text") {
					return;
				}

				const newEdge = {
					id: `e-${connectionMode.linkNodeId}-${node.id}`,
					source:
						connectionMode.direction === "to"
							? connectionMode.linkNodeId
							: node.id,
					target:
						connectionMode.direction === "to"
							? node.id
							: connectionMode.linkNodeId,
					type: "floating",
					style: { stroke: "#16a34a", strokeWidth: 3 },
					markerEnd: directionEnabled
						? { type: "arrowclosed" as MarkerType, color: "#16a34a" }
						: undefined,
				};

				setEdges((eds) => [...eds, newEdge]);
				setConnectionMode(null);
				return;
			}

			const nodeType = node.type as "text" | "connector";
			const target = _event.target as HTMLElement;
			const nodeElement = target.closest(
				".react-flow__node",
			) as HTMLElement | null;

			if (nodeElement) {
				const rect = nodeElement.getBoundingClientRect();
				setContextMenu({
					nodeId: node.id,
					nodeType,
					position: {
						x: rect.left + rect.width / 2,
						y: rect.top,
					},
				});
			}
		},
		[
			connectionMode,
			directionEnabled,
			setEdges,
			setConnectionMode,
			setContextMenu,
		],
	);

	const onPaneClick = useCallback(() => {
		setContextMenu(null);
		setConnectionMode(null);
	}, [setContextMenu, setConnectionMode]);

	const onConnect = useCallback(
		(
			params: Connection,
			getNodeType: (id: string | null) => string | undefined,
		) => {
			const sType = getNodeType(params.source ?? null);
			const tType = getNodeType(params.target ?? null);
			const ok =
				(sType === "text" && tType === "connector") ||
				(sType === "connector" && tType === "text");
			if (!ok) return;
			setEdges((eds) => addEdge(params, eds));
		},
		[setEdges],
	);

	return {
		contextMenu,
		editNode,
		setEditNode,
		onNodeClick,
		onPaneClick,
		onConnect,
		handleContextMenuEdit,
		handleContextMenuDelete,
		handleConnectTo,
		handleConnectFrom,
		handleEditNodeConfirm,
	};
}
