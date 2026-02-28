import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MapIcon } from "lucide-react";

import { AssignmentCard } from "@/components/assignments/assignment-card";
import { CreateAssignmentDialog } from "@/components/assignments/create-assignment-dialog";
import { Guard } from "@/components/auth/Guard";
import { Skeleton } from "@/components/ui/skeleton";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { AssignmentRpc } from "@/server/rpc/assignment";

export const Route = createFileRoute("/dashboard/assignments/manage")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<ManageAssignmentsPage />
		</Guard>
	),
});

function ManageAssignmentsPage() {
	const queryClient = useQueryClient();

	const { data: assignments, isLoading } = useRpcQuery(AssignmentRpc.listTeacherAssignments());

	const deleteMutation = useRpcMutation(AssignmentRpc.deleteAssignment(), {
		operation: "delete assignment",
		showSuccess: true,
		successMessage: "Assignment deleted successfully",
	});

	const handleDelete = (id: string) => {
		if (confirm("Are you sure you want to delete this assignment?")) {
			deleteMutation.mutate(
				{ id },
				{
					onSuccess: () => {
						queryClient.invalidateQueries({ queryKey: ["assignments"] });
					},
				},
			);
		}
	};

	const handleCreateSuccess = () => {
		queryClient.invalidateQueries({ queryKey: ["assignments"] });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Manage Assignments</h1>
					<p className="text-muted-foreground">
						Create and manage assignments for your students
					</p>
				</div>
				<CreateAssignmentDialog onSuccess={handleCreateSuccess} />
			</div>

			{isLoading ? (
				<Skeleton className="h-full w-full" />
			) : assignments && assignments.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{assignments.map((assignment) => (
						<AssignmentCard
							key={assignment.id}
							assignment={assignment}
							onDelete={handleDelete}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-12 border rounded-lg bg-card">
					<MapIcon className="size-12 mx-auto text-muted-foreground mb-4" />
					<h3 className="font-medium mb-1">No assignments yet</h3>
					<p className="text-sm text-muted-foreground mb-4">
						Create your first assignment to get started
					</p>
					<CreateAssignmentDialog onSuccess={handleCreateSuccess} />
				</div>
			)}
		</div>
	);
}
