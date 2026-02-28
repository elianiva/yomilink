import { useAtom } from "jotai";

import { materialTextAtom } from "../lib/atoms";

export function useFileImport() {
	const [materialText, setMaterialText] = useAtom(materialTextAtom);

	return {
		materialText,
		setMaterialText,
	};
}
