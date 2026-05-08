import { createFormHookContexts } from "@tanstack/react-form";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ReactElement, ReactNode } from "react";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
	createFormHookContexts();

// Minimal shape that step components actually use from the form
type SignUpFormShape = {
	Field: <TName extends string>(props: {
		name: TName;
		children: (field: AnyFieldApi) => ReactNode;
	}) => ReactElement;
};

/** Typed form context for step components — safe access to Field/Subscribe without prop drilling. */
export function useSignUpForm(): SignUpFormShape {
	// biome-ignore lint/suspicious/noExplicitAny: useFormContext() returns a too-strictly-typed form,
	// we only need Field/Subscribe shape in step components
	return useFormContext() as unknown as SignUpFormShape;
}
