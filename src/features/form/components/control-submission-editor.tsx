"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FormattingToolbar } from "@/components/ui/formatting-toolbar";
import { cn } from "@/lib/utils";
import { WordCountValidator, countWords } from "./word-count-validator";

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

	const wordCount = countWords(content);

	const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
		const newContent = e.currentTarget.innerText;
		setContent(newContent);
		onChange?.({ content: newContent, wordCount: countWords(newContent) });
	};

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
				<WordCountValidator
					wordCount={wordCount}
					minWordCount={minWordCount}
					maxWordCount={maxWordCount}
					showLabels={false}
				/>
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
