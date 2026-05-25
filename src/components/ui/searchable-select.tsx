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
	group?: string;
};

interface SearchableSelectProps {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	options: SearchableSelectOption[];
	placeholder?: string;
	searchPlaceholder?: string;
}

function groupOptions(options: SearchableSelectOption[]): Map<string, SearchableSelectOption[]> {
	const groups = new Map<string, SearchableSelectOption[]>();
	for (const opt of options) {
		const key = opt.group ?? "";
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(opt);
	}
	return groups;
}

export function SearchableSelect({
	id,
	value,
	onChange,
	options,
	placeholder = "Select an option",
	searchPlaceholder = "Search...",
}: SearchableSelectProps) {
	const [open, setOpen] = useState(false);

	const grouped = groupOptions(options);
	const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));

	const selectedOption = options.find((opt) => opt.id === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					variant="outline"
					aria-haspopup="listbox"
					aria-expanded={open}
					aria-controls={open ? "searchable-select-listbox" : undefined}
					className={cn("w-full justify-between", !value && "text-muted-foreground")}
				>
					{selectedOption?.label ?? placeholder}
					<SearchIcon className="ml-2 size-4 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent id="searchable-select-listbox" className="w-[400px] p-0" align="start">
				<Command>
					<CommandInput className="w-full" placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>No options found.</CommandEmpty>
						{sortedGroups.length === 1 ? (
							<CommandGroup>
								{sortedGroups[0][1].map((option) => (
									<CommandItem
										key={option.id}
										value={option.id}
										keywords={[option.label]}
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
						) : (
							sortedGroups.map(([group, opts]) => {
								return (
									<CommandGroup key={group} heading={group || "No Cohort"}>
										{opts.map((option) => (
											<CommandItem
												key={option.id}
												value={option.id}
												keywords={[option.label]}
												onSelect={() => {
													onChange(option.id);
													setOpen(false);
												}}
											>
												<CheckIcon
													className={cn(
														"mr-2 size-4",
														value === option.id
															? "opacity-100"
															: "opacity-0",
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
								);
							})
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
