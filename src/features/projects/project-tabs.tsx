"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutTemplate,
  CheckSquare,
  Columns3,
  Map,
  Paperclip,
  Users,
  History,
  Settings,
  MessageSquare,
} from "lucide-react";

const tabs = [
  { key: "", label: "Overview", icon: LayoutTemplate },
  { key: "/tasks", label: "Tasks", icon: CheckSquare, countKey: "tasks" },
  { key: "/board", label: "Board", icon: Columns3 },
  {
    key: "/milestones",
    label: "Milestones",
    icon: Map,
    countKey: "milestones",
  },
  {
    key: "/resources",
    label: "Resources",
    icon: Paperclip,
    countKey: "resources",
  },
  { key: "/team", label: "Team", icon: Users, countKey: "members" },
  {
    key: "/chat",
    label: "Chat",
    icon: MessageSquare,
    countKey: "messages",
  },
  { key: "/activity", label: "Activity", icon: History },
  { key: "/settings", label: "Settings", icon: Settings },
];

export function ProjectTabs({
  projectId,
  counts,
  isGuest = false,
}: {
  projectId: string;
  counts: Record<string, number>;
  isGuest?: boolean;
}) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const visibleTabs = isGuest
    ? tabs.filter((t) => t.key !== "/settings" && t.key !== "/activity")
    : tabs;

  return (
    <div className="flex items-center gap-0.5 border-b border-border overflow-x-auto touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {visibleTabs.map((t) => {
        const href = `${base}${t.key}`;
        const isActive =
          t.key === ""
            ? pathname === base || pathname === `${base}/`
            : pathname.startsWith(href);
        const count = t.countKey ? counts[t.countKey] : undefined;
        const Icon = t.icon;

        return (
          <Link
            key={t.key}
            href={href}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              isActive
                ? "text-primary border-primary"
                : "text-text-muted border-transparent hover:text-foreground hover:border-border-subtle"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t.label}
            {count !== undefined && count > 0 && (
              <span
                className={`ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-hover text-text-muted"
                }`}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
