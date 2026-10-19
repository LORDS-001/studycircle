import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "pressable inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-semibold disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        teal: "bg-teal text-teal-foreground hover:bg-teal-hover",
        outline: "border border-foreground/25 bg-surface text-foreground hover:border-foreground/50 hover:bg-surface-2",
        secondary: "bg-surface-2 text-foreground hover:bg-surface-3",
        ghost: "text-foreground hover:bg-surface-2",
        subtle: "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
        gold: "bg-gold text-gold-foreground hover:brightness-[0.96]",
        destructive: "bg-destructive text-white hover:brightness-110 dark:text-[#1b2e55]",
        link: "h-auto px-0 text-teal-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 rounded-[10px] px-3 text-sm",
        md: "h-11 rounded-[var(--radius-control)] px-4 text-[0.9375rem]",
        lg: "h-12 rounded-[var(--radius-control)] px-6 text-base",
        icon: "size-10 rounded-[var(--radius-control)]",
        "icon-sm": "size-9 rounded-[10px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
