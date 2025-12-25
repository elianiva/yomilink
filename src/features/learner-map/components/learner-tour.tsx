import { useEffect, useState } from "react";
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

interface TourStep {
	target: string;
	title: string;
	content: string;
	position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
	{
		target: ".assignment-header",
		title: "Assignment Info",
		content:
			"View the assignment title and description here. You can also see your current attempt number.",
		position: "bottom",
	},
	{
		target: ".connector-node",
		title: "Connectors",
		content:
			"Right-click a connector node, then choose 'Connect To' or 'Connect From'. Click a concept node to complete the connection.",
		position: "bottom",
	},
	{
		target: ".concept-node",
		title: "Concepts",
		content:
			"These are the main concepts from your reading material. Connect them using connectors to build your map.",
		position: "bottom",
	},
	{
		target: ".toolbar-undo",
		title: "Undo",
		content: "Made a mistake? Use undo to step back. You can also redo.",
		position: "top",
	},
	{
		target: ".toolbar-material",
		title: "Reading Material",
		content:
			"Click here to open the reading material for reference while building your map.",
		position: "top",
	},
	{
		target: ".toolbar-submit",
		title: "Submit",
		content:
			"When you're satisfied with your map, click Submit to see your results and score.",
		position: "top",
	},
];

interface LearnerTourProps {
	isOpen: boolean;
	onClose: () => void;
}

export function LearnerTour({ isOpen, onClose }: LearnerTourProps) {
	const [currentStep, setCurrentStep] = useState(0);

	useEffect(() => {
		if (isOpen) {
			const completed = localStorage.getItem("learnerMapTourCompleted");
			if (completed) {
				onClose();
			}
		}
	}, [isOpen, onClose]);

	const handleNext = () => {
		if (currentStep < TOUR_STEPS.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			localStorage.setItem("learnerMapTourCompleted", "true");
			onClose();
		}
	};

	const handleSkip = () => {
		localStorage.setItem("learnerMapTourCompleted", "true");
		onClose();
	};

	const step = TOUR_STEPS[currentStep];

	if (!isOpen) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{currentStep + 1}. {step.title}
					</DialogTitle>
					<DialogDescription>{step.content}</DialogDescription>
				</DialogHeader>
				<div className="flex items-center justify-between text-sm text-muted-foreground py-2">
					<span>
						Step {currentStep + 1} of {TOUR_STEPS.length}
					</span>
					<div className="flex gap-1">
						{TOUR_STEPS.map((_, index) => (
							<div
								key={index}
								className={cn(
									"w-2 h-2 rounded-full transition-colors",
									index === currentStep
										? "bg-primary"
										: index < currentStep
											? "bg-primary/50"
											: "bg-muted",
								)}
							/>
						))}
					</div>
				</div>
				<DialogFooter className="sm:justify-between">
					<Button variant="ghost" size="sm" onClick={handleSkip}>
						Skip Tour
					</Button>
					<Button size="sm" onClick={handleNext}>
						{currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
