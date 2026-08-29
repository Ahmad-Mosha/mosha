import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono text-[10px]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent text-accent-fg shadow-2xs",
        secondary:
          "border-line bg-subtle-2 text-accent",
        destructive:
          "border-rose-200 bg-rose-100 text-rose-800",
        success:
          "border-emerald-200 bg-emerald-100 text-emerald-800",
        warning:
          "border-amber-200 bg-amber-100 text-amber-800",
        outline: "text-ink border-line",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
