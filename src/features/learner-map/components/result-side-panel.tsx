import { type LinkProps, Link } from "@tanstack/react-router";
import { FileTextIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DiagnosisStats } from "@/features/learner-map/components/diagnosis/diagnosis-stats";

interface ResultSidePanelProps {
	correctEdges: number;
	missingEdges: number;
	excessiveEdges: number;
	totalGoalEdges: number;
	score: number;
	hasEdgeDetails: boolean;
	postTestFormId: string | null;
	postTestCompleted: boolean;
	postTestButtonLabel: string;
	postTestDescription: string;
	postTestLinkProps: LinkProps;
}

export function ResultSidePanel({
	correctEdges,
	missingEdges,
	excessiveEdges,
	totalGoalEdges,
	score,
	hasEdgeDetails,
	postTestFormId,
	postTestCompleted,
	postTestButtonLabel,
	postTestDescription,
	postTestLinkProps,
}: ResultSidePanelProps) {
	return (
		<div className="sm:w-80 w-full sm:bg-card/30 sm:backdrop-blur-lg sm:border sm:rounded-lg sm:shadow-sm pointer-events-auto max-h-[calc(100vh-8rem)] overflow-y-auto">
			<div className="p-3">
				<DiagnosisStats
					correct={correctEdges}
					missing={missingEdges}
					excessive={excessiveEdges}
					total={totalGoalEdges}
					score={score}
				/>
			</div>
			{!hasEdgeDetails && (
				<>
					<Separator />
					<div className="p-3 text-sm text-muted-foreground">
						No edge-level data came through for this result. If this should show a map,
						the source data may be empty or malformed.
					</div>
				</>
			)}
			{postTestFormId && (
				<>
					<Separator />
					<div className="p-3 space-y-2.5">
						<div className="flex items-center gap-2">
							<div className="rounded-md bg-primary p-1.5">
								<FileTextIcon className="size-4 text-primary-foreground" />
							</div>
							<p className="text-sm font-medium text-foreground">
								{postTestCompleted ? "Completed" : "Next step required"}
							</p>
							{postTestCompleted && (
								<Badge className="bg-emerald-600 text-white">Done</Badge>
							)}
						</div>
						<p className="text-sm text-muted-foreground">{postTestDescription}</p>
						<Button asChild className="w-full gap-2" size="lg">
							<Link {...postTestLinkProps}>{postTestButtonLabel}</Link>
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
