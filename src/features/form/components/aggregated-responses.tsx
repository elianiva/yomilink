"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { ResponseQuestion, FormResponse } from "./individual-responses-table";

type AggregatedResponsesProps = {
	responses: FormResponse[];
	questions: ResponseQuestion[];
};

type McqStats = {
	questionId: string;
	questionText: string;
	options: Array<{
		id: string;
		text: string;
		count: number;
		percentage: number;
	}>;
};

type LikertStats = {
	questionId: string;
	questionText: string;
	scaleSize: number;
	labels: Record<string, string>;
	mean: number;
	median: number;
	distribution: Array<{ value: number; count: number }>;
};

export function AggregatedResponses({ responses, questions }: AggregatedResponsesProps) {
	const sortedQuestions = useMemo(
		() => [...questions].sort((a, b) => a.orderIndex - b.orderIndex),
		[questions],
	);

	const mcqStats = useMemo(() => {
		const stats: McqStats[] = [];

		for (const question of sortedQuestions) {
			if (question.type !== "mcq") continue;

			const options = question.options as {
				options: Array<{ id: string; text: string }>;
			} | null;
			if (!options?.options) continue;

			const counts: Record<string, number> = {};
			for (const opt of options.options) {
				counts[opt.id] = 0;
			}

			for (const response of responses) {
				const answer = response.answers?.[question.id];
				if (typeof answer === "string" && counts[answer] !== undefined) {
					counts[answer]++;
				}
			}

			stats.push({
				questionId: question.id,
				questionText: question.questionText,
				options: options.options.map((opt) => ({
					id: opt.id,
					text: opt.text,
					count: counts[opt.id] ?? 0,
					percentage:
						responses.length > 0 ? ((counts[opt.id] ?? 0) / responses.length) * 100 : 0,
				})),
			});
		}

		return stats;
	}, [sortedQuestions, responses]);

	const likertStats = useMemo(() => {
		const stats: LikertStats[] = [];

		for (const question of sortedQuestions) {
			if (question.type !== "likert") continue;

			const options = question.options as {
				scaleSize: number;
				labels: Record<string, string>;
			} | null;
			if (!options) continue;

			const values: number[] = [];
			for (const response of responses) {
				const answer = response.answers?.[question.id];
				const num = Number(answer);
				if (!Number.isNaN(num) && num >= 1 && num <= options.scaleSize) {
					values.push(num);
				}
			}

			values.sort((a, b) => a - b);
			const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
			const median =
				values.length > 0
					? values.length % 2 === 0
						? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
						: values[Math.floor(values.length / 2)]
					: 0;

			const distribution: Record<number, number> = {};
			for (let i = 1; i <= options.scaleSize; i++) {
				distribution[i] = 0;
			}
			for (const v of values) {
				distribution[v] = (distribution[v] ?? 0) + 1;
			}

			stats.push({
				questionId: question.id,
				questionText: question.questionText,
				scaleSize: options.scaleSize,
				labels: options.labels ?? {},
				mean,
				median,
				distribution: Object.entries(distribution).map(([value, count]) => ({
					value: Number(value),
					count,
				})),
			});
		}

		return stats;
	}, [sortedQuestions, responses]);

	if (responses.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
				<p>No responses yet</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Summary */}
			<div className="rounded-lg border p-4">
				<div className="text-sm text-muted-foreground">
					Total Responses: {responses.length}
				</div>
			</div>

			{/* MCQ Stats */}
			{mcqStats.length > 0 && (
				<div className="space-y-6">
					<h2 className="text-lg font-semibold">Multiple Choice Questions</h2>
					{mcqStats.map((stat) => (
						<div key={stat.questionId} className="rounded-lg border p-4">
							<h3 className="mb-4 font-medium">{stat.questionText}</h3>
							<div className="h-64">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={stat.options} layout="vertical">
										<XAxis type="number" domain={[0, 100]} />
										<YAxis
											type="category"
											dataKey="text"
											width={100}
											tick={{ fontSize: 12 }}
										/>
										<Bar dataKey="percentage" fill="#3b82f6" radius={4} />
									</BarChart>
								</ResponsiveContainer>
							</div>
							<div className="mt-4 space-y-2">
								{stat.options.map((opt) => (
									<div
										key={opt.id}
										className="flex items-center justify-between text-sm"
									>
										<span className="truncate max-w-[200px]">{opt.text}</span>
										<span className="text-muted-foreground">
											{opt.count} ({opt.percentage.toFixed(1)}%)
										</span>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			)}

			{/* Likert Stats */}
			{likertStats.length > 0 && (
				<div className="space-y-6">
					<h2 className="text-lg font-semibold">Likert Scale Questions</h2>
					{likertStats.map((stat) => (
						<div key={stat.questionId} className="rounded-lg border p-4">
							<h3 className="mb-4 font-medium">{stat.questionText}</h3>
							<div className="h-48">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={stat.distribution}>
										<XAxis
											dataKey="value"
											tick={{ fontSize: 12 }}
											tickFormatter={(v) =>
												stat.labels[String(v)] ?? String(v)
											}
										/>
										<YAxis />
										<Bar dataKey="count" fill="#8b5cf6" radius={4} />
									</BarChart>
								</ResponsiveContainer>
							</div>
							<div className="mt-4 flex gap-6 text-sm">
								<div>
									<span className="text-muted-foreground">Mean: </span>
									<span className="font-medium">{stat.mean.toFixed(2)}</span>
								</div>
								<div>
									<span className="text-muted-foreground">Median: </span>
									<span className="font-medium">{stat.median.toFixed(1)}</span>
								</div>
								<div>
									<span className="text-muted-foreground">Responses: </span>
									<span className="font-medium">
										{stat.distribution.reduce((a, b) => a + b.count, 0)}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{mcqStats.length === 0 && likertStats.length === 0 && (
				<div className="text-center text-muted-foreground py-8">
					No questions with responses to display
				</div>
			)}
		</div>
	);
}
