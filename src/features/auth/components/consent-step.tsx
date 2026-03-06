import type { AnyFieldApi } from "@tanstack/react-form";
import { FileTextIcon, ShieldIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { FieldInfo } from "@/components/ui/field-info";

interface ConsentStepProps {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	form: any;
}

export function ConsentStep({ form }: ConsentStepProps) {
	return (
		<fieldset className="space-y-5">
			<div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-4">
				<div className="flex items-start gap-3">
					<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
						<FileTextIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h3 className="font-medium">Research Information</h3>
						<p className="text-sm text-muted-foreground">KitBuild Research Study</p>
					</div>
				</div>

				<div className="space-y-3 text-sm text-muted-foreground">
					<p>
						Your participation in this research study is entirely voluntary. By checking
						the box below, you acknowledge and agree to the following:
					</p>
					<ul className="space-y-2 pl-4 list-disc">
						<li>
							Your data (including learning activity, assessment results, and
							questionnaire responses) will be collected and used for research
							purposes to evaluate the effectiveness of the Kit-Build Concept Map
							method in Japanese language learning.
						</li>
						<li>
							Your personal information will be kept confidential and will only be
							used for research analysis. Individual identities will not be disclosed
							in any publications or presentations resulting from this study.
						</li>
						<li>
							You may withdraw from this study at any time without penalty. If you
							choose to withdraw, your data will be excluded from the research
							analysis.
						</li>
						<li>
							The research findings may be published in academic journals or presented
							at conferences to contribute to the advancement of educational
							technology in language learning.
						</li>
					</ul>
				</div>

				<div className="flex items-start gap-3 pt-2 border-t border-border/40">
					<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
						<ShieldIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h3 className="font-medium">Data Protection</h3>
						<p className="text-sm text-muted-foreground">
							Your data is stored securely and will only be accessible to the research
							team. We follow ethical research guidelines and data protection
							regulations to ensure your privacy is protected throughout the study.
						</p>
					</div>
				</div>
			</div>

			<form.Field name="consentGiven">
				{(field: AnyFieldApi) => (
					<div className="space-y-2">
						<div className="flex items-start gap-3">
							<Checkbox
								id="consentGiven"
								checked={field.state.value}
								onCheckedChange={(checked) => field.handleChange(checked === true)}
								onBlur={field.handleBlur}
							/>
							<label
								htmlFor="consentGiven"
								className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
							>
								I have read and understood the information above. I voluntarily
								agree to participate in this research study and consent to the
								collection and use of my data for research purposes.
							</label>
						</div>
						<FieldInfo field={field} />
					</div>
				)}
			</form.Field>
		</fieldset>
	);
}
