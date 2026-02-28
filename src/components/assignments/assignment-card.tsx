import { CalendarIcon, MapIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";

interface AssignmentCardProps {
	assignment: {
		id: string;
		title: string;
		description: string;
		goalMapTitle: string;
		startDate: number;
		dueAt: number;
		createdAt: number;
		updatedAt: number;
	};
	onDelete: (id: string) => void;
}

export function AssignmentCard({ assignment, onDelete }: AssignmentCardProps) {
	return (
		<div className="rounded-lg border bg-card p-4 space-y-3">
			<div className="flex items-start justify-between">
				<div>
					<h3 className="font-medium">{assignment.title}</h3>
					{assignment.description && (
						<p className="text-sm text-muted-foreground line-clamp-2">
							{assignment.description}
						</p>
					)}
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="text-destructive hover:text-destructive"
					onClick={() => onDelete(assignment.id)}
				>
					<Trash2Icon className="size-4" />
				</Button>
			</div>

			<div className="flex items-center gap-4 text-sm text-muted-foreground">
				<div className="flex items-center gap-1">
					<MapIcon className="size-4" />
					<span>{assignment.goalMapTitle ?? "Unknown"}</span>
				</div>
				{assignment.startDate && (
					<div className="flex items-center gap-1">
						<CalendarIcon className="size-4" />
						<span>{formatDate(assignment.startDate)}</span>
					</div>
				)}
				{assignment.dueAt && (
					<div className="flex items-center gap-1">
						<CalendarIcon className="size-4" />
						<span>{formatDate(assignment.dueAt)}</span>
					</div>
				)}
			</div>
		</div>
	);
}
