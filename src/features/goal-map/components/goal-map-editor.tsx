import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { Connection } from "@xyflow/react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";

import { AddConceptDialog } from "@/features/goal-map/components/add-concept-dialog";

import "@xyflow/react/dist/style.css";
import { AddLinkDialog } from "@/features/goal-map/components/add-link-dialog";
import { EditorToolbar } from "@/features/goal-map/components/editor-toolbar";
import { MaterialDialog } from "@/features/goal-map/components/material-dialog";
import { SaveDialog, WarningsPanel } from "@/features/goal-map/components/save-dialog";
import { useContextMenu } from "@/features/goal-map/hooks/use-context-menu";
import { useGraphHandlers } from "@/features/goal-map/hooks/use-graph-handlers";
import { useHistory } from "@/features/goal-map/hooks/use-history";
import { useKeyboardShortcuts } from "@/features/goal-map/hooks/use-keyboard-shortcuts";
import { useNodeOperations } from "@/features/goal-map/hooks/use-node-operations";
import { useSaveDialog } from "@/features/goal-map/hooks/use-save-dialog";
import { useViewportControls } from "@/features/goal-map/hooks/use-viewport-controls";
import {
	conceptDialogOpenAtom,
	contextMenuAtom,
	editNodeAtom,
	imagesAtom,
	linkDialogOpenAtom,
	materialDialogOpenAtom,
	materialTextAtom,
	searchOpenAtom,
} from "@/features/goal-map/lib/atoms";
import {
	DEFAULT_COLOR,
	getColorByValue,
	type TailwindColor,
} from "@/features/kitbuild/components/color-picker";
import { ConceptMapCanvas } from "@/features/kitbuild/components/concept-map-canvas";
import { NodeContextMenu } from "@/features/kitbuild/components/node-context-menu";
import { SearchNodesPanel } from "@/features/kitbuild/components/search-nodes-panel";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { toast } from "@/lib/error-toast";
import { pageTitleAtom } from "@/lib/page-title";
import { areNodesConnected } from "@/lib/react-flow-types";
import { randomString } from "@/lib/utils";
import { GoalMapRpc } from "@/server/rpc/goal-map";
import { KitRpc } from "@/server/rpc/kit";
import { TopicRpc } from "@/server/rpc/topic";

const routeApi = getRouteApi("/dashboard/goal-map/$goalMapId");

