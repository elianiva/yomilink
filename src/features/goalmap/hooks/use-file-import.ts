import { useAtom, useSetAtom } from "jotai";
import { useRef } from "react";
import { materialTextAtom, imagesAtom } from "../lib/atoms";

export function useFileImport() {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [materialText, setMaterialText] = useAtom(materialTextAtom);
	const setImages = useSetAtom(imagesAtom);

	const onImportFiles = async (files: FileList | null) => {
		if (!files) return;
		for (const file of Array.from(files)) {
			const sizeOk = file.size <= 10 * 1024 * 1024;
			if (!sizeOk) {
				console.warn("file too large", file.name);
				continue;
			}
			if (file.type === "text/plain") {
				const text = await file.text();
				setMaterialText((t) => (t ? `${t}\n\n` : "") + text);
			} else if (/(png|jpg|jpeg)/i.test(file.type)) {
				const url = URL.createObjectURL(file);
				setImages((arr) => [
					...arr,
					{ id: crypto.randomUUID(), url, name: file.name },
				]);
			} else {
				console.warn("unsupported type", file.type);
			}
		}
	};

	return {
		fileInputRef,
		materialText,
		setMaterialText,
		onImportFiles,
	};
}
