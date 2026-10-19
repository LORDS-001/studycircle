"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, House, Plus, Settings, UsersRound } from "lucide-react";
import { Logo, CircleLoader } from "@/components/brand/logo";
import { SeatRing } from "@/components/brand/rings";
import { useHydrated } from "@/components/providers";
import { activeMembers, useMyGroups, usePendingRetros } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { clearLeaving, isLeaving } from "./sign-out";
import { UserMenu } from "./user-menu";

const NAV = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/groups", label: "Groups", icon: UsersRound, mobileOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, mobileOnly: true },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function FullScreenLoader() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <CircleLoader size={36} />
    </div>
  );
}

/** Gate: waits for local data, then requires a signed-in, onboarded user. */
export function AuthGate(props: { children: React.ReactNode; requireOnboarded?: boolean }) {
  return (
    <React.Suspense fallback={<FullScreenLoader />}>
      <AuthGateInner {...props} />
    </React.Suspense>
  );
}

function AuthGateInner({ children, requireOnboarded = true }: { children: React.ReactNode; requireOnboarded?: boolean }) {
  const hydrated = useHydrated();
  const userId = useStore((s) => s.currentUserId);
  const onboarded = useStore((s) => s.onboarded);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!hydrated) return;
    if (userId) clearLeaving();
    else if (isLeaving()) return;
    else router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (userId && requireOnboarded && !onboarded) router.replace("/onboarding");
  }, [hydrated, userId, onboarded, requireOnboarded, router, pathname]);

  if (!hydrated || !userId || (requireOnboarded && !onboarded)) return <FullScreenLoader />;
  return <>{children}</>;
}

function Sidebar() {
  const pathname = usePathname();
  const groups = useMyGroups();
  const courses = useStore((s) => s.courses);
  const pendingRetros = usePendingRetros();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col border-r border-border px-4 pb-4 pt-6 lg:flex">
      <Link href="/dashboard" className="mb-8 self-start rounded-lg px-2 outline-offset-4" aria-label="StudyCircle home">
        <Logo size={26} />
      </Link>

      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {NAV.filter((n) => !n.mobileOnly).map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "pressable flex h-10 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                active && "bg-surface text-foreground shadow-[0_0_0_1px_var(--border)]",
              )}
            >
              <Icon className="size-[18px]" strokeWidth={2.2} />
              {label}
              {href === "/dashboard" && pendingRetros.length > 0 && (
                <span className="ml-auto grid size-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-gold-foreground">
                  {pendingRetros.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between px-3">
          <h2 className="text-xs font-bold text-subtle-foreground">Your groups</h2>
          <Link
            href="/groups/new"
            className="pressable -mr-1.5 grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            aria-label="Create a group"
          >
            <Plus className="size-4" />
          </Link>
        </div>
        <div className="scrollbar-none -mx-1 flex min-h-0 flex-col gap-0.5 overflow-y-auto px-1">
          {groups.map((g) => {
            const active = isActive(pathname, `/groups/${g.id}`);
            const course = courses.find((c) => c.id === g.courseId);
            return (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-surface-2",
                  active && "bg-surface shadow-[0_0_0_1px_var(--border)]",
                )}
              >
                <SeatRing filled={activeMembers(g).length} total={g.maxSize} size={26} />
                <span className="min-w-0">
                  <span className={cn("block truncate text-sm font-semibold", !active && "text-foreground/85")}>{g.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{course?.code}</span>
                </span>
              </Link>
            );
          })}
          {groups.length === 0 && (
            <p className="px-3 text-sm text-muted-foreground">Groups you join show up here.</p>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <UserMenu />
      </div>
    </aside>
  );
}

function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 lg:hidden">
      <Link href="/dashboard" aria-label="StudyCircle home">
        <Logo size={22} />
      </Link>
      <UserMenu variant="compact" />
    </header>
  );
}

function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-md">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href) || (href === "/groups" && pathname.startsWith("/groups"));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold text-subtle-foreground transition-colors",
                active && "text-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-12 place-items-center rounded-full transition-colors duration-200",
                  active && "bg-surface-3/80",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopBar />
          <main id="main" className="flex-1 pb-28 lg:pb-16">
            {children}
          </main>
        </div>
        <MobileTabBar />
      </div>
    </AuthGate>
  );
}

/** Standard page container + header */
export function Page({ children, className, width = "default" }: { children: React.ReactNode; className?: string; width?: "default" | "narrow" | "wide" }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10",
        width === "default" && "max-w-[1120px]",
        width === "narrow" && "max-w-[760px]",
        width === "wide" && "max-w-[1320px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  eyebrow?: React.ReactNode;
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link
          href={back.href}
          className="mb-4 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
            <path d="M10 3.5 5.5 8l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2 text-sm font-semibold text-teal-text">{eyebrow}</div>}
          <h1 className="text-h1">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-body text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
