import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FilePlusIcon, Loader2 } from "lucide-react";
import { useState } from "react";

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
import { FormList, type FormListItem } from "@/features/form/components/form-list";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { FormRpc } from "@/server/rpc/form";

export const Route = createFileRoute("/dashboard/forms/")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<AdminFormsPage />
		</Guard>
	),
});

function AdminFormsPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [formToDelete, setFormToDelete] = useState<string | null>(null);

	const { data, isLoading } = useRpcQuery(FormRpc.listForms());

	const forms = Array.isArray(data) ? data : [];

	const deleteMutation = useRpcMutation(FormRpc.deleteForm(), {
		operation: "delete form",
		showSuccess: true,
		successMessage: "Form deleted successfully",
		onSuccess: () => {
			setDeleteDialogOpen(false);
			setFormToDelete(null);
			queryClient.invalidateQueries({ queryKey: FormRpc.listForms().queryKey });
		},
	});

	const handleEdit = (form: FormListItem) => {
		navigate({ to: "/dashboard/forms/builder", search: { formId: form.id } });
	};

	const handleViewResults = (form: FormListItem) => {
		navigate({
			to: "/dashboard/forms/$formId/results",
			params: { formId: form.id },
		});
	};

	const handleDelete = (formId: string) => {
		setFormToDelete(formId);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (formToDelete) {
			deleteMutation.mutate({ id: formToDelete });
		}
	};

	const handleCreateNew = () => {
		navigate({ to: "/dashboard/forms/builder" });
	};

	const mappedForms: FormListItem[] = forms.map((form) => ({
		id: form.id,
		title: form.title,
		description: form.description ?? undefined,
		type: form.type,
		status: form.status,
		createdAt: form.createdAt,
		updatedAt: form.updatedAt,
	}));

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<FilePlusIcon className="size-6 text-primary" />
					<div>
						<h1 className="text-2xl font-semibold">Forms</h1>
						<p className="text-muted-foreground">
							Manage your forms and track student responses
						</p>
					</div>
				</div>
				<Button onClick={handleCreateNew}>
					<FilePlusIcon className="mr-2 h-4 w-4" />
					Create Form
				</Button>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : (
				<FormList
					forms={mappedForms}
					onEdit={handleEdit}
					onDelete={handleDelete}
					onViewResults={handleViewResults}
				/>
			)}

			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Form</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this form? This action cannot be undone.
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
