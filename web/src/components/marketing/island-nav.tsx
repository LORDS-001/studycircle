"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/**
 * Floating glass pill, detached from the top edge. On phones the hamburger
 * morphs into an X and opens a full-screen glass menu with staggered links.
 */
export function IslandNav({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = React.useState(false);
  const firstLink = React.useRef<HTMLAnchorElement>(null);
  const toggle = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    firstLink.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center gap-2 rounded-full bg-surface/75 py-2 pl-5 pr-2 shadow-[0_1px_2px_rgb(36_59_107/0.06),0_12px_32px_-16px_rgb(36_59_107/0.25)] ring-1 ring-foreground/[0.07] backdrop-blur-xl supports-[backdrop-filter]:bg-surface/65 dark:shadow-[0_12px_32px_-16px_rgb(0_0_0/0.6)]">
          <Link href="/" aria-label="StudyCircle home" className="mr-2 shrink-0" onClick={() => setOpen(false)}>
            <Logo size={22} />
          </Link>
          <nav aria-label="Main" className="hidden items-center md:flex">
            {links.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:bg-foreground/[0.05] hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/login?next=/courses"
              className="hidden h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground lg:flex"
            >
              <Search className="size-4" strokeWidth={1.8} />
              Find your course
            </Link>
            <Link
              href="/login"
              className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors hover:bg-foreground/[0.05] sm:flex"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className={cn(
                "flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[transform,background-color] duration-300 hover:bg-primary-hover active:scale-[0.97]",
                EASE,
              )}
            >
              Get started
            </Link>
            <button
              ref={toggle}
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative grid size-10 place-items-center rounded-full transition-colors hover:bg-foreground/[0.05] md:hidden"
            >
              <span
                className={cn(
                  "absolute h-[1.5px] w-[18px] rounded-full bg-foreground transition-transform duration-500",
                  EASE,
                  open ? "translate-y-0 rotate-45" : "-translate-y-[4px]",
                )}
              />
              <span
                className={cn(
                  "absolute h-[1.5px] w-[18px] rounded-full bg-foreground transition-transform duration-500",
                  EASE,
                  open ? "translate-y-0 -rotate-45" : "translate-y-[4px]",
                )}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen glass menu (phones) */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        inert={!open}
        className={cn(
          "fixed inset-0 z-40 bg-background/85 backdrop-blur-3xl transition-opacity duration-500 md:hidden",
          EASE,
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <nav aria-label="Menu" className="flex h-full flex-col justify-center gap-1 px-8 pb-16">
          {[...links, { href: "/login", label: "Sign in" }].map((l, i) => (
            <div key={l.href + l.label} className="overflow-hidden">
              <a
                ref={i === 0 ? firstLink : undefined}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block py-2 text-[2.75rem] font-bold leading-tight tracking-[-0.04em] transition-[transform,opacity] duration-700",
                  EASE,
                  open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0",
                )}
                style={{ transitionDelay: open ? `${100 + i * 60}ms` : "0ms" }}
              >
                {l.label}
              </a>
            </div>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className={cn(
              "mt-8 inline-flex h-14 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition-[transform,opacity] duration-700",
              EASE,
              open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0",
            )}
            style={{ transitionDelay: open ? "380ms" : "0ms" }}
          >
            Start a study group
          </Link>
        </nav>
      </div>
    </>
  );
}
