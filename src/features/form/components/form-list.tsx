import { FileText, Pencil, Trash2, BarChart3, Clock, Copy } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export type FormType = "pre_test" | "post_test" | "delayed_test" | "registration" | "questionnaire";
export type FormStatus = "draft" | "published";

export interface FormListItem {
	id: string;
	title: string;
	description?: string;
	type: FormType;
	status: FormStatus;
	createdAt?: Date;
	updatedAt?: Date;
}

interface FormListProps {
	forms: FormListItem[];
	onEdit?: (form: FormListItem) => void;
	onDuplicate?: (form: FormListItem) => void;
	onDelete?: (formId: string) => void;
	onViewResults?: (form: FormListItem) => void;
	className?: string;
}

const formTypeIcons: Record<FormType, React.ReactNode> = {
	pre_test: <FileText className="size-4" />,
	post_test: <FileText className="size-4" />,
	delayed_test: <Clock className="size-4" />,
	registration: <FileText className="size-4" />,

	questionnaire: <FileText className="size-4" />,
};

const formTypeLabels: Record<FormType, string> = {
	pre_test: "Pre-test",
	post_test: "Post-test",
	delayed_test: "Delayed",
	registration: "Registration",

	questionnaire: "Questionnaire",
};

const formStatusConfig: Record<FormStatus, { label: string; dot: string }> = {
	draft: {
		label: "draft",
		dot: "bg-yellow-500",
	},
	published: {
		label: "published",
		dot: "bg-green-500",
	},
};

export function FormList({
	forms,
	onEdit,
	onDuplicate,
	onDelete,
	onViewResults,
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
				<FileText className="size-12 text-stone-400 mb-3" />
				<p className="text-stone-500">No forms found</p>
			</div>
		);
	}

	return (
		<div className={cn("grid gap-2", className)}>
			{forms.map((form) => {
				const statusConfig = formStatusConfig[form.status];

				return (
					<Card
						key={form.id}
						className="group relative border border-stone-200 bg-white py-1"
					>
						<CardContent className="p-3">
							<div className="flex items-start gap-3">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-stone-500">
									{formTypeIcons[form.type]}
								</div>

								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<h3 className="truncate font-medium text-stone-800">
											{form.title}
										</h3>
									</div>

									{form.description && (
										<p className="truncate text-sm text-stone-500 mt-1">
											{form.description}
										</p>
									)}

									<div className="mt-1 flex flex-wrap items-center gap-2">
										<span className="text-xs text-stone-500">
											{formTypeLabels[form.type]}
										</span>

										<span className="text-stone-300">·</span>

										<span className="flex items-center gap-1 text-xs text-stone-500">
											<span
												className={cn(
													"size-1.5 rounded-full",
													statusConfig.dot,
												)}
											/>
											{statusConfig.label}
										</span>

										{form.createdAt && (
											<>
												<span className="text-stone-300">·</span>
												<span className="text-xs text-stone-400">
													Created: {formatRelativeTime(form.createdAt)}
												</span>
											</>
										)}
									</div>
								</div>

								<div className="flex items-center gap-1 shrink-0">
									{onViewResults && (
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) => {
												e.stopPropagation();
												onViewResults(form);
											}}
											title="View Results"
											className="size-7 text-stone-400 hover:text-stone-600"
										>
											<BarChart3 className="size-4" />
										</Button>
									)}
									{onEdit && (
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) => {
												e.stopPropagation();
												onEdit(form);
											}}
											title="Edit"
											className="size-7 text-stone-400 hover:text-stone-600"
										>
											<Pencil className="size-4" />
										</Button>
									)}
									{onDuplicate && (
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) => {
												e.stopPropagation();
												onDuplicate(form);
											}}
											title="Duplicate"
											className="size-7 text-stone-400 hover:text-stone-600"
										>
											<Copy className="size-4" />
										</Button>
									)}
									{onDelete && (
										<Button
											variant="ghost"
											size="icon"
											onClick={(e) => {
												e.stopPropagation();
												onDelete(form.id);
											}}
											title="Delete"
											className="size-7 text-stone-400 hover:text-red-600"
										>
											<Trash2 className="size-4" />
										</Button>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
