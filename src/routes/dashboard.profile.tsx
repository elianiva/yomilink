import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FieldInfo } from "@/components/ui/field-info";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JlptLevel, ProfileSchema } from "@/features/profile/lib/profile-service";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { authClient } from "@/lib/auth-client";
import { getMe, ProfileRpc } from "@/server/rpc/profile";

export const Route = createFileRoute("/dashboard/profile")({
	component: ProfilePage,
	loader: async ({ context }) => {
		const me = await getMe();
		if (!me.success) {
			// TODO: handle error
			return null;
		}
		context.queryClient.setQueryData(ProfileRpc.me(), me.data);
	},
});

function ProfilePage() {
	const { data: me } = useRpcQuery(ProfileRpc.getMe());
	const { mutate: updateProfile } = useRpcMutation(ProfileRpc.updateProfile());

	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			name: me?.name ?? "",
			age: me?.age ?? null,
			jlptLevel: me?.jlptLevel ?? "None",
			japaneseLearningDuration: me?.japaneseLearningDuration ?? null,
			previousJapaneseScore: me?.previousJapaneseScore ?? null,
			mediaConsumption: me?.mediaConsumption ?? null,
			motivation: me?.motivation ?? null,
		},
		validators: {
			onChange: Schema.standardSchemaV1(ProfileSchema),
			onSubmit: Schema.standardSchemaV1(ProfileSchema),
		},
		onSubmit: ({ value }) => updateProfile(value),
	});

	const handleSignOut = async () => {
		await authClient.signOut();
		navigate({ to: "/login" });
	};

	if (me === null || me === undefined) {
		return (
			<div className="flex flex-1 items-center justify-center p-6">
				<div className="rounded-2xl border border-border/60 bg-white px-8 py-6 shadow-sm">
					<p className="text-sm text-muted-foreground">No profile found.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<div className="w-full max-w-md rounded-2xl border border-border/60 bg-white shadow-sm">
				<div className="p-8 space-y-6">
					<div className="flex items-center gap-4">
						<Avatar className="h-14 w-14 rounded-xl ring-4 ring-primary/10">
							<AvatarImage src={me.image ?? ""} alt={me.name ?? me.email ?? "User"} />
							<AvatarFallback className="rounded-xl bg-primary/90 text-primary-foreground text-lg font-bold">
								{((me.name ?? me.email ?? "U")[0] ?? "U").toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<h1 className="text-xl font-semibold truncate">{me.name ?? "User"}</h1>
							<p className="text-sm text-muted-foreground truncate">
								{me.email ?? ""}
							</p>
						</div>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-5"
					>
						<form.Field name="name">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										placeholder="Your name"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										autoComplete="name"
									/>
									<FieldInfo field={field} />
								</div>
							)}
						</form.Field>

						<div className="grid grid-cols-2 gap-4">
							<form.Field name="age">
								{(field) => (
									<div className="space-y-1.5">
										<Label htmlFor="age">Age</Label>
										<Input
											id="age"
											type="number"
											value={field.state.value ?? ""}
											onChange={(e) =>
												field.handleChange(
													e.target.value ? Number(e.target.value) : null,
												)
											}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="jlptLevel">
								{(field) => (
									<div className="space-y-1.5">
										<Label htmlFor="jlptLevel">JLPT Level</Label>
										<select
											id="jlptLevel"
											className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
											value={field.state.value ?? "None"}
											onChange={(e) =>
												field.handleChange(e.target.value as JlptLevel)
											}
										>
											<option value="None">None</option>
											<option value="N5">N5</option>
											<option value="N4">N4</option>
											<option value="N3">N3</option>
											<option value="N2">N2</option>
											<option value="N1">N1</option>
										</select>
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="japaneseLearningDuration">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="duration">Learning Duration (months)</Label>
									<Input
										id="duration"
										type="number"
										value={field.state.value ?? ""}
										onChange={(e) =>
											field.handleChange(
												e.target.value ? Number(e.target.value) : null,
											)
										}
									/>
								</div>
							)}
						</form.Field>

						<form.Field name="previousJapaneseScore">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="prevScore">
										Previous Japanese Score (0-100)
									</Label>
									<Input
										id="prevScore"
										type="number"
										step="0.1"
										value={field.state.value ?? ""}
										onChange={(e) =>
											field.handleChange(
												e.target.value ? Number(e.target.value) : null,
											)
										}
									/>
								</div>
							)}
						</form.Field>

						<form.Field name="mediaConsumption">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="media">Media Consumption (hours/week)</Label>
									<Input
										id="media"
										type="number"
										step="0.1"
										value={field.state.value ?? ""}
										onChange={(e) =>
											field.handleChange(
												e.target.value ? Number(e.target.value) : null,
											)
										}
									/>
								</div>
							)}
						</form.Field>

						<form.Field name="motivation">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor="motivation">Learning Motivation</Label>
									<Textarea
										id="motivation"
										value={field.state.value ?? ""}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="What motivates you to learn Japanese?"
										rows={3}
									/>
								</div>
							)}
						</form.Field>

						<div className="space-y-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								value={me.email ?? ""}
								disabled
								className="bg-muted/50"
							/>
							<p className="text-xs text-muted-foreground">Email cannot be changed</p>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="role">Role</Label>
							<Input
								id="role"
								value={me.role}
								disabled
								className="bg-muted/50 capitalize"
							/>
						</div>

						<div className="flex gap-2 pt-2">
							<Button asChild variant="outline" className="flex-1">
								<Link to="/dashboard" preload="intent">
									Back
								</Link>
							</Button>
							<form.Subscribe
								selector={(s) => [s.canSubmit, s.isSubmitting] as const}
							>
								{([canSubmit, isSubmitting]) => (
									<Button
										type="submit"
										disabled={!canSubmit || isSubmitting}
										className="flex-1"
									>
										{isSubmitting ? "Saving..." : "Save changes"}
									</Button>
								)}
							</form.Subscribe>
						</div>
					</form>

					<div className="border-t pt-4">
						<Button variant="destructive" className="w-full" onClick={handleSignOut}>
							Sign out
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
