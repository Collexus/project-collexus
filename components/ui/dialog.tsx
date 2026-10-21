"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type FilterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  onReset: () => void;
};

export function FilterDialog({ open, onOpenChange, children, onReset }: FilterDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content className="filter-dialog">
          <div className="dialog-heading">
            <div>
              <DialogPrimitive.Title className="dialog-title">Filter events</DialogPrimitive.Title>
              <DialogPrimitive.Description className="dialog-description">Narrow the archive to the events you want to find.</DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild><Button variant="icon" aria-label="Close filters"><X size={18} /></Button></DialogPrimitive.Close>
          </div>
          <div className="dialog-filter-fields">{children}</div>
          <div className="dialog-actions">
            <Button variant="ghost" type="button" onClick={onReset}>Reset filters</Button>
            <DialogPrimitive.Close asChild><Button variant="primary" type="button">Show events</Button></DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
