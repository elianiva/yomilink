import type { AnyFieldApi } from "@tanstack/react-form";
import { ShieldIcon, HatGlassesIcon, DatabaseIcon, DoorClosedIcon, RssIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { FieldInfo } from "@/components/ui/field-info";

interface ConsentStepProps {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    form: any;
}

export function ConsentStep({ form }: ConsentStepProps) {
    return (
        <fieldset className="space-y-5">
            <div className="rounded-md border border-border/60 bg-muted/30 p-4 space-y-4 h-80 overflow-y-auto">
                <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                        Your participation in this research study is entirely voluntary. By checking
                        the box below, you acknowledge and agree to the following:
                    </p>
                </div>
                <div className="flex items-start gap-3 pt-2 border-t border-border/40">
                    <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <DatabaseIcon className="size-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-medium">Data Collection</h3>
                        <p className="text-sm text-muted-foreground">
                            Your data (including learning activity, assessment results, and
                            questionnaire responses) will be collected and used for research
                            purposes to evaluate the effectiveness of the Kit-Build Concept Map
                            method in Japanese language learning.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 pt-2 border-t border-border/40">
                    <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <ShieldIcon className="size-4 text-primary" />
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
                <div className="flex items-start gap-3 pt-2 border-t border-border/40">
                    <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <RssIcon className="size-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-medium">Publication</h3>
                        <p className="text-sm text-muted-foreground">
                            The research findings may be published in academic journals or presented
                            at conferences to contribute to the advancement of educational
                            technology in language learning.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 pt-2 border-t border-border/40">
                    <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <DoorClosedIcon className="size-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-medium">Withdrawal</h3>
                        <p className="text-sm text-muted-foreground">
                            You may withdraw from this study at any time without penalty. If you
                            choose to withdraw, your data will be excluded from the research
                            analysis.
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-3 pt-2 border-t border-border/40">
                    <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <HatGlassesIcon className="size-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-medium">Privacy</h3>
                        <p className="text-sm text-muted-foreground">
                            Your Personal Identifiable Information (PII) will be kept confidential
                            and will only be used for research analysis. Individual identities will
                            not be disclosed in any publications or presentations resulting from
                            this study.
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
                                className="text-sm leading-snug -mt-1 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
