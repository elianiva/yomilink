import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AnyNode } from "../lib/save";
import type { TextNodeData } from "./TextNode";
import type { ConnectorNodeData } from "./connector-node";
import type { ImageNodeData } from "./ImageNode";

interface NodePaletteSidebarProps {
	nodes: AnyNode[];
	onAddTextNode: (label: string) => void;
	onAddConnectorNode: (label: string) => void;
	onAddImageNode: (url: string, caption?: string) => void;
	onDeleteNode: (id: string) => void;
	imageDraft: { url: string; caption?: string } | null;
	onImageDraftChange: (draft: { url: string; caption?: string } | null) => void;
}

export function NodePaletteSidebar({
	nodes,
	onAddTextNode,
	onAddConnectorNode,
	onAddImageNode,
	onDeleteNode,
	imageDraft,
	onImageDraftChange,
}: NodePaletteSidebarProps) {
	const [textDraft, setTextDraft] = useState("");
	const [connDraft, setConnDraft] = useState("is");

	const handleAddText = () => {
		if (textDraft.trim()) {
			onAddTextNode(textDraft.trim());
			setTextDraft("");
		}
	};

	const handleAddConnector = () => {
		if (connDraft.trim()) {
			onAddConnectorNode(connDraft.trim());
		}
	};

	const handleAddImage = () => {
		if (imageDraft?.url) {
			onAddImageNode(imageDraft.url, imageDraft.caption);
			onImageDraftChange(null);
		}
	};

	return (
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
							onKeyDown={(e) => {
								if (e.key === "Enter") handleAddText();
							}}
						/>
						<Button onClick={handleAddText} title="Add text node">
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
								onImageDraftChange({
									url: e.target.value,
									caption: imageDraft?.caption,
								})
							}
							placeholder="Paste image URL or pick from left"
						/>
						<Button onClick={handleAddImage} disabled={!imageDraft?.url}>
							<Plus className="size-4" />
							Add
						</Button>
					</div>
					<Input
						value={imageDraft?.caption ?? ""}
						onChange={(e) =>
							onImageDraftChange({
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
							onKeyDown={(e) => {
								if (e.key === "Enter") handleAddConnector();
							}}
						/>
						<Button onClick={handleAddConnector}>
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
									onClick={() => onDeleteNode(n.id)}
								>
									remove
								</button>
							</div>
						))}
						{nodes.length === 0 ? (
							<div className="text-xs text-muted-foreground">No nodes yet</div>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}
