/**
 * Reusable Database Query Builder Utilities
 *
 * Reduces duplication for common SQL patterns across services.
 */

import { and, type SQL } from "drizzle-orm";

/**
 * Builds a conditional WHERE clause from an array of conditions.
 * Returns undefined if no conditions are provided.
 *
 * @example
 * ```ts
 * const whereClause = buildWhereClause([
 *   search ? ilike(user.name, `%${search}%`) : null,
 *   role ? eq(user.role, role) : null,
 * ]);
 *
 * const results = await db.select().from(user).where(whereClause);
 * ```
 */
export function buildWhereClause(conditions: (SQL | null | undefined)[]): SQL | undefined {
	const validConditions = conditions.filter((c): c is SQL => c !== null && c !== undefined);
	if (validConditions.length === 0) return undefined;
	return validConditions.length === 1 ? validConditions[0] : and(...validConditions as [SQL, ...SQL[]]);
}

/**
 * Pagination input type for list queries.
 */
export interface PaginationInput {
	page: number;
	pageSize: number;
}

/**
 * Calculates the OFFSET value for SQL queries.
 *
 * @example
 * ```ts
 * const offset = calculateOffset({ page: 2, pageSize: 20 }); // Returns 20
 * ```
 */
export function calculateOffset({ page, pageSize }: PaginationInput): number {
	return (page - 1) * pageSize;
}

/**
 * Calculates total pages from count and page size.
 *
 * @example
 * ```ts
 * const totalPages = calculateTotalPages(total: 95, pageSize: 20); // Returns 5
 * ```
 */
export function calculateTotalPages(total: number, pageSize: number): number {
	return Math.ceil(total / pageSize);
}

/**
 * Standard list result type.
 */
export interface ListResult<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

/**
 * Creates a standard list result object.
 *
 * @example
 * ```ts
 * return createListResult(items, total, { page: 1, pageSize: 20 });
 * ```
 */
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

/**
 * Groups flat join results by a key extractor.
 * Useful when querying with LEFT JOIN to avoid N+1 queries.
 *
 * @example
 * ```ts
 * const rows = await db
 *   .select({ userId: user.id, cohortId: cohorts.id, cohortName: cohorts.name })
 *   .from(user)
 *   .leftJoin(cohorts, eq(user.id, cohorts.id));
 *
 * const grouped = groupBy(rows, row => row.userId, row => ({
 *   id: row.cohortId!,
 *   name: row.cohortName!,
 * }));
 * ```
 */
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

/**
 * Safe search string formatter for SQL LIKE queries.
 * Escapes special characters (% and _).
 *
 * @example
 * ```ts
 * const results = await db
 *   .select()
 *   .from(user)
 *   .where(ilike(user.name, `%${escapeLikePattern(search)}%`));
 * ```
 */
export function escapeLikePattern(pattern: string): string {
	return pattern.replace(/[%_\\]/g, "\\$&");
}

/**
 * Creates a fuzzy search pattern for SQL LIKE queries.
 *
 * @example
 * ```ts
 * const results = await db
 *   .select()
 *   .from(user)
 *   .where(or(
 *     ilike(user.name, createFuzzyPattern(search)),
 *     ilike(user.email, createFuzzyPattern(search))
 *   ));
 * ```
 */
export function createFuzzyPattern(search: string): string {
	return `%${escapeLikePattern(search)}%`;
}

/**
 * Creates a prefix search pattern for SQL LIKE queries.
 *
 * @example
 * ```ts
 * const results = await db
 *   .select()
 *   .from(user)
 *   .where(ilike(user.name, createPrefixPattern(search)));
 * ```
 */
export function createPrefixPattern(prefix: string): string {
	return `${escapeLikePattern(prefix)}%`;
}
