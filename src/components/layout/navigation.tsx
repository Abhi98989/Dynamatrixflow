"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, CalendarClock, CheckSquare, FolderKanban, LayoutDashboard,
  Users, Library, Settings, UserCircle, type LucideIcon
} from "lucide-react";

type NavItem = { label: string, href: string, icon: LucideIcon, badge?: number };
const navGroups: { label: string, items: NavItem[] }[] = [
  {
    label: "MAIN",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "WORK",
    items: [
      { label: "Projects", href: "/projects", icon: FolderKanban },
      { label: "My Tasks", href: "/my-tasks", icon: CheckSquare },
      { label: "Upcoming", href: "/upcoming", icon: CalendarClock },
    ],
  },
  {
    label: "COMPANY",
    items: [
      { label: "Team", href: "/team", icon: Users },
      { label: "Resources", href: "/resources", icon: Library },
    ],
  },
  {
    label: "ACTIVITY",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, badge: 3 },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { label: "Profile", href: "/profile", icon: UserCircle },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-5 pb-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-4 text-[11px] font-bold text-[#64748B] tracking-wider uppercase">
            {group.label}
          </p>
          <ul className="flex flex-col gap-1">
            {group.items.map(({ label, href, icon: Icon, badge }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={label} className="px-3">
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={isActive
                      ? "flex items-center justify-between px-3 py-2.5 bg-[#1E293B] text-white border-l-2 border-[#10B981] rounded-r-md transition-colors"
                      : "flex items-center justify-between px-3 py-2.5 text-[#94A3B8] hover:text-white hover:bg-[#1E293B]/50 border-l-2 border-transparent rounded-r-md transition-colors"
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" aria-hidden="true" strokeWidth={2} />
                      <span className="text-[14px] font-medium">{label}</span>
                    </div>
                    {badge && (
                      <span className="w-5 h-5 rounded-full bg-[#10B981] text-white flex items-center justify-center text-[11px] font-bold">
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
