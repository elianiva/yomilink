import { and, type SQL } from "drizzle-orm";

export function buildWhereClause(conditions: (SQL | null | undefined)[]): SQL | undefined {
	const validConditions = conditions.filter((c): c is SQL => c !== null && c !== undefined);
	if (validConditions.length === 0) return undefined;
	return validConditions.length === 1
		? validConditions[0]
		: and(...(validConditions as [SQL, ...SQL[]]));
}

export interface PaginationInput {
	page: number;
	pageSize: number;
}

export function calculateOffset({ page, pageSize }: PaginationInput): number {
	return (page - 1) * pageSize;
}

export function calculateTotalPages(total: number, pageSize: number): number {
	return Math.ceil(total / pageSize);
}

export interface ListResult<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export function createListResult<T>(
	items: T[],
	total: number,
	{ page, pageSize }: PaginationInput,
): ListResult<T> {
	return {
		items,
		total,
		page,
		pageSize,
		totalPages: calculateTotalPages(total, pageSize),
	};
}

export function groupBy<T, K, V>(
	items: T[],
	keyFn: (item: T) => K,
	valueFn: (item: T) => V | null,
): Map<K, V[]> {
	const map = new Map<K, V[]>();

	for (const item of items) {
		const key = keyFn(item);
		const value = valueFn(item);

		if (value === null) continue;

		const existing = map.get(key);
		if (existing) {
			existing.push(value);
		} else {
			map.set(key, [value]);
		}
	}

	return map;
}

export function escapeLikePattern(pattern: string): string {
	return pattern.replace(/[%_\\]/g, "\\$&");
}

export function createFuzzyPattern(search: string): string {
	return `%${escapeLikePattern(search)}%`;
}

export function createPrefixPattern(prefix: string): string {
	return `${escapeLikePattern(prefix)}%`;
}
