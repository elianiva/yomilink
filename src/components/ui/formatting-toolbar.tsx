"use client";

import { Bold, Italic, List, ListOrdered } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface FormattingToolbarProps {
	/** Whether the toolbar is disabled */
	disabled?: boolean;
	/** Additional CSS classes */
	className?: string;
	/** Callback when bold button is clicked */
	onBold?: () => void;
	/** Callback when italic button is clicked */
	onItalic?: () => void;
	/** Callback when bullet list button is clicked */
	onBulletList?: () => void;
	/** Callback when numbered list button is clicked */
	onNumberedList?: () => void;
}

/**
 * A reusable formatting toolbar with Bold, Italic, Bullet List, and Numbered List buttons.
 * Uses document.execCommand to apply formatting to the current selection in a contentEditable element.
 *
 * @example
 * ```tsx
 * <FormattingToolbar
 *   onBold={() => document.execCommand("bold", false)}
 *   onItalic={() => document.execCommand("italic", false)}
 *   onBulletList={() => document.execCommand("insertUnorderedList", false)}
 *   onNumberedList={() => document.execCommand("insertOrderedList", false)}
 * />
 * ```
 */
export function FormattingToolbar({
	disabled = false,
	className,
	onBold,
	onItalic,
	onBulletList,
	onNumberedList,
}: FormattingToolbarProps) {
	const handleBold = () => {
		document.execCommand("bold", false);
		onBold?.();
	};

	const handleItalic = () => {
		document.execCommand("italic", false);
		onItalic?.();
	};

	const handleBulletList = () => {
		document.execCommand("insertUnorderedList", false);
		onBulletList?.();
	};

	const handleNumberedList = () => {
		document.execCommand("insertOrderedList", false);
		onNumberedList?.();
	};

	return (
		<div
			className={cn("flex items-center gap-1 border-b bg-muted/30 p-2", className)}
			data-testid="formatting-toolbar"
			role="toolbar"
			aria-label="Text formatting"
		>
			<Button
				variant="ghost"
				size="sm"
				onClick={handleBold}
				disabled={disabled}
				data-testid="bold-button"
				aria-label="Bold"
				title="Bold"
			>
				<Bold className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={handleItalic}
				disabled={disabled}
				data-testid="italic-button"
				aria-label="Italic"
				title="Italic"
			>
				<Italic className="h-4 w-4" />
			</Button>
			<Separator orientation="vertical" className="mx-1 h-6" />
			<Button
				variant="ghost"
				size="sm"
				onClick={handleBulletList}
				disabled={disabled}
				data-testid="bullet-list-button"
				aria-label="Bullet list"
				title="Bullet list"
			>
				<List className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				onClick={handleNumberedList}
				disabled={disabled}
				data-testid="numbered-list-button"
				aria-label="Numbered list"
				title="Numbered list"
			>
				<ListOrdered className="h-4 w-4" />
			</Button>
		</div>
	);
}
