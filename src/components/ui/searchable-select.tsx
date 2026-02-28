import { CheckIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
	id: string;
	label: string;
	description?: string | null;
};

interface SearchableSelectProps {
	value: string;
	onChange: (value: string) => void;
	options: SearchableSelectOption[];
	placeholder?: string;
	searchPlaceholder?: string;
}

export function SearchableSelect({
	value,
	onChange,
	options,
	placeholder = "Select an option",
	searchPlaceholder = "Search...",
}: SearchableSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const filteredOptions = options.filter((option) =>
		option.label.toLowerCase().includes(search.toLowerCase()),
	);

	const selectedOption = options.find((opt) => opt.id === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					className={cn("w-full justify-between", !value && "text-muted-foreground")}
				>
					{selectedOption?.label ?? placeholder}
					<SearchIcon className="ml-2 size-4 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[400px] p-0" align="start">
				<Command>
					<CommandInput
						className="w-full"
						placeholder={searchPlaceholder}
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>No options found.</CommandEmpty>
						<CommandGroup>
							{filteredOptions.map((option) => (
								<CommandItem
									key={option.id}
									value={option.id}
									onSelect={() => {
										onChange(option.id);
										setOpen(false);
									}}
								>
									<CheckIcon
										className={cn(
											"mr-2 size-4",
											value === option.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<div className="flex flex-col">
										<span>{option.label}</span>
										{option.description && (
											<span className="text-xs text-muted-foreground">
												{option.description}
											</span>
										)}
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
