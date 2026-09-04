"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Library, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideRenderer } from "@/components/editor/SlideRenderer";
import type { BrandLayout } from "@/types/layout-library";
import type { AspectRatio } from "@/types/carousel";
import { LAYOUT_LABELS } from "@/types/layout";

interface LayoutLibraryGalleryProps {
  /** If set, apply replaces/adds into this carousel instead of creating navigation only. */
  carouselId?: string;
  activeSlideId?: string;
  onApplied?: () => void;
}

export function LayoutLibraryGallery({
  carouselId,
  activeSlideId,
  onApplied,
}: LayoutLibraryGalleryProps) {
  const router = useRouter();
  const [layouts, setLayouts] = useState<BrandLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "4:5" | "9:16">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/layout-library")
      .then((r) => r.json())
      .then((data) => {
        setLayouts(data.layouts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    if (filter === "all") return layouts;
    return layouts.filter((l) => l.aspectRatio === filter);
  }, [layouts, filter]);

  const apply = async (layout: BrandLayout, mode: "replace" | "add") => {
    if (!carouselId) return;
    setBusyId(layout.id);
    try {
      const res = await fetch("/api/layout-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layoutId: layout.id,
          carouselId,
          slideId: mode === "replace" ? activeSlideId : undefined,
          mode,
        }),
      });
      if (res.ok) onApplied?.();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-xs text-muted-foreground">
          Layouts XookTech reutilizables · {visible.length}
        </p>
        <div className="flex gap-1">
          {(["all", "4:5", "9:16"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2 py-1 rounded-md border ${
                filter === f
                  ? "border-accent text-accent"
                  : "border-border text-muted-foreground"
              }`}
            >
              {f === "all" ? "Todos" : f}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-12">
          <Library className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Biblioteca vacía</p>
        </div>
      ) : (
        <div className="oc-stagger grid grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((layout) => (
            <div
              key={layout.id}
              className="rounded-xl border border-border bg-surface overflow-hidden"
            >
              <div className="aspect-[4/5] bg-muted relative">
                <SlideRenderer
                  html={layout.html}
                  aspectRatio={layout.aspectRatio as AspectRatio}
                  className="absolute inset-0"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <div className="p-2.5 space-y-1.5">
                <p className="text-xs font-semibold truncate">{layout.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {LAYOUT_LABELS[layout.layout]} · {layout.aspectRatio}
                </p>
                {carouselId ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-[10px]"
                      disabled={busyId === layout.id || !activeSlideId}
                      onClick={() => void apply(layout, "replace")}
                    >
                      Aplicar
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 px-2"
                      disabled={busyId === layout.id}
                      onClick={() => void apply(layout, "add")}
                      title="Añadir slide"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[10px]"
                    onClick={() => router.push("/")}
                  >
                    Abrir un carrusel para usar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
