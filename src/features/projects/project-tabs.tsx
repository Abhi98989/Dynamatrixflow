"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutTemplate, CheckSquare, Columns3, Map, Paperclip, Users, History, Settings } from "lucide-react";

const tabs = [
  { key: "", label: "Overview", icon: LayoutTemplate },
  { key: "/tasks", label: "Tasks", icon: CheckSquare, countKey: "tasks" },
  { key: "/board", label: "Board", icon: Columns3 },
  { key: "/milestones", label: "Milestones", icon: Map, countKey: "milestones" },
  { key: "/resources", label: "Resources", icon: Paperclip, countKey: "resources" },
  { key: "/team", label: "Team", icon: Users, countKey: "members" },
  { key: "/activity", label: "Activity", icon: History },
  { key: "/settings", label: "Settings", icon: Settings },
];

export function ProjectTabs({ projectId, counts }: { projectId: string; counts: Record<string, number> }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <div className="flex items-center gap-0.5 border-b border-[#E4E7EC] overflow-x-auto touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map(t => {
        const href = `${base}${t.key}`;
        const isActive = t.key === ""
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
                ? "text-[#5B5FEF] border-[#5B5FEF]"
                : "text-[#667085] border-transparent hover:text-[#101828] hover:border-[#D0D5DD]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t.label}
            {count !== undefined && count > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isActive ? "bg-[#5B5FEF]/10 text-[#5B5FEF]" : "bg-[#F2F4F7] text-[#667085]"
              }`}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
