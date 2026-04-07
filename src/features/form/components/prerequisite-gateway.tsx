import { useNavigate } from "@tanstack/react-router";
import { Clock, FileCheck, Lock, Timer } from "lucide-react";

import { CenteredContainer } from "@/components/layout/centered-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormUnlock } from "@/hooks/use-form-unlock";

import { CountdownTimer } from "./countdown-timer";

export type PrerequisiteType = "pre-test" | "post-test" | "delayed-test" | "generic";

type PrerequisiteConfig = {
	icon: React.ReactNode;
	defaultTitle: string;
	defaultDescription: string;
	defaultButtonText: string;
};

const PREREQUISITE_CONFIGS: Record<PrerequisiteType, PrerequisiteConfig> = {
	"pre-test": {
		icon: <Lock className="h-5 w-5" />,
		defaultTitle: "Pre-Test Required",
		defaultDescription: "You must complete the pre-test before accessing this assignment.",
		defaultButtonText: "Take Pre-Test",
	},
	"post-test": {
		icon: <FileCheck className="h-5 w-5" />,
		defaultTitle: "Assignment Task Required",
		defaultDescription: "You must complete the assignment tasks before taking the post-test.",
		defaultButtonText: "Complete Tasks",
	},
	"delayed-test": {
		icon: <Timer className="h-5 w-5" />,
		defaultTitle: "Waiting Period Required",
		defaultDescription: "The delayed test will be available after the waiting period.",
		defaultButtonText: "View Post-Test",
	},
	generic: {
		icon: <Lock className="h-5 w-5" />,
		defaultTitle: "Prerequisite Required",
		defaultDescription: "You must complete a required task before continuing.",
		defaultButtonText: "Complete Task",
	},
};

export interface PrerequisiteGatewayProps {
	/** The form/task ID that must be completed */
	requiredFormId: string;
	/** Type of prerequisite - determines icon, title, description defaults */
	type?: PrerequisiteType;
	/** Custom title (overrides default for type) */
	title?: string;
	/** Custom description (overrides default for type) */
	description?: string;
	/** Custom button text (overrides default for type) */
	buttonText?: string;
	/** Navigation target when taking the prerequisite form */
	navigateTo?: string;
	/** Query params for navigation */
	navigateParams?: Record<string, string>;
	/** Children to render when unlocked */
	children: React.ReactNode;
	/** Whether the gateway is enabled */
	enabled?: boolean;
	/** Additional className for container */
	className?: string;
	/** Custom icon (overrides default for type) */
	icon?: React.ReactNode;
	/** Custom return path after completing prerequisite */
	returnTo?: string;
}

export function PrerequisiteGateway({
	requiredFormId,
	type = "generic",
	title,
	description,
	buttonText,
	navigateTo = "/dashboard/forms/take",
	navigateParams,
	children,
	enabled = true,
	className,
	icon,
	returnTo,
}: PrerequisiteGatewayProps) {
	const navigate = useNavigate();
	const config = PREREQUISITE_CONFIGS[type];

	const {
		data: unlockStatus,
		isLoading,
		error,
	} = useFormUnlock({
		formId: requiredFormId,
		enabled: enabled && !!requiredFormId,
	});

	const handleNavigateToTask = () => {
		const search: Record<string, string> = {
			formId: requiredFormId,
			...navigateParams,
		};

		if (returnTo) {
			search.returnTo = returnTo;
		}

		void navigate({
			to: navigateTo,
			search,
		});
	};

	// If not enabled or no prerequisite required, render children directly
	if (!enabled || !requiredFormId) {
		return <>{children}</>;
	}

	// Loading state
	if (isLoading) {
		return (
			<CenteredContainer className={className}>
				<div className="animate-spin rounded-2xl h-8 w-8 border-b-2 border-primary" />
			</CenteredContainer>
		);
	}

	const displayTitle = title ?? config.defaultTitle;
	const displayDescription = description ?? config.defaultDescription;
	const displayButtonText = buttonText ?? config.defaultButtonText;
	const displayIcon = icon ?? config.icon;

	// Error state - treat as locked and redirect to form
	if (error || !unlockStatus) {
		return (
			<CenteredContainer className={className}>
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							{displayIcon}
							{displayTitle}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-muted-foreground">{displayDescription}</p>
						<Button onClick={handleNavigateToTask} className="w-full">
							{displayButtonText}
						</Button>
					</CardContent>
				</Card>
			</CenteredContainer>
		);
	}

	// If unlocked (completed), render children
	if (unlockStatus.isUnlocked) {
		return <>{children}</>;
	}

	// Blocked state - show gateway UI
	return (
		<CenteredContainer className={className}>
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{displayIcon}
						{displayTitle}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-muted-foreground">{displayDescription}</p>

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

					<Button onClick={handleNavigateToTask} className="w-full">
						{displayButtonText}
					</Button>
				</CardContent>
			</Card>
		</CenteredContainer>
	);
}
