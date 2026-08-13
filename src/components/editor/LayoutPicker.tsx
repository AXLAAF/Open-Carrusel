"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { LAYOUT_IDS, LAYOUT_LABELS } from "@/types/layout";
import type { LayoutId } from "@/types/layout";

interface LayoutPickerProps {
  disabled?: boolean;
  width: number;
  height: number;
  onPick: (layout: LayoutId) => void;
}

export function LayoutPicker({ disabled, width, height, onPick }: LayoutPickerProps) {
  const [open, setOpen] = useState(false);
  if (disabled) return null;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors cursor-pointer"
        style={{ width, height }}
        aria-label="Añadir diapositiva"
      >
        <Plus className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-20 w-40 rounded-md border border-border bg-surface shadow-lg p-1">
          {LAYOUT_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className="w-full text-left text-[11px] px-2 py-1.5 rounded hover:bg-muted"
              onClick={() => {
                onPick(id);
                setOpen(false);
              }}
            >
              {LAYOUT_LABELS[id]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
