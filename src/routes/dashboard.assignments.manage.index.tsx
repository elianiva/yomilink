import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardListIcon, Loader2 } from "lucide-react";
import { useState } from "react";

import { CreateAssignmentDialog } from "@/components/assignments/create-assignment-dialog";
import { Guard } from "@/components/auth/Guard";
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
	AssignmentList,
	type AssignmentListItem,
} from "@/features/assignment/components/assignment-list";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { AssignmentRpc } from "@/server/rpc/assignment";

export const Route = createFileRoute("/dashboard/assignments/manage/")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<ManageAssignmentsPage />
		</Guard>
	),
});

function ManageAssignmentsPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);

	const { data, isLoading } = useRpcQuery(AssignmentRpc.listTeacherAssignments());

	const assignments: AssignmentListItem[] = Array.isArray(data)
		? data.map((a) => ({
				id: a.id,
				title: a.title,
				description: a.description,
				goalMapTitle: a.goalMapTitle,
				startDate: a.startDate,
				dueAt: a.dueAt,
				createdAt: a.createdAt,
				totalStudents: a.totalStudents ?? 0,
				submittedStudents: a.submittedStudents ?? 0,
				allSubmitted: a.allSubmitted ?? false,
				preTestFormId: a.preTestFormId,
				postTestFormId: a.postTestFormId,
				delayedPostTestFormId: a.delayedPostTestFormId,
				tamFormId: a.tamFormId,
				preTestSubmitted: a.preTestSubmitted ?? null,
				postTestSubmitted: a.postTestSubmitted ?? null,
				delayedPostTestSubmitted: a.delayedPostTestSubmitted ?? null,
				tamSubmitted: a.tamSubmitted ?? null,
				assignedCohortCount: a.assignedCohorts?.length ?? 0,
				assignedDirectUserCount: a.assignedUsers?.length ?? 0,
			}))
		: [];

	const deleteMutation = useRpcMutation(AssignmentRpc.deleteAssignment(), {
		operation: "delete assignment",
		showSuccess: true,
		successMessage: "Assignment deleted successfully",
		onSuccess: () => {
			setDeleteDialogOpen(false);
			setAssignmentToDelete(null);
			void queryClient.invalidateQueries({ queryKey: ["assignments"] });
		},
	});

	const handleDelete = (id: string) => {
		setAssignmentToDelete(id);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (assignmentToDelete) {
			deleteMutation.mutate({ id: assignmentToDelete });
		}
	};

	const handleCreateSuccess = () => {
		void queryClient.invalidateQueries({ queryKey: ["assignments"] });
	};

	const handleViewDetails = (assignment: AssignmentListItem) => {
		void navigate({
			to: "/dashboard/assignments/manage/$assignmentId",
			params: { assignmentId: assignment.id },
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<ClipboardListIcon className="size-6 text-primary" />
					<div>
						<h1 className="text-2xl font-semibold">Manage Assignments</h1>
						<p className="text-muted-foreground">
							Create and manage assignments for your students
						</p>
					</div>
				</div>
				<CreateAssignmentDialog onSuccess={handleCreateSuccess} />
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : (
				<AssignmentList
					assignments={assignments}
					viewMode="teacher"
					onViewDetails={handleViewDetails}
					onDelete={handleDelete}
					onClick={handleViewDetails}
				/>
			)}

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Assignment</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this assignment? This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDelete}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
