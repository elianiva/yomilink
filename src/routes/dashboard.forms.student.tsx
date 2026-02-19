"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	BookOpenIcon,
	CheckCircle2Icon,
	FileTextIcon,
	Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { FormRpc } from "@/server/rpc/form";

export const Route = createFileRoute("/dashboard/forms/student")({
	component: StudentFormsPage,
});

type StudentForm = {
	id: string;
	title: string;
	description: string | null;
	type: "pre_test" | "post_test" | "registration" | "control";
	unlockStatus: "locked" | "available" | "completed";
	isUnlocked: boolean;
	progress: {
		status: "locked" | "available" | "completed";
		unlockedAt: Date | null;
		completedAt: Date | null;
	} | null;
};

function StudentFormsPage() {
	const navigate = useNavigate({ from: "/dashboard/forms/student" });

	const { data, isLoading } = useQuery({
		...FormRpc.getStudentForms(),
	});

	const forms: StudentForm[] = Array.isArray(data) ? data : [];

	const availableForms = forms.filter((f) => f.unlockStatus === "available");
	const completedForms = forms.filter((f) => f.unlockStatus === "completed");
	const lockedForms = forms.filter((f) => f.unlockStatus === "locked");

	const handleFormClick = (form: StudentForm) => {
		if (form.isUnlocked) {
			navigate({ to: "/dashboard/forms/take", search: { formId: form.id } });
		}
	};

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "pre_test":
				return "Pre-Test";
			case "post_test":
				return "Post-Test";
			case "registration":
				return "Registration";
			case "control":
				return "Control";
			default:
				return type;
		}
	};

	const getTypeColor = (type: string) => {
		switch (type) {
			case "pre_test":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "post_test":
				return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
			case "registration":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "control":
				return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex items-center gap-3">
				<FileTextIcon className="size-8 text-primary" />
				<div>
					<h1 className="text-2xl font-semibold">My Forms</h1>
					<p className="text-muted-foreground">
						Complete your assigned forms to progress in the course
					</p>
				</div>
			</div>

			{forms.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<FileTextIcon className="size-12 text-muted-foreground mb-4" />
						<p className="text-muted-foreground">No forms available yet</p>
					</CardContent>
				</Card>
			) : (
				<>
					{availableForms.length > 0 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold flex items-center gap-2">
								<BookOpenIcon className="size-5 text-blue-600" />
								Available Forms
							</h2>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{availableForms.map((form) => (
									<Card
										key={form.id}
										className="cursor-pointer hover:shadow-md transition-shadow"
										onClick={() => handleFormClick(form)}
									>
										<CardHeader className="pb-3">
											<div className="flex items-start justify-between">
												<CardTitle className="text-lg">{form.title}</CardTitle>
												<span
													className={`text-xs px-2 py-1 rounded-full ${getTypeColor(
														form.type,
													)}`}
												>
													{getTypeLabel(form.type)}
												</span>
											</div>
											{form.description && (
												<CardDescription>{form.description}</CardDescription>
											)}
										</CardHeader>
										<CardContent>
											<Button className="w-full">
												<BookOpenIcon className="mr-2 h-4 w-4" />
												Start Form
											</Button>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					)}

					{completedForms.length > 0 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold flex items-center gap-2">
								<CheckCircle2Icon className="size-5 text-green-600" />
								Completed Forms
							</h2>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{completedForms.map((form) => (
									<Card key={form.id}>
										<CardHeader className="pb-3">
											<div className="flex items-start justify-between">
												<CardTitle className="text-lg">{form.title}</CardTitle>
												<span
													className={`text-xs px-2 py-1 rounded-full ${getTypeColor(
														form.type,
													)}`}
												>
													{getTypeLabel(form.type)}
												</span>
											</div>
											{form.description && (
												<CardDescription>{form.description}</CardDescription>
											)}
										</CardHeader>
										<CardContent>
											<div className="flex items-center gap-2 text-sm text-green-600">
												<CheckCircle2Icon className="h-4 w-4" />
												Completed
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					)}

					{lockedForms.length > 0 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold flex items-center gap-2">
								<FileTextIcon className="size-5 text-gray-500" />
								Locked Forms
							</h2>
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{lockedForms.map((form) => (
									<Card key={form.id} className="opacity-75">
										<CardHeader className="pb-3">
											<div className="flex items-start justify-between">
												<CardTitle className="text-lg">{form.title}</CardTitle>
												<span
													className={`text-xs px-2 py-1 rounded-full ${getTypeColor(
														form.type,
													)}`}
												>
													{getTypeLabel(form.type)}
												</span>
											</div>
											{form.description && (
												<CardDescription>{form.description}</CardDescription>
											)}
										</CardHeader>
										<CardContent>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<FileTextIcon className="h-4 w-4" />
												Complete prerequisites to unlock
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
