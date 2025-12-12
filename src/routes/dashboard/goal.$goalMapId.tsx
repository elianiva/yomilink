import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactFlowInstance } from "@xyflow/react";
import {
	addEdge,
	Background,
	type Connection,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";

import { Guard } from "@/components/auth/Guard";
import "@xyflow/react/dist/style.css";

import { Plus } from "lucide-react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import ConnectorNode, {
	type ConnectorNodeData,
} from "@/components/goalmap/ConnectorNode";
import EditorToolbar from "@/components/goalmap/EditorToolbar";
import { SaveDialog, WarningsPanel } from "@/components/goalmap/SaveDialog";
import ImageNode, {
	type ImageNodeData,
} from "@/components/kit/nodes/ImageNode";
import TextNode, { type TextNodeData } from "@/components/kit/nodes/TextNode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoalMapValidator } from "@/lib/goalmap-validator";
import { saveGoalMap } from "@/server/rpc/goal-map";
import { generateKit } from "@/server/rpc/kit";

export const Route = createFileRoute("/dashboard/goal/$goalMapId")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<TeacherGoalMapEditor />
		</Guard>
	),
});

type AnyNode = Node<TextNodeData | ImageNodeData | ConnectorNodeData>;

type GoalMapDoc = {
	goalMapId: string;
	title?: string;
	description?: string;
	nodes: AnyNode[];
	edges: Edge[];
	viewport: { x: number; y: number; zoom: number };
	updatedAt: number;
	version: number;
};

type KitNode =
	| { id: string; type: "text"; label: string }
	| { id: string; type: "connector"; label: string }
	| { id: string; type: "image"; label?: string; image_url: string };

type KitExport = {
	kit_id: string;
	nodes: KitNode[];
	edges: Array<{ source: string; target: string }>;
	goal_map_id: string;
};

