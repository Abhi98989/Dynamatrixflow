import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject, canManageProject } from "@/server/auth/authorization";
import { notFound } from "next/navigation";
import { AddMemberForm } from "@/features/projects/add-member-form";
import { RemoveMemberButton } from "@/features/projects/remove-member-button";

interface Props { params: Promise<{ id: string }> }

export default async function TeamPage({ params }: Props) {
  const currentUser = await requireActiveUser();
  const { id: projectId } = await params;

  const hasAccess = await canViewProject(currentUser.id, projectId);
  if (!hasAccess) notFound();

  const isManager = await canManageProject(currentUser.id, projectId);

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      projectLeadId: true,
      members: {
        where: { removedAt: null },
        include: {
          user: { select: { id: true, name: true, employeeId: true, position: true, systemRole: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!project) notFound();

  // Get task counts per member
  // Get per-member task status breakdown
  const tasksByStatus = await db.task.groupBy({
    by: ["assigneeId", "status"],
    where: { projectId, archivedAt: null, assigneeId: { not: null } },
    _count: true,
  });
  // Build: { userId: { TODO: n, IN_PROGRESS: n, COMPLETED: n, total: n } }
  const statusMap: Record<string, { todo: number; inProgress: number; completed: number; total: number }> = {};
  for (const row of tasksByStatus) {
    const uid = row.assigneeId!;
    if (!statusMap[uid]) statusMap[uid] = { todo: 0, inProgress: 0, completed: 0, total: 0 };
    statusMap[uid].total += row._count;
    if (row.status === "TODO") statusMap[uid].todo += row._count;
    else if (row.status === "IN_PROGRESS" || row.status === "BLOCKED" || row.status === "IN_REVIEW") statusMap[uid].inProgress += row._count;
    else if (row.status === "COMPLETED") statusMap[uid].completed += row._count;
  }

  // Get available users (not already members)
  const memberIds = project.members.map(m => m.user.id);
  const availableUsers = isManager
    ? await db.user.findMany({
        where: {
          accountStatus: "ACTIVE",
          id: { notIn: memberIds },
        },
        select: { id: true, name: true, employeeId: true, position: true },
        orderBy: { name: "asc" },
      })
    : [];

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const formatEnum = (val: string) => val.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-[#101828]">Team</h2>
          <p className="text-[12px] text-[#667085] mt-0.5">{project.members.length} members assigned to this project</p>
        </div>
        {isManager && availableUsers.length > 0 && (
          <AddMemberForm projectId={projectId} availableUsers={availableUsers} />
        )}
      </div>

      {project.members.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E4E7EC] py-16 text-center">
          <p className="text-[13px] text-[#667085]">No team members assigned yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E4E7EC] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
              <tr>
                <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Member</th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Position</th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Project Role</th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase text-center">To Do</th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase text-center">Active</th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase text-center">Done</th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Joined</th>
                {isManager && <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F7]">
              {project.members.map(m => {
                const isLead = m.user.id === project.projectLeadId;
                return (
                  <tr key={m.id} className="hover:bg-[#F9FAFC] transition-colors h-11">
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#101828] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                          {getInitials(m.user.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-semibold text-[#101828]">{m.user.name}</span>
                            {isLead && <span className="px-1.5 py-0.5 rounded bg-[#5B5FEF]/10 text-[#5B5FEF] text-[9px] font-bold">LEAD</span>}
                          </div>
                          <span className="text-[11px] font-mono text-[#98A2B3]">{m.user.employeeId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-[13px] text-[#475467]">{m.user.position || "—"}</td>
                    <td className="py-2 px-4 text-[12px] text-[#475467]">{formatEnum(m.projectRole)}</td>
                    <td className="py-2 px-4 text-center">
                      <span className="text-[12px] font-semibold text-[#667085] tabular-nums">{statusMap[m.user.id]?.todo || 0}</span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className="text-[12px] font-semibold text-[#2563EB] tabular-nums">{statusMap[m.user.id]?.inProgress || 0}</span>
                    </td>
                    <td className="py-2 px-4 text-center">
                      <span className="text-[12px] font-semibold text-[#15803D] tabular-nums">{statusMap[m.user.id]?.completed || 0}</span>
                    </td>
                    <td className="py-2 px-4 text-[12px] text-[#98A2B3]">
                      {new Date(m.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    {isManager && (
                      <td className="py-2 px-4">
                        {!isLead && (
                          <RemoveMemberButton memberId={m.id} projectId={projectId} memberName={m.user.name} />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
