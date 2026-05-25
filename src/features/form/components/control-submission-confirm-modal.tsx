import { FileText, AlertTriangle, Eye, Send, X } from "lucide-react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ControlSubmissionConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	content: string;
	wordCount: number;
	minWordCount?: number;
	isSubmitting?: boolean;
}

export function ControlSubmissionConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	content,
	wordCount,
	minWordCount = 100,
	isSubmitting = false,
}: ControlSubmissionConfirmModalProps) {
	const isBelowMinimum = wordCount < minWordCount;

	// Format content for preview (limit display if too long)
	const previewContent = content.trim() || "No content provided";
	const displayContent =
		previewContent.length > 1000 ? `${previewContent.slice(0, 1000)}...` : previewContent;

	return (
		<AlertDialog open={isOpen} onOpenChange={onClose}>
			<AlertDialogContent
				className="max-w-2xl"
				data-testid="control-submission-confirm-modal"
			>
				<AlertDialogHeader>
					<div className="flex items-center gap-2">
						<FileText className="size-5 text-primary" />
						<AlertDialogTitle>Confirm Submission</AlertDialogTitle>
					</div>
					<AlertDialogDescription>
						Please review your submission before confirming. This action cannot be
						undone.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{isBelowMinimum && (
					<div
						className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 dark:border-warning/40 dark:bg-warning/10"
						data-testid="word-count-warning"
					>
						<AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
						<div className="text-sm text-warning-foreground">
							<p className="font-medium">Word count below minimum</p>
							<p>
								Your submission has {wordCount} words, but the minimum required is{" "}
								{minWordCount} words.
							</p>
						</div>
					</div>
				)}

				<div className="space-y-3">
					<div className="flex items-center gap-2 text-sm font-medium">
						<Eye className="size-4 text-muted-foreground" />
						<span>Preview</span>
					</div>

					<ScrollArea className="h-[200px] rounded-md border bg-muted/30 p-4">
						<div className="whitespace-pre-wrap text-sm" data-testid="content-preview">
							{displayContent}
						</div>
					</ScrollArea>

					<Separator />

					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">Total Words</span>
						<span
							className={cn(
								"font-medium",
								isBelowMinimum ? "text-warning" : "text-success",
							)}
							data-testid="preview-word-count"
						>
							{wordCount} words
						</span>
					</div>
				</div>

				<AlertDialogFooter className="gap-2">
					<AlertDialogCancel asChild>
						<Button
							variant="outline"
							disabled={isSubmitting}
							data-testid="cancel-button"
						>
							<X className="mr-2 size-4" />
							Cancel
						</Button>
					</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button
							onClick={onConfirm}
							disabled={isBelowMinimum || isSubmitting}
							data-testid="confirm-button"
						>
							<Send className="mr-2 size-4" />
							{isSubmitting ? "Submitting..." : "Confirm Submission"}
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
