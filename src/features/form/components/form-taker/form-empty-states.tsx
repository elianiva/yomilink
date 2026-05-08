import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FormEmptyProps {
	backTo: string;
}

export function FormNoFormSpecified({ backTo }: FormEmptyProps) {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<p className="text-muted-foreground">No form specified</p>
			<Button variant="link" className="mt-2" asChild>
				<Link to={backTo}>Go back to forms</Link>
			</Button>
		</div>
	);
}

interface FormErrorProps {
	message?: string;
	backTo: string;
}

export function FormLoadingError({ message = "Failed to load form", backTo }: FormErrorProps) {
	return (
		<div className="flex flex-col items-center justify-center py-12">
			<p className="text-destructive">{message}</p>
			<Button variant="link" className="mt-2" asChild>
				<Link to={backTo}>Go back to forms</Link>
			</Button>
		</div>
	);
}

export function FormNoQuestions({ title, description }: { title: string; description?: string }) {
	return (
		<Card className="overflow-hidden flex-1">
			<CardHeader className="space-y-4 bg-muted/30">
				<CardTitle className="text-2xl font-semibold">{title}</CardTitle>
				{description && <p className="text-muted-foreground">{description}</p>}
			</CardHeader>
			<CardContent className="py-12 text-center">
				<p className="text-muted-foreground">This form has no questions.</p>
			</CardContent>
		</Card>
	);
}
