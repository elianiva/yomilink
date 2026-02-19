"use client";

import { Type, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WordCountValidatorProps {
	wordCount: number;
	minWordCount?: number;
	maxWordCount?: number;
	showLabels?: boolean;
	className?: string;
}

export function WordCountValidator({
	wordCount,
	minWordCount,
	maxWordCount,
	showLabels = true,
	className,
}: WordCountValidatorProps) {
	const isBelowMinimum =
		minWordCount !== undefined && minWordCount > 0 && wordCount < minWordCount;
	const isAboveMaximum = maxWordCount !== undefined && wordCount > maxWordCount;

	const getStatus = () => {
		if (isAboveMaximum) {
			return {
				icon: AlertCircle,
				iconClassName: "text-destructive",
				textClassName: "text-destructive",
				message: maxWordCount
					? `${wordCount} / ${maxWordCount} words (exceeds maximum)`
					: `${wordCount} words (exceeds maximum)`,
			};
		}
		if (isBelowMinimum) {
			return {
				icon: AlertCircle,
				iconClassName: "text-amber-500",
				textClassName: "text-amber-500",
				message: minWordCount
					? `${wordCount} / ${minWordCount} words minimum`
					: `${wordCount} words`,
			};
		}
		return {
			icon: CheckCircle2,
			iconClassName: "text-green-500",
			textClassName: "text-green-500",
			message: `${wordCount} words`,
		};
	};

	const status = getStatus();
	const StatusIcon = status.icon;

	return (
		<div
			className={cn("flex items-center gap-2 text-sm", className)}
			data-testid="word-count-validator"
		>
			<Type className="h-4 w-4 text-muted-foreground" />
			<span
				className={cn("font-medium", status.textClassName)}
				data-testid="word-count-message"
			>
				<StatusIcon
					className={cn("mr-1 inline h-4 w-4", status.iconClassName)}
				/>
				{status.message}
			</span>
			{showLabels && minWordCount !== undefined && minWordCount > 0 && (
				<span
					className="text-xs text-muted-foreground"
					data-testid="min-word-label"
				>
					Minimum {minWordCount} words required
				</span>
			)}
		</div>
	);
}

export function countWords(text: string): number {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).length;
}
