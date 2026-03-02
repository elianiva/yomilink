import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type Cohort = { id: string; name: string };

type BulkCohortDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	cohorts: Cohort[];
	selectedCount: number;
	onConfirm: (cohortId: string, action: "add" | "remove") => void;
	isLoading?: boolean;
};

export function BulkCohortDialog({
	open,
	onOpenChange,
	cohorts,
	selectedCount,
	onConfirm,
	isLoading,
}: BulkCohortDialogProps) {
	const [cohortId, setCohortId] = useState("");
	const [action, setAction] = useState<"add" | "remove">("add");

	const handleConfirm = () => {
		if (cohortId) {
			onConfirm(cohortId, action);
			setCohortId("");
			setAction("add");
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Assign to Cohort</DialogTitle>
					<DialogDescription>
						{selectedCount} user{selectedCount !== 1 ? "s" : ""} selected
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<span className="text-sm font-medium">Action</span>
						<Select value={action} onValueChange={(v) => setAction(v as "add" | "remove")}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="add">Add to cohort</SelectItem>
								<SelectItem value="remove">Remove from cohort</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<span className="text-sm font-medium">Cohort</span>
						<Select value={cohortId} onValueChange={setCohortId}>
							<SelectTrigger>
								<SelectValue placeholder="Select a cohort" />
							</SelectTrigger>
							<SelectContent>
								{cohorts.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleConfirm} disabled={!cohortId || isLoading}>
						{isLoading ? "Processing..." : "Confirm"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
