import { test, expect } from "@playwright/test";

test.describe("Phase 6: Review Workflow, Comments & Completion Cycle", () => {
  test("Lead submits deliverable, posts comments, requests changes, and approves completed work", async ({
    page,
  }) => {
    // 1. Login as Admin (who has universal Lead permissions)
    await page.goto("/login");
    await page.getByLabel("Employee ID").fill("DMS-001");
    await page.getByLabel("Password").fill("DynamatrixDev123!");
    await page.getByRole("button", { name: "Sign In to Workspace" }).click();

    await page.waitForURL(/\/dashboard/);

    // 2. Navigate to Projects and open first project
    await page.click('a[href="/projects"]');
    await page.waitForURL(/\/projects/);
    await page.locator("text=Expo Express Marketplace").click();
    await page.waitForURL(/\/projects\/.+/);

    // 3. Open Tasks tab
    const tasksLink = page.locator('a[href*="/tasks"]').first();
    await tasksLink.click();
    await page.waitForURL(/\/projects\/.+\/tasks$/);

    // 4. Create a new deliverable
    await page.getByRole("button", { name: "Add Task" }).click();
    const uniqueSuffix = Date.now().toString().slice(-4);
    const taskTitle = `Checkout Security Verification ${uniqueSuffix}`;

    await page.fill("#task-title", taskTitle);
    await page.fill(
      "#task-description",
      "Harden checkout against timing attacks and CSRF vulnerabilities."
    );
    await page.selectOption("#task-priority", "HIGH");
    await page.getByRole("button", { name: "Create Task" }).click();

    // 5. Open task detail page
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible({ timeout: 10000 });
    await page.locator(`text=${taskTitle}`).click();
    await page.waitForURL(/\/projects\/.+\/tasks\/.+/);
    await expect(page.locator("h1")).toContainText(taskTitle);

    // 6. Post a discussion comment
    const commentBox = page.locator('textarea[placeholder*="Write a comment"]');
    await expect(commentBox).toBeVisible();
    await commentBox.fill("Implemented HMAC-SHA256 signature verification for webhook payloads.");
    await page.getByRole("button", { name: "Post Comment" }).click();

    await expect(
      page.locator("text=Implemented HMAC-SHA256 signature verification")
    ).toBeVisible({ timeout: 8000 });

    // 7. Submit for Review
    const submitBtn = page.getByRole("button", { name: "Submit for Review" });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    await expect(page.locator("text=Confirm Submission")).toBeVisible();
    await page.getByRole("button", { name: "Confirm Submission" }).click();

    // Verify task is now in review
    await expect(page.locator("text=Deliverable Submitted for Review")).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole("button", { name: "Request Changes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Approve Deliverable" })).toBeVisible();

    // 8. Request Changes
    await page.getByRole("button", { name: "Request Changes" }).click();
    await expect(page.locator("text=Required Changes & Feedback")).toBeVisible();

    const feedbackInput = page.locator("#feedbackInput");
    await feedbackInput.fill("Please add integration tests verifying signature rejection on expired timestamps.");
    await page.getByRole("button", { name: "Send Feedback & Return" }).click();

    // Verify task returned to In Progress
    await expect(page.locator("text=Changes Requested by")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: "Submit for Review" })).toBeVisible();

    // 9. Resubmit for Review
    await page.getByRole("button", { name: "Submit for Review" }).click();
    await page.getByRole("button", { name: "Confirm Submission" }).click();
    await expect(page.getByRole("button", { name: "Approve Deliverable" })).toBeVisible({
      timeout: 8000,
    });

    // 10. Approve Deliverable
    await page.getByRole("button", { name: "Approve Deliverable" }).click();
    await expect(page.locator("text=Approve & Complete")).toBeVisible();
    await page.getByRole("button", { name: "Approve & Complete" }).click();

    // Verify completed
    await expect(page.locator("text=Deliverable Completed & Approved")).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole("button", { name: "Reopen Deliverable" })).toBeVisible();

    // 11. Navigate to Review Queue page
    await page.click('a[href="/review"]');
    await page.waitForURL(/\/review/);
    await expect(page.locator("h1")).toContainText("Review Queue");
  });
});
