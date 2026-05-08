import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "./signup-form.context";

export const { useAppForm, useTypedAppFormContext } = createFormHook({
	fieldComponents: {},
	formComponents: {},
	fieldContext,
	formContext,
});
