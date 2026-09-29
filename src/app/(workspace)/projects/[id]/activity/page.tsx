import { db } from "@/server/db/client";
import { requireActiveUser, canViewProject } from "@/server/auth/authorization";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  CheckSquare,
  ArrowRight,
  UserPlus,
  UserMinus,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Send,
  CheckCircle2,
  RotateCcw,
  FileText,
  Flag,
  FolderKanban,
  Activity,
  UserRound,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

function formatEnum(val: string): string {
  return val
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(name?: string | null): string {
  if (!name) return "SY";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export default async function ActivityPage({ params }: Props) {
  const currentUser = await requireActiveUser();
  const { id: projectId } = await params;

  const hasAccess = await canViewProject(currentUser.id, projectId);
  if (!hasAccess) notFound();

  const logs = await db.activityLog.findMany({
    where: { projectId },
    include: {
      actor: { select: { id: true, name: true, employeeId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Collect related entity IDs to hydrate rich descriptions
  const taskIds = new Set<string>();
  const commentIds = new Set<string>();

  for (const log of logs) {
    if (
      (log.entityType?.toUpperCase() === "TASK" ||
        log.action.startsWith("TASK_")) &&
      log.entityId
    ) {
      taskIds.add(log.entityId);
    }
    const meta = (log.metadata as Record<string, unknown>) || {};
    if (typeof meta.commentId === "string") {
      commentIds.add(meta.commentId);
    }
  }

  const [tasks, comments] = await Promise.all([
    taskIds.size > 0
      ? db.task.findMany({
          where: { id: { in: Array.from(taskIds) } },
          select: { id: true, taskCode: true, title: true },
        })
      : [],
    commentIds.size > 0
      ? db.taskComment.findMany({
          where: { id: { in: Array.from(commentIds) } },
          select: { id: true, content: true },
        })
      : [],
  ]);

  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const commentMap = new Map(comments.map((c) => [c.id, c.content]));

  // Group logs by date
  const grouped: Record<string, typeof logs> = {};
  for (const log of logs) {
    const key = new Date(log.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(log);
  }

  // Render descriptive action content
  const renderActionContent = (log: (typeof logs)[number]) => {
    const meta = (log.metadata as Record<string, unknown>) || {};
    const task = log.entityId ? taskMap.get(log.entityId) : null;
    const taskCode =
      (typeof meta.taskCode === "string" ? meta.taskCode : null) ||
      task?.taskCode ||
      "";
    const taskTitle =
      (typeof meta.taskTitle === "string"
        ? meta.taskTitle
        : typeof meta.title === "string"
          ? meta.title
          : null) ||
      task?.title ||
      "";
    const taskHref = log.entityId
      ? `/projects/${projectId}/tasks/${log.entityId}`
      : null;

    const renderTaskLink = () => {
      if (!taskHref) return <span>task {taskCode || "item"}</span>;
      return (
        <Link
          href={taskHref}
          className="font-medium text-[#5B5FEF] hover:text-[#4C50D8] hover:underline"
        >
          {taskCode ? `[${taskCode}]` : "task"}{taskTitle ? ` ${taskTitle}` : ""}
        </Link>
      );
    };

    switch (log.action) {
      case "TASK_COMMENT_CREATED":
      case "CREATED_COMMENT": {
        const commentPreview =
          (typeof meta.commentPreview === "string" ? meta.commentPreview : null) ||
          (typeof meta.commentId === "string"
            ? commentMap.get(meta.commentId)
            : null) ||
          (typeof meta.content === "string" ? meta.content : null);

        return {
          icon: MessageSquare,
          iconColor: "text-[#5B5FEF]",
          iconBg: "bg-[#EEF4FF]",
          description: (
            <span>
              commented on {renderTaskLink()}
            </span>
          ),
          extra: commentPreview ? (
            <div className="mt-1.5 pl-3 border-l-2 border-[#D0D5DD] text-[12px] text-[#475467] bg-[#F9FAFB] py-1 px-2.5 rounded-r">
              <p className="line-clamp-2 italic font-normal">&ldquo;{commentPreview}&rdquo;</p>
            </div>
          ) : null,
        };
      }

      case "TASK_CREATED":
      case "CREATED_TASK":
        return {
          icon: CheckSquare,
          iconColor: "text-[#2563EB]",
          iconBg: "bg-[#EFF8FF]",
          description: (
            <span>
              created task {renderTaskLink()}
            </span>
          ),
        };

      case "TASK_STATUS_CHANGED":
      case "UPDATED_TASK_STATUS": {
        const oldStatus = meta.oldStatus || meta.previousStatus;
        const newStatus = meta.newStatus;
        return {
          icon: ArrowRight,
          iconColor: "text-[#F79009]",
          iconBg: "bg-[#FFFAEB]",
          description: (
            <span>
              updated status of {renderTaskLink()}
            </span>
          ),
          extra:
            oldStatus && newStatus ? (
              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-[#F2F4F7] text-[#475467] font-medium">
                  {formatEnum(String(oldStatus))}
                </span>
                <span className="text-[#98A2B3]">→</span>
                <span className="px-2 py-0.5 rounded bg-[#EFF8FF] text-[#175CD3] font-semibold">
                  {formatEnum(String(newStatus))}
                </span>
              </div>
            ) : null,
        };
      }

      case "TASK_REASSIGNED":
        return {
          icon: UserRound,
          iconColor: "text-[#7C3AED]",
          iconBg: "bg-[#F9F5FF]",
          description: (
            <span>
              reassigned {renderTaskLink()}
              {typeof meta.newAssigneeName === "string" ? (
                <> to <span className="font-semibold text-[#101828]">{meta.newAssigneeName}</span></>
              ) : null}
            </span>
          ),
        };

      case "TASK_SUBMITTED_FOR_REVIEW":
      case "REQUESTED_REVIEW":
        return {
          icon: Send,
          iconColor: "text-[#7C3AED]",
          iconBg: "bg-[#F9F5FF]",
          description: (
            <span>
              submitted {renderTaskLink()} for review
            </span>
          ),
          extra: meta.note ? (
            <p className="mt-1 text-[12px] text-[#475467] bg-[#F9FAFB] border border-[#EAECF0] py-1 px-2.5 rounded">
              Note: &ldquo;{String(meta.note)}&rdquo;
            </p>
          ) : null,
        };

      case "TASK_REVIEW_APPROVED":
      case "APPROVED_REVIEW":
        return {
          icon: CheckCircle2,
          iconColor: "text-[#12B76A]",
          iconBg: "bg-[#ECFDF3]",
          description: (
            <span>
              approved task {renderTaskLink()}
            </span>
          ),
        };

      case "TASK_CHANGES_REQUESTED":
        return {
          icon: AlertTriangle,
          iconColor: "text-[#F04438]",
          iconBg: "bg-[#FEF3F2]",
          description: (
            <span>
              requested changes on {renderTaskLink()}
            </span>
          ),
          extra: meta.note ? (
            <p className="mt-1 text-[12px] text-[#475467] bg-[#F9FAFB] border border-[#EAECF0] py-1 px-2.5 rounded">
              Feedback: &ldquo;{String(meta.note)}&rdquo;
            </p>
          ) : null,
        };

      case "TASK_REOPENED":
        return {
          icon: RotateCcw,
          iconColor: "text-[#667085]",
          iconBg: "bg-[#F2F4F7]",
          description: (
            <span>
              reopened {renderTaskLink()}
            </span>
          ),
        };

      case "GUEST_ACCESS_GRANTED":
        return {
          icon: ShieldCheck,
          iconColor: "text-[#7C3AED]",
          iconBg: "bg-[#F9F5FF]",
          description: (
            <span>
              granted guest access to{" "}
              <span className="font-semibold text-[#101828]">
                {String(meta.name || meta.email || "a guest user")}
              </span>
              {meta.email && meta.name ? (
                <span className="text-[#667085] ml-1 font-normal">
                  ({String(meta.email)})
                </span>
              ) : null}
            </span>
          ),
        };

      case "GUEST_ACCESS_REVOKED":
        return {
          icon: ShieldAlert,
          iconColor: "text-[#F04438]",
          iconBg: "bg-[#FEF3F2]",
          description: (
            <span>
              revoked guest access for{" "}
              <span className="font-semibold text-[#101828]">
                {String(meta.name || meta.email || "a guest user")}
              </span>
            </span>
          ),
        };

      case "PROJECT_MEMBER_ADDED":
      case "ADDED_MEMBER":
        return {
          icon: UserPlus,
          iconColor: "text-[#12B76A]",
          iconBg: "bg-[#ECFDF3]",
          description: (
            <span>
              added{" "}
              <span className="font-semibold text-[#101828]">
                {String(meta.targetUserName || meta.memberName || "a member")}
              </span>{" "}
              to the project
              {meta.projectRole ? (
                <>
                  {" "}as{" "}
                  <span className="px-1.5 py-0.5 rounded bg-[#F2F4F7] text-[11px] font-medium text-[#344054]">
                    {formatEnum(String(meta.projectRole))}
                  </span>
                </>
              ) : null}
            </span>
          ),
        };

      case "PROJECT_MEMBER_REMOVED":
      case "REMOVED_MEMBER":
        return {
          icon: UserMinus,
          iconColor: "text-[#F04438]",
          iconBg: "bg-[#FEF3F2]",
          description: (
            <span>
              removed{" "}
              <span className="font-semibold text-[#101828]">
                {String(meta.targetUserName || meta.memberName || "a member")}
              </span>{" "}
              from the project
            </span>
          ),
        };

      case "PROJECT_MEMBER_ROLE_CHANGED":
        return {
          icon: UserRound,
          iconColor: "text-[#2563EB]",
          iconBg: "bg-[#EFF8FF]",
          description: (
            <span>
              updated{" "}
              <span className="font-semibold text-[#101828]">
                {String(meta.targetUserName || "member")}
              </span>
              &apos;s role to{" "}
              <span className="font-semibold text-[#101828]">
                {formatEnum(String(meta.projectRole || meta.newRole || ""))}
              </span>
            </span>
          ),
        };

      case "CREATED_RESOURCE":
      case "RESOURCE_CREATED":
        return {
          icon: FileText,
          iconColor: "text-[#0E9384]",
          iconBg: "bg-[#F0FDF9]",
          description: (
            <span>
              added resource{" "}
              <span className="font-semibold text-[#101828]">
                &ldquo;{String(meta.title || "link")}&rdquo;
              </span>
            </span>
          ),
        };

      case "UPDATED_RESOURCE":
      case "RESOURCE_UPDATED":
        return {
          icon: FileText,
          iconColor: "text-[#0E9384]",
          iconBg: "bg-[#F0FDF9]",
          description: (
            <span>
              updated resource{" "}
              <span className="font-semibold text-[#101828]">
                &ldquo;{String(meta.title || "link")}&rdquo;
              </span>
            </span>
          ),
        };

      case "ARCHIVED_RESOURCE":
      case "RESOURCE_ARCHIVED":
        return {
          icon: FileText,
          iconColor: "text-[#F04438]",
          iconBg: "bg-[#FEF3F2]",
          description: (
            <span>
              archived resource{" "}
              <span className="font-semibold text-[#101828]">
                &ldquo;{String(meta.title || "link")}&rdquo;
              </span>
            </span>
          ),
        };

      case "MILESTONE_CREATED":
        return {
          icon: Flag,
          iconColor: "text-[#5B5FEF]",
          iconBg: "bg-[#EEF4FF]",
          description: (
            <span>
              created milestone{" "}
              <span className="font-semibold text-[#101828]">
                &ldquo;{String(meta.name || meta.title || "milestone")}&rdquo;
              </span>
            </span>
          ),
        };

      case "MILESTONE_UPDATED":
        return {
          icon: Flag,
          iconColor: "text-[#5B5FEF]",
          iconBg: "bg-[#EEF4FF]",
          description: (
            <span>
              updated milestone{" "}
              <span className="font-semibold text-[#101828]">
                &ldquo;{String(meta.name || meta.title || "milestone")}&rdquo;
              </span>
            </span>
          ),
        };

      case "MILESTONE_ARCHIVED":
        return {
          icon: Flag,
          iconColor: "text-[#F04438]",
          iconBg: "bg-[#FEF3F2]",
          description: (
            <span>
              archived milestone{" "}
              <span className="font-semibold text-[#101828]">
                &ldquo;{String(meta.name || meta.title || "milestone")}&rdquo;
              </span>
            </span>
          ),
        };

      case "PROJECT_CREATED":
      case "CREATED_PROJECT":
        return {
          icon: FolderKanban,
          iconColor: "text-[#2563EB]",
          iconBg: "bg-[#EFF8FF]",
          description: <span>created the project</span>,
        };

      case "PROJECT_UPDATED":
        return {
          icon: FolderKanban,
          iconColor: "text-[#667085]",
          iconBg: "bg-[#F2F4F7]",
          description: <span>updated project settings</span>,
        };

      case "PROJECT_ARCHIVED":
        return {
          icon: FolderKanban,
          iconColor: "text-[#F04438]",
          iconBg: "bg-[#FEF3F2]",
          description: <span>archived the project</span>,
        };

      default:
        return {
          icon: Activity,
          iconColor: "text-[#667085]",
          iconBg: "bg-[#F2F4F7]",
          description: (
            <span>{log.action.replace(/_/g, " ").toLowerCase()}</span>
          ),
        };
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[16px] font-semibold text-[#101828]">Activity</h2>
        <p className="text-[12px] text-[#667085] mt-0.5">
          Recent actions and changes on this project
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E4E7EC] py-16 text-center">
          <p className="text-[13px] text-[#667085]">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <h3 className="text-[11px] font-bold text-[#98A2B3] uppercase tracking-wider mb-3">
                {date}
              </h3>
              <div className="bg-white rounded-lg border border-[#E4E7EC] divide-y divide-[#F2F4F7]">
                {entries.map((log) => {
                  const details = renderActionContent(log);
                  const Icon = details.icon;

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3.5 hover:bg-[#F9FAFB]/60 transition-colors"
                    >
                      {/* Avatar with role/action icon badge */}
                      <div className="relative shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-[#F2F4F7] text-[#344054] flex items-center justify-center text-[10px] font-bold border border-[#EAECF0]">
                          {getInitials(log.actor?.name)}
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${details.iconBg} ${details.iconColor} flex items-center justify-center border border-white`}
                        >
                          <Icon className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[#344054] leading-snug">
                          <span className="font-semibold text-[#101828]">
                            {log.actor?.name || "System"}
                          </span>{" "}
                          {details.description}
                        </div>
                        {details.extra}
                      </div>

                      {/* Timestamp */}
                      <span className="text-[11px] text-[#98A2B3] shrink-0 font-medium whitespace-nowrap pl-2">
                        {new Date(log.createdAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

