import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormMetadataEditor } from "@/features/form/components/form-metadata-editor";
import { QuestionList, type Question } from "@/features/form/components/question-list";

import type { EditorContentProps, QuestionWithOptions } from "./types";

export function EditorContent({
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
							onReorder={(qs) => onReorderQuestions(qs as QuestionWithOptions[])}
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
