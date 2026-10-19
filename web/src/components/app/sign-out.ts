"use client";

import { useStore } from "@/lib/store";

/*
 * Deliberate sign-outs navigate away first. This flag stops the auth gate
 * from bouncing the page being left to /login in the meantime.
 */
let leaving = false;

export const isLeaving = () => leaving;
export const clearLeaving = () => {
  leaving = false;
};

export function signOutAndLeave(router: { replace: (href: string) => void }, opts: { reset?: boolean } = {}) {
  leaving = true;
  router.replace("/");
  const { signOut, resetDemo } = useStore.getState();
  if (opts.reset) resetDemo();
  signOut();
}
