import { format } from "date-fns";
import { Save } from "lucide-react";

interface FormHeaderBarProps {
	title: string;
	description?: string;
	answeredCount: number;
	totalQuestions: number;
	lastSaved: Date | null;
}

export function FormHeaderBar({
	title,
	answeredCount,
	totalQuestions,
	lastSaved,
}: FormHeaderBarProps) {
	return (
		<div className="flex flex-wrap shrink-0 items-center gap-4 border-b px-4 py-3">
			<div className="min-w-0 flex-1">
				<h1 className="truncate text-lg font-semibold">{title}</h1>
			</div>
			<div className="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
				<span>
					{answeredCount} of {totalQuestions} answered
				</span>
				<span className="flex items-center gap-1">
					<Save className="size-3" />
					{lastSaved ? `Saved ${format(lastSaved, "h:mm a")}` : "Auto-save"}
				</span>
			</div>
		</div>
	);
}
