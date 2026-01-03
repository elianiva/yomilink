import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { Connection, MarkerType } from "@xyflow/react";
import {
	Background,
	MiniMap,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
} from "@xyflow/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { isErrorResponse } from "@/hooks/use-rpc-error";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { toast } from "@/lib/error-toast";
import { pageTitleAtom } from "@/lib/page-title";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Guard } from "@/components/auth/Guard";
import { ConnectionModeIndicator } from "@/components/ui/connection-mode-indicator";
import { ContextMenuOverlay } from "@/components/ui/context-menu-overlay";
import { AddConceptDialog } from "@/features/goal-map/components/add-concept-dialog";
import { AddLinkDialog } from "@/features/goal-map/components/add-link-dialog";
import { EditorToolbar } from "@/features/goal-map/components/editor-toolbar";
import { ImportMaterialDialog } from "@/features/goal-map/components/import-material-dialog";
import {
	SaveDialog,
	WarningsPanel,
} from "@/features/goal-map/components/save-dialog";
import { useContextMenu } from "@/features/goal-map/hooks/use-context-menu";
import { useGraphHandlers } from "@/features/goal-map/hooks/use-graph-handlers";
import { useHistory } from "@/features/goal-map/hooks/use-history";
import { useKeyboardShortcuts } from "@/features/goal-map/hooks/use-keyboard-shortcuts";
import { useNodeOperations } from "@/features/goal-map/hooks/use-node-operations";
import { useSaveDialog } from "@/features/goal-map/hooks/use-save-dialog";
import { useViewportControls } from "@/features/goal-map/hooks/use-viewport-controls";
import {
	conceptDialogOpenAtom,
	connectionModeAtom,
	contextMenuAtom,
	directionEnabledAtom,
	editNodeAtom,
	imagesAtom,
	isHydratedAtom,
	linkDialogOpenAtom,
	materialTextAtom,
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
import { cn, randomString } from "@/lib/utils";
import { GoalMapRpc } from "@/server/rpc/goal-map";
import { KitRpc } from "@/server/rpc/kit";
import { TopicRpc } from "@/server/rpc/topic";

export const Route = createFileRoute("/dashboard/goal-map/$goalMapId")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<ReactFlowProvider>
				<TeacherGoalMapEditor />
			</ReactFlowProvider>
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

	const { getViewport } = useReactFlow();
	const setPageTitle = useSetAtom(pageTitleAtom);
	const [conceptDialogOpen, setConceptDialogOpen] = useAtom(
		conceptDialogOpenAtom,
	);
	const [linkDialogOpen, setLinkDialogOpen] = useAtom(linkDialogOpenAtom);
	const [searchOpen, setSearchOpen] = useAtom(searchOpenAtom);
	const [isHydrated, setIsHydrated] = useAtom(isHydratedAtom);
	const [contextMenu, setContextMenu] = useAtom(contextMenuAtom);
	const [connectionMode, setConnectionMode] = useAtom(connectionModeAtom);
	const [editNode, setEditNode] = useAtom(editNodeAtom);
	const [materialImages, setMaterialImages] = useAtom(imagesAtom);
	const materialText = useAtomValue(materialTextAtom);
	const setMaterialText = useSetAtom(materialTextAtom);
	const directionEnabled = useAtomValue(directionEnabledAtom);
	const [isSavingForKit, setIsSavingForKit] = useState(false);

	const { goalMapId } = Route.useParams();
	const navigate = useNavigate();

	const { data: existing } = useRpcQuery({
		...GoalMapRpc.getGoalMap({ goalMapId }),
		enabled: goalMapId !== "new",
	});

	const { data: topics, isLoading: topicsLoading } = useRpcQuery(
		TopicRpc.listTopics(),
	);

	const { data: kitStatus } = useRpcQuery(KitRpc.getKitStatus(goalMapId));

	const generateKitMutation = useRpcMutation(KitRpc.generateKit(), {
		operation: "generate kit",
	});

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

	const { undo, redo } = useHistory();
	const {
		getNodeType,
		addTextNode,
		addConnectorNode,
		deleteSelected,
		selectNode,
	} = useNodeOperations();

	const {
		nodes: graphNodes,
		edges: graphEdges,
		onNodesChange,
		onEdgesChange,
		setNodes,
		setEdges,
	} = useGraphHandlers();

	const {
		onNodeClick,
		onPaneClick,
		onConnect,
		handleContextMenuEdit,
		handleContextMenuDelete,
		handleConnectTo,
		handleConnectFrom,
		handleEditNodeConfirm,
	} = useContextMenu();

	const {
		zoomIn,
		zoomOut,
		fit,
		centerMap,
		toggleDirection,
		autoLayout,
		updateEdgeMarkers,
	} = useViewportControls();

	const {
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
		clearWarnings,
		addWarning,
		lastSavedSnapshot,
		setLastSavedSnapshot,
		generateNewId,
	} = useSaveDialog();

	const saveGoalMapMutation = useRpcMutation(GoalMapRpc.saveGoalMap(), {
		operation: "save goal map",
	});
	const saving = saveGoalMapMutation.isPending && !isSavingForKit;

	const doSave = useCallback(
		(
			meta: { topicId: string; name: string; description?: string },
			newGoalMapId?: string,
		) => {
			setSaveError(null);
			const targetGoalMapId =
				newGoalMapId ?? (goalMapId === "new" ? randomString() : goalMapId);
			const isCreatingNewMap =
				goalMapId === "new" || newGoalMapId !== undefined;

			const saveParams = {
				goalMapId: targetGoalMapId,
				title: meta.name,
				description:
					meta.description || (newGoalMapId ? saveMeta.description : undefined),
				topicId: meta.topicId || undefined,
				nodes: graphNodes,
				edges: graphEdges,
				materialText: materialText || undefined,
				materialImages: materialImages.length > 0 ? materialImages : undefined,
			};

			saveGoalMapMutation.mutate(saveParams, {
				onSuccess: () => {
					setLastSavedSnapshot(
						JSON.stringify({ nodes: graphNodes, edges: graphEdges }),
					);
					if (isCreatingNewMap) {
						navigate({
							to: "/dashboard/goal-map/$goalMapId",
							params: { goalMapId: targetGoalMapId },
							replace: goalMapId === "new",
						});
					}
				},
				onError: (error) => {
					const message =
						error instanceof Error ? error.message : "Save failed";
					if (/unauthorized|forbidden/i.test(message)) {
						addWarning(
							"Saved locally (not signed in). Changes are only on this device.",
						);
						setLastSavedSnapshot(
							JSON.stringify({ nodes: graphNodes, edges: graphEdges }),
						);
						if (isCreatingNewMap) {
							navigate({
								to: "/dashboard/goal-map/$goalMapId",
								params: { goalMapId: targetGoalMapId },
								replace: goalMapId === "new",
							});
						}
					} else {
						setSaveError(message);
					}
				},
			});
		},
		[
			goalMapId,
			graphNodes,
			graphEdges,
			materialText,
			materialImages,
			saveMeta,
			navigate,
			setSaveError,
			addWarning,
			setLastSavedSnapshot,
			saveGoalMapMutation,
		],
	);

	useKeyboardShortcuts(
		saving,
		doSave,
		saveMeta.name,
		saveMeta.topicId,
		isNewMap,
	);

	useEffect(() => {
		if (existing && !isHydrated) {
			const loadedNodes = Array.isArray(existing.nodes) ? existing.nodes : [];
			const loadedEdges = Array.isArray(existing.edges) ? existing.edges : [];
			setNodes(loadedNodes);
			setEdges(loadedEdges);
			updateMeta({
				topicId: typeof existing.topicId === "string" ? existing.topicId : "",
				name: typeof existing.title === "string" ? existing.title : "",
				description:
					typeof existing.description === "string" ? existing.description : "",
			});
			setMaterialText(
				typeof existing.materialText === "string" ? existing.materialText : "",
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
			setIsHydrated(true);
		}
	}, [
		existing,
		setNodes,
		setEdges,
		updateMeta,
		setMaterialText,
		setMaterialImages,
		setLastSavedSnapshot,
		setIsHydrated,
		isHydrated,
	]);

	const handleAddConcept = (data: { label: string; color: TailwindColor }) => {
		const viewport = getViewport();
		addTextNode(data.label, data.color, viewport);
		setConceptDialogOpen(false);
	};

	const handleAddLink = (data: { label: string }) => {
		const viewport = getViewport();
		addConnectorNode(data.label, viewport);
		setLinkDialogOpen(false);
	};

	const onConnectWrapper = useCallback(
		(params: Connection) => {
			const sType = getNodeType(params.source ?? null);
			const tType = getNodeType(params.target ?? null);
			const ok =
				(sType === "text" && tType === "connector") ||
				(sType === "connector" && tType === "text");
			if (!ok) {
				toast.error(
					`Invalid connection: ${sType ?? "unknown"} -> ${tType ?? "unknown"}`,
				);
				return;
			}
			onConnect(params, getNodeType);
		},
		[getNodeType, onConnect],
	);

	const handleSaveAs = (meta: {
		topicId: string;
		name: string;
		description?: string;
	}) => {
		const newId = generateNewId();
		doSave(meta, newId);
		setSaveAsOpen(false);
		updateMeta(meta);
	};

	const handleCreateKit = () => {
		setIsSavingForKit(true);
		saveGoalMapMutation.mutate(
			{
				goalMapId,
				title: saveMeta.name || "Untitled",
				topicId: saveMeta.topicId || undefined,
				nodes: graphNodes,
				edges: graphEdges,
			},
			{
				onSuccess: async () => {
					generateKitMutation.mutate(
						{ goalMapId },
						{
							onError: (error: Error) => {
								toast.error(error, { operation: "generate kit" });
							},
							onSuccess: (data) => {
								// Check if it's not an error response and has ok property
								if (data && !isErrorResponse(data) && "ok" in data && data.ok) {
									const message =
										kitStatus?.exists && !kitStatus.isOutdated
											? "Kit updated successfully"
											: "Kit created successfully";
									toast.success(message);
								} else {
									toast.error("Goal map not found", {
										operation: "generate kit",
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

	useEffect(() => {
		if (lastSavedSnapshot === null) {
			setLastSavedSnapshot(
				JSON.stringify({ nodes: graphNodes, edges: graphEdges }),
			);
		}
	}, [lastSavedSnapshot, graphNodes, graphEdges, setLastSavedSnapshot]);

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional
	useEffect(() => {
		updateEdgeMarkers();
	}, [directionEnabled]);

	return (
		<div className="h-full relative">
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
				onConfirm={(data) =>
					handleEditNodeConfirm({ label: data.label, color: data.color?.value })
				}
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
				topics={topics ?? []}
				topicsLoading={topicsLoading}
				defaultTopicId={saveMeta.topicId}
				defaultName={saveMeta.name}
				onCancel={() => setSaveOpen(false)}
				onConfirm={async (meta) => {
					doSave({ ...meta, description: saveMeta.description });
					setSaveOpen(false);
					updateMeta(meta);
				}}
			/>
			<SaveDialog
				open={saveAsOpen}
				saving={saving}
				topics={topics ?? []}
				topicsLoading={topicsLoading}
				defaultTopicId={saveMeta.topicId}
				defaultName={saveMeta.name ? `${saveMeta.name} (copy)` : ""}
				defaultDescription={saveMeta.description}
				onCancel={() => setSaveAsOpen(false)}
				onConfirm={handleSaveAs}
			/>

			<div className="absolute top-20 left-4 z-20 max-w-md">
				<WarningsPanel warnings={saveWarnings} onClear={clearWarnings} />
				{saveError ? (
					<WarningsPanel
						warnings={[saveError]}
						variant="error"
						onClear={clearError}
						className="mt-2"
					/>
				) : null}
			</div>

			<div
				className={cn(
					"rounded-xl border bg-card relative h-full overflow-hidden",
					connectionMode?.active && "ring-2 ring-blue-500/50",
				)}
			>
				<ReactFlow
					nodes={graphNodes}
					edges={graphEdges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnectWrapper}
					onNodeClick={onNodeClick}
					onPaneClick={onPaneClick}
					defaultEdgeOptions={edgeOptions}
					connectionLineComponent={FloatingConnectionLine}
					fitView
				>
					<MiniMap />
					<Background gap={16} />
					<SearchNodesPanel
						open={searchOpen}
						nodes={graphNodes}
						onClose={() => setSearchOpen(false)}
						onSelectNode={selectNode}
					/>
				</ReactFlow>

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
					onSave={() =>
						doSave({ topicId: saveMeta.topicId, name: saveMeta.name })
					}
					onCreateKit={handleCreateKit}
					saving={saving}
					isNewMap={isNewMap}
					kitStatus={kitStatus ?? undefined}
					isGeneratingKit={generateKitMutation.isPending}
				/>

				<ContextMenuOverlay visible={contextMenu !== null} />

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

				<ConnectionModeIndicator
					active={connectionMode?.active ?? false}
					direction={connectionMode?.direction ?? "to"}
					onCancel={() => setConnectionMode(null)}
				/>
			</div>
		</div>
	);
}
