"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, RotateCcw, Settings, Sun } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/overlays";
import { signOutAndLeave } from "./sign-out";
import { useMe } from "@/lib/queries";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function UserMenu({ variant = "full" }: { variant?: "full" | "compact" }) {
  const me = useMe();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const resetDemo = useStore((s) => s.resetDemo);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "pressable flex items-center gap-3 rounded-2xl text-left outline-none hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring",
          variant === "full" ? "w-full p-2" : "rounded-full p-0.5",
        )}
        aria-label="Account menu"
      >
        <Avatar user={me} size={variant === "full" ? "md" : "sm"} />
        {variant === "full" && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{me.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{me.school}</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={variant === "full" ? "start" : "end"} side={variant === "full" ? "top" : "bottom"} className="w-64">
        <DropdownMenuLabel className="pb-2">{me.email}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <div className="flex gap-1 px-1.5 pb-1">
          {[
            { v: "light", icon: Sun, label: "Light" },
            { v: "dark", icon: Moon, label: "Dark" },
            { v: "system", icon: Monitor, label: "Auto" },
          ].map(({ v, icon: Icon, label }) => (
            <button
              key={v}
              onClick={() => setTheme(v)}
              className={cn(
                "pressable flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-xs font-semibold text-muted-foreground hover:bg-surface-2",
                theme === v && "bg-surface-2 text-foreground",
              )}
              aria-pressed={theme === v}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            resetDemo();
            toast.success("Demo data reset");
            router.push("/dashboard");
          }}
        >
          <RotateCcw /> Reset demo data
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => signOutAndLeave(router)}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
