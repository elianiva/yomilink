"use client";

import {
	FileText,
	MoreVertical,
	Pencil,
	Trash2,
	BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FormType = "pre_test" | "post_test" | "registration" | "control";
export type FormStatus = "draft" | "published";
export type FormListStatus = "locked" | "available" | "completed";

export interface FormListItem {
	id: string;
	title: string;
	description?: string;
	type: FormType;
	status: FormStatus;
	formStatus?: FormListStatus;
	createdAt?: Date;
	updatedAt?: Date;
}

interface FormListProps {
	forms: FormListItem[];
	onEdit?: (form: FormListItem) => void;
	onDelete?: (formId: string) => void;
	onViewResults?: (form: FormListItem) => void;
	onClick?: (form: FormListItem) => void;
	className?: string;
}

const formTypeLabels: Record<FormType, string> = {
	pre_test: "Pre-test",
	post_test: "Post-test",
	registration: "Registration",
	control: "Control",
};

const formStatusColors: Record<FormStatus, string> = {
	draft: "bg-yellow-500",
	published: "bg-green-500",
};

const formListStatusColors: Record<FormListStatus, string> = {
	locked: "bg-red-500",
	available: "bg-blue-500",
	completed: "bg-green-500",
};

const formListStatusLabels: Record<FormListStatus, string> = {
	locked: "Locked",
	available: "Available",
	completed: "Completed",
};

export function FormList({
	forms,
	onEdit,
	onDelete,
	onViewResults,
	onClick,
	className,
}: FormListProps) {
	if (forms.length === 0) {
		return (
			<div
				className={cn(
					"flex flex-col items-center justify-center py-12 text-center",
					className,
				)}
			>
				<FileText className="h-12 w-12 text-muted-foreground mb-4" />
				<p className="text-muted-foreground">No forms found</p>
			</div>
		);
	}

	return (
		<div className={cn("grid gap-4", className)}>
			{forms.map((form) => (
				<Card
					key={form.id}
					className={cn(
						"transition-colors hover:bg-accent/50",
						onClick && "cursor-pointer",
					)}
					onClick={() => onClick?.(form)}
				>
					<CardHeader className="pb-3">
						<div className="flex items-start justify-between">
							<div className="space-y-1">
								<CardTitle className="text-lg">{form.title}</CardTitle>
								{form.description && (
									<CardDescription>{form.description}</CardDescription>
								)}
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="outline" className="bg-transparent">
									{formTypeLabels[form.type]}
								</Badge>
								<Badge
									className={cn("text-white", formStatusColors[form.status])}
								>
									{form.status}
								</Badge>
								{form.formStatus && (
									<Badge
										className={cn(
											"text-white",
											formListStatusColors[form.formStatus],
										)}
									>
										{formListStatusLabels[form.formStatus]}
									</Badge>
								)}
								{(onEdit || onDelete) && (
									<DropdownMenu>
										<DropdownMenuTrigger
											asChild
											onClick={(e) => e.stopPropagation()}
										>
											<Button variant="ghost" size="icon" className="h-8 w-8">
												<MoreVertical className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											{onViewResults && (
												<DropdownMenuItem onClick={() => onViewResults(form)}>
													<BarChart3 className="mr-2 h-4 w-4" />
													View Results
												</DropdownMenuItem>
											)}
											{onEdit && (
												<DropdownMenuItem onClick={() => onEdit(form)}>
													<Pencil className="mr-2 h-4 w-4" />
													Edit
												</DropdownMenuItem>
											)}
											{onDelete && (
												<DropdownMenuItem
													onClick={() => onDelete(form.id)}
													className="text-destructive"
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Delete
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{form.createdAt && (
							<p className="text-xs text-muted-foreground">
								Created: {form.createdAt.toLocaleDateString()}
							</p>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
