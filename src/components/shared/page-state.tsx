import Link from "next/link";
import { FileQuestion, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageState({
  kind = "not-found",
}: {
  kind?: "not-found" | "forbidden";
}) {
  const Icon = kind === "forbidden" ? ShieldX : FileQuestion;
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <span className="mb-6 flex size-12 items-center justify-center rounded-lg border bg-surface text-primary">
        <Icon aria-hidden="true" />
      </span>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Dynamatrix Flow
      </p>
      <h1 className="text-page font-bold">
        {kind === "forbidden" ? "Access unavailable" : "Page not found"}
      </h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        This page is unavailable. Return to the workspace to continue.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to workspace</Link>
      </Button>
    </div>
  );
}
