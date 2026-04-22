import { Check } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { LikertOptions, McqOptions, TextOptions } from "../lib/form-service.shared";

interface QuestionPreviewProps {
	question: {
		id: string;
		questionText: string;
		options?: McqOptions | LikertOptions | TextOptions;
		shuffle?: boolean;
	};
}

function McqPreview({ options }: { options: McqOptions }) {
	const displayOptions = options.options.slice(0, 3);
	const hasMore = options.options.length > 3;

	return (
		<div className="space-y-2">
			{displayOptions.map((option, index) => (
				<div
					key={option.id}
					className={cn("flex items-center gap-2 rounded-md border bg-muted/40 p-2")}
				>
					<div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/50">
						{index === 0 && <Check className="h-2.5 w-2.5 text-muted-foreground" />}
					</div>
					<span className="flex-1 truncate text-sm text-muted-foreground">
						{option.text}
					</span>
				</div>
			))}
			{hasMore && (
				<p className="text-xs text-muted-foreground">
					+{options.options.length - 3} more options
				</p>
			)}
		</div>
	);
}

function LikertPreview({ options }: { options: LikertOptions }) {
	const scaleSize = options.scaleSize;
	const labels = options.labels;
	const scalePoints = Array.from({ length: Math.min(scaleSize, 5) }, (_, i) => i + 1);

	const getLowLabel = (): string => {
		const label = labels[1];
		return label ?? "1";
	};

	const getHighLabel = (): string => {
		const label = labels[scaleSize];
		return label ?? scaleSize.toString();
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span className="font-medium">{getLowLabel()}</span>
				<span className="font-medium">{getHighLabel()}</span>
			</div>
			<div className="flex gap-1">
				{scalePoints.map((scaleValue) => (
					<div
						key={scaleValue}
						className={cn(
							"flex h-8 w-8 flex-1 items-center justify-center rounded-md border bg-muted/40 text-sm font-medium text-muted-foreground",
						)}
					>
						{scaleValue}
					</div>
				))}
			</div>
			{scaleSize > 5 && (
				<p className="text-xs text-muted-foreground">Scale of {scaleSize} points</p>
			)}
		</div>
	);
}

function TextPreview({ options }: { options: TextOptions }) {
	const placeholder = options.placeholder ?? "Enter your answer here...";

	return (
		<div className="space-y-2">
			<Textarea
				placeholder={placeholder}
				disabled
				rows={2}
				className="resize-none border bg-muted/40 text-muted-foreground"
			/>
			{(options.minLength || options.maxLength) && (
				<div className="flex gap-2 text-xs text-muted-foreground">
					{options.minLength && <span>Min: {options.minLength} chars</span>}
					{options.maxLength && <span>Max: {options.maxLength} chars</span>}
				</div>
			)}
		</div>
	);
}

export function QuestionPreview({ question }: QuestionPreviewProps) {
	const { options } = question;

	return (
		<div className="mt-2 space-y-2">
			{options && (
				<div className="mt-3">
					{options.type === "mcq" && <McqPreview options={options as McqOptions} />}
					{options.type === "likert" && (
						<LikertPreview options={options as LikertOptions} />
					)}
					{options.type === "text" && <TextPreview options={options as TextOptions} />}
				</div>
			)}
		</div>
	);
}
