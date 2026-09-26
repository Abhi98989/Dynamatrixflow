"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Workspace route error caught:", error);
  }, [error]);

  return (
    <div className="w-full max-w-lg mx-auto py-16 px-4">
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Unable to load this view
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          {error?.message && !error.message.includes("digest")
            ? error.message
            : "An unexpected error occurred while loading this section."}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="flex items-center gap-2 bg-[#5B5FEF] text-white hover:bg-[#4C50D8]"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Return to Projects
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
