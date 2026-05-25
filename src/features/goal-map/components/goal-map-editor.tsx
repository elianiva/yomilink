import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useMachine } from "@xstate/react";
import type { Connection, NodeMouseHandler } from "@xyflow/react";
import { applyEdgeChanges, applyNodeChanges, ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Suspense, useCallback, useEffect, lazy } from "react";

import "@xyflow/react/dist/style.css";
import { AddConceptDialog } from "@/features/goal-map/components/add-concept-dialog";
import { AddLinkDialog } from "@/features/goal-map/components/add-link-dialog";
import { EditorToolbar } from "@/features/goal-map/components/editor-toolbar";
import { SaveDialog, WarningsPanel } from "@/features/goal-map/components/save-dialog";
import { useSaveDialog } from "@/features/goal-map/hooks/use-save-dialog";
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
import { goalMapMachine } from "@/features/goal-map/lib/goal-map.machine";
import {
	DEFAULT_COLOR,
	getColorByValue,
	type TailwindColor,
} from "@/features/kit/components/color-picker";
import { ConceptMapCanvas } from "@/features/kit/components/concept-map-canvas";
import { SearchNodesPanel } from "@/features/kit/components/search-nodes-panel";
import { filterSelectChanges } from "@/features/kit/lib/graph-machine";
import { getLayoutedElements } from "@/features/kit/lib/layout";
import type { Node, Edge } from "@/features/learner-map/lib/comparator";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { useStableSerializedValue } from "@/hooks/use-stable-serialized-value";
import { toast } from "@/lib/error-toast";
import { areNodesConnected } from "@/lib/react-flow-types";
import { randomString } from "@/lib/utils";
import { GoalMapRpc } from "@/server/rpc/goal-map";
import { KitRpc } from "@/server/rpc/kit";
import { TopicRpc } from "@/server/rpc/topic";

const MaterialDialog = lazy(() =>
	import("@/features/goal-map/components/material-dialog").then((m) => ({
		default: m.MaterialDialog,
	})),
);

const routeApi = getRouteApi("/dashboard/goal-map/$goalMapId");

