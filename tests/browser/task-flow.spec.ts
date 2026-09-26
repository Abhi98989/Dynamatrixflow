import { test, expect } from "@playwright/test";

test.describe("Phase 5: Task Management, Checklists & Personal Queues", () => {
  test("Admin creates task in project, manages subtasks, and verifies views", async ({
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

    // 3. Open first project (Expo Express Marketplace)
    await page.locator("text=Expo Express Marketplace").click();
    await page.waitForURL(/\/projects\/.+/);

    // 4. Click Tasks tab or Tasks link
    const tasksLink = page.locator('a[href*="/tasks"]').first();
    await tasksLink.click();
    await page.waitForURL(/\/projects\/.+\/tasks$/);
    await expect(page.locator("h1")).toContainText("Project Tasks");

    // 5. Open Create Task Dialog
    const newTaskBtn = page.getByRole("button", { name: "Add Task" });
    await expect(newTaskBtn).toBeVisible();
    await newTaskBtn.click();

    await expect(page.locator("text=Create Project Task")).toBeVisible();

    const uniqueSuffix = Date.now().toString().slice(-4);
    const taskTitle = `E2E Load Testing Pipeline ${uniqueSuffix}`;

    await page.fill("#task-title", taskTitle);
    await page.fill(
      "#task-description",
      "Configure k6 and Artillery load testing suites for checkout."
    );
    await page.selectOption("#task-priority", "HIGH");

    // Select assignee if option exists
    const assigneeOptions = await page.locator("#task-assignee option").count();
    if (assigneeOptions > 1) {
      await page.locator("#task-assignee").selectOption({ index: 1 });
    }

    // Submit task
    await page.getByRole("button", { name: "Create Task" }).click();

    // Verify dialog closes and task appears
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible({ timeout: 10000 });

    // 6. Click into the new task detail page
    await page.locator(`text=${taskTitle}`).click();
    await page.waitForURL(/\/projects\/.+\/tasks\/.+/);
    await expect(page.locator("h1")).toContainText(taskTitle);

    // 7. Add a subtask
    const subtaskInput = page.locator('input[placeholder*="Add a checklist step"]');
    await expect(subtaskInput).toBeVisible();
    await subtaskInput.fill("Write load profile simulation script");

    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.locator("text=Write load profile simulation script")).toBeVisible();

    // 8. Toggle the subtask
    const subtaskCheckbox = page.locator('button[aria-label*="Toggle subtask"]').first();
    await subtaskCheckbox.click();

    // 9. Navigate to My Tasks
    await page.click('a[href="/my-tasks"]');
    await page.waitForURL(/\/my-tasks/);
    await expect(page.locator("h1")).toContainText("My Tasks");

    // 10. Navigate to Upcoming
    await page.click('a[href="/upcoming"]');
    await page.waitForURL(/\/upcoming/);
    await expect(page.locator("h1")).toContainText("Upcoming Deliverables");
  });
});
