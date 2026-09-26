"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root application error boundary caught:", error);
  }, [error]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center"
    >
      <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-100">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="text-xl font-bold text-slate-900 tracking-tight">
        Unable to load this page
      </h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        {error?.message && !error.message.includes("digest")
          ? error.message
          : "An unexpected error occurred. Please try again or return to the dashboard."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => reset()}
          className="flex items-center gap-2 bg-[#5B5FEF] text-white hover:bg-[#4C50D8]"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Home className="w-4 h-4" /> Dashboard
          </Link>
        </Button>
      </div>
    </main>
  );
}
