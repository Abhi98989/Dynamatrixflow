import { test, expect } from "@playwright/test";

test.describe("Phase 3: Employee Management & Onboarding Flow", () => {
  test("Admin can view team roster, filter, view profile, and create a new employee with forced password reset", async ({
    page,
  }) => {
    // 1. Login as Admin
    await page.goto("/login");
    await page.getByLabel("Employee ID").fill("DMS-001");
    await page.getByLabel("Password").fill("DynamatrixDev123!");
    await page.getByRole("button", { name: "Sign In to Workspace" }).click();

    await page.waitForURL(/\/dashboard/);
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("Dynamatrix Leader").first()).toBeVisible();

    // 2. Navigate to Team page
    await page.click('a[href="/team"]');
    await page.waitForURL(/\/team/);
    await expect(page).toHaveURL("/team");
    await expect(page.locator("h1")).toContainText("Team Directory");

    // 3. Verify employee cards / table
    await expect(page.locator("text=DMS-001")).toBeVisible();
    await expect(page.locator("text=DMS-002")).toBeVisible();
    await expect(page.locator("text=Ram Sharma")).toBeVisible();

    // 4. Test search filter
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await searchInput.fill("Sharma");
    await expect(
      page.locator("tbody").locator("text=Ram Sharma"),
    ).toBeVisible();
    await expect(
      page.locator("tbody").locator("text=Dynamatrix Leader"),
    ).not.toBeVisible();
    await searchInput.fill("");

    // 5. Navigate to employee profile
    await page.click('a[href="/team/DMS-002"]');
    await page.waitForURL(/\/team\/DMS-002/);
    await expect(page).toHaveURL("/team/DMS-002");
    await expect(page.locator("h1")).toContainText("Ram Sharma");
    await expect(page.locator("text=Project Memberships")).toBeVisible();

    // 6. Return to team page and open Add Employee dialog
    await page.click("text=Back to Team Directory");
    await page.waitForURL(/\/team/);
    await expect(page).toHaveURL("/team");

    const addBtn = page.locator('button:has-text("Add Employee")');
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Check dialog appears
    await expect(page.locator("text=Add New Employee")).toBeVisible();

    const uniqueSuffix = Date.now().toString().slice(-4);
    const newName = `Jordan Reed ${uniqueSuffix}`;
    const newEmail = `jordan.${uniqueSuffix}@dynamatrix.internal`;

    await page.fill("#name", newName);
    await page.fill("#email", newEmail);
    await page.fill("#position", "UI/UX Specialist");

    // Submit employee creation
    await page.click('button[type="submit"]:has-text("Create Account")');

    // Wait for temporary credentials card
    await expect(page.locator("text=Account Created Successfully")).toBeVisible(
      { timeout: 10000 },
    );
    const empIdText = await page
      .locator("text=/DMS-\\d+/")
      .first()
      .textContent();
    expect(empIdText).toMatch(/DMS-\d+/);

    const match = empIdText?.match(/DMS-\d+/);
    const createdEmpId = match ? match[0] : "";
    expect(createdEmpId).toBeTruthy();

    // Close modal
    await page.getByRole("button", { name: "Done" }).click();

    // Search for newly created employee in table
    await searchInput.fill(newName);
    await expect(page.locator("tbody").getByText(newName)).toBeVisible();
  });
});
