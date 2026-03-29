import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type {
	FormResponseOutput as FormResponse,
	QuestionOutput as ResponseQuestion,
} from "@/features/form/lib/form-service";
import { formatDateTime } from "@/lib/date-utils";

import { LikertScaleDisplay } from "./likert-scale-display";
import { McqOptionsDisplay } from "./mcq-options-display";

type ResponseDetailModalProps = {
	response: FormResponse;
	questions: ReadonlyArray<ResponseQuestion>;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ResponseDetailModal({
	response,
	questions,
	open,
	onOpenChange,
}: ResponseDetailModalProps) {
	const sortedQuestions = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

	const formatResponseDate = (timestamp: number | null) => {
		if (!timestamp) return "-";
		return formatDateTime(timestamp);
	};

	const formatTimeSpent = (seconds: number | null) => {
		if (seconds === null) return "-";
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		if (mins > 0) return `${mins}m ${secs}s`;
		return `${secs}s`;
	};

	const getAnswerDisplay = (question: ResponseQuestion, answer: unknown) => {
		if (answer === undefined || answer === null) {
			return <span className="text-muted-foreground">No answer</span>;
		}

		switch (question.type) {
			case "mcq": {
				const options = question.options as {
					options: Array<{ id: string; text: string }>;
				} | null;
				if (!options?.options) return typeof answer === "string" ? answer : JSON.stringify(answer);
				return (
					<McqOptionsDisplay
						options={options.options}
						selectedOptionId={typeof answer === "string" ? answer : JSON.stringify(answer)}
					/>
				);
			}
			case "likert": {
				const options = question.options as {
					scaleSize: number;
					labels: Record<string, string>;
				} | null;
				const value = Number(answer);
				if (!options?.labels || Number.isNaN(value)) return typeof answer === "string" ? answer : JSON.stringify(answer);
				return (
					<LikertScaleDisplay
						scaleSize={options.scaleSize}
						labels={options.labels}
						selectedValue={value}
					/>
				);
			}
			case "text":
				return <div className="whitespace-pre-wrap">{typeof answer === "string" ? answer : JSON.stringify(answer)}</div>;
			default:
				return typeof answer === "string" ? answer : JSON.stringify(answer);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						<span>Response Details</span>
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Student info */}
					<div className="rounded-lg bg-muted p-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<div className="text-sm text-muted-foreground">Student</div>
								<div className="font-medium">{response.user.name ?? "Unknown"}</div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground">Email</div>
								<div className="font-medium">{response.user.email}</div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground">Submitted</div>
								<div className="font-medium">
									{formatResponseDate(response.submittedAt)}
								</div>
							</div>
							<div>
								<div className="text-sm text-muted-foreground">Time Spent</div>
								<div className="font-medium">
									{formatTimeSpent(response.timeSpentSeconds)}
								</div>
							</div>
						</div>
					</div>

					{/* Questions and answers */}
					<div className="space-y-6">
						{sortedQuestions.map((question, index) => {
							const answer = response.answers?.[question.id];
							return (
								<div
									key={question.id}
									className="space-y-2 border-b pb-4 last:border-b-0"
								>
									<div className="flex items-start gap-2">
										<span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
											{index + 1}
										</span>
										<div className="flex-1">
											<div className="font-medium">
												{question.questionText}
												{question.required && (
													<span className="text-destructive ml-1">*</span>
												)}
											</div>
											<div className="mt-1 text-sm">
												{getAnswerDisplay(question, answer)}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
