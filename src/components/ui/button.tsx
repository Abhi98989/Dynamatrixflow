import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn/ui button pattern, customized with Dynamatrix tokens and sizing.
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl text-xs font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-clay-button hover:bg-primary-hover active:bg-primary-active active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-[rgba(220,227,240,0.9)] bg-surface text-foreground shadow-[3px_3px_8px_rgba(15,23,42,0.05),-3px_-3px_8px_rgba(255,255,255,0.95)] hover:bg-[#F8FAFF] hover:border-border-strong active:shadow-clay-inset hover:-translate-y-0.5 active:translate-y-0",
        ghost:
          "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
        destructive:
          "bg-destructive text-white shadow-[0_3px_8px_rgba(220,38,38,0.35),inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_1px_rgba(0,0,0,0.2)] hover:opacity-90 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
      },
      size: {
        default: "h-8 px-3 text-xs",
        sm: "h-7 px-2.5 text-[11px] rounded-lg",
        icon: "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
