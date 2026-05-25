import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ResultMobileOverlayProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
}

/**
 * Slide-over bottom sheet for mobile. Covers ~75% of the viewport so the canvas
 * is still partially visible behind it.
 */
export function ResultMobileOverlay({ open, onClose, title, children }: ResultMobileOverlayProps) {
	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 sm:hidden"
			onClick={onClose}
			onKeyDown={onClose}
			role="presentation"
		>
			<div className="absolute inset-0 bg-black/20" />
			<div
				className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t rounded-t-xl shadow-xl max-h-[75vh] overflow-y-auto animate-slide-up"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
				role="dialog"
			>
				<div className="sticky top-0 bg-white/90 backdrop-blur-lg border-b flex items-center justify-between px-4 py-3 rounded-t-xl">
					<p className="text-sm font-medium">{title}</p>
					<Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
						<X className="size-4" />
					</Button>
				</div>
				<div>{children}</div>
			</div>
		</div>
	);
}