function TeacherGoalMapEditor() {
	const nodeTypes = useMemo(
		() => ({
			text: TextNode,
			image: ImageNode,
			connector: ConnectorNode,
		}),
		[],
	);

	const [nodes, setNodes, onNodesChange] = useNodesState<AnyNode>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([] as Edge[]);

	const nodesRef = useRef<AnyNode[]>([]);
	useEffect(() => {
		nodesRef.current = nodes;
	}, [nodes]);

	const rfRef = useRef<ReactFlowInstance<AnyNode, Edge> | null>(null);
	const { goalMapId } = Route.useParams();
	const navigate = useNavigate();
	const [existing, setExisting] = useState<any>(null);
	useEffect(() => {
		let cancelled = false;
		(async () => {
			const res = await fetch(`/api/goal-maps/${goalMapId}`);
			if (!cancelled && res.ok) setExisting(await res.json());
		})();
		return () => {
			cancelled = true;
		};
	}, [goalMapId]);

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

	// simple undo/redo
	const historyRef = useRef<Array<{ nodes: AnyNode[]; edges: Edge[] }>>([
		{ nodes: [], edges: [] },
	]);
	const pointerRef = useRef(0);
	const isApplyingRef = useRef(false);
	const isHydratedRef = useRef(false);

	useEffect(() => {
		if (isApplyingRef.current) return;
		const current = { nodes, edges };
		const last = historyRef.current[pointerRef.current];
		const same =
			JSON.stringify(current.nodes) === JSON.stringify(last.nodes) &&
			JSON.stringify(current.edges) === JSON.stringify(last.edges);
		if (same) return;
		historyRef.current = historyRef.current.slice(0, pointerRef.current + 1);
		historyRef.current.push({
			nodes: JSON.parse(JSON.stringify(nodes)),
			edges: JSON.parse(JSON.stringify(edges)),
		});
		pointerRef.current++;
	}, [nodes, edges]);

	const undo = () => {
		if (pointerRef.current <= 0) return;
		pointerRef.current--;
		const snap = historyRef.current[pointerRef.current];
		isApplyingRef.current = true;
		setNodes(snap.nodes);
		setEdges(snap.edges);
		requestAnimationFrame(() => {
			isApplyingRef.current = false;
		});
	};

	const redo = () => {
		if (pointerRef.current >= historyRef.current.length - 1) return;
		pointerRef.current++;
		const snap = historyRef.current[pointerRef.current];
		isApplyingRef.current = true;
		setNodes(snap.nodes);
		setEdges(snap.edges);
		requestAnimationFrame(() => {
			isApplyingRef.current = false;
		});
	};

	// importer state
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [materialText, setMaterialText] = useState<string>("");
	const [images, setImages] = useState<
		Array<{ id: string; url: string; name: string }>
	>([]);

	// save UX state
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveWarnings, setSaveWarnings] = useState<string[]>([]);
	const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
	const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(
		null,
	);
	const isDirty = useMemo(
		() => JSON.stringify({ nodes, edges }) !== lastSavedSnapshot,
		[nodes, edges, lastSavedSnapshot],
	);

	// save metadata dialog state
	const [saveOpen, setSaveOpen] = useState(false);
	const [saveTopic, setSaveTopic] = useState("");
	const [saveName, setSaveName] = useState("");

	// hydrate editor from backend when editing an existing map
	useEffect(() => {
		if (existing && !isHydratedRef.current) {
			try {
				const loadedNodes = Array.isArray(existing.nodes) ? existing.nodes : [];
				const loadedEdges = Array.isArray(existing.edges) ? existing.edges : [];
				setNodes(loadedNodes);
				setEdges(loadedEdges);
				setSaveTopic(
					typeof existing.description === "string" ? existing.description : "",
				);
				setSaveName(typeof existing.title === "string" ? existing.title : "");
				setLastSavedSnapshot(
					JSON.stringify({ nodes: loadedNodes, edges: loadedEdges }),
				);
			} finally {
				isHydratedRef.current = true;
			}
		}
	}, [existing, setNodes, setEdges]);

	const onImportFiles = async (files: FileList | null) => {
		if (!files) return;
		for (const file of Array.from(files)) {
			const sizeOk = file.size <= 10 * 1024 * 1024;
			if (!sizeOk) {
				console.warn("file too large", file.name);
				continue;
			}
			if (file.type === "text/plain") {
				const text = await file.text();
				setMaterialText((t) => (t ? `${t}\n\n` : "") + text);
			} else if (/(png|jpg|jpeg)/i.test(file.type)) {
				const url = URL.createObjectURL(file);
				setImages((arr) => [
					...arr,
					{ id: crypto.randomUUID(), url, name: file.name },
				]);
			} else {
				console.warn("unsupported type", file.type);
			}
		}
	};

	// creation forms
	const [textDraft, setTextDraft] = useState("");
	const [connDraft, setConnDraft] = useState("is");
	const [imageDraft, setImageDraft] = useState<{
		url: string;
		caption?: string;
	} | null>(null);

	const addTextNode = () => {
		if (!textDraft.trim()) return;
		const id = crypto.randomUUID();
		setNodes((nds) => [
			...nds,
			{
				id,
				type: "text",
				position: {
					x: 150 + Math.random() * 100,
					y: 120 + Math.random() * 100,
				},
				data: { label: textDraft.trim(), variant: "green" },
			},
		]);
		setTextDraft("");
	};

	const addConnectorNode = () => {
		if (!connDraft.trim()) return;
		const id = crypto.randomUUID();
		setNodes((nds) => [
			...nds,
			{
				id,
				type: "connector",
				position: {
					x: 400 + Math.random() * 100,
					y: 200 + Math.random() * 100,
				},
				data: { label: connDraft.trim() },
			},
		]);
	};

	const addImageNode = () => {
		if (!imageDraft?.url) return;
		const id = crypto.randomUUID();
		setNodes((nds) => [
			...nds,
			{
				id,
				type: "image",
				position: {
					x: 600 + Math.random() * 120,
					y: 240 + Math.random() * 120,
				},
				data: { url: imageDraft.url, caption: imageDraft.caption },
			},
		]);
		setImageDraft(null);
	};

	const delSelected = () => {
		setNodes((nds) => nds.filter((n) => !n.selected));
		setEdges((eds) => eds.filter((e) => !e.selected));
	};

	const getNodeType = useCallback(
		(id?: string | null) => nodesRef.current.find((n) => n.id === id)?.type,
		[],
	);

	const onConnect = useCallback(
		(params: Connection) => {
			const sType = getNodeType(params.source ?? null);
			const tType = getNodeType(params.target ?? null);
			const ok =
				((sType === "text" || sType === "image") && tType === "connector") ||
				(sType === "connector" && (tType === "text" || tType === "image"));
			if (!ok) {
				console.warn("invalid connection", sType, "→", tType);
				return;
			}
			setEdges((eds) => addEdge(params, eds));
		},
		[getNodeType, setEdges],
	);

	const zoomIn = () => rfRef.current?.zoomIn?.();
	const zoomOut = () => rfRef.current?.zoomOut?.();
	const fit = () => rfRef.current?.fitView?.({ padding: 0.2 });

	const validate = useCallback(() => {
		// Use enhanced KBFIRA validation
		const validationResult = GoalMapValidator.validateNodes(nodes, edges).pipe(
			Effect.runSync,
		);
		return validationResult.errors;
	}, [nodes, edges]);

	const buildKit = (): KitExport => {
		const kitNodes: KitNode[] = nodes.map((n) => {
			if (n.type === "text") {
				const d = n.data as TextNodeData;
				return { id: n.id, type: "text", label: d.label };
			}
			if (n.type === "image") {
				const d = n.data as ImageNodeData;
				return { id: n.id, type: "image", label: d.caption, image_url: d.url };
			}
			const d = n.data as ConnectorNodeData;
			return { id: n.id, type: "connector", label: d.label };
		});
		const kitEdges = edges.map((e) => ({ source: e.source, target: e.target }));
		return {
			kit_id: crypto.randomUUID(),
			nodes: kitNodes,
			edges: kitEdges,
			goal_map_id: goalMapId,
		};
	};

	const doSave = useCallback(
		async (meta: { topic: string; name: string }) => {
			setSaving(true);
			setSaveError(null);
			// Collect client-side warnings but do not block save, surface to user
			const viewport = rfRef.current?.getViewport?.() ?? {
				x: 0,
				y: 0,
				zoom: 1,
			};

			// Enhanced KBFIRA validation
			const validationResult = GoalMapValidator.validateNodes(
				nodes,
				edges,
			).pipe(Effect.runSync);
			const clientWarnings = validationResult.errors;
			const enhancedWarnings = validationResult.warnings;

			setSaveWarnings(clientWarnings);
			setValidationWarnings(enhancedWarnings);

			const payload: GoalMapDoc = {
				goalMapId,
				title: meta.name,
				description: meta.topic,
				nodes,
				edges,
				viewport,
				updatedAt: Date.now(),
				version: 1,
			};

			try {
				await saveGoalMap({
					data: {
						goalMapId,
						title: meta.name,
						description: meta.topic,
						nodes,
						edges,
						updatedAt: Date.now(),
					},
				});

				// Mark snapshot as saved
				setLastSavedSnapshot(JSON.stringify({ nodes, edges }));

				// Optional: console tracing
				console.log("goalmap.save", {
					payload,
					clientWarnings,
					enhancedWarnings,
					propositions: validationResult.propositions,
				});
			} catch (err: unknown) {
				const message =
					err instanceof Error ? err.message : "Save failed. Please try again.";
				const msg = String(message || "");
				// Fallback: if unauthenticated, store locally so Save still provides value
				if (/unauthorized|forbidden/i.test(msg)) {
					try {
						const localDoc = {
							goalMapId,
							title: meta.name,
							description: meta.topic,
							nodes,
							edges,
							updatedAt: Date.now(),
						};
						localStorage.setItem(
							`goalmap:${goalMapId}`,
							JSON.stringify(localDoc),
						);
						setLastSavedSnapshot(JSON.stringify({ nodes, edges }));
						setSaveWarnings((prev) => {
							const next = new Set([
								...(prev ?? []),
								"Saved locally (not signed in). Changes are only on this device.",
							]);
							return Array.from(next);
						});
						setSaveError(null);
					} catch {
						setSaveError(msg);
					}
				} else {
					setSaveError(msg);
				}
				console.error("goalmap.save error", err);
			} finally {
				setSaving(false);
			}
		},
		[goalMapId, nodes, edges],
	);

	const handleExportKit = () => {
		const errors = validate();
		if (errors.length) {
			console.warn("Validation failed:", errors);
			return;
		}
		const kit = buildKit();
		const blob = new Blob([JSON.stringify(kit, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `kit_${goalMapId}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	// Initialize "dirty" baseline to current graph on first render
	useEffect(() => {
		if (lastSavedSnapshot === null) {
			setLastSavedSnapshot(JSON.stringify({ nodes, edges }));
		}
	}, [lastSavedSnapshot, nodes, edges]);

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
	}, [doSave, saving, saveTopic, saveName]);

	const materialTextareaId = useId();

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button asChild variant="outline" size="sm">
						<Link to="/dashboard">Back</Link>
					</Button>
					<h2 className="text-lg font-semibold">Teacher Goal Map Editor</h2>
				</div>
				<div className="flex items-center gap-2">
					<EditorToolbar
						onUndo={undo}
						onRedo={redo}
						onZoomIn={zoomIn}
						onZoomOut={zoomOut}
						onFit={fit}
						onDelete={delSelected}
						onSaveClick={() => setSaveOpen(true)}
						onExport={handleExportKit}
						saving={saving}
						isDirty={isDirty}
					/>
					<Button
						variant="default"
						size="sm"
						onClick={async () => {
							try {
								await saveGoalMap({
									data: {
										goalMapId,
										title: saveName || "Untitled",
										description: saveTopic,
										nodes,
										edges,
										updatedAt: Date.now(),
									},
								});
								const gen = await generateKit({ data: { goalMapId } });
								console.log("kit.generate", gen);
							} catch (e) {
								console.error("kit.generate error", e);
							}
						}}
					>
						Generate Kit
					</Button>
				</div>
			</div>

			<WarningsPanel
				warnings={saveWarnings}
				onClear={() => setSaveWarnings([])}
			/>
			{validationWarnings.length > 0 ? (
				<WarningsPanel
					warnings={validationWarnings}
					variant="warning"
					onClear={() => setValidationWarnings([])}
					className="mt-2"
				/>
			) : null}
			{saveError ? (
				<WarningsPanel
					warnings={[saveError]}
					variant="error"
					onClear={() => setSaveError(null)}
					className="mt-2"
				/>
			) : null}

			<SaveDialog
				open={saveOpen}
				saving={saving}
				defaultTopic={saveTopic}
				defaultName={saveName}
				onCancel={() => setSaveOpen(false)}
				onConfirm={async (meta) => {
					await doSave(meta);
					setSaveOpen(false);
					setSaveTopic(meta.topic);
					setSaveName(meta.name);
				}}
			/>

			<div className="grid gap-3 grid-cols-12">
				{/* Importer */}
				<div className="col-span-12 lg:col-span-3 rounded-xl border p-3 space-y-3">
					<div className="text-sm font-medium text-muted-foreground">
						Learning Material
					</div>
					<div className="flex items-center gap-2">
						<input
							ref={fileInputRef}
							type="file"
							multiple
							accept=".txt,image/png,image/jpeg"
							onChange={(e) => onImportFiles(e.currentTarget.files)}
							className="sr-only"
						/>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={() => fileInputRef.current?.click()}
							title="Pick files"
						>
							Pick files
						</Button>
						<span className="text-xs text-muted-foreground">
							.txt, .png, .jpg
						</span>
					</div>
					<div className="space-y-2">
						<Label htmlFor={materialTextareaId}>Text</Label>
						<textarea
							id={materialTextareaId}
							className="w-full min-h-40 rounded-md border bg-background p-2 text-sm"
							value={materialText}
							onChange={(e) => setMaterialText(e.target.value)}
							placeholder="Imported text appears here..."
						/>
					</div>
					<div className="space-y-2">
						<div className="text-sm font-medium">Images</div>
						<div className="grid grid-cols-3 gap-2">
							{images.map((img) => (
								<button
									type="button"
									key={img.id}
									className="overflow-hidden rounded-md border"
									onClick={() =>
										setImageDraft({ url: img.url, caption: img.name })
									}
									title="Use in image node"
								>
									<img
										src={img.url}
										alt={img.name}
										className="h-20 w-full object-cover"
									/>
								</button>
							))}
							{images.length === 0 ? (
								<div className="text-xs text-muted-foreground">
									No images imported
								</div>
							) : null}
						</div>
					</div>
				</div>

				{/* Canvas */}
				<div className="col-span-12 lg:col-span-6 rounded-xl border bg-card">
					<div className="h-[520px] lg:h-[calc(100vh-14rem)]">
						<ReactFlow
							nodes={nodes}
							edges={edges}
							nodeTypes={nodeTypes}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
							onConnect={onConnect}
							defaultEdgeOptions={{
								style: { stroke: "#16a34a", strokeWidth: 3 },
							}}
							onInit={(instance) => {
								rfRef.current = instance as ReactFlowInstance<AnyNode, Edge>;
							}}
							fitView
						>
							<MiniMap />
							<Background gap={16} />
							<Controls position="bottom-right" />
						</ReactFlow>
					</div>
				</div>

				{/* Node palette */}
				<div className="col-span-12 lg:col-span-3 rounded-xl border p-3 space-y-4">
					<div className="flex items-center justify-between">
						<div className="text-sm font-medium text-muted-foreground">
							Create Nodes
						</div>
					</div>

					<div className="space-y-3">
						<div className="space-y-2">
							<Label>Text Node</Label>
							<div className="flex gap-2">
								<Input
									value={textDraft}
									onChange={(e) => setTextDraft(e.target.value)}
									placeholder="Enter label (or select text and paste)"
								/>
								<Button onClick={addTextNode} title="Add text node">
									<Plus className="size-4" />
									Add
								</Button>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Image Node</Label>
							<div className="flex gap-2">
								<Input
									value={imageDraft?.url ?? ""}
									onChange={(e) =>
										setImageDraft({
											url: e.target.value,
											caption: imageDraft?.caption,
										})
									}
									placeholder="Paste image URL or pick from left"
								/>
								<Button onClick={addImageNode} disabled={!imageDraft?.url}>
									<Plus className="size-4" />
									Add
								</Button>
							</div>
							<Input
								value={imageDraft?.caption ?? ""}
								onChange={(e) =>
									setImageDraft({
										url: imageDraft?.url ?? "",
										caption: e.target.value,
									})
								}
								placeholder="Optional caption"
							/>
						</div>

						<div className="space-y-2">
							<Label>Connector</Label>
							<div className="flex gap-2">
								<Input
									value={connDraft}
									onChange={(e) => setConnDraft(e.target.value)}
									placeholder='e.g. "is", "causes", "belongs to"'
								/>
								<Button onClick={addConnectorNode}>
									<Plus className="size-4" />
									Add
								</Button>
							</div>
							<div className="flex flex-wrap gap-2">
								{["is", "causes", "belongs to"].map((p) => (
									<button
										key={p}
										type="button"
										className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-900 ring-1 ring-sky-200 hover:bg-sky-200"
										onClick={() => setConnDraft(p)}
									>
										{p}
									</button>
								))}
							</div>
						</div>

						<div className="pt-1">
							<div className="text-sm font-medium text-muted-foreground mb-1">
								Nodes
							</div>
							<div className="max-h-[260px] overflow-auto space-y-2 text-sm">
								{nodes.map((n) => (
									<div
										key={n.id}
										className="flex items-center justify-between rounded-md border px-2 py-1.5"
									>
										<span className="truncate">
											<span
												className={[
													"mr-2 inline-flex h-4 w-1.5 rounded-sm",
													n.type === "text"
														? "bg-emerald-500"
														: n.type === "connector"
															? "bg-sky-500"
															: "bg-amber-500",
												].join(" ")}
											/>
											{n.type}:{" "}
											{n.type === "text"
												? (n.data as TextNodeData)?.label
												: n.type === "connector"
													? (n.data as ConnectorNodeData)?.label
													: ((n.data as ImageNodeData)?.caption ??
														(n.data as ImageNodeData)?.url)}
										</span>
										<button
											type="button"
											className="text-xs text-muted-foreground hover:text-destructive"
											onClick={() => {
												setNodes((nds) => nds.filter((x) => x.id !== n.id));
												setEdges((eds) =>
													eds.filter(
														(e) => e.source !== n.id && e.target !== n.id,
													),
												);
											}}
										>
											remove
										</button>
									</div>
								))}
								{nodes.length === 0 ? (
									<div className="text-xs text-muted-foreground">
										No nodes yet
									</div>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
