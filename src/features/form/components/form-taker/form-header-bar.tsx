import { format } from "date-fns";
import { ArrowLeftIcon, Save } from "lucide-react";

import { Button } from "@/components/ui/button";

interface FormHeaderBarProps {
	title: string;
	description?: string;
	answeredCount: number;
	totalQuestions: number;
	lastSaved: Date | null;
	onBack: () => void;
}

export function FormHeaderBar({
	title,
	description,
	answeredCount,
	totalQuestions,
	lastSaved,
	onBack,
}: FormHeaderBarProps) {
	return (
		<div className="flex shrink-0 items-center gap-4 border-b bg-background px-6 py-4">
			<Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 shrink-0">
				<ArrowLeftIcon className="h-4 w-4" />
				Back
			</Button>
			<div className="min-w-0 flex-1">
				<h1 className="truncate text-lg font-semibold">{title}</h1>
				{description && (
					<p className="truncate text-sm text-muted-foreground">{description}</p>
				)}
			</div>
			<div className="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
				<span>
					{answeredCount} of {totalQuestions} answered
				</span>
				<span className="flex items-center gap-1">
					<Save className="h-3 w-3" />
					{lastSaved ? `Saved ${format(lastSaved, "h:mm a")}` : "Auto-save"}
				</span>
			</div>
		</div>
	);
}
