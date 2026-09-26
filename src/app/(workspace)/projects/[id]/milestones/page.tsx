import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject } from "@/server/auth/authorization";
import { notFound } from "next/navigation";

interface Props { params: Promise<{ id: string }> }

export default async function MilestonesPage({ params }: Props) {
  const currentUser = await requireActiveUser();
  const { id: projectId } = await params;

  const hasAccess = await canViewProject(currentUser.id, projectId);
  if (!hasAccess) notFound();

  const now = new Date();

  const milestones = await db.milestone.findMany({
    where: { projectId, archivedAt: null },
    include: {
      tasks: { where: { archivedAt: null }, select: { status: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const formatEnum = (val: string) => val.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  const statusDot: Record<string, string> = {
    PLANNED: "bg-[#98A2B3]", IN_PROGRESS: "bg-[#2563EB]", COMPLETED: "bg-[#15803D]", ON_HOLD: "bg-[#D97706]",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[16px] font-semibold text-[#101828]">Milestones</h2>
        <p className="text-[12px] text-[#667085] mt-0.5">Track delivery phases and key checkpoints</p>
      </div>

      {milestones.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E4E7EC] py-16 text-center">
          <p className="text-[13px] text-[#667085]">No milestones created yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m, i) => {
            const total = m.tasks.length;
            const completed = m.tasks.filter(t => t.status === "COMPLETED").length;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            const isOverdue = m.deadline ? new Date(m.deadline) < now && m.status !== "COMPLETED" : false;
            const deadlineText = m.deadline
              ? new Date(m.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : null;
            return (
              <div key={m.id} className="bg-white rounded-lg border border-[#E4E7EC] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded bg-[#F2F4F7] flex items-center justify-center text-[12px] font-bold text-[#475467] shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-[#101828] truncate">{m.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDot[m.status] || statusDot.PLANNED}`} />
                          {formatEnum(m.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[#98A2B3]">
                        <span className="font-mono">{m.milestoneCode}</span>
                        {m.deadline && (
                          <span className={isOverdue ? "text-[#DC2626]" : ""}>
                            Due {deadlineText}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-[5px] bg-[#EAECF0] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${progress === 100 ? "bg-[#16A34A]" : "bg-[#5B5FEF]"}`} style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-[#475467] tabular-nums w-7 text-right">{progress}%</span>
                  </div>
                </div>
                {m.description && <p className="text-[12px] text-[#667085] mt-2 ml-10">{m.description}</p>}
                <div className="text-[11px] text-[#98A2B3] mt-2 ml-10">{completed}/{total} tasks completed</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
