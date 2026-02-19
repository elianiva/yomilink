import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	useNavigate,
	useSearch,
} from "@tanstack/react-router";
import {
	FilePlusIcon,
	Loader2,
	Plus,
	Save,
	Eye,
	EyeOff,
	ArrowLeft,
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Guard } from "@/components/auth/Guard";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
	FormMetadataEditor,
	type FormMetadata,
} from "@/features/form/components/form-metadata-editor";
import {
	QuestionList,
	type Question,
} from "@/features/form/components/question-list";
import { McqQuestionEditor } from "@/features/form/components/mcq-question-editor";
import { LikertQuestionEditor } from "@/features/form/components/likert-question-editor";
import { TextQuestionEditor } from "@/features/form/components/text-question-editor";
import {
	FormPreview,
	type QuestionWithOptions as FormPreviewQuestion,
} from "@/features/form/components/form-renderer/form-preview";
import { FormRpc } from "@/server/rpc/form";
import type {
	CreateQuestionInput,
	UpdateQuestionInput,
} from "@/features/form/lib/form-service";
interface SearchParams {
	formId?: string;
}

// Extended question type that includes options from the database
interface QuestionWithOptions extends Question {
	formId: string;
	options: unknown;
	createdAt?: Date;
	updatedAt?: Date;
}

export const Route = createFileRoute("/dashboard/forms/builder")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<FormBuilderPage />
		</Guard>
	),
	validateSearch: (search: Record<string, unknown>): SearchParams => ({
		formId: search.formId as string | undefined,
	}),
});

type QuestionType = "mcq" | "likert" | "text";
type EditorMode = "edit" | "preview";

interface QuestionDialogState {
	isOpen: boolean;
	questionType: QuestionType | null;
	editingQuestion: QuestionWithOptions | null;
}

const defaultMetadata: FormMetadata = {
	title: "",
	description: null,
	type: "registration",
	status: "draft",
};

