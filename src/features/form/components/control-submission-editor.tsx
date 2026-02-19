"use client";

import { Type, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FormattingToolbar } from "@/components/ui/formatting-toolbar";
import { cn } from "@/lib/utils";

export interface ControlSubmissionData {
	content: string;
	wordCount: number;
}

interface ControlSubmissionEditorProps {
	initialContent?: string;
	onChange?: (data: ControlSubmissionData) => void;
	minWordCount?: number;
	maxWordCount?: number;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

export function ControlSubmissionEditor({
	initialContent = "",
	onChange,
	minWordCount = 100,
	maxWordCount,
	placeholder = "Write your response here...",
	disabled = false,
	className,
}: ControlSubmissionEditorProps) {
	const [content, setContent] = useState(initialContent);

	const countWords = useCallback((text: string): number => {
		const trimmed = text.trim();
		if (!trimmed) return 0;
		return trimmed.split(/\s+/).length;
	}, []);

	const wordCount = countWords(content);
	const isBelowMinimum = minWordCount > 0 && wordCount < minWordCount;
	const isAboveMaximum = maxWordCount !== undefined && wordCount > maxWordCount;

	const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
		const newContent = e.currentTarget.innerText;
		setContent(newContent);
		onChange?.({ content: newContent, wordCount: countWords(newContent) });
	};



	const getWordCountStatus = () => {
		if (isAboveMaximum) {
			return {
				icon: AlertCircle,
				className: "text-destructive",
				message: `${wordCount} / ${maxWordCount} words (exceeds maximum)`,
			};
		}
		if (isBelowMinimum) {
			return {
				icon: AlertCircle,
				className: "text-amber-500",
				message: `${wordCount} / ${minWordCount} words minimum`,
			};
		}
		return {
			icon: CheckCircle2,
			className: "text-green-500",
			message: `${wordCount} words`,
		};
	};

	const status = getWordCountStatus();
	const StatusIcon = status.icon;

	return (
		<Card className={cn("overflow-hidden", className)} data-testid="control-submission-editor">
			<FormattingToolbar disabled={disabled} />

			<CardContent className="p-0">
				<div
					contentEditable={!disabled}
					suppressContentEditableWarning
					data-testid="editor-content"
					className={cn(
						"min-h-[300px] p-4 outline-none",
						"prose prose-sm max-w-none",
						"empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
						disabled && "cursor-not-allowed opacity-50",
					)}
					data-placeholder={placeholder}
					onInput={handleContentChange}
					style={{ whiteSpace: "pre-wrap" }}
				>
					{initialContent}
				</div>
			</CardContent>

			<div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2">
				<div className="flex items-center gap-2 text-sm">
					<Type className="h-4 w-4 text-muted-foreground" />
					<span className={cn("font-medium", status.className)} data-testid="word-count">
						<StatusIcon className="mr-1 inline h-4 w-4" />
						{status.message}
					</span>
				</div>
				{minWordCount > 0 && (
					<span className="text-xs text-muted-foreground">
						Minimum {minWordCount} words required
					</span>
				)}
			</div>
		</Card>
	);
}

export function createDefaultControlSubmissionData(): ControlSubmissionData {
	return {
		content: "",
		wordCount: 0,
	};
}
