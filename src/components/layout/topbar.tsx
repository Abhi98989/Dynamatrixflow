"use client";

import { useState } from "react";
import { Bell, Menu, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";
import { logoutAction } from "@/server/auth/actions";
import Image from "next/image";

import Link from "next/link";

interface TopbarProps {
  user?: {
    id?: string;
    name?: string | null;
    employeeId?: string;
    systemRole?: string;
    position?: string | null;
  };
}

export function Topbar({ user }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = user?.name || "Abhishek";
  const displayRole = user?.position || "Company Leader / VP Engineering";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 shadow-sm">
      <div className="h-full w-full px-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-6 flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 lg:hidden shrink-0">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-slate-700 hover:text-slate-900">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-64 max-w-[85vw] p-0 border-r-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SheetDescription className="sr-only">Sidebar</SheetDescription>
                <SidebarContent onNavigate={() => setMenuOpen(false)} user={user} />
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Image 
                src="/app-icon.png" 
                alt="Dynamatrix Flow" 
                width={28} 
                height={28} 
                className="w-7 h-7 rounded-lg shrink-0 object-contain shadow-xs"
                priority
              />
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                Dynamatrix
              </span>
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-slate-400 cursor-pointer w-full max-w-md hover:bg-slate-100 transition-colors">
            <Search className="w-4 h-4" />
            <span className="text-sm flex-1 truncate">Search projects, tasks, doc links...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-500 leading-none">⌘K</kbd>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-medium">System: Normal (99.98% up)</span>
          </div>
          
          <Link href="/notifications" className="relative p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute 1 top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white"></span>
          </Link>
          
          <div className="h-5 w-px bg-slate-200"></div>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden relative border border-slate-200 shadow-sm">
                  {/* Using a placeholder avatar since Image src is needed, for now just a letter */}
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white font-semibold">
                    {displayName.charAt(0)}
                  </div>
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-semibold text-slate-900 leading-tight">{displayName}</span>
                  <span className="text-[10px] font-medium text-slate-500 leading-tight">{displayRole}</span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="flex flex-col space-y-1 mb-3">
                <span className="font-semibold text-slate-900">{displayName}</span>
                <span className="text-xs text-slate-500">{displayRole}</span>
              </div>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" type="submit" className="w-full justify-start text-red-600 hover:bg-red-50">
                  <LogOut className="mr-2 w-4 h-4" /> Sign Out
                </Button>
              </form>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
