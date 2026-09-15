import { expect, test, type Page } from "@playwright/test";

const demoUser = {
  id: "browser-test-user",
  email: "browser-test@a7.local",
  fullName: "Browser Test User",
  accountType: "seeker",
  isAgent: false,
  phoneVerified: false,
  idVerified: false,
};

async function startInEnglish(page: Page) {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem("a7-browser-test-initialized")) return;
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.sessionStorage.setItem("a7-browser-test-initialized", "1");
    window.localStorage.setItem("a7-property-language", "en");
  });
}

async function seedSeeker(page: Page) {
  await page.addInitScript((user) => {
    window.localStorage.setItem("a7-auth-user", JSON.stringify(user));
  }, demoUser);
}

async function gotoReady(page: Page, url: string) {
  await page.goto(url);
  await page.waitForTimeout(400);
}

test.beforeEach(async ({ page }) => {
  await startInEnglish(page);
});

test("search filters survive reload through URL state", async ({ page }) => {
  await gotoReady(page, "/search?purpose=rent&browse=all");
  await page.getByRole("button", { name: "Open all filters" }).click();
  await expect(page.getByRole("dialog", { name: "Filters" })).toBeVisible();
  await page.getByRole("combobox", { name: "City" }).selectOption("Yangon");
  await expect(page).toHaveURL(/location=Yangon/);
  await page.getByRole("button", { name: "Done" }).click();

  await page.reload();
  await page.waitForTimeout(300);
  await expect(page).toHaveURL(/purpose=rent/);
  await expect(page).toHaveURL(/location=Yangon/);
  await expect(page.getByRole("heading", { name: "Best matches" })).toBeVisible();
});

test("filtered search returns from property detail with state intact", async ({ page }) => {
  await gotoReady(page, "/search?purpose=rent&browse=all");
  await page.getByRole("button", { name: "Condo", exact: true }).click();
  await expect(page).toHaveURL(/types=condo/);

  await page.getByRole("link", { name: /View .*\(MM-PROP-/ }).first().click();
  await expect(page).toHaveURL(/\/properties\/MM-PROP-/);
  await page.getByRole("button", { name: "Back to search" }).click();
  await expect(page).toHaveURL(/types=condo/);
});

test("search restores the prior result scroll position", async ({ page }) => {
  await gotoReady(page, "/search?purpose=rent&browse=all");
  await page.evaluate(() => window.scrollTo(0, 1100));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

  await page.getByRole("link", { name: /View .*\(MM-PROP-/ }).nth(2).click();
  await page.getByRole("button", { name: "Back to search" }).click();
  await expect(page).toHaveURL(/browse=all/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
});

test("saved property state persists after refresh", async ({ page }) => {
  await gotoReady(page, "/properties/MM-PROP-018");
  const saveButton = page.getByRole("button", { name: "Save property" });
  await saveButton.click();
  await expect(page.getByRole("button", { name: "Remove from saved homes" })).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await page.waitForTimeout(300);
  await expect(page.getByRole("button", { name: "Remove from saved homes" })).toHaveAttribute("aria-pressed", "true");
});

test("comparison selections persist after refresh", async ({ page }) => {
  await gotoReady(page, "/search?purpose=rent&browse=all");
  const compareButton = page.getByRole("button", { name: /Add .* to comparison/ }).first();
  await compareButton.click();
  await expect(page.getByRole("button", { name: /Remove .* from comparison/ }).first()).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await page.waitForTimeout(300);
  await expect(page.getByRole("button", { name: /Remove .* from comparison/ }).first()).toHaveAttribute("aria-pressed", "true");
});

test("protected route returns after device-local social sign-in", async ({ page }) => {
  await gotoReady(page, "/saved");
  await expect(page).toHaveURL(/\/sign-in/);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.getByRole("button", { name: "Continue in demo mode" }).click();
  await expect(page).toHaveURL(/\/saved$/, { timeout: 4_000 });
  await expect(page.getByRole("heading", { name: "Saved Homes" })).toBeVisible();
});

test("language choice persists across navigation", async ({ page }) => {
  await gotoReady(page, "/help");
  await page.getByRole("button", { name: "Change language" }).click();
  await page.getByRole("button", { name: /မြန်မာ\s*Myanmar/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "my");
  await expect(page.getByRole("heading", { level: 1, name: "အိမ်တစ်လုံးရရှိရန် ခြေလှမ်းတိုင်းအတွက် အကူအညီ။" })).toBeVisible();

  await gotoReady(page, "/privacy");
  await expect(page.locator("html")).toHaveAttribute("lang", "my");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("သင့်အိမ်ရှာဖွေမှု");
});

test("profile dialog closes with Escape and restores focus", async ({ page }) => {
  await seedSeeker(page);
  await gotoReady(page, "/profile");
  const opener = page.getByRole("button", { name: "Edit personal information" });
  await opener.click();
  await expect(page.getByRole("dialog", { name: "Personal information" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
});
