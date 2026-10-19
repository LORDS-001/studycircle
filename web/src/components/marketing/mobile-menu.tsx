"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/overlays";

export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
          <Menu />
        </Button>
      </DialogTrigger>
      <DialogContent title="Menu">
        <nav aria-label="Main" className="-mx-2 flex flex-col">
          {links.map((l) => (
            <DialogClose asChild key={l.href}>
              <a href={l.href} className="rounded-xl px-2 py-3 text-lg font-semibold hover:bg-surface-2">
                {l.label}
              </a>
            </DialogClose>
          ))}
        </nav>
        <div className="mt-6 grid gap-2">
          <Button asChild size="lg">
            <Link href="/login">Start a study group</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
