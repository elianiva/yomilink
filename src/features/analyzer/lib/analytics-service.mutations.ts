import { Effect, Schema } from "effect";
import Papa from "papaparse";

import {
	ExportAnalyticsDataInput,
	ExportResultSchema,
} from "./analytics-service.shared";

export const exportAnalyticsData = Effect.fn("exportAnalyticsData")(function* (
	input: ExportAnalyticsDataInput,
) {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "").substring(0, 15);

	if (input.format === "csv") {
		const csvData = [
			[
				"UserID",
				"UserName",
				"LearnerMapID",
				"Status",
				"Attempt",
				"Score",
				"Correct",
				"Missing",
				"Excessive",
				"TotalGoalEdges",
				"SubmittedAt",
				"AssignmentTitle",
			],
		];

		for (const learner of input.analytics.learners) {
			csvData.push([
				learner.userId,
				learner.userName,
				learner.learnerMapId,
				learner.status,
				learner.attempt.toString(),
				learner.score?.toString() ?? "0",
				learner.correct.toString(),
				learner.missing.toString(),
				learner.excessive.toString(),
				learner.totalGoalEdges.toString(),
				learner.submittedAt ? new Date(learner.submittedAt).toISOString() : "",
				input.analytics.assignment.title,
			]);
		}

		const csv = Papa.unparse(csvData, { header: false });

		return yield* Schema.encode(ExportResultSchema)({
			filename: `KB-Analytics-${timestamp}.csv`,
			data: csv,
			contentType: "text/csv",
		});
	}

	const jsonData = {
		assignment: input.analytics.assignment,
		goalMap: input.analytics.goalMap,
		learners: input.analytics.learners,
		summary: input.analytics.summary,
		exportedAt: new Date().toISOString(),
	};

	return yield* Schema.encode(ExportResultSchema)({
		filename: `KB-Analytics-${timestamp}.json`,
		// @effect-diagnostics-next-line preferSchemaOverJson:off
		data: JSON.stringify(jsonData, null, 2),
		contentType: "application/json",
	});
});
