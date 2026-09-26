import { expect, test, type Page } from "@playwright/test";

async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Employee ID").fill("DMS-001");
  await page.getByLabel("Password").fill("DynamatrixDev123!");
  await page.getByRole("button", { name: "Sign In to Workspace" }).click();
  await page.waitForURL("/dashboard");
}

test("desktop shell renders and header popovers support keyboard dismissal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await loginAsAdmin(page);

  await expect(
    page.getByRole("heading", { name: /Good morning/ }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Notifications" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Notifications", exact: true }),
  ).toBeFocused();

  await page.getByRole("button", { name: "Admin account" }).click();
  await expect(
    page.getByRole("dialog", { name: "Admin account" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await page.screenshot({
    path: "test-results/workspace-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("mobile navigation traps focus, closes with Escape, and has no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await loginAsAdmin(page);

  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  const drawer = page.getByRole("dialog", { name: "Workspace navigation" });
  await expect(drawer).toBeVisible();
  await expect(drawer.locator(":focus")).toHaveCount(1);
  await drawer.getByRole("link", { name: "Dashboard" }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Close navigation" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(menu).toBeFocused();
  await menu.click();
  await drawer.getByRole("link", { name: "Dashboard" }).click();
  await expect(drawer).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/workspace-mobile.png",
    fullPage: true,
  });
});
