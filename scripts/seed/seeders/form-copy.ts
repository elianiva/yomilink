import { eq } from "drizzle-orm";
import { Effect } from "effect";

import type { FormAudience, FormType } from "@/features/form/lib/form-service";
import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { forms, questions } from "@/server/db/schema/app-schema";

type CopyFormOptions = {
	sourceFormId: string;
	title: string;
	description: string;
	type: Exclude<FormType, "registration">;
	audience: FormAudience;
	teacherId: string;
};

export function copyFormWithQuestions({
	sourceFormId,
	title,
	description,
	type,
	audience,
	teacherId,
}: CopyFormOptions) {
	return Effect.gen(function* () {
		const db = yield* Database;

		const existingForm = yield* db.select().from(forms).where(eq(forms.title, title)).limit(1);

		let targetFormId: string;
		if (existingForm[0]) {
			targetFormId = existingForm[0].id;
			yield* db
				.update(forms)
				.set({
					description,
					type,
					audience,
					status: "published",
					createdBy: teacherId,
				})
				.where(eq(forms.id, targetFormId));
		} else {
			targetFormId = randomString();
			yield* db.insert(forms).values({
				id: targetFormId,
				title,
				description,
				type,
				audience,
				status: "published",
				createdBy: teacherId,
			});
		}

		const sourceQuestions = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, sourceFormId))
			.orderBy(questions.orderIndex);

		const existingQuestions = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, targetFormId))
			.orderBy(questions.orderIndex);

		for (const [index, question] of sourceQuestions.entries()) {
			const existingQuestion = existingQuestions[index];
			if (existingQuestion) {
				yield* db
					.update(questions)
					.set({
						type: question.type,
						questionText: question.questionText,
						options: question.options,
						orderIndex: index,
						required: question.required,
					})
					.where(eq(questions.id, existingQuestion.id));
				continue;
			}

			yield* db.insert(questions).values({
				id: randomString(),
				formId: targetFormId,
				type: question.type,
				questionText: question.questionText,
				options: question.options,
				orderIndex: index,
				required: question.required,
			});
		}

		if (existingQuestions.length > sourceQuestions.length) {
			for (const question of existingQuestions.slice(sourceQuestions.length)) {
				yield* db.delete(questions).where(eq(questions.id, question.id));
			}
		}

		return { formId: targetFormId };
	});
}
