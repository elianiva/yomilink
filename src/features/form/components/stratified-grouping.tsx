import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Download, Users, Save, CheckCircle2 } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { AssignmentRpc } from "@/server/rpc/assignment";

import type { FormResponse, ResponseQuestion } from "./individual-responses-table";

type StratifiedGroupingProps = {
	responses: FormResponse[];
	questions: ResponseQuestion[];
	formId: string;
};

type Group = {
	id: number;
	members: FormResponse[];
	condition: "summarizing" | "concept_map";
};

export function StratifiedGrouping({ responses, questions, formId }: StratifiedGroupingProps) {
	const [groups, setGroups] = useState<Group[] | null>(null);
	const [randomStudent, setRandomStudent] = useState<{
		student: FormResponse;
		condition: "summarizing" | "concept_map";
	} | null>(null);
	const queryClient = useQueryClient();

	const { data: assignmentData } = useRpcQuery(
		AssignmentRpc.getAssignmentByPreTestFormId(formId),
	);
	const assignment = assignmentData && "id" in assignmentData ? assignmentData : null;

	const { data: existingGroups } = useRpcQuery(
		AssignmentRpc.getExperimentGroupsByAssignmentId(assignment?.id ?? ""),
	);

	const saveGroupsMutation = useRpcMutation(AssignmentRpc.saveExperimentGroups(), {
		operation: "save groups",
		showSuccess: true,
	});

	const calculateScore = (response: FormResponse) => {
		let score = 0;
		for (const question of questions) {
			if (question.type === "mcq") {
				const options = question.options as {
					correctOptionIds?: string[];
				} | null;
				const correctIds = options?.correctOptionIds || [];
				const answer = response.answers[question.id];

				if (typeof answer === "string" && correctIds.includes(answer)) {
					score++;
				} else if (Array.isArray(answer)) {
					// Handle multiple choice (select all that apply)
					const isCorrect =
						answer.length === correctIds.length &&
						answer.every((id) => correctIds.includes(String(id)));
					if (isCorrect) score++;
				}
			}
		}
		return score;
	};

	const assignGroups = () => {
		if (responses.length === 0) return;

		// Make a copy to avoid mutating original
		const students = [...responses];
		const halfway = Math.floor(students.length / 2);

		let leftover: FormResponse | null = null;
		if (students.length % 2 !== 0) {
			const randomIndex = Math.floor(Math.random() * students.length);
			leftover = students.splice(randomIndex, 1)[0];
		}

		// Calculate scores and sort
		const scoredStudents = students
			.map((s) => ({ student: s, score: calculateScore(s) }))
			.sort((a, b) => a.score - b.score);
		const lowHalf = scoredStudents.slice(0, halfway);
		const highHalf = scoredStudents.slice(halfway);

		const newGroups: Group[] = [];
		for (let i = 0; i < halfway; i++) {
			newGroups.push({
				id: i + 1,
				members: [lowHalf[i].student, highHalf[highHalf.length - 1 - i].student],
				condition: i % 2 === 0 ? "concept_map" : "summarizing",
			});
		}

		let randomStudentWithCondition: {
			student: FormResponse;
			condition: "summarizing" | "concept_map";
		} | null = null;
		if (leftover) {
			randomStudentWithCondition = {
				student: leftover,
				condition: newGroups.length % 2 === 0 ? "concept_map" : "summarizing",
			};
		}
		setGroups(newGroups);
		setRandomStudent(randomStudentWithCondition);
	};

	const handleSaveGroups = async () => {
		if (!assignment || !groups) return;

		const payloadGroups = groups.flatMap((g) =>
			g.members.map((m) => ({
				userId: m.userId,
				groupName: `Group ${g.id}`,
				condition: g.condition,
			})),
		);

		if (randomStudent) {
			payloadGroups.push({
				userId: randomStudent.student.userId,
				groupName: "Random",
				condition: randomStudent.condition,
			});
		}

		await saveGroupsMutation.mutateAsync({
			assignmentId: assignment.id,
			groups: payloadGroups,
		});

		queryClient.invalidateQueries({
			queryKey: AssignmentRpc.assignments(),
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Stratified Grouping</h2>
					<p className="text-sm text-muted-foreground">
						Assign students into pairs based on their pre-test scores.
					</p>
				</div>
				<Button onClick={assignGroups} className="gap-2">
					<Users className="h-4 w-4" />
					{groups ? "Re-assign Groups" : "Assign Groups"}
				</Button>

				{groups && assignment && (
					<Button
						onClick={handleSaveGroups}
						variant="default"
						className="gap-2 bg-green-600 hover:bg-green-700"
						disabled={saveGroupsMutation.isPending}
					>
						<Save className="h-4 w-4" />
						{saveGroupsMutation.isPending ? "Saving..." : "Save to Database"}
					</Button>
				)}
			</div>

			{groups && (
				<Button
					variant="outline"
					onClick={() => {
						const exportHeaders = [
							"Group",
							"Student Name",
							"Email",
							"Score",
							"Condition",
						];
						const exportRows: string[][] = [];
						groups.forEach((g) => {
							g.members.forEach((m) => {
								exportRows.push([
									`Group ${g.id}`,
									m.user.name || "",
									m.user.email,
									calculateScore(m).toString(),
									g.condition === "concept_map" ? "Concept Map" : "Summarizing",
								]);
							});
						});
						if (randomStudent) {
							exportRows.push([
								"Random",
								randomStudent.student.user.name || "",
								randomStudent.student.user.email,
								calculateScore(randomStudent.student).toString(),
								randomStudent.condition === "concept_map"
									? "Concept Map"
									: "Summarizing",
							]);
						}
						const csvContent = [
							exportHeaders.join(","),
							...exportRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
						].join("\n");
						const blob = new Blob([csvContent], { type: "text/csv" });
						const url = URL.createObjectURL(blob);
						const link = document.createElement("a");
						link.href = url;
						link.download = "stratified_groups.csv";
						link.click();
					}}
					className="gap-2"
				>
					<Download className="h-4 w-4" />
					Export Groups CSV
				</Button>
			)}

			{existingGroups &&
				Array.isArray(existingGroups) &&
				existingGroups.length > 0 &&
				!groups && (
					<div className="flex items-center gap-2 text-sm text-green-600 mb-4">
						<CheckCircle2 className="h-4 w-4" />
						<span>
							This assignment already has saved groups. Re-assigning will overwrite
							them.
						</span>
					</div>
				)}

			{responses.length % 2 !== 0 && !groups && (
				<Alert variant="warning">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Odd student count</AlertTitle>
					<AlertDescription>
						There are {responses.length} students. One student will be placed at random
						if you proceed with grouping.
					</AlertDescription>
				</Alert>
			)}

			{groups && (
				<div className="space-y-4">
					{randomStudent && (
						<Alert variant="warning">
							<AlertTriangle className="h-4 w-4" />
							<AlertTitle>Leftover student</AlertTitle>
							<AlertDescription>
								{randomStudent.student.user.name ||
									randomStudent.student.user.email}{" "}
								was placed at random (not paired) because the student count was odd.
							</AlertDescription>
						</Alert>
					)}

					<div className="rounded-lg border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-24">Group</TableHead>
									<TableHead>Student 1</TableHead>
									<TableHead>Score 1</TableHead>
									<TableHead>Student 2</TableHead>
									<TableHead>Score 2</TableHead>
									<TableHead>Condition</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{groups.map((group) => (
									<TableRow key={group.id}>
										<TableCell className="font-medium">
											Group {group.id}
										</TableCell>
										<TableCell>
											{group.members[0].user.name ||
												group.members[0].user.email}
										</TableCell>
										<TableCell>{calculateScore(group.members[0])}</TableCell>
										<TableCell>
											{group.members[1].user.name ||
												group.members[1].user.email}
										</TableCell>
										<TableCell>{calculateScore(group.members[1])}</TableCell>
										<TableCell>
											<span
												className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
													group.condition === "concept_map"
														? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
														: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
												}`}
											>
												{group.condition === "concept_map"
													? "Concept Map"
													: "Summarizing"}
											</span>
										</TableCell>
									</TableRow>
								))}
								{randomStudent && (
									<TableRow className="bg-muted/50">
										<TableCell className="font-medium italic">Random</TableCell>
										<TableCell colSpan={3}>
											{randomStudent.student.user.name ||
												randomStudent.student.user.email}{" "}
											(Score: {calculateScore(randomStudent.student)})
										</TableCell>
										<TableCell>
											<span
												className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
													randomStudent.condition === "concept_map"
														? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
														: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
												}`}
											>
												{randomStudent.condition === "concept_map"
													? "Concept Map"
													: "Summarizing"}
											</span>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			)}
		</div>
	);
}
