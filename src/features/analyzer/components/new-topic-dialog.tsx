import { useForm } from "@tanstack/react-form";
import { Schema } from "effect";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRpcMutation } from "@/hooks/use-rpc-query";
import { TopicRpc } from "@/server/rpc/topic";

const TopicSchema = Schema.Struct({
	title: Schema.String.pipe(Schema.minLength(4)),
	description: Schema.String.pipe(Schema.minLength(4)),
});

export function NewTopicDialog() {
	const [isOpen, setIsOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { mutate: createTopic, isPending } = useRpcMutation(TopicRpc.createTopic(), {
		operation: "create topic",
	});

	const form = useForm({
		defaultValues: {
			title: "",
			description: "",
		},
		validators: {
			onSubmit: Schema.standardSchemaV1(TopicSchema),
		},
		onSubmit: async ({ value }) => {
			setError(null);
			createTopic(
				{
					title: value.title,
					description: value.description,
				},
				{
					onSuccess: () => {
						setIsOpen(false);
						form.reset();
					},
				},
			);
		},
	});

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button size="sm">
					<Plus className="size-4" />
					New Topic
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<DialogHeader>
						<DialogTitle>Create New Topic</DialogTitle>
						<DialogDescription>
							Make sure the topic name is easily recognizable and descriptive.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<form.Field name="title">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor="topic-title">Title</Label>
									<Input
										id="topic-title"
										placeholder="Topic title"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]?.message}
										</p>
									)}
								</div>
							)}
						</form.Field>
						<form.Field name="description">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor="topic-description">Description</Label>
									<Input
										id="topic-description"
										placeholder="Topic description"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]?.message}
										</p>
									)}
								</div>
							)}
						</form.Field>
						{error && <p className="text-sm text-destructive">{error}</p>}
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="outline" disabled={isPending}>
								Cancel
							</Button>
						</DialogClose>
						<Button type="submit" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating...
								</>
							) : (
								"Create"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
