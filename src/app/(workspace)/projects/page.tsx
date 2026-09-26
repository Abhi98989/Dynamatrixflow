import { Metadata } from "next";
import { db } from "@/server/db/client";
import { requireActiveUser } from "@/server/auth/authorization";
import { ProjectList } from "@/features/projects/project-list";
import { SystemRole, TaskStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Projects | Dynamatrix Flow",
  description: "All active, archived, and pipeline client & internal engineering projects.",
};

export default async function ProjectsPage() {
  const currentUser = await requireActiveUser();
  const isAdmin = currentUser.systemRole === SystemRole.ADMIN;

  const projects = await db.project.findMany({
    where: isAdmin ? {} : {
      OR: [
        { projectLeadId: currentUser.id },
        { members: { some: { userId: currentUser.id, removedAt: null } } },
      ],
    },
    select: {
      id: true,
      projectCode: true,
      name: true,
      clientName: true,
      status: true,
      priority: true,
      deadline: true,
      projectLead: { select: { name: true } },
      members: { 
        where: { removedAt: null },
        select: { user: { select: { name: true } } },
        take: 5 
      },
      tasks: { select: { id: true, status: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const enrichedProjects = projects.map((p) => {
    const total = p.tasks ? p.tasks.length : 0;
    const completed = p.tasks ? p.tasks.filter(t => t.status === TaskStatus.COMPLETED).length : 0;
    return {
      ...p,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  return (
    <div className="w-full">
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        <ProjectList projects={enrichedProjects} />
      </div>
    </div>
  );
}
