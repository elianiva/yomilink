import { Schema } from "effect";
import { UserIcon, BookOpenIcon, SchoolIcon, CheckCircleIcon } from "lucide-react";

import { Email, NonEmpty } from "@/lib/validation-schemas";
import { JlptLevelSchema, StudyGroupSchema } from "@/server/rpc/auth";

export const jlptOptions = [
	{ id: "None", label: "None (No JLPT)" },
	{ id: "N5", label: "N5 (Beginner)" },
	{ id: "N4", label: "N4 (Elementary)" },
	{ id: "N3", label: "N3 (Intermediate)" },
	{ id: "N2", label: "N2 (Pre-Advanced)" },
	{ id: "N1", label: "N1 (Advanced)" },
];

export const SignUpSchema = Schema.Struct({
	name: NonEmpty("Name"),
	email: Email,
	// Password validation disabled for students - easy to re-enable
	// password: Schema.String.pipe(
	// 	Schema.minLength(8),
	// 	Schema.pattern(/[A-Z]/, {
	// 		message: () => "Password must include at least one uppercase letter",
	// 	}),
	// 	Schema.pattern(/[a-z]/, {
	// 		message: () => "Password must include at least one lowercase letter",
	// 	}),
	// 	Schema.pattern(/[0-9]|[^A-Za-z0-9]/, {
	// 		message: () => "Password must include at least one number or special character",
	// 	}),
	// ),
	password: Schema.String,
	confirmPassword: Schema.String,
	age: Schema.NullOr(Schema.Number),
	studentId: Schema.NullOr(Schema.String),
	jlptLevel: JlptLevelSchema,
	cohortId: NonEmpty("Cohort"),
	japaneseLearningDuration: Schema.NullOr(Schema.Number),
	previousJapaneseScore: Schema.NullOr(Schema.Number),
	studyGroup: StudyGroupSchema,
	mediaConsumption: Schema.NullOr(Schema.Number),
	motivation: Schema.NullOr(Schema.String),
	consentGiven: Schema.Boolean,
}).pipe(
	Schema.filter((data) => data.password === data.confirmPassword, {
		message: () => "Passwords do not match",
	}),
	Schema.filter((data) => data.consentGiven === true, {
		message: () => "You must give consent to participate in this research",
	}),
);

export type Step = {
	id: "account" | "personal" | "academic" | "consent";
	title: string;
	description: string;
	icon: typeof UserIcon;
};

export const steps: Step[] = [
	{
		id: "account",
		title: "Account",
		description: "Create your login credentials",
		icon: UserIcon,
	},
	{
		id: "personal",
		title: "Personal Information",
		description: "Tell us about your Japanese learning journey",
		icon: BookOpenIcon,
	},
	{
		id: "academic",
		title: "Academic Information",
		description: "Your academic details and cohort assignment",
		icon: SchoolIcon,
	},
	{
		id: "consent",
		title: "Consent",
		description: "Research participation agreement",
		icon: CheckCircleIcon,
	},
];

export const stepVariants = {
	enter: (direction: number) => ({
		x: direction > 0 ? 100 : -100,
		opacity: 0,
	}),
	center: {
		x: 0,
		opacity: 1,
	},
	exit: (direction: number) => ({
		x: direction > 0 ? -100 : 100,
		opacity: 0,
	}),
};
