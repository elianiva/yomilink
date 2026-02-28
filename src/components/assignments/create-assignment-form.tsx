import { UserIcon, UsersIcon } from "lucide-react";
import { useReducer } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { parseDateInput } from "@/lib/date-utils";
import type { Form } from "@/server/db/schema";
import { AssignmentRpc } from "@/server/rpc/assignment";
import { FormRpc } from "@/server/rpc/form";
import { KitRpc } from "@/server/rpc/kit";

type FormState = {
	currentStep: number;
	basic: { title: string; description: string };
	config: { goalMapId: string; startDate: string; endDate: string };
	procedure: {
		preTestFormId: string;
		postTestFormId: string;
		delayedPostTestFormId: string;
		delayedPostTestDelayDays: number;
		tamFormId: string;
	};
	assignment: { selectedCohorts: string[]; selectedUsers: string[] };
};

type FormAction =
	| { type: "SET_STEP"; step: number }
	| { type: "SET_BASIC"; field: keyof FormState["basic"]; value: string }
	| { type: "SET_CONFIG"; field: keyof FormState["config"]; value: string }
	| {
			type: "SET_PROCEDURE";
			field: keyof FormState["procedure"];
			value: string | number;
	  }
	| { type: "TOGGLE_COHORT"; cohortId: string }
	| { type: "TOGGLE_USER"; userId: string }
	| { type: "RESET" };

const initialState: FormState = {
	currentStep: 0,
	basic: { title: "", description: "" },
	config: { goalMapId: "", startDate: "", endDate: "" },
	procedure: {
		preTestFormId: "",
		postTestFormId: "",
		delayedPostTestFormId: "",
		delayedPostTestDelayDays: 7,
		tamFormId: "",
	},
	assignment: { selectedCohorts: [], selectedUsers: [] },
};

function formReducer(state: FormState, action: FormAction): FormState {
	switch (action.type) {
		case "SET_STEP":
			return { ...state, currentStep: action.step };
		case "SET_BASIC":
			return {
				...state,
				basic: { ...state.basic, [action.field]: action.value },
			};
		case "SET_CONFIG":
			return {
				...state,
				config: { ...state.config, [action.field]: action.value },
			};
		case "SET_PROCEDURE":
			return {
				...state,
				procedure: { ...state.procedure, [action.field]: action.value },
			};
		case "TOGGLE_COHORT": {
			const cohorts = state.assignment.selectedCohorts.includes(action.cohortId)
				? state.assignment.selectedCohorts.filter(
						(id) => id !== action.cohortId,
					)
				: [...state.assignment.selectedCohorts, action.cohortId];
			return {
				...state,
				assignment: { ...state.assignment, selectedCohorts: cohorts },
			};
		}
		case "TOGGLE_USER": {
			const users = state.assignment.selectedUsers.includes(action.userId)
				? state.assignment.selectedUsers.filter((id) => id !== action.userId)
				: [...state.assignment.selectedUsers, action.userId];
			return {
				...state,
				assignment: { ...state.assignment, selectedUsers: users },
			};
		}
		case "RESET":
			return initialState;
		default:
			return state;
	}
}

interface CreateAssignmentFormProps {
	onSuccess: () => void;
	onCancel: () => void;
}

