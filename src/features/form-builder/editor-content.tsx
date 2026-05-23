import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormMetadataEditor } from "@/features/form/components/form-metadata-editor";
import { QuestionList, type Question } from "@/features/form/components/question-list";
import { ReadingMaterialRangesEditor } from "@/features/form/components/reading-material-ranges-editor";

import { InlineEditor } from "./inline-editor";
import type { EditorContentProps, QuestionWithOptions } from "./types";

export function EditorContent({
	metadata,
	onMetadataChange,
	questions,
	onDeleteQuestion,
	onReorderQuestions,
	onAddQuestion,
	onQuestionChange,
	isPending,
	hasForm,
	readingMaterialSections,
	onReadingMaterialSectionsChange,
}: EditorContentProps) {
	return (
		<div className="grid gap-6 lg:grid-cols-3">
			{/* Main Content */}
			<div className="lg:col-span-2 space-y-6">
				{/* Form Content Card */}
				<div className="rounded-lg border bg-card p-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
						<h2 className="text-lg font-medium">Questions</h2>
						{hasForm && (
							<div className="flex items-center gap-2 w-full sm:w-auto">
								<Button
									variant="outline"
									size="sm"
									onClick={() => onAddQuestion("mcq")}
									disabled={isPending}
									className="flex-1 sm:flex-initial"
								>
									<Plus className="size-4 sm:mr-1" />
									<span className="hidden sm:inline">MCQ</span>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => onAddQuestion("likert")}
									disabled={isPending}
									className="flex-1 sm:flex-initial"
								>
									<Plus className="size-4 sm:mr-1" />
									<span className="hidden sm:inline">Likert</span>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => onAddQuestion("text")}
									disabled={isPending}
									className="flex-1 sm:flex-initial"
								>
									<Plus className="size-4 sm:mr-1" />
									<span className="hidden sm:inline">Text</span>
								</Button>
							</div>
						)}
					</div>

					{hasForm ? (
						<QuestionList
							questions={questions as Question[]}
							onDelete={onDeleteQuestion}
							onReorder={(qs) => onReorderQuestions(qs as QuestionWithOptions[])}
							editContent={(q) => (
								<InlineEditor
									question={q as QuestionWithOptions}
									onChange={(data) => onQuestionChange(q.id, data)}
									disabled={isPending}
								/>
							)}
						/>
					) : (
						<div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
							<p className="text-sm text-muted-foreground mb-2">
								Save the form first to add questions
							</p>
						</div>
					)}
				</div>

				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-lg font-medium mb-1">Reading Materials</h2>
					<p className="text-sm text-muted-foreground mb-4">
						Optional reference materials students can toggle while answering.
					</p>
					<ReadingMaterialRangesEditor
						sections={readingMaterialSections}
						onChange={onReadingMaterialSectionsChange}
						disabled={isPending}
					/>
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
