import { useMachine } from "@xstate/react";
import { UserIcon, UsersIcon } from "lucide-react";
import { SubmitEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { parseDateInput } from "@/lib/date-utils";
import { assignmentWizardMachine } from "@/machines/assignment-wizard.machine";
import { AssignmentRpc } from "@/server/rpc/assignment";
import { FormRpc } from "@/server/rpc/form";

import { FormSelect } from "./form-select";

interface CreateAssignmentFormProps {
	onSuccess: () => void;
	onCancel: () => void;
}

const steps = [
	{
		title: "Basic Information",
		description: "Enter assignment title, description, and optional reading material",
	},
	{
		title: "Configuration",
		description: "Select a goal map and configure time limits",
	},
	{
		title: "Procedure",
		description: "Configure tests and surveys for this assignment",
	},
	{
		title: "Assignment",
		description: "Select cohorts or students to assign this to",
	},
];

export function CreateAssignmentForm({ onSuccess, onCancel }: CreateAssignmentFormProps) {
	const [snapshot, send] = useMachine(assignmentWizardMachine);

	const { data: goalMaps } = useRpcQuery(AssignmentRpc.getTeacherGoalMaps());
	const { data: cohorts } = useRpcQuery(AssignmentRpc.getAvailableCohorts());
	const { data: users } = useRpcQuery(AssignmentRpc.getAvailableUsers());
	const { data: forms } = useRpcQuery(FormRpc.listForms());

	const ctx = snapshot.context;
	const step = ctx.currentStep;
	const isSubmitting = snapshot.matches("submitting");

	const createMutation = useRpcMutation(AssignmentRpc.createAssignment(), {
		operation: "create assignment",
		showSuccess: true,
		successMessage: "Assignment created successfully",
	});

	const handleSubmit = (e: SubmitEvent) => {
		e.preventDefault();

		if (!ctx.basic.title.trim() || !ctx.config.goalMapId) {
			return;
		}

		createMutation.mutate(
			{
				title: ctx.basic.title.trim(),
				cohortIds: ctx.assignment.selectedCohorts,
				description: ctx.basic.description.trim() || undefined,
				goalMapId: ctx.config.goalMapId,
				layout: "random",
				startDate: parseDateInput(ctx.config.startDate) ?? Date.now(),
				endDate: parseDateInput(ctx.config.endDate),
				userIds: ctx.assignment.selectedUsers,
				preTestFormId: ctx.procedure.preTestFormId,
				postTestFormId: ctx.procedure.postTestFormId || undefined,
				delayedPostTestFormId: ctx.procedure.delayedPostTestFormId || undefined,
				delayedPostTestDelayDays: ctx.procedure.delayedPostTestDelayDays,
			},
			{
				onSuccess: () => {
					send({ type: "SUCCESS" });
					onSuccess();
				},
			},
		);
	};

	const currentStepData = steps[step];
	const formOptions = {
		goalMaps: goalMaps ?? [],
		cohorts: cohorts ?? [],
		users: (users ?? []).filter((u) => u.role === "student"),
		forms: forms ?? [],
	};

	const formsWithDesc = formOptions.forms.map((f) => ({
		...f,
		description: f.description ?? "No description",
	}));
	const pretestForms = formsWithDesc.filter((f) => f.type === "pre_test");
	const posttestForms = formsWithDesc.filter((f) => f.type === "post_test");
	const delayedtestForms = formsWithDesc.filter((f) => f.type === "delayed_test");

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{snapshot.matches("basicInfo") && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">Title *</Label>
						<Input
							id="title"
							value={ctx.basic.title}
							onChange={(e) =>
								send({ type: "SET_BASIC", field: "title", value: e.target.value })
							}
							placeholder="e.g., Photosynthesis Concept Map"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={ctx.basic.description}
							onChange={(e) =>
								send({
									type: "SET_BASIC",
									field: "description",
									value: e.target.value,
								})
							}
							placeholder="Optional description for students..."
							rows={2}
						/>
					</div>
				</div>
			)}

			{snapshot.matches("config") && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="goalMap">Goal Map *</Label>
						<SearchableSelect
							value={ctx.config.goalMapId}
							onChange={(v) =>
								send({ type: "SET_CONFIG", field: "goalMapId", value: v })
							}
							options={formOptions.goalMaps.map((gm) => ({
								id: gm.id,
								label: gm.title,
								description: gm.description,
							}))}
							placeholder="Select a goal map"
							searchPlaceholder="Search goal maps..."
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="startDate">Start Date</Label>
							<Input
								id="startDate"
								type="datetime-local"
								value={ctx.config.startDate}
								onChange={(e) =>
									send({
										type: "SET_CONFIG",
										field: "startDate",
										value: e.target.value,
									})
								}
							/>
							<p className="text-xs text-muted-foreground">
								Default: Now (when creating)
							</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="endDate">End Date (optional)</Label>
							<Input
								id="endDate"
								type="datetime-local"
								value={ctx.config.endDate}
								onChange={(e) =>
									send({
										type: "SET_CONFIG",
										field: "endDate",
										value: e.target.value,
									})
								}
							/>
							<p className="text-xs text-muted-foreground">No end date if not set</p>
						</div>
					</div>
				</div>
			)}

			{snapshot.matches("procedure") && (
				<div className="space-y-4">
					<FormSelect
						id="preTest"
						label="Pre-Test *"
						value={ctx.procedure.preTestFormId}
						onChange={(v) =>
							send({ type: "SET_PROCEDURE", field: "preTestFormId", value: v })
						}
						forms={pretestForms}
						placeholder="Select a pre-test form (required)"
						required
					/>
					{ctx.procedure.preTestFormId === "" && (
						<p className="text-xs text-warning">
							Pre-test is required by default for all assignments.
						</p>
					)}
					<FormSelect
						id="postTest"
						label="Post-Test"
						value={ctx.procedure.postTestFormId}
						onChange={(v) =>
							send({ type: "SET_PROCEDURE", field: "postTestFormId", value: v })
						}
						forms={posttestForms}
						placeholder="Select a post-test form"
					/>
					<FormSelect
						id="delayedPostTest"
						label="Delayed Post-Test"
						value={ctx.procedure.delayedPostTestFormId}
						onChange={(v) =>
							send({
								type: "SET_PROCEDURE",
								field: "delayedPostTestFormId",
								value: v,
							})
						}
						forms={delayedtestForms}
						placeholder="Select a delayed post-test form"
					/>
					<div className="space-y-2">
						<Label htmlFor="delayedPostTestDelayDays">Delayed Test Delay (days)</Label>
						<Input
							id="delayedPostTestDelayDays"
							type="number"
							value={ctx.procedure.delayedPostTestDelayDays}
							onChange={(e) =>
								send({
									type: "SET_PROCEDURE",
									field: "delayedPostTestDelayDays",
									value: Number(e.target.value),
								})
							}
						/>
					</div>
				</div>
			)}

			{snapshot.matches("assignment") && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							<UsersIcon className="size-4" />
							Assign to Cohorts
						</Label>
						<div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
							{formOptions.cohorts.length > 0 ? (
								<div className="space-y-2">
									{formOptions.cohorts.map((cohort) => (
										<label
											key={cohort.id}
											className="flex items-center gap-2 cursor-pointer"
										>
											<input
												type="checkbox"
												checked={ctx.assignment.selectedCohorts.includes(
													cohort.id,
												)}
												onChange={() =>
													send({
														type: "TOGGLE_COHORT",
														cohortId: cohort.id,
													})
												}
												className="rounded"
											/>
											<span>{cohort.name}</span>
											<span className="text-xs text-muted-foreground">
												({cohort.memberCount} members)
											</span>
										</label>
									))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									No cohorts available
								</p>
							)}
						</div>
					</div>
					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							<UserIcon className="size-4" />
							Assign to Individual Users
						</Label>
						<div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
							{formOptions.users.length > 0 ? (
								<div className="space-y-2">
									{formOptions.users.map((user) => (
										<label
											key={user.id}
											className="flex items-center gap-2 cursor-pointer"
										>
											<input
												type="checkbox"
												checked={ctx.assignment.selectedUsers.includes(
													user.id,
												)}
												onChange={() =>
													send({ type: "TOGGLE_USER", userId: user.id })
												}
												className="rounded"
											/>
											<span>{user.name}</span>
											<span className="text-xs text-muted-foreground">
												({user.email})
											</span>
										</label>
									))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									No students available
								</p>
							)}
						</div>
					</div>
					{ctx.assignment.selectedCohorts.length === 0 &&
						ctx.assignment.selectedUsers.length === 0 && (
							<p className="text-sm text-warning">
								Please select at least one cohort or user to assign this to.
							</p>
						)}
				</div>
			)}

			<div className="space-y-2 pt-4 border-t">
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>
						Step {step + 1} of {steps.length}
					</span>
					<span>{currentStepData.title}</span>
				</div>
				<Progress value={((step + 1) / steps.length) * 100} />
			</div>

			<div className="flex gap-2 w-full justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={
						snapshot.matches("basicInfo") ? onCancel : () => send({ type: "BACK" })
					}
				>
					{snapshot.matches("basicInfo") ? "Cancel" : "Previous"}
				</Button>
				{!snapshot.matches("assignment") ? (
					<Button type="button" onClick={() => send({ type: "NEXT" })}>
						Next
					</Button>
				) : (
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Creating..." : "Create Assignment"}
					</Button>
				)}
			</div>
		</form>
	);
}
