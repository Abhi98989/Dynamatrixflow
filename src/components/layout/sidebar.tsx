import { Navigation } from "./navigation";
import Image from "next/image";

export function SidebarContent({
  onNavigate,
  user,
}: {
  onNavigate?: () => void;
  user?: { systemRole?: string };
}) {
  return (
    <div className="flex flex-col justify-between h-full bg-sidebar text-white select-none">
      <div className="flex flex-col h-full overflow-hidden">
        <div className="h-[72px] px-5 shrink-0 flex items-center border-b border-sidebar-secondary overflow-hidden">
          <Image
            src="/logo-new.png"
            alt="Dynamatrix Flow Logo"
            width={280}
            height={140}
            className="w-[200px] h-[100px] object-cover object-center mix-blend-screen -ml-2"
            priority
          />
        </div>

        {/* Navigation - hidden scrollbar */}
        <div className="flex-1 overflow-y-auto py-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Navigation onNavigate={onNavigate} systemRole={user?.systemRole} />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 shrink-0 border-t border-sidebar-secondary">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 px-3 pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sidebar-indicator"></span>
            <span className="font-mono text-[10px] text-sidebar-text tracking-wider uppercase">
              NODE-EAST-01 • v2.4.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ user }: { user?: { systemRole?: string } }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 lg:block border-r border-sidebar-secondary">
      <SidebarContent user={user} />
    </aside>
  );
}