const steps = [
	{
		title: "Basic Information",
		description:
			"Enter assignment title, description, and optional reading material",
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

export function CreateAssignmentForm({
	onSuccess,
	onCancel,
}: CreateAssignmentFormProps) {
	const [state, dispatch] = useReducer(formReducer, initialState);

	const { data: goalMaps } = useRpcQuery(AssignmentRpc.getTeacherGoalMaps());
	const { data: cohorts } = useRpcQuery(AssignmentRpc.getAvailableCohorts());
	const { data: users } = useRpcQuery(AssignmentRpc.getAvailableUsers());
	const { data: forms } = useRpcQuery(FormRpc.listForms());

	const generateKitMutation = useRpcMutation(KitRpc.generateKit(), {
		operation: "generate kit for goal map",
	});
	const createMutation = useRpcMutation(AssignmentRpc.createAssignment(), {
		operation: "create assignment",
		showSuccess: true,
		successMessage: "Assignment created successfully",
	});

	const canProceedNext = () => {
		switch (state.currentStep) {
			case 0:
				return state.basic.title.trim().length > 0;
			case 1:
				return state.config.goalMapId.length > 0;
			case 2:
				return true;
			case 3:
				return (
					state.assignment.selectedCohorts.length > 0 ||
					state.assignment.selectedUsers.length > 0
				);
			default:
				return false;
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!state.basic.title.trim() || !state.config.goalMapId) {
			return;
		}

		generateKitMutation.mutate(
			{ goalMapId: state.config.goalMapId, layout: "random" },
			{
				onSuccess: () => {
					createMutation.mutate(
						{
							title: state.basic.title.trim(),
							description: state.basic.description.trim() || undefined,
							goalMapId: state.config.goalMapId,
							startDate: parseDateInput(state.config.startDate) ?? Date.now(),
							endDate: parseDateInput(state.config.endDate),
							userIds: state.assignment.selectedUsers,
							preTestFormId: state.procedure.preTestFormId || undefined,
							postTestFormId: state.procedure.postTestFormId || undefined,
							delayedPostTestFormId:
								state.procedure.delayedPostTestFormId || undefined,
							delayedPostTestDelayDays:
								state.procedure.delayedPostTestDelayDays,
							tamFormId: state.procedure.tamFormId || undefined,
						},
						{ onSuccess },
					);
				},
			},
		);
	};

	const isSubmitting =
		createMutation.isPending || generateKitMutation.isPending;
	const currentStepData = steps[state.currentStep];

	const formOptions = {
		goalMaps: goalMaps ?? [],
		cohorts: cohorts ?? [],
		users: (users ?? []).filter((u) => u.role === "student"),
		forms: forms ?? [],
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{state.currentStep === 0 && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">Title *</Label>
						<Input
							id="title"
							value={state.basic.title}
							onChange={(e) =>
								dispatch({
									type: "SET_BASIC",
									field: "title",
									value: e.target.value,
								})
							}
							placeholder="e.g., Photosynthesis Concept Map"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							value={state.basic.description}
							onChange={(e) =>
								dispatch({
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

			{state.currentStep === 1 && (
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="goalMap">Goal Map *</Label>
						<SearchableSelect
							value={state.config.goalMapId}
							onChange={(v) =>
								dispatch({ type: "SET_CONFIG", field: "goalMapId", value: v })
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
								value={state.config.startDate}
								onChange={(e) =>
									dispatch({
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
								value={state.config.endDate}
								onChange={(e) =>
									dispatch({
										type: "SET_CONFIG",
										field: "endDate",
										value: e.target.value,
									})
								}
							/>
							<p className="text-xs text-muted-foreground">
								No end date if not set
							</p>
						</div>
					</div>
				</div>
			)}

			{state.currentStep === 2 && (
				<div className="space-y-4">
					<FormSelect
						id="preTest"
						label="Pre-Test"
						value={state.procedure.preTestFormId}
						onChange={(v) =>
							dispatch({
								type: "SET_PROCEDURE",
								field: "preTestFormId",
								value: v,
							})
						}
						forms={formOptions.forms.filter((f) => f.type === "pre_test")}
						placeholder="Select a pre-test form"
					/>
					<FormSelect
						id="postTest"
						label="Post-Test"
						value={state.procedure.postTestFormId}
						onChange={(v) =>
							dispatch({
								type: "SET_PROCEDURE",
								field: "postTestFormId",
								value: v,
							})
						}
						forms={formOptions.forms.filter((f) => f.type === "post_test")}
						placeholder="Select a post-test form"
					/>
					<FormSelect
						id="delayedPostTest"
						label="Delayed Post-Test"
						value={state.procedure.delayedPostTestFormId}
						onChange={(v) =>
							dispatch({
								type: "SET_PROCEDURE",
								field: "delayedPostTestFormId",
								value: v,
							})
						}
						forms={formOptions.forms.filter(
							(f) => f.type === "delayed_test" || f.type === "post_test",
						)}
						placeholder="Select a delayed post-test form"
					/>
					<div className="space-y-2">
						<Label htmlFor="delayedPostTestDelayDays">
							Delayed Test Delay (days)
						</Label>
						<Input
							id="delayedPostTestDelayDays"
							type="number"
							value={state.procedure.delayedPostTestDelayDays}
							onChange={(e) =>
								dispatch({
									type: "SET_PROCEDURE",
									field: "delayedPostTestDelayDays",
									value: Number(e.target.value),
								})
							}
						/>
					</div>
					<FormSelect
						id="tamSurvey"
						label="TAM Survey"
						value={state.procedure.tamFormId}
						onChange={(v) =>
							dispatch({ type: "SET_PROCEDURE", field: "tamFormId", value: v })
						}
						forms={formOptions.forms.filter((f) => f.type === "tam")}
						placeholder="Select a TAM survey form"
					/>
				</div>
			)}

			{state.currentStep === 3 && (
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
												checked={state.assignment.selectedCohorts.includes(
													cohort.id,
												)}
												onChange={() =>
													dispatch({
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
												checked={state.assignment.selectedUsers.includes(
													user.id,
												)}
												onChange={() =>
													dispatch({ type: "TOGGLE_USER", userId: user.id })
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
					{state.assignment.selectedCohorts.length === 0 &&
						state.assignment.selectedUsers.length === 0 && (
							<p className="text-sm text-amber-600">
								Please select at least one cohort or user to assign this to.
							</p>
						)}
				</div>
			)}

			<div className="space-y-2 pt-4 border-t">
				<div className="flex items-center justify-between text-xs text-muted-foreground">
					<span>
						Step {state.currentStep + 1} of {steps.length}
					</span>
					<span>{currentStepData.title}</span>
				</div>
				<Progress value={((state.currentStep + 1) / steps.length) * 100} />
			</div>

			<div className="flex gap-2 w-full justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={
						state.currentStep === 0
							? onCancel
							: () =>
									dispatch({ type: "SET_STEP", step: state.currentStep - 1 })
					}
				>
					{state.currentStep === 0 ? "Cancel" : "Previous"}
				</Button>
				{state.currentStep < steps.length - 1 ? (
					<Button
						type="button"
						onClick={() =>
							dispatch({ type: "SET_STEP", step: state.currentStep + 1 })
						}
						disabled={!canProceedNext()}
					>
						Next
					</Button>
				) : (
					<Button type="submit" disabled={isSubmitting || !canProceedNext()}>
						{generateKitMutation.isPending
							? "Generating Kit..."
							: createMutation.isPending
								? "Creating..."
								: "Create Assignment"}
					</Button>
				)}
			</div>
		</form>
	);
}

function FormSelect({
	id,
	label,
	value,
	onChange,
	forms,
	placeholder,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	forms: Form[];
	placeholder: string;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>{label}</Label>
			<SearchableSelect
				value={value}
				onChange={onChange}
				options={forms.map((f) => ({
					id: f.id,
					label: f.title,
					description: f.description ?? undefined,
				}))}
				placeholder={placeholder}
				searchPlaceholder={`Search ${label.toLowerCase()}s...`}
			/>
		</div>
	);
}
