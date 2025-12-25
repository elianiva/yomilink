import { atom } from "jotai";

export const pageTitleAtom = atom<string | null>(null);

export type PageTitleOverride = {
	path: string;
	title: string;
};

export const pageTitleOverridesAtom = atom<PageTitleOverride[]>([]);
