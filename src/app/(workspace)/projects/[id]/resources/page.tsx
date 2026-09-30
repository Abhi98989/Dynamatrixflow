import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject } from "@/server/auth/authorization";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ResourcesPage({ params }: Props) {
  const currentUser = await requireActiveUser();
  const { id: projectId } = await params;

  const hasAccess = await canViewProject(currentUser.id, projectId);
  if (!hasAccess) notFound();

  const resources = await db.projectResource.findMany({
    where: { projectId, archivedAt: null },
    include: {
      addedBy: { select: { name: true } },
      relatedTask: { select: { title: true, taskCode: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatEnum = (val: string) =>
    val
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const catColor: Record<string, string> = {
    RESEARCH: "bg-[#EFF6FF] text-[#2563EB]",
    DOCUMENTATION: "bg-[#F0FDF4] text-[#15803D]",
    DEVELOPMENT: "bg-[#F5F3FF] text-[#7C3AED]",
    DESIGN: "bg-[#FDF2F8] text-[#DB2777]",
    API: "bg-[#FFFBEB] text-[#B45309]",
    CLIENT_REFERENCE: "bg-[#F1F5F9] text-[#64748B]",
    COMPETITOR: "bg-[#FEF2F2] text-[#DC2626]",
    MEETING: "bg-[#F0FDF4] text-[#15803D]",
    TUTORIAL: "bg-[#EFF6FF] text-[#2563EB]",
    OTHER: "bg-surface-hover text-text-muted",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[16px] font-semibold text-foreground">Resources</h2>
        <p className="text-[12px] text-text-muted mt-0.5">
          Documentation, links, and reference materials
        </p>
      </div>

      {resources.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border py-16 text-center">
          <p className="text-[13px] text-text-muted">No resources added yet.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="py-2.5 px-4 text-[11px] font-bold text-text-muted tracking-wider uppercase">
                  Title
                </th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-text-muted tracking-wider uppercase">
                  Category
                </th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-text-muted tracking-wider uppercase">
                  Added By
                </th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-text-muted tracking-wider uppercase">
                  Related Task
                </th>
                <th className="py-2.5 px-4 text-[11px] font-bold text-text-muted tracking-wider uppercase w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F4F7]">
              {resources.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-surface-hover transition-colors h-11"
                >
                  <td className="py-2 px-4">
                    <div>
                      <span className="text-[13px] font-semibold text-foreground">
                        {r.title}
                      </span>
                      {r.description && (
                        <p className="text-[11px] text-text-muted truncate max-w-xs mt-0.5">
                          {r.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${catColor[r.category] || catColor.OTHER}`}
                    >
                      {formatEnum(r.category)}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-[13px] text-text-secondary">
                    {r.addedBy.name}
                  </td>
                  <td className="py-2 px-4">
                    {r.relatedTask ? (
                      <span className="text-[11px] font-mono text-text-muted">
                        {r.relatedTask.taskCode}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#D0D5DD]">—</span>
                    )}
                  </td>
                  <td className="py-2 px-4">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-[#4C50D8]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
