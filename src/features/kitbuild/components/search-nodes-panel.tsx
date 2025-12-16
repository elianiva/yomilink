import type { Node } from "@xyflow/react";
import { Search, X } from "lucide-react";
import { memo, useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SearchNodesPanelProps = {
	open: boolean;
	nodes: Node[];
	onClose: () => void;
	onSelectNode: (nodeId: string) => void;
};

function SearchNodesPanelImpl({
	open,
	nodes,
	onClose,
	onSelectNode,
}: SearchNodesPanelProps) {
	const [query, setQuery] = useState("");
	const inputId = useId();

	useEffect(() => {
		if (open) {
			setQuery("");
		}
	}, [open]);

	const filteredNodes = useMemo(() => {
		if (!query.trim()) return nodes;
		const lowerQuery = query.toLowerCase();
		return nodes.filter((node) => {
			const label =
				(node.data as { label?: string })?.label ??
				(node.data as { caption?: string })?.caption ??
				"";
			return label.toLowerCase().includes(lowerQuery);
		});
	}, [nodes, query]);

	if (!open) return null;

	return (
		<div className="absolute top-2 left-2 z-10 w-72 rounded-lg border bg-background shadow-lg">
			<div className="flex items-center gap-2 border-b p-2">
				<Search className="size-4 text-muted-foreground" />
				<Input
					id={inputId}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search nodes..."
					className="h-8 border-0 shadow-none focus-visible:ring-0"
					autoFocus
				/>
				<Button
					variant="ghost"
					size="icon"
					className="size-7"
					onClick={onClose}
				>
					<X className="size-4" />
				</Button>
			</div>

			<div className="max-h-64 overflow-y-auto p-1">
				{filteredNodes.length === 0 ? (
					<div className="px-3 py-4 text-center text-sm text-muted-foreground">
						{query ? "No nodes found" : "No nodes in canvas"}
					</div>
				) : (
					<div className="space-y-0.5">
						{filteredNodes.map((node) => {
							const label =
								(node.data as { label?: string })?.label ??
								(node.data as { caption?: string })?.caption ??
								"Untitled";
							const typeColor =
								node.type === "text"
									? "bg-emerald-500"
									: node.type === "connector"
										? "bg-sky-500"
										: "bg-amber-500";

							return (
								<button
									key={node.id}
									type="button"
									onClick={() => {
										onSelectNode(node.id);
										onClose();
									}}
									className={cn(
										"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
										"hover:bg-accent transition-colors",
									)}
								>
									<span
										className={cn(
											"inline-flex h-4 w-1.5 shrink-0 rounded-sm",
											typeColor,
										)}
									/>
									<span className="truncate">{label}</span>
									<span className="ml-auto text-xs text-muted-foreground">
										{node.type}
									</span>
								</button>
							);
						})}
					</div>
				)}
			</div>

			<div className="border-t px-3 py-2 text-xs text-muted-foreground">
				{filteredNodes.length} node{filteredNodes.length !== 1 ? "s" : ""}{" "}
				{query && `matching "${query}"`}
			</div>
		</div>
	);
}

export const SearchNodesPanel = memo(SearchNodesPanelImpl);
