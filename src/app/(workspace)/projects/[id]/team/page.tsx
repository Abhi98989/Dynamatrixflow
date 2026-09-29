import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject, canManageProject } from "@/server/auth/authorization";
import { notFound } from "next/navigation";
import { AddMemberForm } from "@/features/projects/add-member-form";
import { RemoveMemberButton } from "@/features/projects/remove-member-button";
import { GenerateGuestDialog } from "@/features/guests/generate-guest-dialog";
import { RevokeGuestButton } from "@/features/guests/revoke-guest-button";
import { ShieldCheck } from "lucide-react";
import { SystemRole } from "@prisma/client";

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
      name: true,
      projectCode: true,
      projectLeadId: true,
      members: {
        where: { removedAt: null },
        include: {
          user: { select: { id: true, name: true, email: true, employeeId: true, position: true, systemRole: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!project) notFound();

  const teamMembers = project.members.filter(m => (m.user.systemRole as string) !== "GUEST");
  const guestMembers = project.members.filter(m => (m.user.systemRole as string) === "GUEST");

  // Get task counts per member
  const tasksByStatus = await db.task.groupBy({
    by: ["assigneeId", "status"],
    where: { projectId, archivedAt: null, assigneeId: { not: null } },
    _count: true,
  });

  const statusMap: Record<string, { todo: number; inProgress: number; completed: number; total: number }> = {};
  for (const row of tasksByStatus) {
    const uid = row.assigneeId!;
    if (!statusMap[uid]) statusMap[uid] = { todo: 0, inProgress: 0, completed: 0, total: 0 };
    statusMap[uid].total += row._count;
    if (row.status === "TODO") statusMap[uid].todo += row._count;
    else if (row.status === "IN_PROGRESS" || row.status === "BLOCKED" || row.status === "IN_REVIEW") statusMap[uid].inProgress += row._count;
    else if (row.status === "COMPLETED") statusMap[uid].completed += row._count;
  }

  // Get available users (not already members and not guests)
  const memberIds = project.members.map(m => m.user.id);
  const availableUsers = isManager
    ? await db.user.findMany({
        where: {
          accountStatus: "ACTIVE",
          systemRole: { not: SystemRole.GUEST },
          id: { notIn: memberIds },
        },
        select: { id: true, name: true, employeeId: true, position: true },
        orderBy: { name: "asc" },
      })
    : [];

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const formatEnum = (val: string) => val.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  return (
    <div className="space-y-6">
      {/* Team Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-[#101828]">Project Team</h2>
          <p className="text-[12px] text-[#667085] mt-0.5">{teamMembers.length} team members assigned</p>
        </div>
        {isManager && (
          <div className="flex items-center gap-2 flex-wrap">
            <GenerateGuestDialog
              projectId={projectId}
              projectName={project.name}
              projectCode={project.projectCode}
            />
            {availableUsers.length > 0 && (
              <AddMemberForm projectId={projectId} availableUsers={availableUsers} />
            )}
          </div>
        )}
      </div>

      {/* Internal Team Table */}
      {teamMembers.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E4E7EC] py-16 text-center">
          <p className="text-[13px] text-[#667085]">No internal team members assigned yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E4E7EC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[680px]">
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
                {teamMembers.map(m => {
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
        </div>
      )}

      {/* Guest Observers Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold text-[#101828]">Guest Observers</h3>
              <p className="text-[12px] text-[#667085]">
                External stakeholders with read-only visibility into milestones and progress %
              </p>
            </div>
          </div>
          {isManager && guestMembers.length > 0 && (
            <GenerateGuestDialog
              projectId={projectId}
              projectName={project.name}
              projectCode={project.projectCode}
            />
          )}
        </div>

        {guestMembers.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E4E7EC] p-6 text-center">
            <ShieldCheck className="w-8 h-8 text-[#98A2B3] mx-auto mb-2 opacity-60" />
            <p className="text-[13px] font-medium text-[#101828]">No Guest Observers Assigned</p>
            <p className="text-[12px] text-[#667085] mt-1 max-w-md mx-auto">
              You can generate guest credentials to give external stakeholders real-time visibility into project delivery roadmaps.
            </p>
            {isManager && (
              <div className="mt-3">
                <GenerateGuestDialog
                  projectId={projectId}
                  projectName={project.name}
                  projectCode={project.projectCode}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[#E4E7EC] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
                  <tr>
                    <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Guest Observer</th>
                    <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Guest ID</th>
                    <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Email</th>
                    <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Permissions</th>
                    <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase">Access Granted</th>
                    {isManager && <th className="py-2.5 px-4 text-[11px] font-bold text-[#667085] tracking-wider uppercase text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F4F7]">
                  {guestMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F9FAFC] transition-colors h-11">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                            {getInitials(m.user.name)}
                          </div>
                          <span className="text-[13px] font-semibold text-[#101828]">{m.user.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <span className="font-mono text-xs font-bold text-[#101828] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {m.user.employeeId}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-xs text-[#475467] font-medium">{m.user.email || "—"}</td>
                      <td className="py-2 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1 h-1 rounded-full bg-emerald-600" />
                          Read-Only Monitor
                        </span>
                      </td>
                      <td className="py-2 px-4 text-[12px] text-[#98A2B3]">
                        {new Date(m.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      {isManager && (
                        <td className="py-2 px-4 text-right">
                          <RevokeGuestButton
                            guestUserId={m.user.id}
                            projectId={projectId}
                            guestName={m.user.name}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
