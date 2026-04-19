import { Schema } from "effect";
import { BookOpenIcon, CheckCircleIcon, SchoolIcon, UserIcon } from "lucide-react";

import { NonEmpty, Password } from "@/lib/validation-schemas";
import { JlptLevelSchema } from "@/server/rpc/auth";

export const jlptOptions = [
	{ id: "None", label: "None (No JLPT)" },
	{ id: "N5", label: "N5 (Beginner)" },
	{ id: "N4", label: "N4 (Elementary)" },
	{ id: "N3", label: "N3 (Intermediate)" },
	{ id: "N2", label: "N2 (Pre-Advanced)" },
	{ id: "N1", label: "N1 (Advanced)" },
];

export const SignUpSchema = Schema.Struct({
	studentId: NonEmpty("Student ID"),
	password: Password(8),
	confirmPassword: Schema.String,
	age: Schema.NullOr(Schema.Number),
	jlptLevel: JlptLevelSchema,
	cohortId: NonEmpty("Cohort"),
	japaneseLearningDuration: Schema.NullOr(Schema.Number),
	previousJapaneseScore: Schema.NullOr(Schema.Number),
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

export type SignUpForm = typeof SignUpSchema.Type;

export type Step = {
	id: "account" | "personal" | "academic" | "consent";
	title: string;
	description: string;
	icon: typeof UserIcon;
};

export const steps: Step[] = [
	{
		id: "account",
		title: "Whitelist",
		description: "Pick your reserved account and set a password",
		icon: UserIcon,
	},
	{
		id: "personal",
		title: "Personal",
		description: "Tell us about yourself",
		icon: BookOpenIcon,
	},
	{
		id: "academic",
		title: "Academic",
		description: "Choose your cohort and review your student ID",
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
