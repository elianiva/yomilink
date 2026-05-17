import { Bold, Italic, List, ListOrdered } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface FormattingToolbarProps {
	disabled?: boolean;
	className?: string;
	onBold?: () => void;
	onItalic?: () => void;
	onBulletList?: () => void;
	onNumberedList?: () => void;
}

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
				<Bold className="size-4" />
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
				<Italic className="size-4" />
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
				<List className="size-4" />
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
				<ListOrdered className="size-4" />
			</Button>
		</div>
	);
}
