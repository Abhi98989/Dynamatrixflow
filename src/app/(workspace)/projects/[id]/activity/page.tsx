import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject } from "@/server/auth/authorization";
import { notFound } from "next/navigation";

interface Props { params: Promise<{ id: string }> }

export default async function ActivityPage({ params }: Props) {
  const currentUser = await requireActiveUser();
  const { id: projectId } = await params;

  const hasAccess = await canViewProject(currentUser.id, projectId);
  if (!hasAccess) notFound();

  const logs = await db.activityLog.findMany({
    where: { projectId },
    include: {
      actor: { select: { name: true, employeeId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  // Group logs by date
  const grouped: Record<string, typeof logs> = {};
  for (const log of logs) {
    const key = new Date(log.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[16px] font-semibold text-[#101828]">Activity</h2>
        <p className="text-[12px] text-[#667085] mt-0.5">Recent actions and changes on this project</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E4E7EC] py-16 text-center">
          <p className="text-[13px] text-[#667085]">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <h3 className="text-[11px] font-bold text-[#98A2B3] uppercase tracking-wider mb-3">{date}</h3>
              <div className="space-y-0">
                {entries.map(log => (
                  <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-[#F2F4F7] last:border-0">
                    <div className="w-6 h-6 rounded-full bg-[#F2F4F7] text-[#475467] flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">
                      {log.actor ? getInitials(log.actor.name) : "SY"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#101828]">
                        <span className="font-semibold">{log.actor?.name || "System"}</span>{" "}
                        <span className="text-[#475467]">{log.action}</span>
                      </p>
                      {log.metadata && typeof log.metadata === "object" && "previousStatus" in log.metadata && (
                        <p className="text-[11px] text-[#98A2B3] mt-0.5">
                          {String((log.metadata as Record<string, unknown>).previousStatus)} → {String((log.metadata as Record<string, unknown>).newStatus)}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-[#98A2B3] shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
