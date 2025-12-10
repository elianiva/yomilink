import { useConvexQuery } from "@convex-dev/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { BarChart3, Box, Check, Map as MapIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardHome,
});

type StudentKit = {
	goalMapId: string;
	title: string;
	description?: string;
	updatedAt: number;
	teacherId: string;
};

function JoinKitDialog({
	open,
	onClose,
	onConfirm,
	kits,
}: {
	open: boolean;
	onClose: () => void;
	onConfirm: (kitId: string) => void;
	kits: StudentKit[];
}) {
	const [selectedKitId, setSelectedKitId] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setSelectedKitId((prev) => prev ?? kits[0]?.goalMapId ?? null);
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose, kits]);

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
				className="relative z-10 w-full max-w-2xl rounded-xl border bg-background shadow-xl"
			>
				<div className="flex items-center justify-between border-b p-4">
					<h3 className="text-lg font-semibold">Select a Kit</h3>
					<Button variant="ghost" size="sm" onClick={onClose}>
						Close
					</Button>
				</div>

				<div className="p-4">
					<div className="rounded-lg border">
						<div className="border-b px-3 py-2 text-sm font-medium text-muted-foreground">
							Available Kits
						</div>
						<ul className="max-h-[360px] overflow-auto p-2">
							{(kits ?? []).map((k) => {
								const active = k.goalMapId === selectedKitId;
								return (
									<li key={k.goalMapId}>
										<button
											type="button"
											className={[
												"w-full rounded-md px-3 py-2 text-left",
												active
													? "bg-accent text-accent-foreground ring-1 ring-border"
													: "hover:bg-muted/50",
											].join(" ")}
											onClick={() => setSelectedKitId(k.goalMapId)}
										>
											<div className="flex items-start justify-between gap-3">
												<div className="space-y-1">
													<div className="font-medium">{k.title}</div>
													{typeof k.description === "string" &&
													k.description ? (
														<div className="text-xs text-muted-foreground line-clamp-2">
															{k.description}
														</div>
													) : null}
												</div>
												{active ? (
													<Check className="mt-1 size-4 shrink-0" />
												) : null}
											</div>
										</button>
									</li>
								);
							})}
							{(kits ?? []).length === 0 ? (
								<li className="px-3 py-6 text-center text-sm text-muted-foreground">
									No kits available yet.
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
	const kits = useConvexQuery(api.goalMaps.listForStudent);
	const { user: me } = useAuth();

	return (
		<div className="space-y-6">
			<div className="rounded-xl border p-4">
				<h2 className="text-lg font-semibold">Welcome!</h2>
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

				{me?.role === "teacher" || me?.role === "admin" ? (
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
				) : null}

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
				kits={kits ?? []}
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
