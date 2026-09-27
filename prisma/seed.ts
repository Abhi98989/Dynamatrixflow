import {
  PrismaClient,
  SystemRole,
  AccountStatus,
  ProjectStatus,
  Priority,
  TaskStatus,
  MilestoneStatus,
  ResourceCategory,
  ProjectMemberRole,
  NotificationType,
} from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing existing data...");
  // Delete in reverse dependency order
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.projectResource.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskUpdate.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding users...");
  const devPasswordHash = await hash("DynamatrixDev123!");

  // 1. Admin
  const admin = await prisma.user.create({
    data: {
      employeeId: "DMS-001",
      name: "Dynamatrix Leader",
      email: "admin@dynamatrix.internal",
      passwordHash: devPasswordHash,
      systemRole: SystemRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      position: "Managing Director",
      mustChangePassword: false,
    },
  });

  // 2. Project Lead
  const leadRam = await prisma.user.create({
    data: {
      employeeId: "DMS-002",
      name: "Ram Sharma",
      email: "ram.sharma@dynamatrix.internal",
      passwordHash: devPasswordHash,
      systemRole: SystemRole.PROJECT_LEAD,
      accountStatus: AccountStatus.ACTIVE,
      position: "Technical Lead",
      mustChangePassword: false,
      createdById: admin.id,
    },
  });

  // 3. Frontend Developer
  const devAbhishek = await prisma.user.create({
    data: {
      employeeId: "DMS-003",
      name: "Abhishek Shrestha",
      email: "abhishek@dynamatrix.internal",
      passwordHash: devPasswordHash,
      systemRole: SystemRole.EMPLOYEE,
      accountStatus: AccountStatus.ACTIVE,
      position: "Frontend Developer",
      mustChangePassword: false,
      createdById: admin.id,
    },
  });

  // 4. Backend Developer
  const devSuman = await prisma.user.create({
    data: {
      employeeId: "DMS-004",
      name: "Suman Thapa",
      email: "suman@dynamatrix.internal",
      passwordHash: devPasswordHash,
      systemRole: SystemRole.EMPLOYEE,
      accountStatus: AccountStatus.ACTIVE,
      position: "Backend Developer",
      mustChangePassword: false,
      createdById: admin.id,
    },
  });

  // 5. UI/UX Designer
  const designerHari = await prisma.user.create({
    data: {
      employeeId: "DMS-005",
      name: "Hari Adhikari",
      email: "hari@dynamatrix.internal",
      passwordHash: devPasswordHash,
      systemRole: SystemRole.EMPLOYEE,
      accountStatus: AccountStatus.ACTIVE,
      position: "UI/UX Designer",
      mustChangePassword: false,
      createdById: admin.id,
    },
  });

  // 6. QA Engineer
  const qaRamesh = await prisma.user.create({
    data: {
      employeeId: "DMS-006",
      name: "Ramesh Karki",
      email: "ramesh@dynamatrix.internal",
      passwordHash: devPasswordHash,
      systemRole: SystemRole.EMPLOYEE,
      accountStatus: AccountStatus.ACTIVE,
      position: "QA Engineer",
      mustChangePassword: false,
      createdById: admin.id,
    },
  });

  console.log("Seeding projects...");
  // Project 1: Expo Express Marketplace
  const projectExpo = await prisma.project.create({
    data: {
      projectCode: "DF-EXP-001",
      name: "Expo Express Marketplace",
      description:
        "Modern B2B & B2C multi-vendor marketplace platform for Nepali trade exhibitions and local vendors.",
      clientName: "Expo Express Nepal Pvt. Ltd.",
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      startDate: new Date("2026-08-01T00:00:00Z"),
      deadline: new Date("2026-11-30T00:00:00Z"),
      technologyTags: ["Next.js", "PostgreSQL", "Tailwind", "Khalti API"],
      internalNotes:
        "Payment gateway integration SLA requires staging test pass by mid October.",
      projectLeadId: leadRam.id,
      createdById: admin.id,
    },
  });

  // Project 2: Internal HR & Workflow Portal (Planning)
  const projectPortal = await prisma.project.create({
    data: {
      projectCode: "DF-INT-002",
      name: "Dynamatrix Ops Portal",
      description:
        "Internal operations, asset tracking, and hardware resource deployment manager.",
      status: ProjectStatus.PLANNING,
      priority: Priority.MEDIUM,
      startDate: new Date("2026-10-01T00:00:00Z"),
      deadline: new Date("2027-01-31T00:00:00Z"),
      technologyTags: ["TypeScript", "Prisma", "React"],
      projectLeadId: leadRam.id,
      createdById: admin.id,
    },
  });

  console.log("Seeding project members...");
  // Members for Expo Express
  await prisma.projectMember.createMany({
    data: [
      {
        projectId: projectExpo.id,
        userId: leadRam.id,
        projectRole: ProjectMemberRole.PROJECT_LEAD,
        addedById: admin.id,
      },
      {
        projectId: projectExpo.id,
        userId: devAbhishek.id,
        projectRole: ProjectMemberRole.DEVELOPER,
        addedById: admin.id,
      },
      {
        projectId: projectExpo.id,
        userId: devSuman.id,
        projectRole: ProjectMemberRole.DEVELOPER,
        addedById: leadRam.id,
      },
      {
        projectId: projectExpo.id,
        userId: designerHari.id,
        projectRole: ProjectMemberRole.DESIGNER,
        addedById: leadRam.id,
      },
      {
        projectId: projectExpo.id,
        userId: qaRamesh.id,
        projectRole: ProjectMemberRole.QA,
        addedById: leadRam.id,
      },
      // Ops Portal members
      {
        projectId: projectPortal.id,
        userId: leadRam.id,
        projectRole: ProjectMemberRole.PROJECT_LEAD,
        addedById: admin.id,
      },
      {
        projectId: projectPortal.id,
        userId: devSuman.id,
        projectRole: ProjectMemberRole.DEVELOPER,
        addedById: admin.id,
      },
    ],
  });

  console.log("Seeding milestones...");
  const milestone1 = await prisma.milestone.create({
    data: {
      milestoneCode: "EXP-M01",
      projectId: projectExpo.id,
      name: "UI/UX Design & Prototyping",
      description:
        "Complete high-fidelity Figma components and user journeys for desktop and mobile.",
      status: MilestoneStatus.COMPLETED,
      sortOrder: 1,
      createdById: leadRam.id,
    },
  });

  const milestone2 = await prisma.milestone.create({
    data: {
      milestoneCode: "EXP-M02",
      projectId: projectExpo.id,
      name: "Checkout & Payment Engine",
      description:
        "Cart calculation, address selection, and Khalti payment gateway integration.",
      status: MilestoneStatus.IN_PROGRESS,
      sortOrder: 2,
      createdById: leadRam.id,
    },
  });

  await prisma.milestone.create({
    data: {
      milestoneCode: "EXP-M03",
      projectId: projectExpo.id,
      name: "Integration Testing & Deployment",
      description: "End-to-end user checkout testing and staging rollout.",
      status: MilestoneStatus.PLANNED,
      sortOrder: 3,
      createdById: leadRam.id,
    },
  });

  console.log("Seeding tasks...");
  // Task 1: Checkout Module
  const task1 = await prisma.task.create({
    data: {
      taskCode: "EXP-001",
      projectId: projectExpo.id,
      milestoneId: milestone2.id,
      title: "Checkout Module Implementation",
      description:
        "Build address selector, shipping preference, and payment method selector with total bill calculations.",
      assigneeId: devAbhishek.id,
      createdById: leadRam.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      progress: 65,
      startDate: new Date("2026-09-10T00:00:00Z"),
      dueDate: new Date("2026-10-05T00:00:00Z"),
      estimatedMinutes: 2400,
    },
  });

  // Subtasks for Task 1
  await prisma.subtask.createMany({
    data: [
      {
        taskId: task1.id,
        title: "Address selection UI",
        isCompleted: true,
        sortOrder: 1,
      },
      {
        taskId: task1.id,
        title: "Shipping tier picker",
        isCompleted: true,
        sortOrder: 2,
      },
      {
        taskId: task1.id,
        title: "Payment method tabs (Khalti/eSewa/COD)",
        isCompleted: false,
        sortOrder: 3,
      },
      {
        taskId: task1.id,
        title: "Order summary calculation verification",
        isCompleted: false,
        sortOrder: 4,
      },
    ],
  });

  // Task 2: Payment Gateway Integration (Blocked)
  const task2 = await prisma.task.create({
    data: {
      taskCode: "EXP-002",
      projectId: projectExpo.id,
      milestoneId: milestone2.id,
      title: "Khalti Payment Gateway API Integration",
      description:
        "Implement backend initiate transaction endpoint and payment verification callback webhook.",
      assigneeId: devSuman.id,
      createdById: leadRam.id,
      status: TaskStatus.BLOCKED,
      priority: Priority.CRITICAL,
      progress: 40,
      blockerReason:
        "Waiting for merchant test credentials from client finance team.",
      startDate: new Date("2026-09-15T00:00:00Z"),
      dueDate: new Date("2026-09-30T00:00:00Z"),
    },
  });

  // Task 3: Design System Tokens (Completed)
  const task3 = await prisma.task.create({
    data: {
      taskCode: "EXP-003",
      projectId: projectExpo.id,
      milestoneId: milestone1.id,
      title: "Design System & Component Token Specs",
      description:
        "Draft Figma typography, color palette, buttons, cards, and navigation tokens.",
      assigneeId: designerHari.id,
      createdById: leadRam.id,
      status: TaskStatus.COMPLETED,
      priority: Priority.MEDIUM,
      progress: 100,
      completedAt: new Date("2026-09-05T12:00:00Z"),
    },
  });

  // Task 4: Cart Unit Tests (In Review)
  const task4 = await prisma.task.create({
    data: {
      taskCode: "EXP-004",
      projectId: projectExpo.id,
      milestoneId: milestone2.id,
      title: "Cart discount & VAT calculation test suite",
      description:
        "Validate round-off precision and multi-item tax breakdown unit tests.",
      assigneeId: qaRamesh.id,
      createdById: leadRam.id,
      status: TaskStatus.IN_REVIEW,
      priority: Priority.HIGH,
      progress: 90,
      submittedForReviewAt: new Date("2026-09-24T16:00:00Z"),
      dueDate: new Date("2026-09-28T00:00:00Z"),
    },
  });

  // Task Updates
  await prisma.taskUpdate.createMany({
    data: [
      {
        taskId: task1.id,
        userId: devAbhishek.id,
        previousStatus: TaskStatus.TODO,
        newStatus: TaskStatus.IN_PROGRESS,
        previousProgress: 0,
        newProgress: 30,
        note: "Initialized checkout components and address forms.",
      },
      {
        taskId: task1.id,
        userId: devAbhishek.id,
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.IN_PROGRESS,
        previousProgress: 30,
        newProgress: 65,
        note: "Completed address and shipping selectors; working on payment options.",
      },
      {
        taskId: task2.id,
        userId: devSuman.id,
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.BLOCKED,
        previousProgress: 40,
        newProgress: 40,
        blockerReason:
          "Waiting for merchant test credentials from client finance team.",
        note: "Endpoint routes scaffolded, sandbox verification blocked on keys.",
      },
    ],
  });

  // Comments
  await prisma.taskComment.createMany({
    data: [
      {
        taskId: task2.id,
        userId: leadRam.id,
        content:
          "I reached out to client contact Mr. Koirala; expecting keys by tomorrow morning.",
      },
      {
        taskId: task1.id,
        userId: designerHari.id,
        content:
          "Figma tokens for payment radio cards have been updated in the style guide.",
      },
    ],
  });

  console.log("Seeding project resources...");
  await prisma.projectResource.createMany({
    data: [
      {
        projectId: projectExpo.id,
        relatedTaskId: task2.id,
        title: "Khalti Payment Gateway Official Documentation",
        url: "https://docs.khalti.com/epayment",
        description:
          "Official API reference for ePayment initiate and lookup flows.",
        category: ResourceCategory.API,
        tags: ["Khalti", "Payment", "API", "Docs"],
        addedById: devSuman.id,
      },
      {
        projectId: projectExpo.id,
        relatedTaskId: task3.id,
        title: "Expo Express UI Figma Workspace",
        url: "https://www.figma.com/file/expo-express-workspace",
        description:
          "Primary design tokens, wireframes, and mobile responsive screens.",
        category: ResourceCategory.DESIGN,
        tags: ["Figma", "UI/UX", "Design"],
        addedById: designerHari.id,
      },
      {
        projectId: projectExpo.id,
        title: "Next.js App Router Server Actions Reference",
        url: "https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations",
        description:
          "Standard documentation for form mutations and revalidations.",
        category: ResourceCategory.DOCUMENTATION,
        tags: ["Next.js", "React", "FullStack"],
        addedById: devAbhishek.id,
      },
    ],
  });

  console.log("Seeding activity logs...");
  await prisma.activityLog.createMany({
    data: [
      {
        actorId: admin.id,
        projectId: projectExpo.id,
        action: "PROJECT_CREATED",
        entityType: "Project",
        entityId: projectExpo.id,
        metadata: { name: projectExpo.name, code: projectExpo.projectCode },
      },
      {
        actorId: admin.id,
        projectId: projectExpo.id,
        action: "PROJECT_LEAD_ASSIGNED",
        entityType: "Project",
        entityId: projectExpo.id,
        metadata: {
          leadName: leadRam.name,
          leadEmployeeId: leadRam.employeeId,
        },
      },
      {
        actorId: leadRam.id,
        projectId: projectExpo.id,
        action: "TASK_CREATED",
        entityType: "Task",
        entityId: task1.id,
        metadata: {
          taskCode: task1.taskCode,
          title: task1.title,
          assignee: devAbhishek.name,
        },
      },
      {
        actorId: devSuman.id,
        projectId: projectExpo.id,
        action: "TASK_STATUS_CHANGED",
        entityType: "Task",
        entityId: task2.id,
        metadata: {
          taskCode: task2.taskCode,
          from: TaskStatus.IN_PROGRESS,
          to: TaskStatus.BLOCKED,
          reason:
            "Waiting for merchant test credentials from client finance team.",
        },
      },
    ],
  });

  console.log("Seeding notifications...");
  await prisma.notification.createMany({
    data: [
      {
        userId: devAbhishek.id,
        type: NotificationType.TASK_ASSIGNED,
        title: "New Task Assigned",
        message:
          "Ram Sharma assigned you to task EXP-001 (Checkout Module Implementation).",
        projectId: projectExpo.id,
        entityType: "Task",
        entityId: task1.id,
        isRead: false,
      },
      {
        userId: leadRam.id,
        type: NotificationType.TASK_REVIEW_REQUESTED,
        title: "Task Submitted for Review",
        message:
          "Ramesh Karki submitted EXP-004 (Cart discount & VAT calculation test suite) for your review.",
        projectId: projectExpo.id,
        entityType: "Task",
        entityId: task4.id,
        isRead: false,
      },
    ],
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
