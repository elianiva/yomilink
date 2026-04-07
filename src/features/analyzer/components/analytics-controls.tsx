import { Switch } from "@/components/ui/switch";

function LegendDot({ color }: { color: string }) {
	return <span className="inline-block size-3 rounded-full" style={{ backgroundColor: color }} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide pl-0.5">
			{children}
		</div>
	);
}

interface VisibilityState {
	showGoalMap: boolean;
	showLearnerMap: boolean;
	showCorrectEdges: boolean;
	showMissingEdges: boolean;
	showExcessiveEdges: boolean;
	showNeutralEdges: boolean;
	consolidatedView: boolean;
	showNamesOnHover: boolean;
}

interface AnalyticsControlsProps {
	visibility: VisibilityState;
	onChange: (updates: Partial<VisibilityState>) => void;
	showDisplayOptions?: boolean;
}

export function AnalyticsControls({
	visibility,
	onChange,
	showDisplayOptions = true,
}: AnalyticsControlsProps) {
	return (
		<div className="border-b-[0.5px] p-3 space-y-3">
			<div className="flex items-center justify-between">
				<SectionTitle>Connector Visibility</SectionTitle>
			</div>
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2 text-xs">
					<Switch
						checked={visibility.showGoalMap}
						onCheckedChange={(v) => onChange({ showGoalMap: v })}
					/>
					<span>Goal Map</span>
				</div>
				<div className="flex items-center gap-2 text-xs">
					<Switch
						checked={visibility.showLearnerMap}
						onCheckedChange={(v) => onChange({ showLearnerMap: v })}
					/>
					<span>Learner Map</span>
				</div>
			</div>

			<div className="flex items-center justify-between">
				<SectionTitle>Edge Types</SectionTitle>
			</div>
			<div className="flex items-center gap-4 flex-wrap">
				<div className="flex items-center gap-2 text-xs">
					<Switch
						checked={visibility.showCorrectEdges}
						onCheckedChange={(v) => onChange({ showCorrectEdges: v })}
					/>
					<LegendDot color="var(--edge-correct)" />
					<span>Correct</span>
				</div>
				<div className="flex items-center gap-2 text-xs">
					<Switch
						checked={visibility.showMissingEdges}
						onCheckedChange={(v) => onChange({ showMissingEdges: v })}
					/>
					<LegendDot color="var(--edge-missing)" />
					<span>Missing</span>
				</div>
				<div className="flex items-center gap-2 text-xs">
					<Switch
						checked={visibility.showExcessiveEdges}
						onCheckedChange={(v) => onChange({ showExcessiveEdges: v })}
					/>
					<LegendDot color="var(--edge-excessive)" />
					<span>Excessive</span>
				</div>
				<div className="flex items-center gap-2 text-xs">
					<Switch
						checked={visibility.showNeutralEdges}
						onCheckedChange={(v) => onChange({ showNeutralEdges: v })}
					/>
					<LegendDot color="var(--edge-neutral)" />
					<span>Neutral</span>
				</div>
			</div>

			{showDisplayOptions && (
				<>
					<div className="flex items-center justify-between pt-2 border-t-[0.5px]">
						<SectionTitle>Display Options</SectionTitle>
					</div>
					<div className="flex items-center gap-4 flex-wrap">
						<div className="flex items-center gap-2 text-xs">
							<Switch
								checked={visibility.consolidatedView}
								onCheckedChange={(v) => onChange({ consolidatedView: v })}
							/>
							<span>Consolidated View</span>
						</div>
						<div className="flex items-center gap-2 text-xs">
							<Switch
								checked={visibility.showNamesOnHover}
								onCheckedChange={(v) => onChange({ showNamesOnHover: v })}
							/>
							<span>Show Names on Hover</span>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