export function GoalMapEditor() {
	const { getViewport } = useReactFlow();
	const setPageTitle = useSetAtom(pageTitleAtom);
	const [conceptDialogOpen, setConceptDialogOpen] = useAtom(conceptDialogOpenAtom);
	const [linkDialogOpen, setLinkDialogOpen] = useAtom(linkDialogOpenAtom);
	const [searchOpen, setSearchOpen] = useAtom(searchOpenAtom);
	const [contextMenu, setContextMenu] = useAtom(contextMenuAtom);
	const [editNode, setEditNode] = useAtom(editNodeAtom);
	const [materialImages, setMaterialImages] = useAtom(imagesAtom);
	const materialText = useAtomValue(materialTextAtom);
	const setMaterialText = useSetAtom(materialTextAtom);
	const materialDialogOpen = useAtomValue(materialDialogOpenAtom);

	const { goalMapId } = routeApi.useParams();
	const navigate = useNavigate();

	const isNewMap = goalMapId === "new";

	const { data: existing } = useRpcQuery({
		...GoalMapRpc.getGoalMap({ goalMapId }),
		enabled: !isNewMap,
	});
	const { data: topics, isLoading: topicsLoading } = useRpcQuery(TopicRpc.listTopics());
	const { data: kitStatus } = useRpcQuery({
		...KitRpc.getKitStatus(goalMapId),
		enabled: !isNewMap,
	});

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
	const { getNodeType, addTextNode, addConnectorNode, deleteSelected, selectNode } =
		useNodeOperations();

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
		handleEditNodeConfirm,
	} = useContextMenu();

	const { zoomIn, zoomOut, fit, centerMap, autoLayout } = useViewportControls();

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
	const saving = saveGoalMapMutation.isPending;

	const doSave = useCallback(
		(meta: { topicId: string; name: string; description?: string }, newGoalMapId?: string) => {
			setSaveError(null);
			const targetGoalMapId =
				newGoalMapId ?? (goalMapId === "new" ? randomString() : goalMapId);
			const isCreatingNewMap = goalMapId === "new" || newGoalMapId !== undefined;

			const saveParams = {
				goalMapId: targetGoalMapId,
				title: meta.name,
				description: meta.description || (newGoalMapId ? saveMeta.description : undefined),
				topicId: meta.topicId || undefined,
				nodes: graphNodes,
				edges: graphEdges,
				materialText: materialText || undefined,
				materialImages: materialImages.length > 0 ? materialImages : undefined,
				// Auto-publish kit for existing maps (not when creating new map)
				publish: !isCreatingNewMap && !!kitStatus?.exists,
			};

			saveGoalMapMutation.mutate(saveParams, {
				onSuccess: (result) => {
					setLastSavedSnapshot(JSON.stringify({ nodes: graphNodes, edges: graphEdges }));

					// published is true when kit was auto-regenerated
					if (
						result &&
						typeof result === "object" &&
						"published" in result &&
						result.published
					) {
						toast.success("Goal map and student activity saved successfully!");
					}

					if (isCreatingNewMap) {
						void navigate({
							to: "/dashboard/goal-map/$goalMapId",
							params: { goalMapId: targetGoalMapId },
							replace: goalMapId === "new",
						});
					}
				},
				onError: (error) => {
					const message = error instanceof Error ? error.message : "Save failed";
					if (/unauthorized|forbidden/i.test(message)) {
						addWarning(
							"Saved locally (not signed in). Changes are only on this device.",
						);
						setLastSavedSnapshot(
							JSON.stringify({ nodes: graphNodes, edges: graphEdges }),
						);
						if (isCreatingNewMap) {
							void navigate({
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
			kitStatus,
		],
	);

	useKeyboardShortcuts(saving, doSave, saveMeta.name, saveMeta.topicId, isNewMap);

	useEffect(() => {
		if (existing) {
			const loadedNodes = Array.isArray(existing.nodes) ? existing.nodes : [];
			const loadedEdges = Array.isArray(existing.edges) ? existing.edges : [];
			setNodes(loadedNodes);
			setEdges(loadedEdges);
			updateMeta({
				topicId: typeof existing.topicId === "string" ? existing.topicId : "",
				name: typeof existing.title === "string" ? existing.title : "",
				description: typeof existing.description === "string" ? existing.description : "",
			});
			setMaterialText(typeof existing.materialText === "string" ? existing.materialText : "");
			setMaterialImages(
				typeof existing.materialImages === "object" &&
					Array.isArray(existing.materialImages)
					? existing.materialImages
					: [],
			);
			setLastSavedSnapshot(JSON.stringify({ nodes: loadedNodes, edges: loadedEdges }));
		}
	}, [
		existing,
		setNodes,
		setEdges,
		updateMeta,
		setMaterialText,
		setMaterialImages,
		setLastSavedSnapshot,
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
			// Prevent connecting a node to itself
			if (params.source === params.target) {
				toast.error("Cannot connect a node to itself");
				return;
			}
			// Prevent duplicate edges between same pair of nodes
			if (areNodesConnected(graphEdges, params.source, params.target)) {
				toast.error("These nodes are already connected");
				return;
			}
			const sType = getNodeType(params.source ?? null);
			const tType = getNodeType(params.target ?? null);
			const ok =
				(sType === "text" && tType === "connector") ||
				(sType === "connector" && tType === "text");
			if (!ok) {
				toast.error(`Invalid connection: ${sType ?? "unknown"} -> ${tType ?? "unknown"}`);
				return;
			}
			onConnect(params, getNodeType);
		},
		[getNodeType, graphEdges, onConnect],
	);

	const onConnectEnd = useCallback(() => {
		setContextMenu(null);
	}, [setContextMenu]);

	// Validate connection during drag (prevents visual feedback for invalid connections)
	const isValidConnectionHandler = useCallback(
		(params: { source: string; target: string }) => {
			if (params.source === params.target) return false;
			if (areNodesConnected(graphEdges, params.source, params.target)) return false;
			const sType = getNodeType(params.source ?? null);
			const tType = getNodeType(params.target ?? null);
			return (
				(sType === "text" && tType === "connector") ||
				(sType === "connector" && tType === "text")
			);
		},
		[getNodeType, graphEdges],
	);

	const handleSaveAs = (meta: { topicId: string; name: string; description?: string }) => {
		const newId = generateNewId();
		doSave(meta, newId);
		setSaveAsOpen(false);
		updateMeta(meta);
	};

	useEffect(() => {
		if (lastSavedSnapshot === null) {
			setLastSavedSnapshot(JSON.stringify({ nodes: graphNodes, edges: graphEdges }));
		}
	}, [lastSavedSnapshot, graphNodes, graphEdges, setLastSavedSnapshot]);

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
			{materialDialogOpen && (
				<MaterialDialog
					key={`${materialText.slice(0, 50)}-${materialImages.length}`}
					goalMapId={goalMapId}
					materialText={materialText}
					materialImages={materialImages}
				/>
			)}
			<SaveDialog
				open={saveOpen}
				saving={saving}
				topics={topics ?? []}
				topicsLoading={topicsLoading}
				defaultTopicId={saveMeta.topicId}
				defaultName={saveMeta.name}
				onCancel={() => setSaveOpen(false)}
				onConfirm={async (meta) => {
					doSave(meta);
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

			<div className="rounded-xl border bg-card relative h-full overflow-hidden">
				<ConceptMapCanvas
					nodes={graphNodes}
					edges={graphEdges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnectWrapper}
					onConnectEnd={onConnectEnd}
					isValidConnection={isValidConnectionHandler}
					onNodeClick={onNodeClick}
					onPaneClick={onPaneClick}
					readOnly={false}
				>
					<SearchNodesPanel
						open={searchOpen}
						nodes={graphNodes}
						onClose={() => setSearchOpen(false)}
						onSelectNode={selectNode}
					/>
				</ConceptMapCanvas>

				<EditorToolbar
					onUndo={undo}
					onRedo={redo}
					onZoomIn={zoomIn}
					onZoomOut={zoomOut}
					onFit={fit}
					onCenterMap={centerMap}
					onAutoLayout={autoLayout}
					onDelete={deleteSelected}
					onSave={() => doSave({ topicId: saveMeta.topicId, name: saveMeta.name })}
					saving={saving}
					isNewMap={isNewMap}
				/>

				{contextMenu && (
					<NodeContextMenu
						nodeId={contextMenu.nodeId}
						nodeType={contextMenu.nodeType}
						position={contextMenu.position}
						onEdit={handleContextMenuEdit}
						onDelete={handleContextMenuDelete}
						onClose={() => setContextMenu(null)}
					/>
				)}
			</div>
		</div>
	);
}

export function GoalMapEditorWrapper() {
	return (
		<ReactFlowProvider>
			<GoalMapEditor />
		</ReactFlowProvider>
	);
}
