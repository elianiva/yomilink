import {
	CheckCircle2Icon,
	ClockIcon,
	FlaskConicalIcon,
	LockIcon,
	UnlockIcon,
	UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ExperimentPhase =
	| "preTest"
	| "stratifiedAssignment"
	| "mainAssignment"
	| "postTest"
	| "tamSurvey"
	| "delayedTest";

export interface PhaseConfig {
	id: ExperimentPhase;
	label: string;
	description: string;
	icon: LucideIcon;
}

export const EXPERIMENT_PHASES: PhaseConfig[] = [
	{
		id: "preTest",
		label: "Pre-Test",
		description: "Baseline knowledge assessment before the experiment",
		icon: FlaskConicalIcon,
	},
	{
		id: "stratifiedAssignment",
		label: "Stratified Assignment",
		description:
			"Assign students to experiment (concept map) or control (summarizing) groups based on pre-test scores",
		icon: UsersIcon,
	},
	{
		id: "mainAssignment",
		label: "Main Activity",
		description:
			"Core learning activity: Concept Map building for experiment group, Summarizing task for control group",
		icon: LockIcon,
	},
	{
		id: "postTest",
		label: "Post-Test",
		description: "Immediate learning assessment after the main activity",
		icon: CheckCircle2Icon,
	},
	{
		id: "tamSurvey",
		label: "Questionnaires",
		description: "TAM (Technology Acceptance Model) and other survey questionnaires",
		icon: UnlockIcon,
	},
	{
		id: "delayedTest",
		label: "Delayed Test",
		description: "Retention assessment to measure long-term learning (typically 7+ days after)",
		icon: ClockIcon,
	},
];

export type PhaseStatus =
	| "completed"
	| "in_progress"
	| "available"
	| "locked"
	| "pending"
	| "scheduled";

export interface PhaseStatusInfo {
	status: PhaseStatus;
	label: string;
}
