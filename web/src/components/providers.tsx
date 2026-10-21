"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/overlays";
import { useStore } from "@/lib/store";
import { supabaseEnabled, getSupabase } from "@/lib/supabase/client";
import { loadSupabaseData, showSupabaseError } from "@/lib/supabase/data";

const HydratedContext = React.createContext(false);
export const useHydrated = () => React.useContext(HydratedContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const persistedHydrated = React.useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
  const [supabaseReady, setSupabaseReady] = React.useState(false);
  const hydrated = supabaseEnabled ? supabaseReady : persistedHydrated;

  React.useEffect(() => {
    if (supabaseEnabled) {
      const client = getSupabase();
      let channel: ReturnType<typeof client.channel> | undefined;
      let realtimeReload: number | undefined;
      let cancelled = false;
      let firstCheck = true;
      const watch = async (sessionOverride?: Awaited<ReturnType<typeof client.auth.getSession>>["data"]["session"]) => {
        try {
          let session = sessionOverride;
          if (session === undefined) {
            const { data, error } = await client.auth.getSession();
            if (error) throw error;
            session = data.session;
          }
          if (cancelled) return;
          if (!session) {
            useStore.setState({ currentUserId: null, onboarded: false });
            if (realtimeReload !== undefined) window.clearTimeout(realtimeReload);
            realtimeReload = undefined;
            if (channel) await client.removeChannel(channel);
            channel = undefined;
            return;
          }
          if (realtimeReload !== undefined) window.clearTimeout(realtimeReload);
          realtimeReload = undefined;
          await loadSupabaseData(session);
          if (cancelled) return;
          if (channel) await client.removeChannel(channel);
          channel = client.channel(`studycircle:${session.user.id}`);
          for (const table of ["messages", "sessions", "availability", "session_rsvps", "group_members", "prep_done"]) {
            channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
              if (realtimeReload !== undefined) window.clearTimeout(realtimeReload);
              realtimeReload = window.setTimeout(() => {
                realtimeReload = undefined;
                void loadSupabaseData(session).catch(showSupabaseError);
              }, 300);
            });
          }
          channel.subscribe();
        } catch (error) {
          if (!cancelled) {
            showSupabaseError(error);
          }
        } finally {
          if (firstCheck) {
            firstCheck = false;
            if (!cancelled) setSupabaseReady(true);
          }
        }
      };
      void watch();
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED", "INITIAL_SESSION"].includes(event)) return;
        window.setTimeout(() => {
          if (cancelled) return;
          if (event === "SIGNED_OUT") {
            useStore.setState({ currentUserId: null, onboarded: false });
            if (realtimeReload !== undefined) window.clearTimeout(realtimeReload);
            realtimeReload = undefined;
            if (channel) void client.removeChannel(channel);
            channel = undefined;
          } else void watch(session ?? undefined);
        }, 0);
      });
      return () => {
        cancelled = true;
        if (realtimeReload !== undefined) window.clearTimeout(realtimeReload);
        subscription.unsubscribe();
        if (channel) void client.removeChannel(channel);
      };
    }

    useStore.persist.rehydrate();
    // Keep demo tabs in sync through their local persisted snapshot.
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
