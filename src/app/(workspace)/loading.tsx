import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading workspace" className="space-y-8">
      <span className="sr-only">Loading workspace…</span>
      <div className="space-y-3">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Card className="space-y-4 p-6">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="space-y-5 p-6">
            <Skeleton className="size-10" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
