import type { Page } from "@playwright/test";

export type WhitelistAccount = {
	studentId: string;
	name: string;
	password: string;
};

export const whitelistAccounts = [
	{ studentId: "20260001", name: "Tanaka Hanako", password: "password123" },
	{ studentId: "20260002", name: "Suzuki Ken", password: "password123" },
	{ studentId: "20260003", name: "Sato Yui", password: "password123" },
	{ studentId: "20260004", name: "Yamada Haru", password: "authpassword123" },
	{ studentId: "20260005", name: "Kobayashi Mei", password: "immediate123" },
	{ studentId: "20260006", name: "Ito Rina", password: "persist123" },
	{ studentId: "20260007", name: "Nakamura Ren", password: "isolated123" },
	{ studentId: "20260008", name: "Watanabe Aya", password: "access123" },
	{ studentId: "20260009", name: "Takahashi Yuna", password: "testpassword123" },
	{ studentId: "20260010", name: "Matsumoto Sora", password: "mypassword123" },
	{ studentId: "20260011", name: "Kato Mio", password: "progress123" },
	{ studentId: "20260012", name: "Fujita Rei", password: "back123456" },
	{ studentId: "20260013", name: "Sakai Nao", password: "authflow123" },
	{ studentId: "20260014", name: "Arai Kiko", password: "persist999" },
	{ studentId: "20260015", name: "Mori Yuna", password: "isolate999" },
	{ studentId: "20260016", name: "Okada Rei", password: "signup888" },
	{ studentId: "20260017", name: "Hayashi Mei", password: "signup777" },
	{ studentId: "20260018", name: "Ishikawa Rio", password: "signup666" },
	{ studentId: "20260019", name: "Murakami Ao", password: "signup555" },
	{ studentId: "20260020", name: "Shimizu Hina", password: "signup444" },
] as const;

export async function selectWhitelistAccount(page: Page, account: Pick<WhitelistAccount, "studentId" | "name">) {
	await page.locator("#studentId").click();
	await page.getByPlaceholder("Search your name or student ID").fill(account.studentId);
	await page.getByText(`${account.name} (${account.studentId})`, { exact: true }).click();
}

export async function fillSignupAccountStep(page: Page, account: WhitelistAccount) {
	await selectWhitelistAccount(page, account);
	await page.locator("#password").fill(account.password);
	await page.locator("#confirmPassword").fill(account.password);
}

export async function fillSignupPersonalStep(page: Page, values: { age: string; jlptLabel: string }) {
	await page.locator("#age").fill(values.age);
	await page.locator("#jlptLevel").click();
	await page.getByText(values.jlptLabel, { exact: true }).click();
}

export async function fillSignupAcademicStep(page: Page, values: { studyGroup?: string; japaneseLearningDuration?: string; previousJapaneseScore?: string; mediaConsumption?: string; motivation?: string; }) {
	if (values.studyGroup) {
		await page.locator("#studyGroup").click();
		await page.getByText(values.studyGroup, { exact: true }).click();
	}
	if (values.japaneseLearningDuration !== undefined) await page.locator("#japaneseLearningDuration").fill(values.japaneseLearningDuration);
	if (values.previousJapaneseScore !== undefined) await page.locator("#previousJapaneseScore").fill(values.previousJapaneseScore);
	if (values.mediaConsumption !== undefined) await page.locator("#mediaConsumption").fill(values.mediaConsumption);
	if (values.motivation !== undefined) await page.locator("#motivation").fill(values.motivation);
}

export async function completeConsentStep(page: Page) {
	await page.locator("#consentGiven").click();
}

export async function loginWithStudentId(page: Page, studentId: string, password: string) {
	await page.goto("/login");
	await page.waitForSelector("#studentId");
	await page.locator("#studentId").fill(studentId);
	await page.locator("#password").fill(password);
	await page.locator('button[type="submit"]').click();
}
