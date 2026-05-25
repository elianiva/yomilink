import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardTitle } from "@/components/ui/card";

export function FormSubmittedSuccess() {
	return (
		<Card className="overflow-hidden flex-1">
			<CardContent className="flex flex-col items-center justify-center py-12">
				<CheckCircle2 className="size-16 text-success" />
				<CardTitle className="mt-4 text-2xl">Form Submitted!</CardTitle>
				<p className="mt-2 text-muted-foreground">Thank you for your response.</p>
			</CardContent>
		</Card>
	);
}
