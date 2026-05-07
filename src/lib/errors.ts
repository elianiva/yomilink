import { Data } from "effect";

export class GoalMapNotFoundError extends Data.TaggedError("GoalMapNotFoundError")<{
	readonly goalMapId: string;
}> {}

export class AssignmentNotFoundError extends Data.TaggedError("AssignmentNotFoundError")<{
	readonly assignmentId: string;
}> {}
