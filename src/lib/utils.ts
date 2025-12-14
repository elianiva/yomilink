import { createRandomStringGenerator } from "@better-auth/utils/random";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const randomStringGenerator = createRandomStringGenerator("a-z", "A-Z", "0-9");

export const randomString = (length = 32) => randomStringGenerator(length);
