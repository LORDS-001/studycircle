import * as React from "react";
import { cn } from "@/lib/utils";

/** The basic raised surface. Use sparingly — not every group of content needs a box. */
export function Panel({
  className,
  as: Comp = "div",
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: React.ElementType }) {
  return <Comp className={cn("rounded-[var(--radius-card)] border border-border bg-surface", className)} {...props} />;
}

export function PanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-h3">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
  className,
  id,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-4", className)}>
      <h2 id={id} className="text-lg font-bold tracking-tight">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-surface-3/70", className)} aria-hidden />;
}

export function Progress({
  value,
  className,
  label,
  tone = "teal",
}: {
  value: number;
  className?: string;
  label?: string;
  tone?: "teal" | "blue" | "gold";
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 overflow-hidden rounded-full bg-surface-3", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out)]",
          tone === "teal" && "bg-teal",
          tone === "blue" && "bg-foreground",
          tone === "gold" && "bg-gold",
        )}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-border-strong px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted-foreground [&_svg]:size-6">
          {icon}
        </div>
      )}
      <h3 className="text-h3">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[0.9375rem] leading-6 text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border-strong bg-surface-2 px-1 text-[11px] font-semibold text-muted-foreground">
      {children}
    </kbd>
  );
}
