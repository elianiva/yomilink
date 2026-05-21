import { relations } from "drizzle-orm/relations";

import {
	user,
	assignmentTargets,
	cohorts,
	assignments,
	forms,
	questions,
	account,
	cohortMembers,
	session,
	whitelistEntries,
	kits,
	goalMaps,
	learnerMaps,
	diagnoses,
	feedback,
	formProgress,
	formResponses,
	topics,
	texts,
} from "./schema";

export const assignmentTargetsRelations = relations(assignmentTargets, ({ one }) => ({
	user: one(user, {
		fields: [assignmentTargets.userId],
		references: [user.id],
	}),
	cohort: one(cohorts, {
		fields: [assignmentTargets.cohortId],
		references: [cohorts.id],
	}),
	assignment: one(assignments, {
		fields: [assignmentTargets.assignmentId],
		references: [assignments.id],
	}),
}));

export const userRelations = relations(user, ({ many }) => ({
	assignmentTargets: many(assignmentTargets),
	accounts: many(account),
	cohortMembers: many(cohortMembers),
	sessions: many(session),
	whitelistEntries: many(whitelistEntries),
	formProgresses: many(formProgress),
	formResponses: many(formResponses),
}));

export const cohortsRelations = relations(cohorts, ({ many }) => ({
	assignmentTargets: many(assignmentTargets),
	cohortMembers: many(cohortMembers),
	whitelistEntries: many(whitelistEntries),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
	assignmentTargets: many(assignmentTargets),
	form_tamFormId: one(forms, {
		fields: [assignments.tamFormId],
		references: [forms.id],
		relationName: "assignments_tamFormId_forms_id",
	}),
	form_delayedPostTestFormId: one(forms, {
		fields: [assignments.delayedPostTestFormId],
		references: [forms.id],
		relationName: "assignments_delayedPostTestFormId_forms_id",
	}),
	form_postTestFormId: one(forms, {
		fields: [assignments.postTestFormId],
		references: [forms.id],
		relationName: "assignments_postTestFormId_forms_id",
	}),
	form_preTestFormId: one(forms, {
		fields: [assignments.preTestFormId],
		references: [forms.id],
		relationName: "assignments_preTestFormId_forms_id",
	}),
	kit: one(kits, {
		fields: [assignments.kitId],
		references: [kits.id],
	}),
	goalMap: one(goalMaps, {
		fields: [assignments.goalMapId],
		references: [goalMaps.id],
	}),
	learnerMaps: many(learnerMaps),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
	form: one(forms, {
		fields: [questions.formId],
		references: [forms.id],
	}),
}));

export const formsRelations = relations(forms, ({ many }) => ({
	questions: many(questions),
	assignments_tamFormId: many(assignments, {
		relationName: "assignments_tamFormId_forms_id",
	}),
	assignments_delayedPostTestFormId: many(assignments, {
		relationName: "assignments_delayedPostTestFormId_forms_id",
	}),
	assignments_postTestFormId: many(assignments, {
		relationName: "assignments_postTestFormId_forms_id",
	}),
	assignments_preTestFormId: many(assignments, {
		relationName: "assignments_preTestFormId_forms_id",
	}),
	formProgresses: many(formProgress),
	formResponses: many(formResponses),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const cohortMembersRelations = relations(cohortMembers, ({ one }) => ({
	user: one(user, {
		fields: [cohortMembers.userId],
		references: [user.id],
	}),
	cohort: one(cohorts, {
		fields: [cohortMembers.cohortId],
		references: [cohorts.id],
	}),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const whitelistEntriesRelations = relations(whitelistEntries, ({ one }) => ({
	user: one(user, {
		fields: [whitelistEntries.claimedUserId],
		references: [user.id],
	}),
	cohort: one(cohorts, {
		fields: [whitelistEntries.cohortId],
		references: [cohorts.id],
	}),
}));

export const kitsRelations = relations(kits, ({ one, many }) => ({
	assignments: many(assignments),
	learnerMaps: many(learnerMaps),
	text: one(texts, {
		fields: [kits.textId],
		references: [texts.id],
	}),
	goalMap: one(goalMaps, {
		fields: [kits.goalMapId],
		references: [goalMaps.id],
	}),
}));

export const goalMapsRelations = relations(goalMaps, ({ one, many }) => ({
	assignments: many(assignments),
	diagnoses: many(diagnoses),
	feedbacks: many(feedback),
	learnerMaps: many(learnerMaps),
	topic: one(topics, {
		fields: [goalMaps.topicId],
		references: [topics.id],
	}),
	text: one(texts, {
		fields: [goalMaps.textId],
		references: [texts.id],
	}),
	kits: many(kits),
}));

export const diagnosesRelations = relations(diagnoses, ({ one }) => ({
	learnerMap: one(learnerMaps, {
		fields: [diagnoses.learnerMapId],
		references: [learnerMaps.id],
	}),
	goalMap: one(goalMaps, {
		fields: [diagnoses.goalMapId],
		references: [goalMaps.id],
	}),
}));

export const learnerMapsRelations = relations(learnerMaps, ({ one, many }) => ({
	diagnoses: many(diagnoses),
	feedbacks: many(feedback),
	kit: one(kits, {
		fields: [learnerMaps.kitId],
		references: [kits.id],
	}),
	goalMap: one(goalMaps, {
		fields: [learnerMaps.goalMapId],
		references: [goalMaps.id],
	}),
	assignment: one(assignments, {
		fields: [learnerMaps.assignmentId],
		references: [assignments.id],
	}),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
	goalMap: one(goalMaps, {
		fields: [feedback.goalMapId],
		references: [goalMaps.id],
	}),
	learnerMap: one(learnerMaps, {
		fields: [feedback.learnerMapId],
		references: [learnerMaps.id],
	}),
}));

export const formProgressRelations = relations(formProgress, ({ one }) => ({
	user: one(user, {
		fields: [formProgress.userId],
		references: [user.id],
	}),
	form: one(forms, {
		fields: [formProgress.formId],
		references: [forms.id],
	}),
}));

export const formResponsesRelations = relations(formResponses, ({ one }) => ({
	user: one(user, {
		fields: [formResponses.userId],
		references: [user.id],
	}),
	form: one(forms, {
		fields: [formResponses.formId],
		references: [forms.id],
	}),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
	goalMaps: many(goalMaps),
}));

export const textsRelations = relations(texts, ({ many }) => ({
	goalMaps: many(goalMaps),
	kits: many(kits),
}));
