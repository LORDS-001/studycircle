import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        gold: "bg-gold text-gold-foreground",
        teal: "bg-teal-soft text-teal-text",
        neutral: "bg-surface-2 text-muted-foreground",
        outline: "border border-border-strong text-muted-foreground",
        blue: "bg-primary text-primary-foreground",
        live: "bg-teal text-white",
        danger: "bg-destructive-soft text-destructive",
      },
      size: {
        sm: "h-6 px-2.5 text-xs",
        md: "h-7 px-3 text-[0.8125rem]",
      },
    },
    defaultVariants: { variant: "neutral", size: "sm" },
  },
);

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
