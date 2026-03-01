import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {}

interface PasswordInputProps extends React.ComponentProps<"input"> {
	showPasswordToggle?: boolean;
}

function Input({ className, type, ...props }: InputProps) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
				"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
				className,
			)}
			{...props}
		/>
	);
}

function PasswordInput({ className, showPasswordToggle = true, ...props }: PasswordInputProps) {
	const [showPassword, setShowPassword] = React.useState(false);

	return (
		<div className="relative">
			<Input
				type={showPassword ? "text" : "password"}
				className={cn("pr-10", className)}
				{...props}
			/>
			{showPasswordToggle && (
				<button
					type="button"
					onClick={() => setShowPassword(!showPassword)}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-sm"
					tabIndex={-1}
				>
					{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
				</button>
			)}
		</div>
	);
}

export { Input, PasswordInput };
