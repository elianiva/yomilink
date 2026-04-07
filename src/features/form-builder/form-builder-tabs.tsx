import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FormMetadata } from "@/features/form/components/form-metadata-editor";
import type { QuestionWithOptions as FormPreviewQuestion } from "@/features/form/components/form-renderer/form-preview";
import { FormPreview } from "@/features/form/components/form-renderer/form-preview";

import { EditorContent } from "./editor-content";
import type { EditorMode, QuestionType, QuestionWithOptions } from "./types";

interface FormBuilderTabsProps {
	isEditing: boolean;
	formId: string | undefined;
	editorMode: EditorMode;
	metadata: FormMetadata;
	questions: QuestionWithOptions[];
	isPending: boolean;
	onEditorModeChange: (mode: EditorMode) => void;
	onMetadataChange: (metadata: FormMetadata) => void;
	onEditQuestion: (question: QuestionWithOptions) => void;
	onDeleteQuestion: (questionId: string) => void;
	onReorderQuestions: (questions: QuestionWithOptions[]) => void;
	onAddQuestion: (type: QuestionType) => void;
}

export function FormBuilderTabs({
	isEditing,
	formId,
	editorMode,
	metadata,
	questions,
	isPending,
	onEditorModeChange,
	onMetadataChange,
	onEditQuestion,
	onDeleteQuestion,
	onReorderQuestions,
	onAddQuestion,
}: FormBuilderTabsProps) {
	if (isEditing) {
		return (
			<Tabs
				value={editorMode}
				onValueChange={(v) => onEditorModeChange(v as EditorMode)}
				className="w-full"
			>
				<TabsList className="grid w-fit grid-cols-2">
					<TabsTrigger value="edit">Edit</TabsTrigger>
					<TabsTrigger value="preview">Preview</TabsTrigger>
				</TabsList>

				<TabsContent value="edit" className="mt-6">
					<EditorContent
						metadata={metadata}
						onMetadataChange={onMetadataChange}
						questions={questions}
						onEditQuestion={onEditQuestion}
						onDeleteQuestion={onDeleteQuestion}
						onReorderQuestions={onReorderQuestions}
						onAddQuestion={onAddQuestion}
						isPending={isPending}
						hasForm={true}
					/>
				</TabsContent>

				<TabsContent value="preview" className="mt-6">
					<FormPreview
						form={{
							id: formId ?? "preview",
							title: metadata.title,
							description: metadata.description ?? undefined,
							type: metadata.type,
							audience: metadata.audience,
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
		);
	}

	// New form mode - no tabs, just editor
	return (
		<EditorContent
			metadata={metadata}
			onMetadataChange={onMetadataChange}
			questions={questions}
			onEditQuestion={onEditQuestion}
			onDeleteQuestion={onDeleteQuestion}
			onReorderQuestions={onReorderQuestions}
			onAddQuestion={onAddQuestion}
			isPending={isPending}
			hasForm={true}
		/>
	);
}
