import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn/ui button pattern, customized with Dynamatrix tokens and sizing.
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-[6px_6px_12px_rgba(7,36,208,0.3),-4px_-4px_10px_rgba(255,255,255,0.8),inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.1)] hover:bg-[#061CB0] active:bg-primary-active active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3)]",
        outline:
          "border-[2px] border-white bg-surface text-foreground shadow-[4px_4px_10px_rgba(0,0,0,0.06),-4px_-4px_10px_rgba(255,255,255,1),inset_1px_1px_0_rgba(255,255,255,1)] hover:bg-[#F3F4F6] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.05)]",
        ghost: "text-muted-foreground hover:bg-surface-hover hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,1)] hover:text-foreground",
        destructive: "bg-destructive text-white shadow-sm hover:opacity-90",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs rounded-xl",
        icon: "size-11",
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
