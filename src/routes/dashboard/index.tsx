import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, Box, Check, Map as MapIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardHome,
});

type Topic = { id: string; name: string };
type Kit = { id: string; name: string; topicId: string; tags: string[] };

const demoTopics: Topic[] = [
	{ id: "t1", name: "General" },
	{ id: "t2", name: "Biology" },
	{ id: "t3", name: "Astronomy" },
	{ id: "t4", name: "Geography" },
];

const demoKits: Kit[] = [
	{
		id: "k1",
		name: "Intro Kit",
		topicId: "t1",
		tags: ["basics", "orientation"],
	},
	{
		id: "k2",
		name: "Ecosystems",
		topicId: "t2",
		tags: ["food chain", "habitats"],
	},
	{
		id: "k3",
		name: "Stars and Planets",
		topicId: "t3",
		tags: ["planets", "constellation"],
	},
	{ id: "k4", name: "Maps 101", topicId: "t4", tags: ["cartography", "gps"] },
	{
		id: "k5",
		name: "Cell Biology",
		topicId: "t2",
		tags: ["cells", "microscope"],
	},
];

function JoinKitDialog({
	open,
	onClose,
	onConfirm,
}: {
	open: boolean;
	onClose: () => void;
	onConfirm: (kitId: string) => void;
}) {
	const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
	const [selectedKitId, setSelectedKitId] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			setSelectedTopicId((prev) => prev ?? demoTopics[0]?.id ?? null);
			setSelectedKitId(null);
			const onKey = (e: KeyboardEvent) => {
				if (e.key === "Escape") onClose();
			};
			window.addEventListener("keydown", onKey);
			return () => window.removeEventListener("keydown", onKey);
		}
	}, [open, onClose]);

	const kitsForTopic = useMemo(
		() =>
			demoKits.filter((k) =>
				!selectedTopicId ? true : k.topicId === selectedTopicId,
			),
		[selectedTopicId],
	);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<button
				type="button"
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onClose}
				aria-label="Close dialog backdrop"
			/>
			<div
				role="dialog"
				aria-modal="true"
				className="relative z-10 w-full max-w-3xl rounded-xl border bg-background shadow-xl"
			>
				<div className="flex items-center justify-between border-b p-4">
					<h3 className="text-lg font-semibold">Select Topic and Kit</h3>
					<Button variant="ghost" size="sm" onClick={onClose}>
						Close
					</Button>
				</div>

				<div className="grid gap-4 p-4 md:grid-cols-2">
					<div className="rounded-lg border">
						<div className="border-b px-3 py-2 text-sm font-medium text-muted-foreground">
							Topic
						</div>
						<ul className="max-h-[360px] overflow-auto p-2">
							{demoTopics.map((t) => {
								const active = t.id === selectedTopicId;
								return (
									<li key={t.id}>
										<button
											type="button"
											className={[
												"flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm",
												active
													? "bg-accent text-accent-foreground ring-1 ring-border"
													: "hover:bg-muted/50",
											].join(" ")}
											onClick={() => setSelectedTopicId(t.id)}
										>
											<span>{t.name}</span>
											{active ? <Check className="size-4" /> : null}
										</button>
									</li>
								);
							})}
						</ul>
					</div>

					<div className="rounded-lg border">
						<div className="border-b px-3 py-2 text-sm font-medium text-muted-foreground">
							Kit
						</div>
						<ul className="max-h-[360px] overflow-auto p-2">
							{kitsForTopic.map((k) => {
								const active = k.id === selectedKitId;
								return (
									<li key={k.id}>
										<button
											type="button"
											className={[
												"w-full rounded-md px-3 py-2 text-left",
												active
													? "bg-accent text-accent-foreground ring-1 ring-border"
													: "hover:bg-muted/50",
											].join(" ")}
											onClick={() => setSelectedKitId(k.id)}
										>
											<div className="flex items-start justify-between gap-3">
												<div className="space-y-1">
													<div className="font-medium">{k.name}</div>
													<div className="flex flex-wrap gap-1">
														{k.tags.map((tag) => (
															<span
																key={tag}
																className="inline-flex items-center rounded-full bg-amber-200/70 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-300/70"
															>
																{tag}
															</span>
														))}
													</div>
												</div>
												{active ? (
													<Check className="mt-1 size-4 shrink-0" />
												) : null}
											</div>
										</button>
									</li>
								);
							})}
							{kitsForTopic.length === 0 ? (
								<li className="px-3 py-6 text-center text-sm text-muted-foreground">
									No kits in this topic yet.
								</li>
							) : null}
						</ul>
					</div>
				</div>

				<div className="flex items-center justify-end gap-2 border-t p-4">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						onClick={() => {
							if (selectedKitId) {
								onConfirm(selectedKitId);
								onClose();
							}
						}}
						disabled={!selectedKitId}
					>
						Open
					</Button>
				</div>
			</div>
		</div>
	);
}

function DashboardHome() {
	const [isJoinOpen, setIsJoinOpen] = useState(false);
	const navigate = useNavigate();

	return (
		<div className="space-y-6">
			<div className="rounded-xl border p-4">
				<h2 className="text-lg font-semibold">Welcome to Yomilink</h2>
				<p className="text-sm text-muted-foreground">
					Choose a section to get started.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div className="rounded-lg border p-4 space-y-2">
					<div className="flex items-center gap-2">
						<Box className="size-4 text-muted-foreground" />
						<div className="font-medium">Kits</div>
					</div>
					<p className="text-sm text-muted-foreground">
						Join or manage your kits, organized by topics with tags.
					</p>
					<div className="flex gap-2">
						<Button className="mt-1" onClick={() => setIsJoinOpen(true)}>
							Join Kit
						</Button>
					</div>
				</div>

				<div className="rounded-lg border p-4 space-y-2">
					<div className="flex items-center gap-2">
						<MapIcon className="size-4 text-muted-foreground" />
						<div className="font-medium">Goal Map Editor</div>
					</div>
					<p className="text-sm text-muted-foreground">
						Create a teacher goal map and generate a student kit.
					</p>
					<div className="flex gap-2">
						<Button asChild className="mt-1">
							<Link
								to="/dashboard/goal/$goalMapId"
								params={{ goalMapId: "new" }}
								preload="intent"
							>
								New Goal Map
							</Link>
						</Button>
					</div>
				</div>

				<div className="rounded-lg border p-4 space-y-2">
					<div className="flex items-center gap-2">
						<BarChart3 className="size-4 text-muted-foreground" />
						<div className="font-medium">Analytics / Results</div>
					</div>
					<p className="text-sm text-muted-foreground">
						Explore analytics or results.
					</p>
					<div className="flex gap-2">
						<Button asChild variant="outline" className="mt-1">
							<Link to="/dashboard/analytics" preload="intent">
								Analytics
							</Link>
						</Button>
						<Button asChild variant="outline" className="mt-1">
							<Link to="/dashboard/results" preload="intent">
								Results
							</Link>
						</Button>
					</div>
				</div>
			</div>

			<JoinKitDialog
				open={isJoinOpen}
				onClose={() => setIsJoinOpen(false)}
				onConfirm={(kitId) => {
					navigate({
						to: "/dashboard/kit/$kitId",
						params: { kitId },
					});
				}}
			/>
		</div>
	);
}