export function GoalMapEditor() {
	const { getViewport, getNodes, zoomIn, zoomOut, fitView, setCenter } = useReactFlow();
	const { goalMapId } = routeApi.useParams();
	const navigate = useNavigate();
	const isNewMap = goalMapId === "new";

	const [snapshot, send] = useMachine(goalMapMachine);

	const nodes = snapshot.context.nodes;
	const edges = snapshot.context.edges;

	const { data: existing } = useRpcQuery({
		...GoalMapRpc.getGoalMap({ goalMapId }),
		enabled: !isNewMap,
	});
	const { data: topics, isLoading: topicsLoading } = useRpcQuery(TopicRpc.listTopics());
	const { data: kitStatus } = useRpcQuery({
		...KitRpc.getKitStatus(goalMapId),
		enabled: !isNewMap,
	});

	// ── Simple UI state (local) ──────────────────────────────
	const [conceptDialogOpen, setConceptDialogOpen] = useAtom(conceptDialogOpenAtom);
	const [linkDialogOpen, setLinkDialogOpen] = useAtom(linkDialogOpenAtom);
	const [searchOpen, setSearchOpen] = useAtom(searchOpenAtom);
	const [, setContextMenu] = useAtom(contextMenuAtom);
	const [editNode, setEditNode] = useAtom(editNodeAtom);
	const [materialImages, setMaterialImages] = useAtom(imagesAtom);
	const materialText = useAtomValue(materialTextAtom);
	const setMaterialText = useSetAtom(materialTextAtom);
	const materialDialogOpen = useAtomValue(materialDialogOpenAtom);

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
		setLastSavedSnapshot,
		generateNewId,
	} = useSaveDialog();

	const saveGoalMapMutation = useRpcMutation(GoalMapRpc.saveGoalMap(), {
		operation: "save goal map",
	});
	const saving = saveGoalMapMutation.isPending;

	// ── Load initial graph state ──────────────────────────────
	useEffect(() => {
		if (!isNewMap) return;
		send({ type: "LOADED", data: { nodes: [], edges: [] } });
	}, [isNewMap, send]);

	useEffect(() => {
		if (!existing) return;
		const loadedNodes = Array.isArray(existing.nodes) ? existing.nodes : [];
		const loadedEdges = Array.isArray(existing.edges) ? existing.edges : [];
		send({ type: "LOADED", data: { nodes: loadedNodes, edges: loadedEdges } });
		updateMeta({
			topicId: typeof existing.topicId === "string" ? existing.topicId : "",
			name: typeof existing.title === "string" ? existing.title : "",
			description: typeof existing.description === "string" ? existing.description : "",
		});
		setMaterialText(typeof existing.materialText === "string" ? existing.materialText : "");
		setMaterialImages(
			typeof existing.materialImages === "object" && Array.isArray(existing.materialImages)
				? existing.materialImages
				: [],
		);
		setLastSavedSnapshot(JSON.stringify({ nodes: loadedNodes, edges: loadedEdges }));
	}, [existing, send, updateMeta, setMaterialText, setMaterialImages, setLastSavedSnapshot]);

	const stableNodes = useStableSerializedValue(nodes);
	const stableEdges = useStableSerializedValue(edges);

	// ── Graph change handlers ─────────────────────────────────
	const onNodesChange = useCallback(
		(changes: import("@xyflow/react").NodeChange<Node>[]) => {
			const filtered = filterSelectChanges(changes);
			const next = applyNodeChanges(filtered, stableNodes);
			send({ type: "SET_NODES", nodes: next });
		},
		[stableNodes, send],
	);

	const onEdgesChange = useCallback(
		(changes: import("@xyflow/react").EdgeChange<Edge>[]) => {
			const next = applyEdgeChanges(changes, stableEdges);
			send({ type: "SET_EDGES", edges: next });
		},
		[stableEdges, send],
	);

	const onConnect = useCallback(
		(params: Connection) => {
			if (params.source === params.target) {
				toast.error("Cannot connect a node to itself");
				return;
			}
			if (areNodesConnected(stableEdges, params.source, params.target)) {
				toast.error("These nodes are already connected");
				return;
			}
			const sType = stableNodes.find((n) => n.id === params.source)?.type;
			const tType = stableNodes.find((n) => n.id === params.target)?.type;
			const ok =
				(sType === "text" && tType === "connector") ||
				(sType === "connector" && tType === "text");
			if (!ok) {
				toast.error(`Invalid connection: ${sType ?? "unknown"} -> ${tType ?? "unknown"}`);
				return;
			}
			const newEdge = {
				id: `e-${params.source}-${params.target}`,
				source: params.source!,
				target: params.target!,
				type: "floating" as const,
				style: { stroke: "#16a34a", strokeWidth: 3 },
			};
			send({
				type: "SET_EDGES",
				edges: [...stableEdges, newEdge],
			});
		},
		[stableNodes, stableEdges, send],
	);

	const isValidConnectionHandler = useCallback(
		(params: { source: string; target: string }) => {
			if (params.source === params.target) return false;
			if (areNodesConnected(stableEdges, params.source, params.target)) return false;
			const sType = stableNodes.find((n) => n.id === params.source)?.type;
			const tType = stableNodes.find((n) => n.id === params.target)?.type;
			return (
				(sType === "text" && tType === "connector") ||
				(sType === "connector" && tType === "text")
			);
		},
		[stableNodes, stableEdges],
	);

	// ── Viewport controls ─────────────────────────────────────

	const handleZoomIn = useCallback(() => void zoomIn(), [zoomIn]);
	const handleZoomOut = useCallback(() => void zoomOut(), [zoomOut]);
	const handleFit = useCallback(() => void fitView({ padding: 0.2 }), [fitView]);
	const centerMap = useCallback(() => void fitView({ padding: 0.2 }), [fitView]);

	const handleAutoLayout = useCallback(() => {
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			stableNodes,
			stableEdges,
			"LR",
		);
		send({ type: "SET_NODES", nodes: layoutedNodes });
		send({ type: "SET_EDGES", edges: layoutedEdges });
		setTimeout(() => void fitView({ padding: 0.2 }), 50);
	}, [stableNodes, stableEdges, send, fitView]);

	// ── Node operations ───────────────────────────────────────
	const addTextNode = useCallback(
		(label: string, color: TailwindColor) => {
			if (!label.trim()) return;
			const viewport = getViewport();
			const id = crypto.randomUUID();
			const centerX = viewport ? -viewport.x / viewport.zoom + 400 : 200;
			const centerY = viewport ? -viewport.y / viewport.zoom + 300 : 200;
			const newNode: Node = {
				id,
				type: "text",
				position: { x: centerX + Math.random() * 50, y: centerY + Math.random() * 50 },
				data: { label: label.trim(), color: color.value },
			};
			send({
				type: "SET_NODES",
				nodes: [...stableNodes, newNode],
			});
		},
		[stableNodes, getViewport, send],
	);

	const addConnectorNode = useCallback(
		(label: string) => {
			if (!label.trim()) return;
			const viewport = getViewport();
			const id = crypto.randomUUID();
			const centerX = viewport ? -viewport.x / viewport.zoom + 400 : 300;
			const centerY = viewport ? -viewport.y / viewport.zoom + 300 : 250;
			const newNode: Node = {
				id,
				type: "connector",
				position: { x: centerX + Math.random() * 50, y: centerY + Math.random() * 50 },
				data: { label: label.trim() },
			};
			send({
				type: "SET_NODES",
				nodes: [...stableNodes, newNode],
			});
		},
		[stableNodes, getViewport, send],
	);

	const handleDeleteSelected = useCallback(() => {
		const rfNodes = getNodes();
		const selectedIds = new Set(rfNodes.filter((n) => n.selected).map((n) => n.id));
		if (selectedIds.size === 0) return;
		const nextNodes = stableNodes.filter((n) => !selectedIds.has(n.id));
		const nextEdges = stableEdges.filter(
			(e) => !selectedIds.has(e.source) && !selectedIds.has(e.target),
		);
		send({
			type: "DELETE_SELECTED",
			nodes: nextNodes,
			edges: nextEdges,
		});
	}, [stableNodes, stableEdges, getNodes, send]);

	const selectNode = useCallback(
		(nodeId: string) => {
			const node = stableNodes.find((n) => n.id === nodeId);
			if (node) {
				void setCenter(node.position.x + 75, node.position.y + 25, {
					zoom: 1.5,
					duration: 500,
				});
			}
		},
		[stableNodes, setCenter],
	);

	// ── Save ──────────────────────────────────────────────────
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
				nodes: stableNodes,
				edges: stableEdges,
				materialText: materialText || undefined,
				materialImages: materialImages.length > 0 ? materialImages : undefined,
				publish: !isCreatingNewMap && !!kitStatus?.exists,
			};

			saveGoalMapMutation.mutate(saveParams, {
				onSuccess: (result) => {
					setLastSavedSnapshot(
						JSON.stringify({ nodes: stableNodes, edges: stableEdges }),
					);
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
							JSON.stringify({ nodes: stableNodes, edges: stableEdges }),
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
			stableNodes,
			stableEdges,
			materialText,
			materialImages,
			saveMeta,
			saveGoalMapMutation,
			setSaveError,
			addWarning,
			setLastSavedSnapshot,
			navigate,
			kitStatus,
		],
	);

	// ── Context menu handlers ─────────────────────────────────
	const handleNodeClick: NodeMouseHandler = useCallback(
		(_event, node) => {
			const target = _event.target as HTMLElement;
			const nodeElement = target.closest(".react-flow__node") as HTMLElement | null;
			if (nodeElement) {
				const rect = nodeElement.getBoundingClientRect();
				setContextMenu({
					nodeId: node.id,
					nodeType: node.type as "text" | "connector",
					position: { x: rect.left + rect.width / 2, y: rect.top },
				});
			}
		},
		[setContextMenu],
	);

	const handlePaneClick = useCallback(() => {
		setContextMenu(null);
	}, [setContextMenu]);

	const handleEditNodeConfirm = useCallback(
		(data: { label: string; color?: string }) => {
			if (!editNode) return;
			const nextNodes = stableNodes.map((n) => {
				if (n.id !== editNode.id) return n;
				if (editNode.type === "text") {
					return {
						...n,
						data: { ...n.data, label: data.label, color: data.color ?? n.data.color },
					};
				}
				return { ...n, data: { ...n.data, label: data.label } };
			});
			send({
				type: "SET_NODES",
				nodes: nextNodes,
			});
			setEditNode(null);
		},
		[editNode, stableNodes, send, setEditNode],
	);

	// ── Keyboard shortcuts ────────────────────────────────────
	const handleUndo = useCallback(() => send({ type: "UNDO" }), [send]);
	const handleRedo = useCallback(() => send({ type: "REDO" }), [send]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setContextMenu(null);
			}
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				if (saving) return;
				if (isNewMap || !saveMeta.name.trim()) {
					setSaveOpen(true);
				} else {
					doSave({ topicId: saveMeta.topicId, name: saveMeta.name.trim() });
				}
			}
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
				e.preventDefault();
				handleUndo();
			}
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
				e.preventDefault();
				handleRedo();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [saving, doSave, saveMeta, isNewMap, setSaveOpen, setContextMenu, handleUndo, handleRedo]);

	// ── Dialogs and handlers ──────────────────────────────────
	const handleAddConcept = useCallback(
		(data: { label: string; color: TailwindColor }) => {
			addTextNode(data.label, data.color);
			setConceptDialogOpen(false);
		},
		[addTextNode, setConceptDialogOpen],
	);

	const handleAddLink = useCallback(
		(data: { label: string }) => {
			addConnectorNode(data.label);
			setLinkDialogOpen(false);
		},
		[addConnectorNode, setLinkDialogOpen],
	);

	const onConnectEnd = useCallback(() => {
		setContextMenu(null);
	}, [setContextMenu]);

	const handleSaveAs = useCallback(
		(meta: { topicId: string; name: string; description?: string }) => {
			const newId = generateNewId();
			doSave(meta, newId);
			setSaveAsOpen(false);
			updateMeta(meta);
		},
		[doSave, generateNewId, setSaveAsOpen, updateMeta],
	);

	const canUndo = snapshot.context.pointer > 0;
	const canRedo = snapshot.context.pointer < snapshot.context.history.length - 1;

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
				<Suspense fallback={null}>
					<MaterialDialog
						key={`${materialText.slice(0, 50)}-${materialImages.length}`}
						goalMapId={goalMapId}
						materialText={materialText}
						materialImages={materialImages}
					/>
				</Suspense>
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

			<div className="border-t-[0.5px] -mx-4 bg-card relative h-full overflow-hidden">
				<ConceptMapCanvas
					nodes={stableNodes}
					edges={stableEdges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onConnectEnd={onConnectEnd}
					isValidConnection={isValidConnectionHandler}
					onNodeClick={handleNodeClick}
					onPaneClick={handlePaneClick}
					readOnly={false}
				>
					<SearchNodesPanel
						open={searchOpen}
						nodes={stableNodes}
						onClose={() => setSearchOpen(false)}
						onSelectNode={selectNode}
					/>
				</ConceptMapCanvas>

				<EditorToolbar
					onUndo={handleUndo}
					onRedo={handleRedo}
					canUndo={canUndo}
					canRedo={canRedo}
					onZoomIn={handleZoomIn}
					onZoomOut={handleZoomOut}
					onFit={handleFit}
					onCenterMap={centerMap}
					onAutoLayout={handleAutoLayout}
					onDelete={handleDeleteSelected}
					onSave={() => doSave({ topicId: saveMeta.topicId, name: saveMeta.name })}
					saving={saving}
					isNewMap={isNewMap}
					goalMapId={goalMapId}
					onDeleted={() => void navigate({ to: "/dashboard/goal-map", replace: true })}
				/>
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
