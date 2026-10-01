"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarClock,
  CheckSquare,
  ClipboardCheck,
  FolderKanban,
  LayoutDashboard,
  Users,
  Library,
  Settings,
  UserCircle,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};
const defaultNavGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "MAIN",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "WORK",
    items: [
      { label: "Projects", href: "/projects", icon: FolderKanban },
      { label: "Chat", href: "/chat", icon: MessageSquare },
      { label: "My Tasks", href: "/my-tasks", icon: CheckSquare },
      { label: "Review Queue", href: "/review", icon: ClipboardCheck },
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
    items: [{ label: "Notifications", href: "/notifications", icon: Bell }],
  },
  {
    label: "ACCOUNT",
    items: [
      { label: "Profile", href: "/profile", icon: UserCircle },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const guestNavGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "MONITOR",
    items: [
      { label: "Guest Monitor", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "WORKSPACE",
    items: [
      { label: "Projects", href: "/projects", icon: FolderKanban },
      { label: "Chat", href: "/chat", icon: MessageSquare },
      { label: "Resources & Files", href: "/resources", icon: Library },
    ],
  },
  {
    label: "ACCOUNT",
    items: [{ label: "Profile", href: "/profile", icon: UserCircle }],
  },
];

export function Navigation({
  onNavigate,
  systemRole,
}: {
  onNavigate?: () => void;
  systemRole?: string;
}) {
  const pathname = usePathname();
  const navGroups = systemRole === "GUEST" ? guestNavGroups : defaultNavGroups;

  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-5 pb-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-4 text-[11px] font-bold text-sidebar-text tracking-wider uppercase">
            {group.label}
          </p>
          <ul className="flex flex-col gap-1">
            {group.items.map(({ label, href, icon: Icon, badge }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={label} className="px-3">
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={
                      isActive
                        ? "flex items-center justify-between px-3 py-2.5 bg-sidebar-active text-sidebar-text-active border-l-2 border-sidebar-indicator rounded-r-md transition-colors"
                        : "flex items-center justify-between px-3 py-2.5 text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover border-l-2 border-transparent rounded-r-md transition-colors"
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className="w-4 h-4"
                        aria-hidden="true"
                        strokeWidth={2}
                      />
                      <span className="text-[14px] font-medium">{label}</span>
                    </div>
                    {badge && (
                      <span className="w-5 h-5 rounded-full bg-sidebar-indicator text-white flex items-center justify-center text-[11px] font-bold">
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
