import type { FormMetadata } from "@/features/form/components/form-metadata-editor";
import type { Question } from "@/features/form/components/question-list";

export type QuestionType = "mcq" | "likert" | "text";
export type EditorMode = "edit" | "preview";

export interface SearchParams {
	formId?: string;
}

// Extended question type that includes options from the database
export interface QuestionWithOptions extends Question {
	formId: string;
	options: unknown;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface QuestionDialogState {
	isOpen: boolean;
	questionType: QuestionType | null;
	editingQuestion: QuestionWithOptions | null;
}

export const defaultMetadata: FormMetadata = {
	title: "",
	description: null,
	type: "registration",
	status: "draft",
};

export interface EditorContentProps {
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

export interface QuestionEditorDialogProps {
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

export interface EditorWrapperProps {
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
