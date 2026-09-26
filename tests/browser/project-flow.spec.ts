import { test, expect } from "@playwright/test";

test.describe("Phase 4: Projects & Membership Management Flow", () => {
  test("Admin can view projects, filter, create new project with lead, and add team members", async ({
    page,
  }) => {
    // 1. Login as Admin
    await page.goto("/login");
    await page.getByLabel("Employee ID").fill("DMS-001");
    await page.getByLabel("Password").fill("DynamatrixDev123!");
    await page.getByRole("button", { name: "Sign In to Workspace" }).click();

    await page.waitForURL(/\/dashboard/);
    await expect(page).toHaveURL("/dashboard");

    // 2. Navigate to Projects
    await page.click('a[href="/projects"]');
    await page.waitForURL(/\/projects/);
    await expect(page).toHaveURL("/projects");
    await expect(page.locator("h1")).toContainText("Projects");

    // 3. Verify seeded projects
    await expect(page.locator("text=Expo Express Marketplace")).toBeVisible();
    await expect(page.locator("text=DF-EXP-001")).toBeVisible();

    // 4. Test search filter
    const searchInput = page.locator(
      'input[placeholder*="Search projects by name"]',
    );
    await searchInput.fill("Ops");
    await expect(page.locator("text=Dynamatrix Ops Portal")).toBeVisible();
    await expect(
      page.locator("text=Expo Express Marketplace"),
    ).not.toBeVisible();
    await searchInput.fill("");

    // 5. Open New Project Dialog
    const newProjectBtn = page.getByRole("button", { name: "New Project" });
    await expect(newProjectBtn).toBeVisible();
    await newProjectBtn.click();

    await expect(page.locator("text=Create New Project")).toBeVisible();

    const uniqueSuffix = Date.now().toString().slice(-4);
    const projectName = `Client Portal ${uniqueSuffix}`;

    await page.fill("#name", projectName);
    await page.fill("#prefix", "CP");
    await page.fill("#clientName", "Apex Logistics");
    await page.fill(
      "#description",
      "B2B client tracking and logistics management portal.",
    );

    // Select Project Lead (Ram Sharma)
    const ramOptionVal = await page
      .locator("#projectLeadId option", { hasText: "Ram Sharma" })
      .getAttribute("value");
    if (ramOptionVal) {
      await page.selectOption("#projectLeadId", ramOptionVal);
    }

    // Submit
    await page.click('button[type="submit"]:has-text("Create Project")');

    // Wait for redirect to project detail page
    await page.waitForURL(/\/projects\/[a-z0-9]+/);
    await expect(page.locator("h1")).toContainText(projectName);
    await expect(page.locator('span:has-text("DF-CP-")').first()).toBeVisible();
    await expect(page.locator("text=Ram Sharma").first()).toBeVisible();

    // 6. Test Add Member dialog
    const addMemberBtn = page
      .getByRole("button", { name: "Add Member" })
      .first();
    await expect(addMemberBtn).toBeVisible();
    await addMemberBtn.click();

    await expect(page.locator("text=Add Project Member")).toBeVisible();

    // Select an employee to add
    await page.selectOption("#memberSelect", { index: 1 });
    await page.selectOption("#roleSelect", "DEVELOPER");
    await page.click('button[type="submit"]:has-text("Add Member")');

    // Member dialog closes, verify members count >= 2
    await expect(page.locator("text=Project Team (2)")).toBeVisible({
      timeout: 10000,
    });
  });
});
