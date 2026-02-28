import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { FilePlusIcon, Loader2, Save, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FormMetadata } from "@/features/form/components/form-metadata-editor";
import type { QuestionWithOptions as FormPreviewQuestion } from "@/features/form/components/form-renderer/form-preview";
import { FormPreview } from "@/features/form/components/form-renderer/form-preview";
import type { CreateQuestionInput, UpdateQuestionInput } from "@/features/form/lib/form-service";
import { useRpcMutation } from "@/hooks/use-rpc-query";
import { FormRpc } from "@/server/rpc/form";

import { EditorContent } from "./editor-content";
import { QuestionEditorDialog } from "./question-editor-dialog";
import {
	type QuestionDialogState,
	type QuestionType,
	type EditorMode,
	defaultMetadata,
} from "./types";
import type { QuestionWithOptions } from "./types";

export function FormBuilderPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { formId } = useSearch({ from: "/dashboard/forms/builder" });
	const isEditing = Boolean(formId);

	// State
	const [metadata, setMetadata] = useState<FormMetadata>(defaultMetadata);
	const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
	const [editorMode, setEditorMode] = useState<EditorMode>("edit");
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [questionDialog, setQuestionDialog] = useState<QuestionDialogState>({
		isOpen: false,
		questionType: null,
		editingQuestion: null,
	});
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

	// Queries
	const { data: existingForm, isLoading: isLoadingForm } = useQuery({
		...FormRpc.getFormById({ id: formId ?? "" }),
		enabled: isEditing,
	});

	// Mutations
	const createFormMutation = useRpcMutation(FormRpc.createForm(), {
		operation: "create form",
		showSuccess: true,
		successMessage: "Form created successfully",
		onSuccess: (result) => {
			if ("error" in result) {
				toast.error("Failed to create form");
				return;
			}
			queryClient.invalidateQueries({ queryKey: FormRpc.forms() });
			void navigate({
				to: "/dashboard/forms/builder",
				search: { formId: result.id },
			});
		},
	});

	const updateFormMutation = useRpcMutation(FormRpc.updateForm(), {
		operation: "update form",
		showSuccess: true,
		successMessage: "Form saved successfully",
		onSuccess: () => {
			setHasUnsavedChanges(false);
			queryClient.invalidateQueries({ queryKey: FormRpc.forms() });
		},
	});

	const createQuestionMutation = useRpcMutation(FormRpc.createQuestion(), {
		operation: "create question",
		showSuccess: true,
		successMessage: "Question created",
		onSuccess: () => {
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
	});

	const updateQuestionMutation = useRpcMutation(FormRpc.updateQuestion(), {
		operation: "update question",
		showSuccess: true,
		successMessage: "Question updated",
		onSuccess: () => {
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
	});

	const deleteQuestionMutation = useRpcMutation(FormRpc.deleteQuestion(), {
		operation: "delete question",
		showSuccess: true,
		successMessage: "Question deleted",
		onSuccess: () => {
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
	});

	const reorderQuestionsMutation = useRpcMutation(FormRpc.reorderQuestions(), {
		operation: "reorder questions",
		onSuccess: () => {
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
	});

	const publishFormMutation = useRpcMutation(FormRpc.publishForm(), {
		operation: "publish form",
		showSuccess: true,
		successMessage: "Form published",
		onSuccess: () => {
			setMetadata((prev) => ({ ...prev, status: "published" }));
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
	});

	const unpublishFormMutation = useRpcMutation(FormRpc.unpublishForm(), {
		operation: "unpublish form",
		showSuccess: true,
		successMessage: "Form unpublished",
		onSuccess: () => {
			setMetadata((prev) => ({ ...prev, status: "draft" }));
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
	});

	// Load existing form data
	if (isEditing && existingForm && !("error" in existingForm)) {
		if (metadata.title === "" && existingForm.form.title) {
			setMetadata({
				title: existingForm.form.title,
				description: existingForm.form.description,
				type: existingForm.form.type,
				status: existingForm.form.status,
			});
		}
		if (questions.length === 0 && existingForm.questions) {
			setQuestions(existingForm.questions as QuestionWithOptions[]);
		}
	}

	// Handlers
	const handleMetadataChange = useCallback((newMetadata: FormMetadata) => {
		setMetadata(newMetadata);
		setHasUnsavedChanges(true);
	}, []);

	const handleSaveForm = async () => {
		if (!metadata.title.trim()) {
			toast.error("Form title is required");
			return;
		}

		if (isEditing && formId) {
			await updateFormMutation.mutateAsync({
				formId,
				title: metadata.title,
				description: metadata.description ?? undefined,
				type: metadata.type,
				status: metadata.status,
			});
		} else {
			await createFormMutation.mutateAsync({
				title: metadata.title,
				description: metadata.description ?? undefined,
				type: metadata.type,
			});
		}
	};

	const handleOpenQuestionDialog = (type: QuestionType, question?: QuestionWithOptions) => {
		setQuestionDialog({
			isOpen: true,
			questionType: type,
			editingQuestion: question ?? null,
		});
	};

	const handleCloseQuestionDialog = () => {
		setQuestionDialog({
			isOpen: false,
			questionType: null,
			editingQuestion: null,
		});
	};

	const handleSaveQuestion = async (questionData: {
		questionText: string;
		options: unknown;
		required: boolean;
	}) => {
		if (!formId) {
			toast.error("Please save the form first");
			return;
		}

		const editingQuestion = questionDialog.editingQuestion;

		if (editingQuestion) {
			// Update existing question
			const input: UpdateQuestionInput = {
				questionId: editingQuestion.id,
				questionText: questionData.questionText,
				options: questionData.options as UpdateQuestionInput["options"],
				required: questionData.required,
			};
			await updateQuestionMutation.mutateAsync(input);
		} else if (questionDialog.questionType) {
			// Create new question
			const input: CreateQuestionInput = {
				formId,
				type: questionDialog.questionType,
				questionText: questionData.questionText,
				options: questionData.options as CreateQuestionInput["options"],
				required: questionData.required,
			};
			await createQuestionMutation.mutateAsync(input);
		}

		handleCloseQuestionDialog();
	};

	const handleDeleteQuestion = async (questionId: string) => {
		await deleteQuestionMutation.mutateAsync({ id: questionId });
	};

	const handleReorderQuestions = async (reorderedQuestions: QuestionWithOptions[]) => {
		setQuestions(reorderedQuestions);
		if (formId) {
			await reorderQuestionsMutation.mutateAsync({
				formId,
				questionIds: reorderedQuestions.map((q) => q.id),
			});
		}
	};

	const handleBack = () => {
		if (hasUnsavedChanges) {
			setShowUnsavedDialog(true);
		} else {
			void navigate({ to: "/dashboard/forms" });
		}
	};

	const isPending =
		createFormMutation.isPending ||
		updateFormMutation.isPending ||
		createQuestionMutation.isPending ||
		updateQuestionMutation.isPending ||
		deleteQuestionMutation.isPending ||
		publishFormMutation.isPending ||
		unpublishFormMutation.isPending ||
		isLoadingForm;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={handleBack}>
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
					{isEditing && metadata.status === "draft" && (
						<Button
							onClick={() => formId && publishFormMutation.mutate({ id: formId })}
							disabled={isPending || questions.length === 0}
							variant="outline"
						>
							{publishFormMutation.isPending ? (
								<Loader2 className="mr-2 size-4 animate-spin" />
							) : (
								<Eye className="mr-2 size-4" />
							)}
							Publish
						</Button>
					)}
					{isEditing && metadata.status === "published" && (
						<Button
							onClick={() => formId && unpublishFormMutation.mutate({ id: formId })}
							disabled={isPending}
							variant="outline"
						>
							{unpublishFormMutation.isPending ? (
								<Loader2 className="mr-2 size-4 animate-spin" />
							) : (
								<EyeOff className="mr-2 size-4" />
							)}
							Unpublish
						</Button>
					)}
					<Button onClick={handleSaveForm} disabled={isPending || !metadata.title.trim()}>
						{isPending ? (
							<Loader2 className="mr-2 size-4 animate-spin" />
						) : (
							<Save className="mr-2 size-4" />
						)}
						{isEditing ? "Save Changes" : "Create Form"}
					</Button>
				</div>
			</div>

			{/* Mode Toggle */}
			{isEditing && (
				<Tabs
					value={editorMode}
					onValueChange={(v) => setEditorMode(v as EditorMode)}
					className="w-full"
				>
					<TabsList className="grid w-fit grid-cols-2">
						<TabsTrigger value="edit">Edit</TabsTrigger>
						<TabsTrigger value="preview">Preview</TabsTrigger>
					</TabsList>

					<TabsContent value="edit" className="mt-6">
						<EditorContent
							metadata={metadata}
							onMetadataChange={handleMetadataChange}
							questions={questions}
							onEditQuestion={(q) =>
								handleOpenQuestionDialog(q.type as QuestionType, q)
							}
							onDeleteQuestion={handleDeleteQuestion}
							onReorderQuestions={handleReorderQuestions}
							onAddQuestion={handleOpenQuestionDialog}
							isPending={isPending}
							hasForm={isEditing}
						/>
					</TabsContent>

					<TabsContent value="preview" className="mt-6">
						<FormPreview
							form={{
								id: formId ?? "preview",
								title: metadata.title,
								description: metadata.description ?? undefined,
								type: metadata.type,
								status: metadata.status,
							}}
							questions={questions.map((q) => ({
								id: q.id,
								questionText: q.questionText,
								type: q.type,
								orderIndex: q.orderIndex,
								required: q.required,
								options: q.options as FormPreviewQuestion["options"],
							}))}
							answers={{}}
							onAnswerChange={() => {}}
						/>
					</TabsContent>
				</Tabs>
			)}

			{!isEditing && (
				<EditorContent
					metadata={metadata}
					onMetadataChange={handleMetadataChange}
					questions={questions}
					onEditQuestion={() => {}}
					onDeleteQuestion={() => {}}
					onReorderQuestions={() => {}}
					onAddQuestion={() => {}}
					isPending={isPending}
					hasForm={false}
				/>
			)}

			{/* Question Editor Dialog */}
			<QuestionEditorDialog
				isOpen={questionDialog.isOpen}
				questionType={questionDialog.questionType}
				editingQuestion={questionDialog.editingQuestion}
				onClose={handleCloseQuestionDialog}
				onSave={handleSaveQuestion}
				isPending={createQuestionMutation.isPending || updateQuestionMutation.isPending}
			/>

			{/* Unsaved Changes Dialog */}
			<AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes. Are you sure you want to leave?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
							Stay
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => void navigate({ to: "/dashboard/forms" })}
						>
							Leave
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
