"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioPrimitive from "@radix-ui/react-radio-group";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Select ---------- */

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  id,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: React.ReactNode }[];
  placeholder?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-control)] border border-border-strong bg-surface px-3.5 text-left text-base text-foreground transition-[border-color,box-shadow] duration-150 hover:border-foreground/35 focus-visible:border-teal focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-teal/20 data-[placeholder]:text-subtle-foreground",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="anim-popover z-50 max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-float"
        >
          <SelectPrimitive.Viewport>
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="relative flex h-10 cursor-pointer select-none items-center rounded-[10px] pl-3 pr-9 text-[0.9375rem] font-medium outline-none data-[highlighted]:bg-surface-2"
              >
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-3">
                  <Check className="size-4 text-teal-text" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/* ---------- Switch ---------- */

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-surface-3 transition-colors duration-200 data-[state=checked]:bg-teal disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb className="pointer-events-none block size-6 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.2)] transition-transform duration-200 ease-[var(--ease-out)] data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0" />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";

/* ---------- Checkbox ---------- */

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "pressable peer grid size-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] border-border-strong bg-surface data-[state=checked]:border-teal data-[state=checked]:bg-teal",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="animate-pop text-white">
      <Check className="size-3.5" strokeWidth={3.5} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";

/* ---------- Segmented control (radio group) ---------- */

export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  className,
  size = "md",
  "aria-label": ariaLabel,
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; icon?: React.ReactNode }[];
  className?: string;
  size?: "sm" | "md";
  "aria-label": string;
}) {
  return (
    <RadioPrimitive.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      aria-label={ariaLabel}
      orientation="horizontal"
      className={cn("inline-flex gap-1 rounded-[14px] bg-surface-2 p-1", className)}
    >
      {options.map((o) => (
        <RadioPrimitive.Item
          key={o.value}
          value={o.value}
          className={cn(
            "pressable inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] font-semibold text-muted-foreground hover:text-foreground data-[state=checked]:bg-surface data-[state=checked]:text-foreground data-[state=checked]:shadow-[0_1px_2px_rgb(36_59_107/0.12),0_0_0_1px_var(--border)] [&_svg]:size-4",
            size === "md" ? "h-9 px-3.5 text-sm" : "h-8 px-3 text-[0.8125rem]",
          )}
        >
          {o.icon}
          {o.label}
        </RadioPrimitive.Item>
      ))}
    </RadioPrimitive.Root>
  );
}

/* ---------- Choice cards (radio group with descriptions) ---------- */

export function ChoiceCards<T extends string>({
  value,
  onValueChange,
  options,
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: { value: T; title: React.ReactNode; description?: React.ReactNode; aside?: React.ReactNode }[];
  className?: string;
  "aria-label": string;
}) {
  return (
    <RadioPrimitive.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      aria-label={ariaLabel}
      className={cn("grid gap-2", className)}
    >
      {options.map((o) => (
        <RadioPrimitive.Item
          key={o.value}
          value={o.value}
          className="pressable group flex items-start gap-3 rounded-2xl border border-border-strong bg-surface p-4 text-left hover:border-foreground/35 data-[state=checked]:border-teal data-[state=checked]:bg-teal-soft/50 data-[state=checked]:shadow-[0_0_0_1px_var(--teal)] active:scale-[0.99]"
        >
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] border-border-strong group-data-[state=checked]:border-teal">
            <span className="size-2.5 scale-50 rounded-full bg-teal opacity-0 transition-[transform,opacity] duration-200 ease-[var(--ease-out)] group-data-[state=checked]:scale-100 group-data-[state=checked]:opacity-100" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="font-bold">{o.title}</span>
              {o.aside}
            </span>
            {o.description && <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{o.description}</span>}
          </span>
        </RadioPrimitive.Item>
      ))}
    </RadioPrimitive.Root>
  );
}

/* ---------- Tabs (underline style, scrollable on mobile) ---------- */

export const Tabs = TabsPrimitive.Root;
export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("outline-none", className)} {...props} />
));
TabsContent.displayName = "TabsContent";

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap px-3 text-[0.9375rem] font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground [&_svg]:size-4",
        "after:absolute after:inset-x-3 after:-bottom-px after:h-[2.5px] after:scale-x-0 after:rounded-full after:bg-foreground after:transition-transform after:duration-200 after:ease-[var(--ease-out)] data-[state=active]:after:scale-x-100",
        className,
      )}
      {...props}
    />
  );
}
