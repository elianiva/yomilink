import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { Connection, MarkerType, NodeMouseHandler } from "@xyflow/react";
import { addEdge, Background, MiniMap, ReactFlow } from "@xyflow/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { toast } from "sonner";
import { pageTitleAtom } from "@/lib/page-title";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Guard } from "@/components/auth/Guard";
import { AddConceptDialog } from "@/features/goal-map/components/add-concept-dialog";
import { AddLinkDialog } from "@/features/goal-map/components/add-link-dialog";
import { EditorToolbar } from "@/features/goal-map/components/editor-toolbar";
import { ImportMaterialDialog } from "@/features/goal-map/components/import-material-dialog";
import {
	SaveDialog,
	WarningsPanel,
} from "@/features/goal-map/components/save-dialog";
import { useHistory } from "@/features/goal-map/hooks/use-history";
import { useNodeOperations } from "@/features/goal-map/hooks/use-node-operations";
import {
	conceptDialogOpenAtom,
	connectionModeAtom,
	contextMenuAtom,
	directionEnabledAtom,
	edgesAtom,
	editNodeAtom,
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
	saveDescriptionAtom,
	saveErrorAtom,
	imagesAtom,
	saveNameAtom,
	saveOpenAtom,
	saveTopicIdAtom,
	saveWarningsAtom,
	searchOpenAtom,
} from "@/features/goal-map/lib/atoms";
import {
	DEFAULT_COLOR,
	getColorByValue,
	type TailwindColor,
} from "@/features/kitbuild/components/color-picker";
import { ConnectorNode } from "@/features/kitbuild/components/connector-node";
import { FloatingConnectionLine } from "@/features/kitbuild/components/floating-connection-line";
import { FloatingEdge } from "@/features/kitbuild/components/floating-edge";
import { NodeContextMenu } from "@/features/kitbuild/components/node-context-menu";
import { SearchNodesPanel } from "@/features/kitbuild/components/search-nodes-panel";
import { TextNode } from "@/features/kitbuild/components/text-node";
import { getLayoutedElements } from "@/features/kitbuild/lib/layout";
import type {
	ConnectorNodeData,
	TextNodeData,
} from "@/features/kitbuild/types";
import { cn, randomString } from "@/lib/utils";
import { GoalMapRpc, saveToLocalStorage } from "@/server/rpc/goal-map";
import { KitRpc } from "@/server/rpc/kit";
import { TopicRpc } from "@/server/rpc/topic";

