import { createFileRoute, useNavigate } from "@tanstack/react-router";
import "@xyflow/react/dist/style.css";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { MarkerType } from "@xyflow/react";
import {
	addEdge,
	Background,
	type Connection,
	Controls,
	MiniMap,
	ReactFlow,
} from "@xyflow/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { Guard } from "@/components/auth/Guard";
import { AddConceptDialog } from "@/features/goalmap/components/add-concept-dialog";
import { AddLinkDialog } from "@/features/goalmap/components/add-link-dialog";
import type { TailwindColor } from "@/features/goalmap/components/color-picker";
import ConnectorNode from "@/features/goalmap/components/connector-node";
import { EditorToolbar } from "@/features/goalmap/components/editor-toolbar";
import { ImportMaterialDialog } from "@/features/goalmap/components/import-material-dialog";
import {
	SaveDialog,
	WarningsPanel,
} from "@/features/goalmap/components/save-dialog";
import { SearchNodesPanel } from "@/features/goalmap/components/search-nodes-panel";
import TextNode from "@/features/goalmap/components/TextNode";
import { useHistory } from "@/features/goalmap/hooks/use-history";
import { useNodeOperations } from "@/features/goalmap/hooks/use-node-operations";
import {
	conceptDialogOpenAtom,
	directionEnabledAtom,
	edgesAtom,
	historyAtom,
	historyPointerAtom,
	isApplyingHistoryAtom,
	isHydratedAtom,
	lastSavedSnapshotAtom,
	linkDialogOpenAtom,
	materialTextAtom,
	nodesAtom,
	rfInstanceAtom,
	saveAsOpenAtom,
	saveErrorAtom,
	saveNameAtom,
	saveOpenAtom,
	saveTopicAtom,
	saveWarningsAtom,
	searchOpenAtom,
	selectedColorAtom,
} from "@/features/goalmap/lib/atoms";
import { getLayoutedElements } from "@/features/goalmap/lib/layout";
import { GoalMapRpc, saveToLocalStorage } from "@/server/rpc/goal-map";
import { generateKit } from "@/server/rpc/kit";

export const Route = createFileRoute("/dashboard/goal/$goalMapId")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<TeacherGoalMapEditor />
		</Guard>
	),
});

