"use server";

import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { SystemRole } from "@prisma/client";

export interface SearchResultItem {
  id: string;
  type: "project" | "task" | "member" | "resource" | "navigation";
  title: string;
  subtitle?: string;
  badge?: string;
  url: string;
}

export async function globalSearchAction(query: string): Promise<SearchResultItem[]> {
  const user = await requireActiveUser();
  const trimmed = query.trim();

  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  const isAdmin = user.systemRole === SystemRole.ADMIN;
  const isGuest = (user.systemRole as string) === "GUEST";

  // 1. Search Projects
  const projectWhere: any = {
    OR: [
      { name: { contains: trimmed, mode: "insensitive" } },
      { projectCode: { contains: trimmed, mode: "insensitive" } },
      { clientName: { contains: trimmed, mode: "insensitive" } },
    ],
  };

  if (!isAdmin) {
    projectWhere.members = {
      some: { userId: user.id, removedAt: null },
    };
  }

  const projects = await db.project.findMany({
    where: projectWhere,
    select: {
      id: true,
      name: true,
      projectCode: true,
      status: true,
    },
    take: 5,
    orderBy: { updatedAt: "desc" },
  });

  const projectResults: SearchResultItem[] = projects.map((p) => ({
    id: `project-${p.id}`,
    type: "project",
    title: p.name,
    subtitle: `Project Code: ${p.projectCode}`,
    badge: p.status.replace("_", " "),
    url: `/projects/${p.id}`,
  }));

  // 2. Search Tasks
  const taskWhere: any = {
    archivedAt: null,
    OR: [
      { title: { contains: trimmed, mode: "insensitive" } },
      { taskCode: { contains: trimmed, mode: "insensitive" } },
    ],
  };

  if (!isAdmin) {
    taskWhere.project = {
      members: {
        some: { userId: user.id, removedAt: null },
      },
    };
  }

  const tasks = await db.task.findMany({
    where: taskWhere,
    select: {
      id: true,
      title: true,
      taskCode: true,
      status: true,
      projectId: true,
      project: { select: { name: true } },
    },
    take: 5,
    orderBy: { updatedAt: "desc" },
  });

  const taskResults: SearchResultItem[] = tasks.map((t) => ({
    id: `task-${t.id}`,
    type: "task",
    title: t.title,
    subtitle: `${t.taskCode} • ${t.project.name}`,
    badge: t.status.replace("_", " "),
    url: `/projects/${t.projectId}?task=${t.id}`,
  }));

  // 3. Search Team Members (hide internal team from Guests)
  let memberResults: SearchResultItem[] = [];
  if (!isGuest) {
    const members = await db.user.findMany({
      where: {
        accountStatus: "ACTIVE",
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { employeeId: { contains: trimmed, mode: "insensitive" } },
          { position: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        employeeId: true,
        position: true,
        systemRole: true,
      },
      take: 4,
    });

    memberResults = members.map((m) => ({
      id: `member-${m.id}`,
      type: "member",
      title: m.name,
      subtitle: `${m.position || "Team Member"} (${m.employeeId})`,
      badge: m.systemRole.replace("_", " "),
      url: `/team/${m.employeeId}`,
    }));
  }

  // 4. Search Resources
  const resourceWhere: any = {
    archivedAt: null,
    title: { contains: trimmed, mode: "insensitive" },
  };

  if (!isAdmin) {
    resourceWhere.project = {
      members: {
        some: { userId: user.id, removedAt: null },
      },
    };
  }

  const resources = await db.projectResource.findMany({
    where: resourceWhere,
    select: {
      id: true,
      title: true,
      category: true,
      projectId: true,
      project: { select: { name: true } },
      url: true,
    },
    take: 4,
  });

  const resourceResults: SearchResultItem[] = resources.map((r) => ({
    id: `res-${r.id}`,
    type: "resource",
    title: r.title,
    subtitle: `${r.category} • ${r.project.name}`,
    badge: "File / Link",
    url: r.url,
  }));

  return [...projectResults, ...taskResults, ...memberResults, ...resourceResults];
}
