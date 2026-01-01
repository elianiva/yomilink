import { SelectItem } from "@/components/ui/select";
import { EmptyState } from "./empty-state";

export function AssignmentSelectContent({
	assignments,
	isLoading,
}: {
	assignments:
		| Array<{ id: string; title: string; totalSubmissions: number }>
		| undefined;
	isLoading: boolean;
}) {
	if (isLoading) {
		return <EmptyState>Loading...</EmptyState>;
	}

	if (!assignments || assignments.length === 0) {
		return <EmptyState>No assignments</EmptyState>;
	}

	return (
		<>
			{assignments.map((assignment) => (
				<SelectItem key={assignment.id} value={assignment.id}>
					{assignment.title} ({assignment.totalSubmissions} submissions)
				</SelectItem>
			))}
		</>
	);
}
