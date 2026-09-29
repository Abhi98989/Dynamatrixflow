"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search, FolderKanban, CheckSquare, Users, FileText,
  ArrowRight, CornerDownLeft, Loader2, X
} from "lucide-react";
import { globalSearchAction, type SearchResultItem } from "@/features/search/actions";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string;
}

export function CommandPalette({ open, onOpenChange, userRole }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const isGuest = userRole === "GUEST";

  const defaultNavItems: SearchResultItem[] = [
    { id: "nav-dash", type: "navigation" as const, title: isGuest ? "Guest Monitor" : "Dashboard", subtitle: "Overview and real-time activity", url: "/dashboard" },
    { id: "nav-proj", type: "navigation" as const, title: "Projects", subtitle: "View and manage active projects", url: "/projects" },
    ...(!isGuest ? [
      { id: "nav-tasks", type: "navigation" as const, title: "My Tasks", subtitle: "Assigned technical deliverables", url: "/my-tasks" },
      { id: "nav-team", type: "navigation" as const, title: "Team Directory", subtitle: "Internal engineers & staff", url: "/team" },
    ] : []),
    { id: "nav-res", type: "navigation" as const, title: "Resources & Deliverables", subtitle: "Shared files, docs, & links", url: "/resources" },
  ];

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        setQuery("");
        setResults([]);
        setSelectedIndex(0);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Live search query
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      const timer = setTimeout(() => {
        setResults([]);
        setSelectedIndex(0);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await globalSearchAction(query);
        setResults(res);
        setSelectedIndex(0);
      });
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const displayedItems = query.trim().length >= 2 ? results : defaultNavItems;

  const handleSelect = (item: SearchResultItem) => {
    onOpenChange(false);
    if (item.url.startsWith("http")) {
      window.open(item.url, "_blank");
    } else {
      router.push(item.url);
    }
  };

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (displayedItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % displayedItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + displayedItems.length) % displayedItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = displayedItems[selectedIndex];
      if (current) {
        handleSelect(current);
      }
    }
  };

  const getIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "project":
        return <FolderKanban className="w-4 h-4 text-[#5B5FEF]" />;
      case "task":
        return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      case "member":
        return <Users className="w-4 h-4 text-amber-600" />;
      case "resource":
        return <FileText className="w-4 h-4 text-purple-600" />;
      default:
        return <ArrowRight className="w-4 h-4 text-[#667085]" />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDownInInput}
            placeholder="Type to search projects, tasks, team members, or links..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-[#5B5FEF] animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-slate-50 flex-1 max-h-[420px]">
          {query.trim().length >= 2 && results.length === 0 && !isSearching && (
            <div className="py-12 text-center text-xs text-slate-500">
              No results found for &ldquo;<span className="font-semibold text-slate-800">{query}</span>&rdquo;
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Quick Navigation
            </div>
          )}

          {displayedItems.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#5B5FEF]/10 text-slate-900"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${isSelected ? "text-[#5B5FEF]" : "text-slate-900"}`}>
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {item.badge}
                    </span>
                  )}
                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-[#5B5FEF]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded font-mono text-[9px]">↑</kbd>
              <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded font-mono text-[9px]">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 bg-white border border-slate-200 rounded font-mono text-[9px]">↵</kbd>
              select
            </span>
          </div>
          <span>Dynamatrix Universal Search</span>
        </div>
      </div>
    </div>
  );
}