function TeacherGoalMapEditor() {
	const nodeTypes = useMemo(
		() => ({
			text: TextNode,
			connector: ConnectorNode,
		}),
		[],
	);

	// Atom state
	const [nodes, setNodes] = useAtom(nodesAtom);
	const [edges, setEdges] = useAtom(edgesAtom);
	const [rfInstance, setRfInstance] = useAtom(rfInstanceAtom);
	const [selectedColor, setSelectedColor] = useAtom(selectedColorAtom);
	const [conceptDialogOpen, setConceptDialogOpen] = useAtom(
		conceptDialogOpenAtom,
	);
	const [linkDialogOpen, setLinkDialogOpen] = useAtom(linkDialogOpenAtom);
	const [searchOpen, setSearchOpen] = useAtom(searchOpenAtom);
	const [directionEnabled, setDirectionEnabled] = useAtom(directionEnabledAtom);
	const [saveOpen, setSaveOpen] = useAtom(saveOpenAtom);
	const [saveAsOpen, setSaveAsOpen] = useAtom(saveAsOpenAtom);
	const [saveTopic, setSaveTopic] = useAtom(saveTopicAtom);
	const [saveName, setSaveName] = useAtom(saveNameAtom);
	const [saveError, setSaveError] = useAtom(saveErrorAtom);
	const [saveWarnings, setSaveWarnings] = useAtom(saveWarningsAtom);
	const [lastSavedSnapshot, setLastSavedSnapshot] = useAtom(
		lastSavedSnapshotAtom,
	);
	const history = useAtomValue(historyAtom);
	const [historyPointer, setHistoryPointer] = useAtom(historyPointerAtom);
	const [, setIsApplying] = useAtom(isApplyingHistoryAtom);
	const [isHydrated, setIsHydrated] = useAtom(isHydratedAtom);

	const { goalMapId } = Route.useParams();
	const navigate = useNavigate();

	const { data: existing } = useQuery({
		...GoalMapRpc.getGoalMap({ id: goalMapId }),
		enabled: goalMapId !== "new",
	});

	useEffect(() => {
		if (goalMapId === "new") {
			const id = crypto.randomUUID();
			navigate({
				to: "/dashboard/goal/$goalMapId",
				params: { goalMapId: id },
				replace: true,
			});
		}
	}, [goalMapId, navigate]);

	// Use extracted hooks
	useHistory();
	const materialText = useAtomValue(materialTextAtom);
	const setMaterialText = useSetAtom(materialTextAtom);
	const {
		getNodeType,
		addTextNode,
		addConnectorNode,
		deleteSelected,
		selectNode,
	} = useNodeOperations();

	// Undo/redo functions
	const undo = useCallback(() => {
		if (historyPointer <= 0) return;
		const newPointer = historyPointer - 1;
		setHistoryPointer(newPointer);
		const snap = history[newPointer];
		setIsApplying(true);
		setNodes(snap.nodes);
		setEdges(snap.edges);
		requestAnimationFrame(() => {
			setIsApplying(false);
		});
	}, [
		history,
		historyPointer,
		setHistoryPointer,
		setIsApplying,
		setNodes,
		setEdges,
	]);

	const redo = useCallback(() => {
		if (historyPointer >= history.length - 1) return;
		const newPointer = historyPointer + 1;
		setHistoryPointer(newPointer);
		const snap = history[newPointer];
		setIsApplying(true);
		setNodes(snap.nodes);
		setEdges(snap.edges);
		requestAnimationFrame(() => {
			setIsApplying(false);
		});
	}, [
		history,
		historyPointer,
		setHistoryPointer,
		setIsApplying,
		setNodes,
		setEdges,
	]);

	const saveGoalMapMutation = useMutation(GoalMapRpc.saveGoalMap());
	const saving = saveGoalMapMutation.isPending;

	useEffect(() => {
		if (existing && !isHydrated) {
			try {
				const loadedNodes = Array.isArray(existing.nodes) ? existing.nodes : [];
				const loadedEdges = Array.isArray(existing.edges) ? existing.edges : [];
				setNodes(loadedNodes);
				setEdges(loadedEdges);
				setSaveTopic(
					typeof existing.description === "string" ? existing.description : "",
				);
				setSaveName(typeof existing.title === "string" ? existing.title : "");
				setMaterialText(
					typeof existing.materialText === "string"
						? existing.materialText
						: "",
				);
				setLastSavedSnapshot(
					JSON.stringify({ nodes: loadedNodes, edges: loadedEdges }),
				);
			} finally {
				setIsHydrated(true);
			}
		}
	}, [
		existing,
		setNodes,
		setEdges,
		isHydrated,
		setIsHydrated,
		setSaveName,
		setSaveTopic,
		setMaterialText,
		setLastSavedSnapshot,
	]);

	// Add concept node from dialog
	const handleAddConcept = (data: { label: string; color: TailwindColor }) => {
		const viewport = rfInstance?.getViewport();
		addTextNode(data.label, data.color, viewport);
		setSelectedColor(data.color);
		setConceptDialogOpen(false);
	};

	// Add link/connector node from dialog
	const handleAddLink = (data: { label: string }) => {
		const viewport = rfInstance?.getViewport();
		addConnectorNode(data.label, viewport);
		setLinkDialogOpen(false);
	};

	const onConnect = useCallback(
		(params: Connection) => {
			const sType = getNodeType(params.source ?? null);
			const tType = getNodeType(params.target ?? null);
			const ok =
				(sType === "text" && tType === "connector") ||
				(sType === "connector" && tType === "text");
			if (!ok) {
				console.warn("invalid connection", sType, "→", tType);
				return;
			}
			setEdges((eds) => addEdge(params, eds));
		},
		[getNodeType, setEdges],
	);

	// Custom node change handler to wrap ReactFlow's onChange
	const onNodesChange = useCallback(
		(changes: any) => {
			setNodes((nds) => {
				// ReactFlow's applyNodeChanges equivalent
				return changes.reduce((acc: any, change: any) => {
					if (change.type === "remove") {
						return acc.filter((n: any) => n.id !== change.id);
					}
					if (change.type === "position") {
						return acc.map((n: any) =>
							n.id === change.id
								? { ...n, position: change.position || n.position }
								: n,
						);
					}
					if (change.type === "select") {
						return acc.map((n: any) =>
							n.id === change.id ? { ...n, selected: change.selected } : n,
						);
					}
					if (change.type === "dimensions") {
						return acc.map((n: any) =>
							n.id === change.id
								? {
										...n,
										measured: {
											width: change.dimensions.width,
											height: change.dimensions.height,
										},
									}
								: n,
						);
					}
					return acc;
				}, nds);
			});
		},
		[setNodes],
	);

	// Custom edge change handler
	const onEdgesChange = useCallback(
		(changes: any) => {
			setEdges((eds) => {
				return changes.reduce((acc: any, change: any) => {
					if (change.type === "remove") {
						return acc.filter((e: any) => e.id !== change.id);
					}
					if (change.type === "select") {
						return acc.map((e: any) =>
							e.id === change.id ? { ...e, selected: change.selected } : e,
						);
					}
					return acc;
				}, eds);
			});
		},
		[setEdges],
	);

	const zoomIn = () => rfInstance?.zoomIn?.();
	const zoomOut = () => rfInstance?.zoomOut?.();
	const fit = () => rfInstance?.fitView?.({ padding: 0.2 });
	const centerMap = () => rfInstance?.fitView?.({ padding: 0.2 });
	const toggleDirection = () => {
		setDirectionEnabled((prev) => !prev);
	};

	// Auto-layout nodes using dagre
	const autoLayout = () => {
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			nodes,
			edges,
			"LR",
		);
		setNodes(layoutedNodes);
		setEdges(layoutedEdges);
		// Fit view after layout
		setTimeout(() => {
			rfInstance?.fitView?.({ padding: 0.2 });
		}, 50);
	};

	const doSave = useCallback(
		(meta: { topic: string; name: string }, newGoalMapId?: string) => {
			setSaveError(null);
			const targetGoalMapId = newGoalMapId ?? goalMapId;

			const saveParams = {
				goalMapId: targetGoalMapId,
				title: meta.name,
				description: meta.topic,
				nodes,
				edges,
				materialText: materialText || undefined,
			};

			saveGoalMapMutation.mutate(saveParams, {
				onSuccess: () => {
					setLastSavedSnapshot(JSON.stringify({ nodes, edges }));
					if (newGoalMapId) {
						navigate({
							to: "/dashboard/goal/$goalMapId",
							params: { goalMapId: newGoalMapId },
						});
					}
				},
				onError: (error) => {
					// Check if it's an auth error, fallback to localStorage
					const message =
						error instanceof Error ? error.message : "Save failed";
					if (/unauthorized|forbidden/i.test(message)) {
						saveToLocalStorage(saveParams);
						setSaveWarnings((prev) => {
							const next = new Set([
								...(prev ?? []),
								"Saved locally (not signed in). Changes are only on this device.",
							]);
							return Array.from(next);
						});
						setLastSavedSnapshot(JSON.stringify({ nodes, edges }));
						if (newGoalMapId) {
							navigate({
								to: "/dashboard/goal/$goalMapId",
								params: { goalMapId: newGoalMapId },
							});
						}
					} else {
						setSaveError(message);
						console.error("goalmap.save error", message);
					}
				},
			});
		},
		[
			goalMapId,
			nodes,
			edges,
			materialText,
			navigate,
			setSaveError,
			setSaveWarnings,
			setLastSavedSnapshot,
			saveGoalMapMutation,
		],
	);

	// Handle Save As (create copy with new ID)
	const handleSaveAs = (meta: { topic: string; name: string }) => {
		const newId = crypto.randomUUID();
		doSave(meta, newId);
		setSaveAsOpen(false);
		setSaveTopic(meta.topic);
		setSaveName(meta.name);
	};

	const handleCreateKit = () => {
		saveGoalMapMutation.mutate(
			{
				goalMapId,
				title: saveName || "Untitled",
				description: saveTopic,
				nodes,
				edges,
			},
			{
				onSuccess: async () => {
					try {
						const gen = await generateKit({ data: { goalMapId } });
						console.log("kit.generate", gen);
					} catch (e) {
						console.error("kit.generate error", e);
					}
				},
				onError: (e) => {
					console.error("kit.generate error", e);
				},
			},
		);
	};

	// Initialize "dirty" baseline to current graph on first render
	useEffect(() => {
		if (lastSavedSnapshot === null) {
			setLastSavedSnapshot(JSON.stringify({ nodes, edges }));
		}
	}, [lastSavedSnapshot, nodes, edges, setLastSavedSnapshot]);

	// Cmd/Ctrl+S saves
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				if (saving) return;
				if (!saveTopic.trim() || !saveName.trim()) {
					setSaveOpen(true);
				} else {
					void doSave({ topic: saveTopic.trim(), name: saveName.trim() });
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [doSave, saving, saveTopic, saveName, setSaveOpen]);

	// Edge options with direction
	const edgeOptions = useMemo(
		() => ({
			style: { stroke: "#16a34a", strokeWidth: 3 },
			markerEnd: directionEnabled
				? { type: "arrowclosed" as MarkerType, color: "#16a34a" }
				: undefined,
		}),
		[directionEnabled],
	);

	// Update existing edges when direction changes
	useEffect(() => {
		setEdges((eds) =>
			eds.map((edge) => ({
				...edge,
				markerEnd: directionEnabled
					? { type: "arrowclosed" as MarkerType, color: "#16a34a" }
					: undefined,
			})),
		);
	}, [directionEnabled, setEdges]);

	return (
		<div className="space-y-3 h-full flex flex-col">
			{/* Toolbar */}
			<EditorToolbar
				onUndo={undo}
				onRedo={redo}
				onZoomIn={zoomIn}
				onZoomOut={zoomOut}
				onFit={fit}
				onCenterMap={centerMap}
				onToggleDirection={toggleDirection}
				onAutoLayout={autoLayout}
				onDelete={deleteSelected}
				onCreateKit={handleCreateKit}
				saving={saving}
			/>

			{/* Dialogs */}
			<AddConceptDialog
				open={conceptDialogOpen}
				defaultColor={selectedColor}
				onCancel={() => setConceptDialogOpen(false)}
				onConfirm={handleAddConcept}
			/>
			<AddLinkDialog
				open={linkDialogOpen}
				onCancel={() => setLinkDialogOpen(false)}
				onConfirm={handleAddLink}
			/>
			<ImportMaterialDialog />
			<SaveDialog
				open={saveOpen}
				saving={saving}
				defaultTopic={saveTopic}
				defaultName={saveName}
				onCancel={() => setSaveOpen(false)}
				onConfirm={async (meta) => {
					doSave(meta);
					setSaveOpen(false);
					setSaveTopic(meta.topic);
					setSaveName(meta.name);
				}}
			/>
			<SaveDialog
				open={saveAsOpen}
				saving={saving}
				defaultTopic={saveTopic}
				defaultName={saveName ? `${saveName} (copy)` : ""}
				onCancel={() => setSaveAsOpen(false)}
				onConfirm={handleSaveAs}
			/>

			{/* Warnings */}
			<WarningsPanel
				warnings={saveWarnings}
				onClear={() => setSaveWarnings([])}
			/>
			{saveError ? (
				<WarningsPanel
					warnings={[saveError]}
					variant="error"
					onClear={() => setSaveError(null)}
					className="mt-2"
				/>
			) : null}

			<div className="flex-1">
				{/* Canvas */}
				<div className="rounded-xl border bg-card relative h-full">
					<ReactFlow
						nodes={nodes}
						edges={edges}
						nodeTypes={nodeTypes}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						onConnect={onConnect}
						defaultEdgeOptions={edgeOptions}
						onInit={(instance) => {
							setRfInstance(instance);
						}}
						fitView
					>
						<MiniMap />
						<Background gap={16} />
						<Controls position="bottom-right" />
						<SearchNodesPanel
							open={searchOpen}
							nodes={nodes}
							onClose={() => setSearchOpen(false)}
							onSelectNode={selectNode}
						/>
					</ReactFlow>
				</div>
			</div>
		</div>
	);
}
