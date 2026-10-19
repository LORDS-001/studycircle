"use client";

import * as React from "react";
import type { Group } from "./types";

export const GroupContext = React.createContext<Group | null>(null);

/** The current group inside /groups/[groupId]/*. The layout guarantees membership. */
export function useCurrentGroup(): Group {
  const g = React.useContext(GroupContext);
  if (!g) throw new Error("useCurrentGroup must be used inside the group layout");
  return g;
}
