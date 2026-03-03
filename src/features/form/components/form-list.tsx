import {
	FileText,
	MoreVertical,
	Pencil,
	Trash2,
	BarChart3,
	Clock,
	Users,
	CheckCircle2,
	Lock,
	Unlock,
} from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export type FormType =
	| "pre_test"
	| "post_test"
	| "delayed_test"
	| "registration"
	| "tam"
	| "control";
export type FormStatus = "draft" | "published";
export type FormListStatus = "locked" | "available" | "completed";

export interface FormStats {
	completed: number;
	available: number;
	locked: number;
	total: number;
}

export interface FormListItem {
	id: string;
	title: string;
	description?: string;
	type: FormType;
	status: FormStatus;
	formStatus?: FormListStatus;
	createdAt?: Date;
	updatedAt?: Date;
	stats?: FormStats;
}

interface FormListProps {
	forms: FormListItem[];
	onEdit?: (form: FormListItem) => void;
	onDelete?: (formId: string) => void;
	onViewResults?: (form: FormListItem) => void;
	onClick?: (form: FormListItem) => void;
	className?: string;
}

// Monochrome coral theme - 4 colors:
// 1. Primary coral (actions, progress, accents)
// 2. Stone 600 (text, icons)
// 3. Stone 400 (muted text, borders)
// 4. Stone 100/50 (backgrounds)
const formTypeIcons: Record<FormType, React.ReactNode> = {
	pre_test: <FileText className="size-4" />,
	post_test: <FileText className="size-4" />,
	delayed_test: <Clock className="size-4" />,
	registration: <FileText className="size-4" />,
	tam: <BarChart3 className="size-4" />,
	control: <FileText className="size-4" />,
};

const formTypeLabels: Record<FormType, string> = {
	pre_test: "Pre-test",
	post_test: "Post-test",
	delayed_test: "Delayed",
	registration: "Registration",
	tam: "TAM",
	control: "Control",
};

const formStatusConfig: Record<FormStatus, { label: string; dot: string }> = {
	draft: {
		label: "Draft",
		dot: "bg-stone-400",
	},
	published: {
		label: "Published",
		dot: "bg-primary",
	},
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
				<FileText className="size-12 text-stone-400 mb-3" />
				<p className="text-stone-500">No forms found</p>
			</div>
		);
	}

	return (
		<div className={cn("grid gap-2", className)}>
			{forms.map((form) => {
				const statusConfig = formStatusConfig[form.status];
				const stats = form.stats ?? {
					completed: 0,
					available: 0,
					locked: 0,
					total: 0,
				};

				const handleClick = () => {
					if (onClick) {
						onClick(form);
					} else if (onViewResults) {
						onViewResults(form);
					}
				};

				return (
					<Card
						key={form.id}
						className={cn(
							"group relative overflow-hidden border border-stone-200 shadow-none transition-all duration-200 py-2",
							"hover:border-primary/40 hover:shadow-sm hover:bg-stone-50/50",
							"cursor-pointer bg-white",
						)}
						onClick={handleClick}
					>
						<CardContent className="p-3">
							<div className="flex items-start gap-3">
								{/* Icon - monochrome */}
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-stone-500">
									{formTypeIcons[form.type]}
								</div>

								{/* Main Content */}
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

									{/* Metadata Row */}
									<div className="mt-1 flex flex-wrap items-center gap-2">
										{/* Type Label - text only */}
										<span className="text-xs text-stone-500">
											{formTypeLabels[form.type]}
										</span>

										<span className="text-stone-300">·</span>

										{/* Status */}
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
													{formatRelativeTime(form.createdAt)}
												</span>
											</>
										)}
									</div>

									{/* Stats Section */}
									<div className="hidden sm:flex items-center mt-2 gap-3">
										<div className="flex items-center gap-1.5">
											<Users className="size-3.5 text-stone-400" />
											<div className="flex items-baseline gap-1">
												<span className="text-sm font-medium text-stone-700">
													{stats.completed}
												</span>
												<span className="text-sm text-stone-400">
													/{stats.total}
												</span>
											</div>
										</div>
										<span className="text-xs text-stone-600/50">|</span>
										{/* Breakdown - monochrome */}
										<div className="flex items-center gap-2 text-sm text-stone-500">
											<span className="flex items-center gap-0.5">
												<CheckCircle2 className="size-3" />
												{stats.completed}
											</span>
											<span className="flex items-center gap-0.5">
												<Unlock className="size-3" />
												{stats.available}
											</span>
											<span className="flex items-center gap-0.5 text-stone-400">
												<Lock className="size-3" />
												{stats.locked}
											</span>
										</div>
									</div>
								</div>

								{/* Actions */}
								<div className="flex items-center gap-1">
									{(onEdit || onDelete) && (
										<DropdownMenu>
											<DropdownMenuTrigger
												asChild
												onClick={(e) => e.stopPropagation()}
											>
												<Button
													variant="ghost"
													size="icon"
													className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-stone-400 hover:text-stone-600"
												>
													<MoreVertical className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="border-stone-200"
											>
												{onViewResults && (
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation();
															onViewResults(form);
														}}
													>
														<BarChart3 className="mr-2 size-4" />
														View Results
													</DropdownMenuItem>
												)}
												{onEdit && (
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation();
															onEdit(form);
														}}
													>
														<Pencil className="mr-2 size-4" />
														Edit
													</DropdownMenuItem>
												)}
												{onDelete && (
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation();
															onDelete(form.id);
														}}
														className="text-stone-700"
													>
														<Trash2 className="mr-2 size-4" />
														Delete
													</DropdownMenuItem>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
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
