import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorCardProps {
	title?: string;
	description?: string;
	onRetry?: () => void;
}

export function ErrorCard({
	title = "Something went wrong",
	description = "An error occurred while loading the data.",
	onRetry,
}: ErrorCardProps) {
	return (
		<Card className="border-destructive/50">
			<CardHeader>
				<div className="flex items-center gap-2">
					<AlertCircle className="h-5 w-5 text-destructive" />
					<CardTitle className="text-destructive">{title}</CardTitle>
				</div>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			{onRetry && (
				<CardContent>
					<Button onClick={onRetry} variant="outline">
						Try Again
					</Button>
				</CardContent>
			)}
		</Card>
	);
}
