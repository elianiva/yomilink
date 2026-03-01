import { Link } from "@tanstack/react-router";
import { CheckCircle, Circle, Edit, GitFork, Loader2, Trash2 } from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { GoalMap } from "@/features/goal-map/lib/goal-map-service";
import { formatRelativeTime } from "@/lib/date-utils";
import { safeParseJson } from "@/lib/utils";

interface GoalMapCardProps {
	goalMap: GoalMap;
	isDeleteConfirmOpen: boolean;
	isDeleting: boolean;
	onDeleteClick: (goalMapId: string) => void;
	onConfirmDelete: () => void;
}

/**
 * Parse nodes/edges JSON and return counts
 */
function parseGoalMapStats(nodes: unknown, edges: unknown) {
	let nodeCount = 0;
	let edgeCount = 0;

	try {
		const parsedNodes = typeof nodes === "string" ? safeParseJson(nodes, []) : nodes;
		const parsedEdges = typeof edges === "string" ? safeParseJson(edges, []) : edges;

		if (Array.isArray(parsedNodes)) {
			nodeCount = parsedNodes.length;
		}
		if (Array.isArray(parsedEdges)) {
			edgeCount = parsedEdges.length;
		}
	} catch {
		// Ignore parse errors
	}

	return { nodeCount, edgeCount };
}

export function GoalMapCard({
	goalMap,
	isDeleteConfirmOpen,
	isDeleting,
	onDeleteClick,
	onConfirmDelete,
}: GoalMapCardProps) {
	const { nodeCount, edgeCount } = parseGoalMapStats(goalMap.nodes, goalMap.edges);

	return (
		<div className="group relative flex flex-col p-4 bg-card border-[0.5px] rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200">
			{/* Card content */}
			<div className="flex-1 min-w-0">
				<h3 className="font-semibold truncate text-base">{goalMap.title}</h3>
				{goalMap.description && (
					<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
						{goalMap.description}
					</p>
				)}
			</div>

			{/* Metadata row */}
			<div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
				<span className="inline-flex items-center gap-1">
					<Circle className="size-3" aria-hidden="true" />
					{nodeCount} concept{nodeCount !== 1 ? "s" : ""}
				</span>
				<span className="inline-flex items-center gap-1">
					<GitFork className="size-3" aria-hidden="true" />
					{edgeCount} link{edgeCount !== 1 ? "s" : ""}
				</span>
				{goalMap.kitId && (
					<span className="inline-flex items-center gap-1 text-green-600">
						<CheckCircle className="size-3" aria-hidden="true" />
						Kit ready
					</span>
				)}
				{goalMap.updatedAt && (
					<span className="ml-auto">{formatRelativeTime(goalMap.updatedAt)}</span>
				)}
			</div>

			{/* Action buttons - visible on hover */}
			<div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
				<Button asChild variant="secondary" size="icon" className="size-8">
					<Link
						to="/dashboard/goal-map/$goalMapId"
						params={{ goalMapId: goalMap.id }}
						preload="intent"
					>
						<Edit className="size-4" />
						<span className="sr-only">Edit</span>
					</Link>
				</Button>
				<AlertDialog open={isDeleteConfirmOpen}>
					<AlertDialogTrigger asChild>
						<Button
							variant="secondary"
							size="icon"
							className="size-8"
							onClick={() => onDeleteClick(goalMap.id)}
							disabled={isDeleting}
						>
							<Trash2 className="size-4" />
							<span className="sr-only">Delete</span>
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete Goal Map</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to delete "{goalMap.title}"? This action
								cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel asChild>
								<Button variant="outline" disabled={isDeleting}>
									Cancel
								</Button>
							</AlertDialogCancel>
							<AlertDialogAction asChild>
								<Button
									variant="destructive"
									onClick={onConfirmDelete}
									disabled={isDeleting}
								>
									{isDeleting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Deleting...
										</>
									) : (
										"Delete"
									)}
								</Button>
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
