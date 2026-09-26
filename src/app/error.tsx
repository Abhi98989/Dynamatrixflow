"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center"
    >
      <h1 className="text-page font-bold">Unable to load this page</h1>
      <p className="mt-3 text-muted-foreground">
        Something went wrong. Please try again.
      </p>
      <Button className="mt-6" onClick={retry}>
        Try again
      </Button>
    </main>
  );
}
