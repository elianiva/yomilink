import {
	FilePlusIcon,
	Loader2,
	Save,
	Eye,
	EyeOff,
	ArrowLeft,
	RotateCcw,
	ChevronDown,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	const [moreOpen, setMoreOpen] = useState(false);

	const actionButtons = (
		<div className="hidden sm:flex items-center gap-2">
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
	);

	const mobileMenu = (
		<div className="sm:hidden">
			<DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm">
						<ChevronDown className="size-4 mr-1" />
						Actions
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{!isEditing && hasUnsavedChanges && (
						<DropdownMenuItem
							onClick={() => {
								onClearDraft();
								setMoreOpen(false);
							}}
						>
							<RotateCcw className="size-4 mr-2" />
							Clear Draft
						</DropdownMenuItem>
					)}
					{isEditing && metadata.status === "draft" && (
						<DropdownMenuItem
							onClick={() => {
								onPublish();
								setMoreOpen(false);
							}}
							disabled={isPending || questionsCount === 0}
						>
							<Eye className="size-4 mr-2" />
							Publish
						</DropdownMenuItem>
					)}
					{isEditing && metadata.status === "published" && (
						<DropdownMenuItem
							onClick={() => {
								onUnpublish();
								setMoreOpen(false);
							}}
						>
							<EyeOff className="size-4 mr-2" />
							Unpublish
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						onClick={() => {
							onSave();
							setMoreOpen(false);
						}}
					>
						<Save className="size-4 mr-2" />
						{isEditing ? "Save Changes" : "Create Form"}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);

	return (
		<div className="flex items-center justify-between gap-4">
			<div className="flex items-center gap-4 min-w-0">
				<Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
					<ArrowLeft className="size-5" />
				</Button>
				<div className="flex items-center gap-3 min-w-0">
					<FilePlusIcon className="size-6 text-primary shrink-0" />
					<div className="min-w-0">
						<h1 className="text-xl sm:text-2xl font-semibold truncate font-heading">
							{isEditing ? "Edit Form" : "Create New Form"}
						</h1>
						<p className="text-muted-foreground text-sm truncate hidden sm:block">
							{isEditing
								? "Modify your form and questions"
								: "Build a new form with questions and configuration"}
						</p>
					</div>
				</div>
			</div>
			{actionButtons}
			{mobileMenu}
		</div>
	);
}