export const Route = createFileRoute("/dashboard/goal-map/$goalMapId")({
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

	const edgeTypes = useMemo(
		() => ({
			floating: FloatingEdge,
		}),
		[],
	);

	// Atom state
	const [nodes, setNodes] = useAtom(nodesAtom);
	const [edges, setEdges] = useAtom(edgesAtom);
	const [rfInstance, setRfInstance] = useAtom(rfInstanceAtom);
	const setPageTitle = useSetAtom(pageTitleAtom);
	const [conceptDialogOpen, setConceptDialogOpen] = useAtom(
		conceptDialogOpenAtom,
	);
	const [linkDialogOpen, setLinkDialogOpen] = useAtom(linkDialogOpenAtom);
	const [searchOpen, setSearchOpen] = useAtom(searchOpenAtom);
	const [directionEnabled, setDirectionEnabled] = useAtom(directionEnabledAtom);
	const [saveOpen, setSaveOpen] = useAtom(saveOpenAtom);
	const [saveAsOpen, setSaveAsOpen] = useAtom(saveAsOpenAtom);
	const [saveTopicId, setSaveTopicId] = useAtom(saveTopicIdAtom);
	const [saveName, setSaveName] = useAtom(saveNameAtom);
	const [saveDescription, setSaveDescription] = useAtom(saveDescriptionAtom);
	const [saveError, setSaveError] = useAtom(saveErrorAtom);
	const [saveWarnings, setSaveWarnings] = useAtom(saveWarningsAtom);
	const [lastSavedSnapshot, setLastSavedSnapshot] = useAtom(
		lastSavedSnapshotAtom,
	);
	const history = useAtomValue(historyAtom);
	const [historyPointer, setHistoryPointer] = useAtom(historyPointerAtom);
	const [, setIsApplying] = useAtom(isApplyingHistoryAtom);
	const [isHydrated, setIsHydrated] = useAtom(isHydratedAtom);

	// Context menu and connection mode state
	const [contextMenu, setContextMenu] = useAtom(contextMenuAtom);
	const [connectionMode, setConnectionMode] = useAtom(connectionModeAtom);
	const [editNode, setEditNode] = useAtom(editNodeAtom);
	const [materialImages, setMaterialImages] = useAtom(imagesAtom);

	const { goalMapId } = Route.useParams();
	const navigate = useNavigate();
	const [isSavingForKit, setIsSavingForKit] = useState(false);

	const { data: existing } = useQuery({
		...GoalMapRpc.getGoalMap({ id: goalMapId }),
		enabled: goalMapId !== "new",
	});

	const { data: topics = [], isLoading: topicsLoading } = useQuery(
		TopicRpc.listTopics(),
	);

	const { data: kitStatus } = useQuery(KitRpc.getKitStatus(goalMapId));
	const generateKitMutation = useMutation(KitRpc.generateKit());

	const isNewMap = goalMapId === "new";

	useEffect(() => {
		if (isNewMap) {
			setPageTitle("New Goal Map");
		} else if (existing?.title) {
			setPageTitle(existing.title);
		} else {
			setPageTitle(null);
		}

		return () => {
			setPageTitle(null);
		};
	}, [isNewMap, existing?.title, setPageTitle]);

	useEffect(() => {
		if (isNewMap) {
			setPageTitle("New Goal Map");
		} else if (existing?.title) {
			setPageTitle(existing.title);
		} else {
			setPageTitle(null);
		}

		return () => {
			setPageTitle(null);
		};
	}, [isNewMap, existing?.title, setPageTitle]);

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

	// Close context menu when clicking outside or pressing Escape
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setContextMenu(null);
				setConnectionMode(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [setContextMenu, setConnectionMode]);

	// Handle node click - show context menu or complete connection
	const onNodeClick: NodeMouseHandler = useCallback(
		(_event, node) => {
			// If in connection mode, try to complete the connection
			if (connectionMode?.active) {
				const clickedType = node.type;

				// Only allow connecting to concept (text) nodes
				if (clickedType !== "text") {
					return;
				}

				// Create the edge based on direction
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

			// Show context menu using screen coordinates
			const nodeType = node.type as "text" | "connector";

			// Find the node element from the event target
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

	// Handle pane click - close context menu and cancel connection mode
	const onPaneClick = useCallback(() => {
		setContextMenu(null);
		setConnectionMode(null);
	}, [setContextMenu, setConnectionMode]);

	// Context menu actions
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

		// Remove the node
		setNodes((nds) => nds.filter((n) => n.id !== contextMenu.nodeId));
		// Remove connected edges
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

	// Handle edit node confirmation
	const handleEditNodeConfirm = useCallback(
		(data: { label: string; color?: TailwindColor }) => {
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
								color: data.color?.value,
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
	const saving = saveGoalMapMutation.isPending && !isSavingForKit;

	useEffect(() => {
		if (existing && !isHydrated) {
			try {
				const loadedNodes = Array.isArray(existing.nodes) ? existing.nodes : [];
				const loadedEdges = Array.isArray(existing.edges) ? existing.edges : [];
				setNodes(loadedNodes);
				setEdges(loadedEdges);
				setSaveTopicId(
					typeof existing.topicId === "string" ? existing.topicId : "",
				);
				setSaveName(typeof existing.title === "string" ? existing.title : "");
				setSaveDescription(
					typeof existing.description === "string" ? existing.description : "",
				);
				setMaterialText(
					typeof existing.materialText === "string"
						? existing.materialText
						: "",
				);
				setMaterialImages(
					typeof existing.materialImages === "object" &&
						Array.isArray(existing.materialImages)
						? existing.materialImages
						: [],
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
		setSaveDescription,
		setSaveTopicId,
		setMaterialText,
		setMaterialImages,
		setLastSavedSnapshot,
	]);

	// Add concept node from dialog
	const handleAddConcept = (data: { label: string; color: TailwindColor }) => {
		const viewport = rfInstance?.getViewport();
		addTextNode(data.label, data.color, viewport);
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
				console.warn("invalid connection", sType, "->", tType);
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
		(
			meta: { topicId: string; name: string; description?: string },
			newGoalMapId?: string,
		) => {
			setSaveError(null);
			// Generate a new ID if this is a new goal map
			const targetGoalMapId =
				newGoalMapId ?? (goalMapId === "new" ? randomString() : goalMapId);
			const isCreatingNewMap =
				goalMapId === "new" || newGoalMapId !== undefined;

			const saveParams = {
				goalMapId: targetGoalMapId,
				title: meta.name,
				description:
					meta.description || (newGoalMapId ? saveDescription : undefined),
				topicId: meta.topicId || undefined,
				nodes,
				edges,
				materialText: materialText || undefined,
				materialImages: materialImages.length > 0 ? materialImages : undefined,
			};

			saveGoalMapMutation.mutate(saveParams, {
				onSuccess: () => {
					setLastSavedSnapshot(JSON.stringify({ nodes, edges }));
					if (isCreatingNewMap) {
						navigate({
							to: "/dashboard/goal-map/$goalMapId",
							params: { goalMapId: targetGoalMapId },
							replace: goalMapId === "new",
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
						if (isCreatingNewMap) {
							navigate({
								to: "/dashboard/goal-map/$goalMapId",
								params: { goalMapId: targetGoalMapId },
								replace: goalMapId === "new",
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
			materialImages,
			saveDescription,
			navigate,
			setSaveError,
			setSaveWarnings,
			setLastSavedSnapshot,
			saveGoalMapMutation,
		],
	);

	// Handle Save As (create copy with new ID)
	const handleSaveAs = (meta: {
		topicId: string;
		name: string;
		description?: string;
	}) => {
		const newId = randomString();
		doSave(meta, newId);
		setSaveAsOpen(false);
		setSaveTopicId(meta.topicId);
		setSaveName(meta.name);
		setSaveDescription(meta.description || "");
	};

	const handleCreateKit = () => {
		setIsSavingForKit(true);
		saveGoalMapMutation.mutate(
			{
				goalMapId,
				title: saveName || "Untitled",
				topicId: saveTopicId || undefined,
				nodes,
				edges,
			},
			{
				onSuccess: async () => {
					generateKitMutation.mutate(
						{ goalMapId },
						{
							onError: (error: Error) => {
								console.error("Failed to generate kit:", error);
								toast.error("Failed to generate kit", {
									description: error.message,
								});
							},
							onSuccess: (data) => {
								if (data?.ok) {
									const message =
										kitStatus?.exists && !kitStatus.isOutdated
											? "Kit updated successfully"
											: "Kit created successfully";
									toast.success(message);
								} else {
									toast.error("Failed to generate kit", {
										description: "Goal map not found",
									});
								}
							},
							onSettled: () => {
								setIsSavingForKit(false);
							},
						},
					);
				},
				onError: () => {
					setIsSavingForKit(false);
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
				// If it's a new map or missing required data, show dialog
				if (isNewMap || !saveName.trim()) {
					setSaveOpen(true);
				} else {
					void doSave({ topicId: saveTopicId, name: saveName.trim() });
				}
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [doSave, saving, saveTopicId, saveName, setSaveOpen, isNewMap]);

	// Edge options with direction
	const edgeOptions = useMemo(
		() => ({
			type: "floating",
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
		<div className="h-full relative">
			{/* Dialogs */}
			<AddConceptDialog
				open={conceptDialogOpen}
				defaultColor={DEFAULT_COLOR}
				onCancel={() => setConceptDialogOpen(false)}
				onConfirm={handleAddConcept}
			/>
			<AddLinkDialog
				open={linkDialogOpen}
				onCancel={() => setLinkDialogOpen(false)}
				onConfirm={handleAddLink}
			/>

			{/* Edit dialogs */}
			<AddConceptDialog
				open={editNode?.type === "text"}
				editMode
				initialLabel={editNode?.type === "text" ? editNode.label : ""}
				initialColor={
					editNode?.type === "text" && editNode.color
						? getColorByValue(editNode.color)
						: undefined
				}
				onCancel={() => setEditNode(null)}
				onConfirm={(data) => handleEditNodeConfirm(data)}
			/>
			<AddLinkDialog
				open={editNode?.type === "connector"}
				editMode
				initialLabel={editNode?.type === "connector" ? editNode.label : ""}
				onCancel={() => setEditNode(null)}
				onConfirm={(data) => handleEditNodeConfirm(data)}
			/>
			<ImportMaterialDialog goalMapId={goalMapId} />
			<SaveDialog
				open={saveOpen}
				saving={saving}
				topics={topics}
				topicsLoading={topicsLoading}
				defaultTopicId={saveTopicId}
				defaultName={saveName}
				onCancel={() => setSaveOpen(false)}
				onConfirm={async (meta) => {
					doSave({ ...meta, description: saveDescription });
					setSaveOpen(false);
					setSaveTopicId(meta.topicId);
					setSaveName(meta.name);
				}}
			/>
			<SaveDialog
				open={saveAsOpen}
				saving={saving}
				topics={topics}
				topicsLoading={topicsLoading}
				defaultTopicId={saveTopicId}
				defaultName={saveName ? `${saveName} (copy)` : ""}
				defaultDescription={saveDescription}
				onCancel={() => setSaveAsOpen(false)}
				onConfirm={handleSaveAs}
			/>

			{/* Warnings */}
			<div className="absolute top-20 left-4 z-20 max-w-md">
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
			</div>

			{/* Canvas */}
			<div
				className={cn(
					"rounded-xl border bg-card relative h-full overflow-hidden",
					connectionMode?.active && "ring-2 ring-blue-500/50",
				)}
			>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onNodeClick={onNodeClick}
					onPaneClick={onPaneClick}
					defaultEdgeOptions={edgeOptions}
					connectionLineComponent={FloatingConnectionLine}
					onInit={(instance) => {
						setRfInstance(instance);
					}}
					fitView
				>
					<MiniMap />
					<Background gap={16} />
					<SearchNodesPanel
						open={searchOpen}
						nodes={nodes}
						onClose={() => setSearchOpen(false)}
						onSelectNode={selectNode}
					/>
				</ReactFlow>

				{/* Floating Toolbar */}
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
					onSave={() => doSave({ topicId: saveTopicId, name: saveName })}
					onCreateKit={handleCreateKit}
					saving={saving}
					isNewMap={isNewMap}
					kitStatus={kitStatus ?? undefined}
					isGeneratingKit={generateKitMutation.isPending}
				/>

				{/* Dark overlay when context menu is open */}
				{contextMenu && (
					<div
						className="absolute inset-0 bg-black/30 z-40 pointer-events-none animate-in fade-in duration-150"
						aria-hidden="true"
					/>
				)}

				{/* Node Context Menu - rendered outside ReactFlow with screen coordinates */}
				{contextMenu && (
					<NodeContextMenu
						nodeId={contextMenu.nodeId}
						nodeType={contextMenu.nodeType}
						position={contextMenu.position}
						onEdit={handleContextMenuEdit}
						onDelete={handleContextMenuDelete}
						onConnectTo={
							contextMenu.nodeType === "connector" ? handleConnectTo : undefined
						}
						onConnectFrom={
							contextMenu.nodeType === "connector"
								? handleConnectFrom
								: undefined
						}
						onClose={() => setContextMenu(null)}
					/>
				)}

				{/* Connection Mode Indicator */}
				{connectionMode?.active && (
					<div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 bg-blue-500 text-white border border-blue-600 rounded-lg px-3 py-1.5 shadow-lg text-sm flex items-center gap-2">
						<span>
							Click a concept to connect{" "}
							{connectionMode.direction === "to" ? "to" : "from"}
						</span>
						<button
							type="button"
							onClick={() => setConnectionMode(null)}
							className="text-xs text-white/80 hover:text-white underline"
						>
							Cancel
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
