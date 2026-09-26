import { Metadata } from 'next';
import { db } from '@/server/db/client';
import { requireActiveUser } from '@/server/auth/authorization';
import { TaskStatus, SystemRole, MilestoneStatus, ProjectStatus } from '@prisma/client';
import {
  UpcomingSchedule,
  UpcomingTaskItem,
  UpcomingMilestoneItem,
  UpcomingProjectItem,
} from '@/features/upcoming/upcoming-schedule';

export const metadata: Metadata = {
  title: 'Upcoming Deadlines | Dynamatrix Flow',
  description: 'Chronological timeline of deliverables, milestones, and project deadlines across Dynamatrix Flow.',
};

export default async function UpcomingDeadlinesPage() {
  const currentUser = await requireActiveUser();
  const isAdmin = currentUser.systemRole === SystemRole.ADMIN;

  // Determine accessible projects
  const userProjectFilter = isAdmin
    ? { archivedAt: null }
    : {
        archivedAt: null,
        OR: [
          { projectLeadId: currentUser.id },
          { members: { some: { userId: currentUser.id, removedAt: null } } },
          { tasks: { some: { assigneeId: currentUser.id } } },
        ],
      };

  const accessibleProjects = await db.project.findMany({
    where: userProjectFilter,
    select: {
      id: true,
      name: true,
      projectCode: true,
      status: true,
      priority: true,
      deadline: true,
      projectLead: { select: { id: true, name: true, employeeId: true } },
      _count: { select: { tasks: { where: { archivedAt: null } } } },
    },
    orderBy: { name: 'asc' },
  });

  const accessibleProjectIds = accessibleProjects.map((p) => p.id);

  // 1. Fetch upcoming tasks with due dates
  const rawTasks = await db.task.findMany({
    where: {
      archivedAt: null,
      dueDate: { not: null },
      status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      projectId: { in: accessibleProjectIds },
    },
    include: {
      project: { select: { id: true, name: true, projectCode: true, projectLeadId: true } },
      assignee: { select: { id: true, name: true, employeeId: true } },
      milestone: { select: { id: true, name: true, milestoneCode: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  // 2. Fetch upcoming milestones with deadlines
  const rawMilestones = await db.milestone.findMany({
    where: {
      archivedAt: null,
      deadline: { not: null },
      status: { not: MilestoneStatus.COMPLETED },
      projectId: { in: accessibleProjectIds },
    },
    include: {
      project: { select: { id: true, name: true, projectCode: true, projectLeadId: true } },
      tasks: { where: { archivedAt: null }, select: { status: true } },
    },
    orderBy: { deadline: 'asc' },
  });

  // 3. Extract projects that have deadlines and are not completed
  const rawProjectDeadlines = accessibleProjects.filter(
    (p) =>
      p.deadline !== null &&
      p.status !== ProjectStatus.COMPLETED &&
      p.status !== ProjectStatus.ARCHIVED
  );

  // Serialize to JSON-safe client format
  const tasks: UpcomingTaskItem[] = rawTasks.map((t) => ({
    type: 'TASK',
    id: t.id,
    taskCode: t.taskCode,
    title: t.title,
    status: t.status,
    priority: t.priority,
    progress: t.progress,
    dueDate: t.dueDate!.toISOString(),
    blockerReason: t.blockerReason,
    projectId: t.projectId,
    project: {
      id: t.project.id,
      name: t.project.name,
      projectCode: t.project.projectCode,
      projectLeadId: t.project.projectLeadId,
    },
    assignee: t.assignee
      ? {
          id: t.assignee.id,
          name: t.assignee.name,
          employeeId: t.assignee.employeeId,
        }
      : null,
    milestone: t.milestone
      ? {
          id: t.milestone.id,
          name: t.milestone.name,
          milestoneCode: t.milestone.milestoneCode,
        }
      : null,
  }));

  const milestones: UpcomingMilestoneItem[] = rawMilestones.map((m) => ({
    type: 'MILESTONE',
    id: m.id,
    milestoneCode: m.milestoneCode,
    name: m.name,
    status: m.status,
    deadline: m.deadline!.toISOString(),
    projectId: m.projectId,
    project: {
      id: m.project.id,
      name: m.project.name,
      projectCode: m.project.projectCode,
      projectLeadId: m.project.projectLeadId,
    },
    totalTasks: m.tasks.length,
    completedTasks: m.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
  }));

  const projects: UpcomingProjectItem[] = rawProjectDeadlines.map((p) => ({
    type: 'PROJECT',
    id: p.id,
    projectCode: p.projectCode,
    name: p.name,
    status: p.status,
    priority: p.priority,
    deadline: p.deadline!.toISOString(),
    projectLead: p.projectLead,
    totalTasks: p._count.tasks,
  }));

  const projectOptions = accessibleProjects.map((p) => ({
    id: p.id,
    name: p.name,
    projectCode: p.projectCode,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <UpcomingSchedule
        currentUserId={currentUser.id}
        isAdmin={isAdmin}
        tasks={tasks}
        milestones={milestones}
        projects={projects}
        projectOptions={projectOptions}
      />
    </div>
  );
}
