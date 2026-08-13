"use client";

import { Button } from "@/components/ui/button";
import type { Slide } from "@/types/carousel";

interface HistoryPanelProps {
  slide: Slide | null;
  onRestore: (html: string) => void;
}

export function HistoryPanel({ slide, onRestore }: HistoryPanelProps) {
  const versions = slide?.previousVersions ?? [];

  if (!slide) {
    return <p className="p-4 text-xs text-muted-foreground">Selecciona una diapositiva.</p>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
      <p className="text-[10px] text-muted-foreground">
        Hasta 5 versiones anteriores. Deshacer: ⌘Z / Ctrl+Z.
      </p>
      <div className="rounded-md border border-accent/40 px-2 py-2">
        <p className="font-medium">Actual</p>
        <p className="text-muted-foreground truncate font-mono">{slide.id}</p>
      </div>
      {versions.length === 0 && (
        <p className="text-muted-foreground">Sin historial todavía. Cada guardado crea una versión.</p>
      )}
      {[...versions].reverse().map((html, i) => {
        const index = versions.length - i;
        return (
          <div key={`${index}-${html.length}`} className="rounded-md border border-border px-2 py-2 space-y-1.5">
            <p className="font-medium">Versión {index}</p>
            <p className="text-muted-foreground line-clamp-2">{html.replace(/<[^>]+>/g, " ").trim()}</p>
            <Button type="button" size="sm" variant="outline" className="w-full h-7" onClick={() => onRestore(html)}>
              Restaurar
            </Button>
          </div>
        );
      })}
    </div>
  );
}
