import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

test.beforeAll(async () => {
  const devPasswordHash = await hash("DynamatrixDev123!");
  await prisma.user.upsert({
    where: { employeeId: "DMS-TEST-PW" },
    update: {
      passwordHash: devPasswordHash,
      mustChangePassword: true,
      accountStatus: "ACTIVE",
    },
    create: {
      employeeId: "DMS-TEST-PW",
      name: "Password Flow Tester",
      passwordHash: devPasswordHash,
      systemRole: "EMPLOYEE",
      accountStatus: "ACTIVE",
      mustChangePassword: true,
    },
  });
});

test.afterAll(async () => {
  await prisma.user.deleteMany({ where: { employeeId: "DMS-TEST-PW" } });
  await prisma.$disconnect();
});

test("first-login forces password change and blocks workspace bypass", async ({
  page,
}) => {
  // 1. Visit /dashboard unauthenticated -> redirected to /login
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);

  // 2. Sign in with test employee requiring password change
  await page.getByLabel("Employee ID").fill("DMS-TEST-PW");
  await page.getByLabel("Password").fill("DynamatrixDev123!");
  await page.getByRole("button", { name: "Sign In to Workspace" }).click();

  // 3. User is forced to /change-password
  await page.waitForURL(/\/change-password/);
  await expect(
    page.getByRole("heading", { name: "Password Change Required" }),
  ).toBeVisible();

  // 4. Attempt to bypass by directly navigating to /dashboard -> server guard blocks and redirects back to /change-password
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/change-password/);

  // 5. Submit new password
  await page
    .getByLabel("New Password", { exact: true })
    .fill("AbhishekPass123!");
  await page.getByLabel("Confirm New Password").fill("AbhishekPass123!");
  await page.getByRole("button", { name: "Set Password & Continue" }).click();

  // 6. User is now allowed into /dashboard
  await page.waitForURL(/\/dashboard/);
  await expect(
    page.getByRole("heading", { name: /Good morning/ }),
  ).toBeVisible();
});
