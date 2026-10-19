"use client";

import { Avatar } from "@/components/ui/avatar";
import { arcPath } from "@/components/brand/logo";
import { ROLES } from "@/lib/templates";
import type { SessionRole, User } from "@/lib/types";
import { cn, firstName } from "@/lib/utils";

/**
 * The group as a circle: members sit on the ring, one segment each.
 * The highlighted member (the teacher / facilitator) gets the lit segment.
 */
export function MemberCircle({
  members,
  roles,
  litUserId,
  size = 240,
  center,
  className,
}: {
  members: User[];
  roles?: Record<string, SessionRole | undefined>;
  litUserId?: string;
  size?: number;
  center?: React.ReactNode;
  className?: string;
}) {
  const n = Math.max(members.length, 1);
  const span = 360 / n;
  const ringR = 17.5;
  return (
    <div className={cn("relative mx-auto", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" fill="none" className="absolute inset-0 size-full" aria-hidden>
        {members.map((m, i) => {
          // Faint connectors between neighbours: the circle the members form
          const c = -90 + span * i + span / 2;
          const half = span / 2 - (n > 5 ? 15 : 19);
          return (
            <path
              key={m.id}
              d={arcPath(24, 24, ringR, c - half, c + half)}
              strokeWidth={1.4}
              strokeLinecap="round"
              className="stroke-foreground/15"
            />
          );
        })}
      </svg>
      {members.map((m, i) => {
        const angle = ((-90 + span * i) * Math.PI) / 180;
        const r = (ringR / 48) * size;
        const x = size / 2 + r * Math.cos(angle);
        const y = size / 2 + r * Math.sin(angle);
        const role = roles?.[m.id];
        return (
          <div
            key={m.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={{ left: x, top: y }}
          >
            <Avatar
              user={m}
              size="md"
              className={cn("ring-4 ring-surface", m.id === litUserId && "outline-[2.5px] outline-offset-[3px] outline-teal outline dark:outline-gold")}
            />
            <span className="mt-1 whitespace-nowrap rounded-full bg-surface px-1.5 text-xs font-bold">{firstName(m.name)}</span>
            {role && (
              <span
                className={cn(
                  "whitespace-nowrap rounded-full bg-surface px-1.5 text-[11px] font-medium text-muted-foreground",
                  m.id === litUserId && "font-bold text-teal-text",
                )}
              >
                {ROLES[role].name}
              </span>
            )}
          </div>
        );
      })}
      {center && <div className="absolute inset-0 grid place-items-center text-center">{center}</div>}
    </div>
  );
}