function FormBuilderPage() {
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
	const createFormMutation = useMutation({
		...FormRpc.createForm(),
		onSuccess: (result) => {
			if ("error" in result) {
				toast.error("Failed to create form");
				return;
			}
			toast.success("Form created successfully");
			queryClient.invalidateQueries({ queryKey: FormRpc.forms() });
			void navigate({
				to: "/dashboard/forms/builder",
				search: { formId: result.id },
			});
		},
		onError: () => {
			toast.error("Failed to create form");
		},
	});

	const updateFormMutation = useMutation({
		mutationFn: async (data: { formId: string; metadata: FormMetadata }) => {
			const response = await fetch(`/api/forms/${data.formId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: data.metadata.title,
					description: data.metadata.description,
					type: data.metadata.type,
					status: data.metadata.status,
				}),
			});
			if (!response.ok) throw new Error("Failed to update form");
			return response.json();
		},
		onSuccess: () => {
			toast.success("Form saved successfully");
			setHasUnsavedChanges(false);
			queryClient.invalidateQueries({ queryKey: FormRpc.forms() });
		},
		onError: () => {
			toast.error("Failed to save form");
		},
	});

	const createQuestionMutation = useMutation({
		...FormRpc.createQuestion(),
		onSuccess: () => {
			toast.success("Question created");
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to create question",
			);
		},
	});

	const updateQuestionMutation = useMutation({
		...FormRpc.updateQuestion(),
		onSuccess: () => {
			toast.success("Question updated");
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to update question",
			);
		},
	});

	const deleteQuestionMutation = useMutation({
		...FormRpc.deleteQuestion(),
		onSuccess: () => {
			toast.success("Question deleted");
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete question",
			);
		},
	});

	const reorderQuestionsMutation = useMutation({
		...FormRpc.reorderQuestions(),
		onSuccess: () => {
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
	});

	const publishFormMutation = useMutation({
		...FormRpc.publishForm(),
		onSuccess: () => {
			toast.success("Form published");
			setMetadata((prev) => ({ ...prev, status: "published" }));
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
		onError: () => {
			toast.error("Failed to publish form");
		},
	});

	const unpublishFormMutation = useMutation({
		...FormRpc.unpublishForm(),
		onSuccess: () => {
			toast.success("Form unpublished");
			setMetadata((prev) => ({ ...prev, status: "draft" }));
			if (formId) {
				queryClient.invalidateQueries({
					queryKey: [...FormRpc.forms(), "byId", formId],
				});
			}
		},
		onError: () => {
			toast.error("Failed to unpublish form");
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
			await updateFormMutation.mutateAsync({ formId, metadata });
		} else {
			await createFormMutation.mutateAsync({
				title: metadata.title,
				description: metadata.description ?? undefined,
				type: metadata.type,
			});
		}
	};

	const handleOpenQuestionDialog = (
		type: QuestionType,
		question?: QuestionWithOptions,
	) => {
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
		} else {
			// Create new question
			const input: CreateQuestionInput = {
				formId,
				type: questionDialog.questionType!,
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

	const handleReorderQuestions = async (
		reorderedQuestions: QuestionWithOptions[],
	) => {
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
							onClick={() =>
								formId && publishFormMutation.mutate({ id: formId })
							}
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
							onClick={() =>
								formId && unpublishFormMutation.mutate({ id: formId })
							}
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
					<Button
						onClick={handleSaveForm}
						disabled={isPending || !metadata.title.trim()}
					>
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
				isPending={
					createQuestionMutation.isPending || updateQuestionMutation.isPending
				}
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

interface EditorContentProps {
	metadata: FormMetadata;
	onMetadataChange: (metadata: FormMetadata) => void;
	questions: QuestionWithOptions[];
	onEditQuestion: (question: QuestionWithOptions) => void;
	onDeleteQuestion: (questionId: string) => void;
	onReorderQuestions: (questions: QuestionWithOptions[]) => void;
	onAddQuestion: (type: QuestionType) => void;
	isPending: boolean;
	hasForm: boolean;
}

function EditorContent({
	metadata,
	onMetadataChange,
	questions,
	onEditQuestion,
	onDeleteQuestion,
	onReorderQuestions,
	onAddQuestion,
	isPending,
	hasForm,
}: EditorContentProps) {
	return (
		<div className="grid gap-6 lg:grid-cols-3">
			{/* Main Content */}
			<div className="lg:col-span-2 space-y-6">
				{/* Form Content Card */}
				<div className="rounded-lg border bg-card p-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-medium">Questions</h2>
						{hasForm && (
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => onAddQuestion("mcq")}
									disabled={isPending}
								>
									<Plus className="mr-1 size-4" />
									MCQ
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => onAddQuestion("likert")}
									disabled={isPending}
								>
									<Plus className="mr-1 size-4" />
									Likert
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => onAddQuestion("text")}
									disabled={isPending}
								>
									<Plus className="mr-1 size-4" />
									Text
								</Button>
							</div>
						)}
					</div>

					{hasForm ? (
						<QuestionList
							questions={questions as Question[]}
							onEdit={(q) => onEditQuestion(q as QuestionWithOptions)}
							onDelete={onDeleteQuestion}
							onReorder={(qs) =>
								onReorderQuestions(qs as QuestionWithOptions[])
							}
						/>
					) : (
						<div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
							<p className="text-sm text-muted-foreground mb-2">
								Save the form first to add questions
							</p>
						</div>
					)}
				</div>
			</div>

			{/* Sidebar */}
			<div className="space-y-6">
				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-lg font-medium mb-4">Form Settings</h2>
					<FormMetadataEditor
						metadata={metadata}
						onChange={onMetadataChange}
						disabled={isPending}
					/>
				</div>
			</div>
		</div>
	);
}

interface QuestionEditorDialogProps {
	isOpen: boolean;
	questionType: QuestionType | null;
	editingQuestion: QuestionWithOptions | null;
	onClose: () => void;
	onSave: (data: {
		questionText: string;
		options: unknown;
		required: boolean;
	}) => void;
	isPending: boolean;
}

function QuestionEditorDialog({
	isOpen,
	questionType,
	editingQuestion,
	onClose,
	onSave,
	isPending,
}: QuestionEditorDialogProps) {
	if (!questionType) return null;

	const isEditing = editingQuestion !== null;

	const getInitialData = () => {
		if (editingQuestion) {
			const opts = editingQuestion.options as { type: string } | null;
			// Extract options without the type discriminator for the editors
			if (opts && opts.type === "mcq") {
				const mcqOpts = opts as {
					type: "mcq";
					options: { id: string; text: string }[];
					correctOptionIds: string[];
					shuffle: boolean;
				};
				return {
					questionText: editingQuestion.questionText,
					options: {
						options: mcqOpts.options,
						correctOptionIds: mcqOpts.correctOptionIds,
						shuffle: mcqOpts.shuffle,
					},
					required: editingQuestion.required,
				};
			}
			if (opts && opts.type === "likert") {
				const likertOpts = opts as {
					type: "likert";
					scaleSize: number;
					labels: Record<string, string>;
				};
				return {
					questionText: editingQuestion.questionText,
					options: {
						scaleSize: likertOpts.scaleSize,
						labels: likertOpts.labels,
					},
					required: editingQuestion.required,
				};
			}
			if (opts && opts.type === "text") {
				const textOpts = opts as {
					type: "text";
					minLength: number | null;
					maxLength: number | null;
					placeholder: string;
				};
				return {
					questionText: editingQuestion.questionText,
					options: {
						minLength: textOpts.minLength,
						maxLength: textOpts.maxLength,
						placeholder: textOpts.placeholder,
					},
					required: editingQuestion.required,
				};
			}
			return {
				questionText: editingQuestion.questionText,
				options: editingQuestion.options,
				required: editingQuestion.required,
			};
		}
		return null;
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit" : "Add"}{" "}
						{questionType === "mcq"
							? "Multiple Choice"
							: questionType === "likert"
								? "Likert Scale"
								: "Text"}{" "}
						Question
					</DialogTitle>
				</DialogHeader>

				{questionType === "mcq" && (
					<McqQuestionEditorWrapper
						initialData={getInitialData()}
						onSave={onSave}
						onCancel={onClose}
						isPending={isPending}
					/>
				)}

				{questionType === "likert" && (
					<LikertQuestionEditorWrapper
						initialData={getInitialData()}
						onSave={onSave}
						onCancel={onClose}
						isPending={isPending}
					/>
				)}

				{questionType === "text" && (
					<TextQuestionEditorWrapper
						initialData={getInitialData()}
						onSave={onSave}
						onCancel={onClose}
						isPending={isPending}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

interface EditorWrapperProps {
	initialData: {
		questionText: string;
		options: unknown;
		required: boolean;
	} | null;
	onSave: (data: {
		questionText: string;
		options: unknown;
		required: boolean;
	}) => void;
	onCancel: () => void;
	isPending: boolean;
}

function McqQuestionEditorWrapper({
	initialData,
	onSave,
	onCancel,
	isPending,
}: EditorWrapperProps) {
	const [data, setData] = useState({
		questionText: initialData?.questionText ?? "",
		options: (initialData?.options as
			| {
					options: { id: string; text: string }[];
					correctOptionIds: string[];
					shuffle: boolean;
			  }
			| undefined) ?? {
			options: [],
			correctOptionIds: [],
			shuffle: false,
		},
		required: initialData?.required ?? true,
	});

	const handleSave = () => {
		if (!data.questionText.trim()) return;
		onSave({
			questionText: data.questionText,
			options: {
				type: "mcq" as const,
				options: data.options.options,
				correctOptionIds: data.options.correctOptionIds,
				shuffle: data.options.shuffle,
			},
			required: data.required,
		});
	};

	return (
		<div className="space-y-4">
			<McqQuestionEditor
				data={{
					questionText: data.questionText,
					options: data.options.options,
					correctOptionIds: data.options.correctOptionIds,
					shuffle: data.options.shuffle,
					required: data.required,
				}}
				onChange={(newData) =>
					setData({
						...data,
						questionText: newData.questionText,
						options: {
							options: newData.options as { id: string; text: string }[],
							correctOptionIds: newData.correctOptionIds,
							shuffle: newData.shuffle,
						},
						required: newData.required,
					})
				}
				disabled={isPending}
			/>
			<div className="flex justify-end gap-2 pt-4 border-t">
				<Button variant="outline" onClick={onCancel} disabled={isPending}>
					Cancel
				</Button>
				<Button
					onClick={handleSave}
					disabled={
						isPending ||
						!data.questionText.trim() ||
						data.options.options.length < 2
					}
				>
					{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
					Save Question
				</Button>
			</div>
		</div>
	);
}

function LikertQuestionEditorWrapper({
	initialData,
	onSave,
	onCancel,
	isPending,
}: EditorWrapperProps) {
	const [data, setData] = useState({
		questionText: initialData?.questionText ?? "",
		options: (initialData?.options as
			| { scaleSize: number; labels: Record<string, string> }
			| undefined) ?? {
			scaleSize: 5,
			labels: {
				"1": "Strongly Disagree",
				"2": "Disagree",
				"3": "Neutral",
				"4": "Agree",
				"5": "Strongly Agree",
			},
		},
		required: initialData?.required ?? true,
	});

	const handleSave = () => {
		if (!data.questionText.trim()) return;
		onSave({
			questionText: data.questionText,
			options: {
				type: "likert" as const,
				scaleSize: data.options.scaleSize,
				labels: data.options.labels,
			},
			required: data.required,
		});
	};

	return (
		<div className="space-y-4">
			<LikertQuestionEditor
				data={{
					questionText: data.questionText,
					scaleSize: data.options.scaleSize,
					labels: data.options.labels,
					required: data.required,
				}}
				onChange={(newData) =>
					setData({
						questionText: newData.questionText,
						options: {
							scaleSize: newData.scaleSize,
							labels: newData.labels,
						},
						required: newData.required,
					})
				}
				disabled={isPending}
			/>
			<div className="flex justify-end gap-2 pt-4 border-t">
				<Button variant="outline" onClick={onCancel} disabled={isPending}>
					Cancel
				</Button>
				<Button
					onClick={handleSave}
					disabled={isPending || !data.questionText.trim()}
				>
					{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
					Save Question
				</Button>
			</div>
		</div>
	);
}

function TextQuestionEditorWrapper({
	initialData,
	onSave,
	onCancel,
	isPending,
}: EditorWrapperProps) {
	const [data, setData] = useState({
		questionText: initialData?.questionText ?? "",
		options: (initialData?.options as
			| {
					minLength: number | null;
					maxLength: number | null;
					placeholder: string | null;
			  }
			| undefined) ?? {
			minLength: null,
			maxLength: null,
			placeholder: null,
		},
		required: initialData?.required ?? true,
	});

	const handleSave = () => {
		if (!data.questionText.trim()) return;
		onSave({
			questionText: data.questionText,
			options: {
				type: "text" as const,
				minLength: data.options.minLength,
				maxLength: data.options.maxLength,
				placeholder: data.options.placeholder,
			},
			required: data.required,
		});
	};

	return (
		<div className="space-y-4">
			<TextQuestionEditor
				data={{
					questionText: data.questionText,
					minLength: data.options.minLength,
					maxLength: data.options.maxLength,
					placeholder: data.options.placeholder,
					required: data.required,
				}}
				onChange={(newData) =>
					setData({
						questionText: newData.questionText,
						options: {
							minLength: newData.minLength,
							maxLength: newData.maxLength,
							placeholder: newData.placeholder ?? null,
						},
						required: newData.required,
					})
				}
				disabled={isPending}
			/>
			<div className="flex justify-end gap-2 pt-4 border-t">
				<Button variant="outline" onClick={onCancel} disabled={isPending}>
					Cancel
				</Button>
				<Button
					onClick={handleSave}
					disabled={isPending || !data.questionText.trim()}
				>
					{isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
					Save Question
				</Button>
			</div>
		</div>
	);
}
