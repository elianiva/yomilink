import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AnyNode } from "../lib/save";
import type { TextNodeData } from "./TextNode";
import type { ConnectorNodeData } from "./connector-node";

export interface NodePaletteSidebarProps {
	nodes: AnyNode[];
	onAddTextNode: (label: string) => void;
	onAddConnectorNode: (label: string) => void;
	onDeleteNode: (id: string) => void;
}

export function NodePaletteSidebar({
	nodes,
	onAddTextNode,
	onAddConnectorNode,
	onDeleteNode,
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
											n.type === "text" ? "bg-emerald-500" : "bg-sky-500",
										].join(" ")}
									/>
									{n.type}:{" "}
									{n.type === "text"
										? (n.data as TextNodeData)?.label
										: (n.data as ConnectorNodeData)?.label}
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
