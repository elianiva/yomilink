import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClipboardListIcon, Loader2 } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
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
import { CreateAssignmentDialog } from "@/features/assignment/components/create-assignment-dialog";
import { Guard } from "@/features/auth/components/Guard";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { AssignmentRpc } from "@/server/rpc/assignment";

export const Route = createFileRoute("/dashboard/assignments/manage/")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<AssignmentsManagePage />
		</Guard>
	),
});

function AssignmentsManagePage() {
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
				preTestSubmitted: a.preTestSubmitted ?? null,
				postTestSubmitted: a.postTestSubmitted ?? null,
				delayedPostTestSubmitted: a.delayedPostTestSubmitted ?? null,
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
		<div className="space-y-6 pt-4">
			<PageHeader
				icon={ClipboardListIcon}
				title="Manage Assignments"
				description="Create and manage assignments for your students"
				action={<CreateAssignmentDialog onSuccess={handleCreateSuccess} />}
			/>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="size-8 animate-spin text-muted-foreground" />
				</div>
			) : (
				<AssignmentList
					assignments={assignments}
					viewMode="teacher"
					onViewDetails={handleViewDetails}
					onDelete={handleDelete}
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
								<Loader2 className="mr-2 size-4 animate-spin" />
							)}
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
