"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { EditGroupDialog } from "@/components/app/edit-group-dialog";
import { Button } from "@/components/ui/button";
import type { Group } from "@/lib/types";

export function EditGroupDialogTrigger({ group }: { group: Group }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Pencil /> Edit
      </Button>
      <EditGroupDialog group={group} open={open} onOpenChange={setOpen} />
    </>
  );
}
