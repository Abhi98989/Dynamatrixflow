import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-2xl border border-[rgba(220,227,240,0.8)] bg-[#F8FAFF] px-4 py-2 text-sm text-text-primary shadow-[inset_4px_4px_10px_rgba(15,23,42,0.06),inset_-4px_-4px_10px_rgba(255,255,255,0.95)] transition-all",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-text-muted",
        "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
