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

export function useSignUpForm(): SignUpFormShape {
	return useFormContext() as SignUpFormShape;
}
