import { AnalyticsControls } from "@/features/analyzer/components/analytics-controls";
import type { VisibilityState } from "@/features/learner-map/lib/visibility";

interface ResultControlsPanelProps {
	visibility: VisibilityState;
	onChange: (updates: Partial<VisibilityState>) => void;
}

export function ResultControlsPanel({ visibility, onChange }: ResultControlsPanelProps) {
	return (
		<div className="bg-card/30 backdrop-blur-lg border rounded-lg shadow-lg">
			<AnalyticsControls
				visibility={visibility}
				onChange={onChange}
				showDisplayOptions={false}
				className="border-none"
			/>
		</div>
	);
}
