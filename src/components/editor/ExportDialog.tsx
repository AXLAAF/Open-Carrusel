"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportDialogProps {
  carouselId: string;
  slideCount: number;
  activeSlideId?: string;
}

export function ExportDialog({ carouselId, slideCount, activeSlideId }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [scope, setScope] = useState<"all" | "current">("all");
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [quality, setQuality] = useState(90);
  const [naming, setNaming] = useState<"index" | "id" | "name">("index");
  const doneTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (doneTimer.current) window.clearTimeout(doneTimer.current);
    };
  }, []);

  const handleExport = async () => {
    if (exporting || slideCount === 0) return;
    if (scope === "current" && !activeSlideId) return;
    setExporting(true);
    setDone(false);
    try {
      const body: Record<string, unknown> = { format, quality, naming };
      if (scope === "current") body.slideIds = [activeSlideId];
      const response = await fetch(`/api/carousels/${carouselId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const ext = blob.type.includes("zip") ? "zip" : format;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carousel-${carouselId}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExporting(false);
      if (doneTimer.current) window.clearTimeout(doneTimer.current);
      doneTimer.current = window.setTimeout(() => setDone(false), 3000);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setOpen((v) => !v)}
        disabled={exporting || slideCount === 0}
        variant="accent"
        size="sm"
      >
        <span className="oc-enter-pop inline-flex items-center gap-2">
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exportando
            </>
          ) : done ? (
            <>
              <Check className="h-4 w-4" />
              Listo
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Exportar
            </>
          )}
        </span>
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-64 rounded-lg border border-border bg-surface shadow-lg p-3 space-y-2 text-xs">
          <label className="flex items-center justify-between">
            Alcance
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as "all" | "current")}
              className="h-7 rounded-md border border-border bg-muted px-1"
            >
              <option value="all">Todas</option>
              <option value="current" disabled={!activeSlideId}>
                Esta diapositiva
              </option>
            </select>
          </label>
          <label className="flex items-center justify-between">
            Formato
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "png" | "jpg")}
              className="h-7 rounded-md border border-border bg-muted px-1"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
            </select>
          </label>
          <label className="flex items-center justify-between">
            Calidad {quality}
            <input
              type="range"
              min={60}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-24"
            />
          </label>
          <label className="flex items-center justify-between">
            Nombre
            <select
              value={naming}
              onChange={(e) => setNaming(e.target.value as "index" | "id" | "name")}
              className="h-7 rounded-md border border-border bg-muted px-1"
            >
              <option value="index">slide-1</option>
              <option value="name">marca-01</option>
              <option value="id">id</option>
            </select>
          </label>
          <Button
            size="sm"
            variant="accent"
            className="w-full"
            onClick={handleExport}
            disabled={exporting || (scope === "current" && !activeSlideId)}
          >
            Descargar
          </Button>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Feed 1:1 recorta el centro de un 4:5. Revisa zonas seguras antes de exportar.
          </p>
        </div>
      )}
    </div>
  );
}
