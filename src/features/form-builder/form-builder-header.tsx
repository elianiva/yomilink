import { FilePlusIcon, Loader2, Save, Eye, EyeOff, ArrowLeft, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FormStatus } from "@/features/form/components/form-metadata-editor";

type MutationState = {
	isPending: boolean;
};

interface FormBuilderHeaderProps {
	isEditing: boolean;
	metadata: {
		title: string;
		status: FormStatus;
	};
	hasUnsavedChanges: boolean;
	questionsCount: number;
	isPending: boolean;
	createMutation: MutationState;
	updateMutation: MutationState;
	publishMutation: MutationState;
	unpublishMutation: MutationState;
	onBack: () => void;
	onSave: () => void;
	onPublish: () => void;
	onUnpublish: () => void;
	onClearDraft: () => void;
}

export function FormBuilderHeader({
	isEditing,
	metadata,
	hasUnsavedChanges,
	questionsCount,
	isPending,
	createMutation,
	updateMutation,
	publishMutation,
	unpublishMutation,
	onBack,
	onSave,
	onPublish,
	onUnpublish,
	onClearDraft,
}: FormBuilderHeaderProps) {
	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" onClick={onBack}>
					<ArrowLeft className="size-5" />
				</Button>
				<div className="flex items-center gap-3">
					<FilePlusIcon className="size-6 text-primary" />
					<div>
						<h1 className="text-2xl font-semibold">
							{isEditing ? "Edit Form" : "Create New Form"}
						</h1>
						<p className="text-muted-foreground">
							{isEditing
								? "Modify your form and questions"
								: "Build a new form with questions and configuration"}
						</p>
					</div>
				</div>
			</div>
			<div className="flex items-center gap-2">
				{!isEditing && hasUnsavedChanges && (
					<Button variant="ghost" size="sm" onClick={onClearDraft}>
						<RotateCcw className="mr-2 size-4" />
						Clear Draft
					</Button>
				)}
				{isEditing && metadata.status === "draft" && (
					<Button
						onClick={onPublish}
						disabled={isPending || questionsCount === 0}
						variant="outline"
					>
						{publishMutation.isPending ? (
							<Loader2 className="mr-2 size-4 animate-spin" />
						) : (
							<Eye className="mr-2 size-4" />
						)}
						Publish
					</Button>
				)}
				{isEditing && metadata.status === "published" && (
					<Button onClick={onUnpublish} disabled={isPending} variant="outline">
						{unpublishMutation.isPending ? (
							<Loader2 className="mr-2 size-4 animate-spin" />
						) : (
							<EyeOff className="mr-2 size-4" />
						)}
						Unpublish
					</Button>
				)}
				<Button onClick={onSave} disabled={isPending || !metadata.title.trim()}>
					{createMutation.isPending || updateMutation.isPending ? (
						<Loader2 className="mr-2 size-4 animate-spin" />
					) : (
						<Save className="mr-2 size-4" />
					)}
					{isEditing ? "Save Changes" : "Create Form"}
				</Button>
			</div>
		</div>
	);
}
