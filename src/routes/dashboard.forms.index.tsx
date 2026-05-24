import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FilePlusIcon, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Guard } from "@/features/auth/components/Guard";
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
			void queryClient.invalidateQueries({ queryKey: FormRpc.listForms().queryKey });
		},
	});

	const duplicateMutation = useRpcMutation(FormRpc.cloneForm(), {
		operation: "duplicate form",
		showSuccess: true,
		successMessage: "Form duplicated successfully",
		onSuccess: async (result) => {
			await queryClient.invalidateQueries({ queryKey: FormRpc.listForms().queryKey });
			void navigate({ to: "/dashboard/forms/builder", search: { formId: result.id } });
		},
	});

	const handleEdit = (form: FormListItem) => {
		void navigate({ to: "/dashboard/forms/builder", search: { formId: form.id } });
	};

	const handleViewResults = (form: FormListItem) => {
		void navigate({
			to: "/dashboard/forms/$formId/results",
			params: { formId: form.id },
		});
	};

	const handleDuplicate = (form: FormListItem) => {
		duplicateMutation.mutate({ formId: form.id });
	};

	const handleDelete = (formId: string) => {
		setFormToDelete(formId);
		setDeleteDialogOpen(true);
	};

	const confirmDelete = () => {
		if (formToDelete) {
			deleteMutation.mutate({ formId: formToDelete });
		}
	};

	const handleCreateNew = () => {
		void navigate({ to: "/dashboard/forms/builder" });
	};

	const mappedForms: FormListItem[] = forms
		.filter((f) => f.type !== "tam")
		.map((form) => ({
			id: form.id,
			title: form.title,
			description: form.description ?? undefined,
			type: form.type as FormListItem["type"],
			status: form.status,
			createdAt: form.createdAt,
			updatedAt: form.updatedAt,
			stats: form.stats,
		}));

	const compareTitles = (a: FormListItem, b: FormListItem) => a.title.localeCompare(b.title);

	const drafts = mappedForms.filter((f) => f.status === "draft").sort(compareTitles);
	const published = mappedForms.filter((f) => f.status === "published").sort(compareTitles);

	return (
		<div className="space-y-6">
			<PageHeader
				icon={FilePlusIcon}
				title="Forms"
				description="Manage your forms and track student responses"
				action={
					<Button onClick={handleCreateNew} className="interactive-sm">
						<FilePlusIcon className="mr-2 size-4" />
						Create Form
					</Button>
				}
			/>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="size-8 animate-spin text-muted-foreground" />
				</div>
			) : (
				<Tabs defaultValue="published">
					<TabsList>
						<TabsTrigger value="published">Published ({published.length})</TabsTrigger>
						<TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
					</TabsList>
					<TabsContent value="published">
						<FormList
							forms={published}
							onEdit={handleEdit}
							onDelete={handleDelete}
							onDuplicate={handleDuplicate}
							onViewResults={handleViewResults}
						/>
					</TabsContent>
					<TabsContent value="drafts">
						<FormList
							forms={drafts}
							onEdit={handleEdit}
							onDelete={handleDelete}
							onDuplicate={handleDuplicate}
							onViewResults={handleViewResults}
						/>
					</TabsContent>
				</Tabs>
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
