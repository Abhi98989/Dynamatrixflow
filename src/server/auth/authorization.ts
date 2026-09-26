import { getCurrentUser } from "./index";
import { db } from "@/server/db/client";
import { SystemRole, AccountStatus, TaskStatus } from "@prisma/client";

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationError extends Error {
  constructor(message = "You must be signed in to perform this action.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Ensures a user is signed in.
 */
export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthenticationError();
  }
  return user;
}

/**
 * Ensures an authenticated user has an ACTIVE account status.
 */
export async function requireActiveUser() {
  const user = await requireAuthenticatedUser();
  if (user.accountStatus !== AccountStatus.ACTIVE) {
    throw new AuthorizationError("Your account is inactive or suspended.");
  }
  return user;
}

/**
 * Ensures the authenticated user is an organization ADMIN.
 */
export async function requireAdmin() {
  const user = await requireActiveUser();
  if (user.systemRole !== SystemRole.ADMIN) {
    throw new AuthorizationError("Administrator privileges required.");
  }
  return user;
}

/**
 * Checks if the user can view the specified project.
 * Admin can view all projects. Project leads and active members can view their projects.
 */
export async function canViewProject(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { systemRole: true, accountStatus: true },
  });

  if (!user || user.accountStatus !== AccountStatus.ACTIVE) return false;
  if (user.systemRole === SystemRole.ADMIN) return true;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      projectLeadId: true,
      members: {
        where: { userId, removedAt: null },
        select: { id: true },
      },
    },
  });

  if (!project) return false;
  return project.projectLeadId === userId || project.members.length > 0;
}

/**
 * Checks if the user can manage the specified project (Admin or designated Project Lead).
 */
export async function canManageProject(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { systemRole: true, accountStatus: true },
  });

  if (!user || user.accountStatus !== AccountStatus.ACTIVE) return false;
  if (user.systemRole === SystemRole.ADMIN) return true;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { projectLeadId: true },
  });

  return project?.projectLeadId === userId;
}

/**
 * Asserts that the authenticated user has view access to the project.
 */
export async function requireProjectAccess(projectId: string) {
  const user = await requireActiveUser();
  const allowed = await canViewProject(user.id, projectId);
  if (!allowed) {
    throw new AuthorizationError("You do not have access to this project.");
  }
  return user;
}

/**
 * Asserts that the authenticated user is Admin or the Project Lead.
 */
export async function requireProjectManage(projectId: string) {
  const user = await requireActiveUser();
  const allowed = await canManageProject(user.id, projectId);
  if (!allowed) {
    throw new AuthorizationError(
      "You do not have permission to manage this project.",
    );
  }
  return user;
}

/**
 * Checks if the user can add or remove members in a project.
 */
export async function canManageMembers(
  userId: string,
  projectId: string,
): Promise<boolean> {
  return canManageProject(userId, projectId);
}

/**
 * Checks if the user can create tasks within a project.
 */
export async function canCreateTask(
  userId: string,
  projectId: string,
): Promise<boolean> {
  return canManageProject(userId, projectId);
}

/**
 * Checks if the user can update the given task.
 */
export async function canUpdateTask(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { systemRole: true, accountStatus: true },
  });

  if (!user || user.accountStatus !== AccountStatus.ACTIVE) return false;
  if (user.systemRole === SystemRole.ADMIN) return true;

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      assigneeId: true,
      project: { select: { projectLeadId: true } },
    },
  });

  if (!task) return false;
  return task.assigneeId === userId || task.project.projectLeadId === userId;
}

/**
 * Validates allowed status transitions for a task by role.
 */
export function isAllowedStatusTransition(
  userRole: SystemRole,
  isLeadOrAdmin: boolean,
  isAssignee: boolean,
  currentStatus: TaskStatus,
  newStatus: TaskStatus,
): boolean {
  if (currentStatus === newStatus) return true;

  // Project Lead or Admin have broader workflow control
  if (isLeadOrAdmin) {
    if (newStatus === TaskStatus.CANCELLED) return true;
    if (
      currentStatus === TaskStatus.TODO &&
      newStatus === TaskStatus.IN_PROGRESS
    )
      return true;
    if (
      currentStatus === TaskStatus.IN_PROGRESS &&
      (newStatus === TaskStatus.BLOCKED || newStatus === TaskStatus.IN_REVIEW)
    )
      return true;
    if (
      currentStatus === TaskStatus.BLOCKED &&
      newStatus === TaskStatus.IN_PROGRESS
    )
      return true;
    if (
      currentStatus === TaskStatus.IN_REVIEW &&
      (newStatus === TaskStatus.COMPLETED ||
        newStatus === TaskStatus.IN_PROGRESS)
    )
      return true;
    if (
      currentStatus === TaskStatus.COMPLETED &&
      newStatus === TaskStatus.IN_PROGRESS
    )
      return true; // Reopen
    return false;
  }

  // Assignee Employee: normal execution lifecycle
  if (isAssignee) {
    if (
      currentStatus === TaskStatus.TODO &&
      newStatus === TaskStatus.IN_PROGRESS
    )
      return true;
    if (
      currentStatus === TaskStatus.IN_PROGRESS &&
      (newStatus === TaskStatus.BLOCKED || newStatus === TaskStatus.IN_REVIEW)
    )
      return true;
    if (
      currentStatus === TaskStatus.BLOCKED &&
      newStatus === TaskStatus.IN_PROGRESS
    )
      return true;
    // Cannot approve own review into COMPLETED
    return false;
  }

  return false;
}

/**
 * Checks if the user can review and approve a task submission.
 */
export async function canReviewTask(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { systemRole: true, accountStatus: true },
  });

  if (!user || user.accountStatus !== AccountStatus.ACTIVE) return false;
  if (user.systemRole === SystemRole.ADMIN) return true;

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      assigneeId: true,
      project: { select: { projectLeadId: true } },
    },
  });

  if (!task) return false;
  // A Lead can review, but employees cannot approve their own review
  return task.project.projectLeadId === userId && task.assigneeId !== userId;
}

/**
 * Checks if the user can manage/archive a project resource.
 */
export async function canManageResource(
  userId: string,
  resourceId: string,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { systemRole: true, accountStatus: true },
  });

  if (!user || user.accountStatus !== AccountStatus.ACTIVE) return false;
  if (user.systemRole === SystemRole.ADMIN) return true;

  const resource = await db.projectResource.findUnique({
    where: { id: resourceId },
    select: {
      addedById: true,
      project: { select: { projectLeadId: true } },
    },
  });

  if (!resource) return false;
  return (
    resource.addedById === userId || resource.project.projectLeadId === userId
  );
}
