"use client";

import type * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type FormType = "pre_test" | "post_test" | "registration" | "control";
export type FormStatus = "draft" | "published";

export interface FormMetadata {
	title: string;
	description: string | null;
	type: FormType;
	status: FormStatus;
}

interface FormMetadataEditorProps {
	metadata: FormMetadata;
	onChange: (metadata: FormMetadata) => void;
	disabled?: boolean;
}

const formTypeLabels: Record<FormType, string> = {
	pre_test: "Pre-Test",
	post_test: "Post-Test",
	registration: "Registration",
	control: "Control Group",
};

const formTypeDescriptions: Record<FormType, string> = {
	pre_test: "Assessment before content access",
	post_test: "Assessment after assignment completion",
	registration: "Initial user registration form",
	control: "Control group alternative activity",
};

export function FormMetadataEditor({
	metadata,
	onChange,
	disabled = false,
}: FormMetadataEditorProps) {
	const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange({ ...metadata, title: e.target.value });
	};

	const handleDescriptionChange = (
		e: React.ChangeEvent<HTMLTextAreaElement>,
	) => {
		onChange({ ...metadata, description: e.target.value || null });
	};

	const handleTypeChange = (value: string) => {
		onChange({ ...metadata, type: value as FormType });
	};

	const handleStatusChange = (value: string) => {
		onChange({ ...metadata, status: value as FormStatus });
	};

	return (
		<div className="space-y-6" data-testid="form-metadata-editor">
			<div className="space-y-2">
				<Label htmlFor="form-title">
					Form Title <span className="text-destructive">*</span>
				</Label>
				<Input
					id="form-title"
					data-testid="form-title-input"
					value={metadata.title}
					onChange={handleTitleChange}
					placeholder="Enter form title"
					disabled={disabled}
					aria-required="true"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="form-description">Description</Label>
				<Textarea
					id="form-description"
					data-testid="form-description-input"
					value={metadata.description ?? ""}
					onChange={handleDescriptionChange}
					placeholder="Enter form description (optional)"
					disabled={disabled}
					rows={3}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="form-type">Form Type</Label>
				<Select
					value={metadata.type}
					onValueChange={handleTypeChange}
					disabled={disabled}
				>
					<SelectTrigger
						id="form-type"
						data-testid="form-type-select"
						className="w-full"
					>
						<SelectValue placeholder="Select form type" />
					</SelectTrigger>
					<SelectContent>
						{(Object.keys(formTypeLabels) as FormType[]).map((type) => (
							<SelectItem key={type} value={type}>
								<div className="flex flex-col text-left">
									<span>{formTypeLabels[type]}</span>
									<span className="text-xs text-muted-foreground">
										{formTypeDescriptions[type]}
									</span>
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label htmlFor="form-status">Status</Label>
				<Select
					value={metadata.status}
					onValueChange={handleStatusChange}
					disabled={disabled}
				>
					<SelectTrigger
						id="form-status"
						data-testid="form-status-select"
						className="w-full"
					>
						<SelectValue placeholder="Select status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="draft">
							<div className="flex items-center gap-2">
								<span className="h-2 w-2 rounded-full bg-yellow-500" />
								Draft
							</div>
						</SelectItem>
						<SelectItem value="published">
							<div className="flex items-center gap-2">
								<span className="h-2 w-2 rounded-full bg-green-500" />
								Published
							</div>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
