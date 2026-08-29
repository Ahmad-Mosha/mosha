import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-label font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono text-meta",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent text-accent-fg shadow-2xs",
        secondary:
          "border-line bg-subtle-2 text-accent",
        destructive:
          "border-danger/35 bg-danger-tint text-danger",
        success:
          "border-success/35 bg-success-tint text-success",
        warning:
          "border-warn/35 bg-warn-tint text-warn",
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
