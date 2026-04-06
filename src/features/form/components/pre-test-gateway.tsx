import { useNavigate } from "@tanstack/react-router";
import { Clock, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormUnlock } from "@/hooks/use-form-unlock";
import { cn } from "@/lib/utils";

import { CountdownTimer } from "./countdown-timer";

export interface PreTestGatewayProps {
	/** The pre-test form ID that must be completed */
	preTestFormId: string;
	/** The assignment ID for navigation after completing pre-test */
	assignmentId?: string;
	/** Children to render when unlocked */
	children: React.ReactNode;
	/** Additional className for container */
	className?: string;
	/** Whether the gateway is enabled */
	enabled?: boolean;
	/** Custom title for the gateway */
	title?: string;
	/** Custom description message */
	description?: string;
	/** Button text to take pre-test */
	buttonText?: string;
}

export function PreTestGateway({
	preTestFormId,
	assignmentId,
	children,
	className,
	enabled = true,
	title = "Pre-Test Required",
	description = "You must complete the pre-test before accessing this assignment.",
	buttonText = "Take Pre-Test",
}: PreTestGatewayProps) {
	const navigate = useNavigate();
	const {
		data: unlockStatus,
		isLoading,
		error,
	} = useFormUnlock({
		formId: preTestFormId,
		enabled: enabled && !!preTestFormId,
	});

	const handleTakePreTest = () => {
		if (assignmentId) {
			void navigate({
				to: "/dashboard/forms/take",
				search: {
					formId: preTestFormId,
					returnTo: `/dashboard/learner-map/${assignmentId}`,
				},
			});
		} else {
			void navigate({
				to: "/dashboard/forms/take",
				search: { formId: preTestFormId },
			});
		}
	};

	// If not enabled or no pre-test required, render children directly
	if (!enabled || !preTestFormId) {
		return <>{children}</>;
	}

	// Loading state
	if (isLoading) {
		return (
			<div className={cn("flex items-center justify-center p-8", className)}>
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
			</div>
		);
	}

	// Error state - treat as locked and redirect to form
	if (error || !unlockStatus) {
		return (
			<div className={cn("flex items-center justify-center p-8", className)}>
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Lock className="h-5 w-5" />
							{title}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-muted-foreground">{description}</p>
						<Button onClick={handleTakePreTest} className="w-full">
							{buttonText}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// If unlocked (completed), render children
	if (unlockStatus.isUnlocked) {
		return <>{children}</>;
	}

	// Blocked state - show gateway UI

	return (
		<div className={cn("flex items-center justify-center p-8", className)}>
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Lock className="h-5 w-5" />
						{title}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground">{description}</p>

					{unlockStatus.reason && (
						<div className="bg-muted rounded-lg p-3 text-sm">
							<p className="font-medium">{unlockStatus.reason}</p>
						</div>
					)}

					{unlockStatus.earliestUnlockAt && (
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Clock className="h-4 w-4" />
							<CountdownTimer
								targetDate={unlockStatus.earliestUnlockAt}
								onComplete={() => {
									// Refresh will happen automatically via useFormUnlock polling
								}}
							/>
						</div>
					)}

					<Button onClick={handleTakePreTest} className="w-full">
						{buttonText}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
