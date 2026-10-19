import { cn, initials } from "@/lib/utils";
import type { User } from "@/lib/types";

const sizes = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-xl",
};

export function Avatar({
  user,
  size = "md",
  className,
  ring,
}: {
  user: Pick<User, "name" | "hue" | "avatarUrl"> | undefined;
  size?: keyof typeof sizes;
  className?: string;
  /** Adds a background-coloured ring, for stacking */
  ring?: boolean;
}) {
  const name = user?.name ?? "Unknown";
  const hue = user?.hue ?? 220;
  return (
    <span
      title={name}
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-bold tracking-tight",
        "bg-[hsl(var(--h)_42%_88%)] text-[hsl(var(--h)_45%_26%)] dark:bg-[hsl(var(--h)_28%_26%)] dark:text-[hsl(var(--h)_55%_86%)]",
        ring && "ring-[2.5px] ring-surface",
        sizes[size],
        className,
      )}
      style={{ ["--h" as string]: hue }}
    >
      {user?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{size === "xs" ? initials(name).slice(0, 1) : initials(name)}</span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}

export function AvatarStack({
  users,
  max = 4,
  size = "sm",
  className,
}: {
  users: (User | undefined)[];
  max?: number;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;
  return (
    <span className={cn("flex items-center", size === "xs" || size === "sm" ? "-space-x-1.5" : "-space-x-2.5", className)}>
      {shown.map((u, i) => (
        <Avatar key={u?.id ?? i} user={u} size={size} ring />
      ))}
      {rest > 0 && (
        <span
          className={cn(
            "relative inline-flex items-center justify-center rounded-full bg-surface-3 font-bold text-muted-foreground ring-[2.5px] ring-surface",
            sizes[size],
          )}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
