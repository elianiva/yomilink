import { execSync } from "node:child_process";

import { expect, test as setup, type Page } from "@playwright/test";

const authDir = "./playwright/.auth";

async function signInAndSaveState(page: Page, email: string, password: string, targetUrl: string, storagePath: string) {
	const response = await page.evaluate(
		async ({ email, password }) => {
			const res = await fetch("/api/auth/sign-in/email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ email, password, rememberMe: true }),
			});
			return { ok: res.ok, status: res.status, text: await res.text() };
		},
		{ email, password },
	);

	if (!response.ok) {
		throw new Error(`Auth setup failed (${response.status}): ${response.text}`);
	}

	await page.goto(targetUrl);
	await expect(page).toHaveURL(targetUrl);
	await page.context().storageState({ path: storagePath });
}

setup("seed database", async () => {
	if (!process.env.E2E_RUN_SEED) {
		console.log("Skipping seed (set E2E_RUN_SEED=1 to run seed)");
		return;
	}

	try {
		execSync("vp run db:seed", { stdio: "inherit" });
	} catch {
		console.log("Seed may have already run or failed, continuing...");
	}
});

setup("authenticate student", async ({ page }) => {
	await signInAndSaveState(page, "tanaka@demo.local", "demo12345", "/dashboard/assignments", authDir + "/student.json");
	console.log("Student auth state saved");
});

setup("authenticate teacher", async ({ page }) => {
	await signInAndSaveState(page, "teacher@demo.local", "teacher123", "/dashboard", authDir + "/teacher.json");
	console.log("Teacher auth state saved");
});
