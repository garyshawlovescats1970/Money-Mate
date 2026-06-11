import { test, expect } from "@playwright/test";

// Smoke: register → login → add expense → persists across reload.
test("login, add an expense, see it persist", async ({ page }) => {
  const email = `smoke-${Date.now()}@test.dev`;
  const password = "correct-horse-9";

  await page.goto("/login");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password (8+ characters)").fill(password);
  await page.getByRole("button", { name: "Create account" }).last().click();

  // Lands on the Money tab
  await expect(page.getByText("Left this month")).toBeVisible({
    timeout: 15_000,
  });

  // Set income and add an expense
  await page.getByLabel("Monthly take-home pay").fill("2000");
  await page.getByPlaceholder("What was it?").fill("Big shop");
  await page.getByPlaceholder("£").fill("62.40");
  await page.getByRole("button", { name: "Add", exact: true }).click();

  const entry = page
    .locator("section")
    .filter({ hasText: "Big shop" })
    .last();
  await expect(entry.getByText("Big shop")).toBeVisible();
  await expect(entry.getByText("£62.40")).toBeVisible();

  // Wait for the debounced save to land, then reload — data must persist.
  await expect(page.getByText("Synced")).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await expect(page.getByText("Big shop")).toBeVisible({ timeout: 15_000 });
  await expect(
    page.locator("section").filter({ hasText: "Big shop" }).last().getByText("£62.40"),
  ).toBeVisible();
});
