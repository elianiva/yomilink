import { ArrowDownIcon, ArrowUpIcon, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Option {
	id: string;
	text: string;
}

interface AnswerOptionCardProps {
	option: Option;
	index: number;
	totalOptions: number;
	isCorrect: boolean;
	disabled?: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onTextChange: (text: string) => void;
	onCorrectToggle: () => void;
	onRemove: () => void;
}

export function AnswerOptionCard({
	option,
	index,
	totalOptions,
	isCorrect,
	disabled = false,
	onMoveUp,
	onMoveDown,
	onTextChange,
	onCorrectToggle,
	onRemove,
}: AnswerOptionCardProps) {
	return (
		<motion.div
			layout
			initial={{ opacity: 0, y: -5 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{
				duration: 0.15,
				layout: { duration: 0.1 },
			}}
			className={cn(
				"flex items-start gap-2 rounded-xl border bg-card p-3 transition-colors",
				isCorrect && "border-green-500/50 bg-green-50/25",
			)}
			data-testid={`option-row-${index}`}
		>
			<div className="flex flex-col pt-1">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-6 w-6"
					disabled={disabled || index === 0}
					onClick={onMoveUp}
					data-testid={`move-up-${index}`}
				>
					<ArrowUpIcon className="size-3" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-6 w-6"
					disabled={disabled || index === totalOptions - 1}
					onClick={onMoveDown}
					data-testid={`move-down-${index}`}
				>
					<ArrowDownIcon className="size-3" />
				</Button>
			</div>

			<div className="flex flex-1 flex-col gap-1.5">
				<Input
					data-testid={`option-input-${index}`}
					value={option.text}
					onChange={(e) => onTextChange(e.target.value)}
					placeholder={`Option ${index + 1}`}
					disabled={disabled}
					className={cn(
						isCorrect && "border-green-500/50 focus-visible:ring-green-500/30",
					)}
				/>

				<button
					type="button"
					onClick={onCorrectToggle}
					disabled={disabled}
					data-testid={`correct-toggle-${index}`}
					className={cn(
						"self-start flex items-center gap-1 text-xs font-medium transition-colors",
						isCorrect
							? "text-green-600"
							: "text-muted-foreground hover:text-green-600",
					)}
				>
					{isCorrect ? (
						<>
							<CheckCircle2 className="size-3" />
							<span>Correct answer</span>
						</>
					) : (
						<>
							<Circle className="size-3" />
							<span>Mark as correct</span>
						</>
					)}
				</button>
			</div>

			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
				onClick={onRemove}
				disabled={disabled || totalOptions <= 2}
				data-testid={`remove-option-${index}`}
				aria-label="Remove option"
			>
				<Trash2 className="h-4 w-4" />
			</Button>
		</motion.div>
	);
}
