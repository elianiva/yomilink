import {
	CheckCircle2Icon,
	ArrowRightLeftIcon,
	SearchIcon,
	LayoutGridIcon,
	Undo2Icon,
	ZoomInIcon,
	BookOpenIcon,
	SendIcon,
	MousePointer2Icon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CanvasOnboardingDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const STEPS = [
	{
		icon: <MousePointer2Icon className="size-5" />,
		title: "Drag to arrange",
		description:
			"Drag any concept card to arrange them on the canvas. Group related concepts close together to organize your thinking.",
	},
	{
		icon: <ArrowRightLeftIcon className="size-5" />,
		title: "Connect concepts",
		description:
			"Drag from a concept's handle (the dot on its side) to a connector card to create a relationship line. Each connection shows how concepts relate.",
	},
	{
		icon: <SearchIcon className="size-5" />,
		title: "Search nodes",
		description:
			"Use the search button (magnifying glass) in the toolbar to quickly find and jump to any concept on the canvas.",
	},
	{
		icon: <LayoutGridIcon className="size-5" />,
		title: "Auto Layout",
		description:
			"Click the Auto Layout button to automatically arrange all nodes in a clean, readable order. Use this if the canvas gets messy.",
	},
	{
		icon: <Undo2Icon className="size-5" />,
		title: "Undo & Redo",
		description:
			"Made a mistake? Use the undo/redo arrows in the toolbar to step backward or forward through your changes.",
	},
	{
		icon: <ZoomInIcon className="size-5" />,
		title: "Zoom controls",
		description: "Use +/- buttons to zoom in/out, or the fit button to see everything at once.",
	},
	{
		icon: <BookOpenIcon className="size-5" />,
		title: "Reading material",
		description:
			"Open the reading material to review the lesson content while building your map.",
	},
	{
		icon: <SendIcon className="size-5" />,
		title: "Submit when ready",
		description:
			"Once you've arranged concepts and made all your connections, click Submit to see how your map compares to the teacher's.",
	},
] as const;

export function CanvasOnboardingDialog({ open, onOpenChange }: CanvasOnboardingDialogProps) {
	const [step, setStep] = useState(0);
	const isLast = step === STEPS.length - 1;

	const handleNext = () => {
		if (isLast) {
			onOpenChange(false);
			setStep(0);
		} else {
			setStep((s) => s + 1);
		}
	};

	const handleSkip = () => {
		onOpenChange(false);
		setStep(0);
	};

	const current = STEPS[step];

	return (
		<Dialog open={open} onOpenChange={handleSkip}>
			<DialogContent className="sm:max-w-md" showCloseButton={false}>
				<DialogHeader>
					<div className="flex items-center gap-2 text-primary mb-1">
						{current.icon}
						<DialogTitle className="text-base">{current.title}</DialogTitle>
					</div>
					<DialogDescription className="text-sm leading-relaxed">
						{current.description}
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center justify-between py-2">
					<div className="flex gap-1.5">
						{STEPS.map((_, i) => (
							<div
								key={i}
								className={cn(
									"size-1.5 rounded-full transition-all",
									i === step && "w-4 bg-primary",
									i < step && "bg-primary/40",
									i > step && "bg-muted-foreground/20",
								)}
							/>
						))}
					</div>
					<span className="text-xs text-muted-foreground tabular-nums">
						{step + 1} of {STEPS.length}
					</span>
				</div>

				<DialogFooter className="gap-2">
					<Button variant="ghost" size="sm" onClick={handleSkip}>
						Skip tour
					</Button>
					<Button size="sm" onClick={handleNext}>
						{isLast ? (
							<>
								<CheckCircle2Icon className="size-4" />
								Got it
							</>
						) : (
							"Next"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
