"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/overlays";
import { useStore } from "@/lib/store";

const HydratedContext = React.createContext(false);
export const useHydrated = () => React.useContext(HydratedContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = React.useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );

  React.useEffect(() => {
    useStore.persist.rehydrate();
    // Stand-in for Supabase Realtime: other tabs' writes show up here instantly
    const onStorage = (e: StorageEvent) => {
      if (e.key === useStore.persist.getOptions().name) useStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={400} skipDelayDuration={300}>
        <HydratedContext.Provider value={hydrated}>{children}</HydratedContext.Provider>
        <Toaster
          position="bottom-center"
          offset={88}
          mobileOffset={88}
          toastOptions={{
            classNames: {
              toast:
                "!rounded-2xl !border !border-border !bg-surface !text-foreground !shadow-float !font-sans !gap-3 !px-4 !py-3.5",
              title: "!font-semibold !text-[0.9375rem]",
              description: "!text-muted-foreground",
              actionButton: "!bg-primary !text-primary-foreground !rounded-lg !font-semibold",
              icon: "!text-teal-text",
            },
          }}
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}
