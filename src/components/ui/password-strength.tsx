import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
	password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
	const checks = {
		length: password.length >= 8,
		uppercase: /[A-Z]/.test(password),
		lowercase: /[a-z]/.test(password),
		numberOrSpecial: /[0-9]|[^A-Za-z0-9]/.test(password),
	};
	const passed = Object.values(checks).filter(Boolean).length;
	const strength = passed === 4 ? "strong" : passed >= 3 ? "medium" : "weak";
	const strengthColor = {
		weak: "bg-destructive",
		medium: "bg-amber-500",
		strong: "bg-emerald-500",
	};
	const requirement = (label: string, met: boolean) => (
		<div className={cn("flex items-center gap-1.5 text-xs", met ? "text-emerald-600" : "text-muted-foreground")}>
			{met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
			<span>{label}</span>
		</div>
	);
	return (
		<div className="space-y-2 pt-1">
			<div className="flex gap-0.5 h-1">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className={cn(
							"flex-1 rounded-full transition-colors",
							i <= passed ? strengthColor[strength] : "bg-muted",
						)}
					/>
				))}
			</div>
			<div className="grid grid-cols-2 gap-x-4 gap-y-1">
				{requirement("8+ characters", checks.length)}
				{requirement("Uppercase letter", checks.uppercase)}
				{requirement("Lowercase letter", checks.lowercase)}
				{requirement("Number or special character", checks.numberOrSpecial)}
			</div>
		</div>
	);
}
