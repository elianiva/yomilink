import { createFileRoute } from "@tanstack/react-router";
import {
	ChevronDown,
	ChevronRight,
	ImageDown,
	Redo2,
	Trash2,
	Undo2,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/dashboard/results")({
	component: DynamicAnalyzerPage,
});

type Session = {
	id: string;
	name: string;
	duration: string;
	kit: string;
	flags?: ("F" | "L")[];
};

const demoSessions: Session[] = [
	{ id: "s1", name: "Student-1", duration: "01:06", kit: "K:1", flags: ["F"] },
	{ id: "s2", name: "Student-1", duration: "00:12", kit: "K:1" },
	{ id: "s3", name: "budi", duration: "00:37", kit: "K:1", flags: ["F", "L"] },
	{ id: "s4", name: "Watanabe", duration: "01:24", kit: "K:1" },
	{ id: "s5", name: "test", duration: "00:12", kit: "K:1", flags: ["F", "L"] },
	{ id: "s6", name: "Alexey 2", duration: "00:44", kit: "K:1" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<div className="text-xs font-medium text-muted-foreground uppercase tracking-wide pl-0.5">
			{children}
		</div>
	);
}

function Chip({
	children,
	color = "default",
}: {
	children: React.ReactNode;
	color?: "default" | "green" | "blue";
}) {
	const cls =
		color === "green"
			? "bg-emerald-100 text-emerald-900 ring-emerald-300/80"
			: color === "blue"
				? "bg-sky-100 text-sky-900 ring-sky-300/80"
				: "bg-muted text-foreground/80 ring-border";
	return (
		<span
			className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium ring-1 ${cls}`}
		>
			{children}
		</span>
	);
}

function formatSeconds(total: number) {
	const m = Math.floor(total / 60)
		.toString()
		.padStart(2, "0");
	const s = Math.floor(total % 60)
		.toString()
		.padStart(2, "0");
	return `${m}:${s}`;
}

function FlowNode({ label, muted }: { label: string; muted?: boolean }) {
	return (
		<div className="mx-auto">
			<div
				className={[
					"inline-block rounded-lg px-3 py-1.5 text-sm shadow-xs ring-1",
					muted
						? "bg-muted text-foreground/80 ring-border"
						: "bg-amber-200/80 text-amber-900 ring-amber-300/70",
				].join(" ")}
			>
				{label}
			</div>
		</div>
	);
}

function Arrow() {
	return (
		<div className="mx-auto h-12 w-px border-l-2 border-dashed border-rose-500" />
	);
}

function DynamicAnalyzerPage() {
	// Group Analysis state
	const [minVal, setMinVal] = useState(1);
	const [maxVal, setMaxVal] = useState(1);
	const firstId = useId();
	const lastId = useId();

	// Sessions
	const sessions = demoSessions;

	// Timeline
	const [timeSec, setTimeSec] = useState(2);

	const nodes = useMemo(
		() => [
			"High Insulin level",
			"Type II",
			"Diabetes",
			"Type I",
			"Insulin Dependent",
		],
		[],
	);

	return (
		<div className="h-full grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
			{/* Left rail */}
			<aside className="rounded-lg border bg-card">
				<div className="border-b p-3 flex items-center justify-between">
					<h2 className="text-sm font-semibold">Dynamic Analyzer</h2>
					<div className="text-[10px] text-muted-foreground">Teacher View</div>
				</div>

				<div className="p-3 space-y-4">
					{/* Group Analysis */}
					<div className="space-y-2">
						<SectionTitle>Group Analysis</SectionTitle>
						<div className="space-y-3 rounded-md border p-3">
							<div className="flex items-center gap-2">
								<div className="w-10 text-xs text-muted-foreground">Min</div>
								<div className="flex-1">
									<Slider
										value={[minVal]}
										min={1}
										max={10}
										onValueChange={(v) => setMinVal((v as number[])[0] ?? 1)}
									/>
								</div>
								<div className="w-10 text-xs tabular-nums text-muted-foreground">
									{minVal}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-10 text-xs text-muted-foreground">Max</div>
								<div className="flex-1">
									<Slider
										value={[maxVal]}
										min={1}
										max={10}
										onValueChange={(v) => setMaxVal((v as number[])[0] ?? 1)}
									/>
								</div>
								<div className="w-10 text-xs tabular-nums text-muted-foreground">
									{maxVal}
								</div>
							</div>
						</div>
					</div>

					<Separator />

					{/* Learnermap */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<SectionTitle>Learnermap</SectionTitle>
							<Button size="sm" variant="outline" className="h-7">
								Reload
							</Button>
						</div>

						<div className="flex items-center gap-3">
							<div className="text-xs text-muted-foreground">Session</div>
							<div className="flex items-center gap-2 text-xs">
								<Switch aria-labelledby={firstId} />
								<span id={firstId}>First</span>
							</div>
							<div className="flex items-center gap-2 text-xs">
								<Switch aria-labelledby={lastId} />
								<span id={lastId}>Last</span>
							</div>
							<Button size="sm" variant="outline" className="ml-auto h-7">
								Clear
							</Button>
						</div>

						<div className="mt-2 rounded-md border">
							<div className="flex items-center justify-between text-xs text-muted-foreground px-3 py-2 border-b">
								<div>Name</div>
								<div>Duration</div>
							</div>
							<div className="max-h-64 overflow-auto">
								{sessions.map((s) => (
									<div
										key={s.id}
										className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
									>
										<div className="flex items-center gap-2 text-sm">
											<Chip>{s.kit}</Chip>
											<div>{s.name}</div>
											{s.flags?.includes("F") ? (
												<Chip color="blue">F</Chip>
											) : null}
											{s.flags?.includes("L") ? (
												<Chip color="green">L</Chip>
											) : null}
										</div>
										<div className="text-xs font-semibold tabular-nums">
											{s.duration}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</aside>

			{/* Right main area */}
			<section className="rounded-lg border overflow-hidden flex flex-col">
				{/* Top toolbar */}
				<div className="border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
					<div className="h-12 px-3 flex items-center gap-2">
						<div className="font-semibold">Dynamic Analyzer</div>
						<div className="ml-auto flex items-center gap-1.5">
							<Button
								variant="outline"
								size="sm"
								className="h-8 w-8 p-0"
								title="Undo"
							>
								<Undo2 className="size-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-8 w-8 p-0"
								title="Redo"
							>
								<Redo2 className="size-4" />
							</Button>

							<Separator className="h-6" orientation="vertical" />

							<Button
								variant="outline"
								size="sm"
								className="h-8 w-8 p-0"
								title="Zoom Out"
							>
								<ZoomOut className="size-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-8 w-8 p-0"
								title="Zoom In"
							>
								<ZoomIn className="size-4" />
							</Button>

							<Separator className="h-6" orientation="vertical" />

							<Button variant="outline" size="sm" className="h-8 gap-1">
								Map <ChevronDown className="size-4" />
							</Button>

							<Button variant="outline" size="sm" className="h-8 gap-1">
								Export <ImageDown className="size-4" />
							</Button>
							<Button variant="outline" size="sm" className="h-8 gap-1">
								Clear <Trash2 className="size-4" />
							</Button>
						</div>
					</div>
				</div>

				{/* Canvas */}
				<div className="flex-1 overflow-auto">
					<div className="p-4">
						<div className="mx-auto w-full max-w-[560px]">
							{nodes.map((n, i) => (
								<div key={n}>
									<FlowNode label={n} muted={n.startsWith("Type")} />
									{i < nodes.length - 1 ? <Arrow /> : null}
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Bottom controls */}
				<div className="border-t bg-background px-3 py-2 flex items-center gap-2">
					<div className="flex items-center gap-2">
						<Button size="sm" variant="outline" className="h-8 gap-1">
							Group Analysis <ChevronRight className="size-4" />
						</Button>
						<Button size="sm" variant="outline" className="h-8 gap-1">
							Flow Analysis <ChevronRight className="size-4" />
						</Button>
					</div>

					<Button
						size="sm"
						className="h-8 ml-2 bg-emerald-600 hover:bg-emerald-700"
					>
						Comparison Analysis
					</Button>

					<div className="ml-auto flex items-center gap-3 w-[420px] max-w-full">
						<div className="text-xs text-muted-foreground">Start</div>
						<div className="flex-1">
							<Slider
								min={0}
								max={120}
								value={[timeSec]}
								onValueChange={(v) => setTimeSec((v as number[])[0] ?? 0)}
							/>
						</div>
						<div className="text-xs tabular-nums w-[42px] text-right">
							{formatSeconds(timeSec)}
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
