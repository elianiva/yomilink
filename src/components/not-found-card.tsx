import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NotFoundCardProps {
	resource?: string;
	onBack?: () => void;
}

export function NotFoundCard({ resource = "Resource", onBack }: NotFoundCardProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<FileQuestion className="h-5 w-5 text-muted-foreground" />
					<CardTitle>{resource} Not Found</CardTitle>
				</div>
				<CardDescription>
					The {resource.toLowerCase()} you are looking for does not exist or has been
					removed.
				</CardDescription>
			</CardHeader>
			{onBack && (
				<CardContent>
					<Button onClick={onBack} variant="outline">
						Go Back
					</Button>
				</CardContent>
			)}
		</Card>
	);
}
