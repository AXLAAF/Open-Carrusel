"use client";

import { useEffect, useMemo, useState } from "react";
import { Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BrandLayout } from "@/types/layout-library";
import type { AspectRatio } from "@/types/carousel";
import { LAYOUT_LABELS } from "@/types/layout";

interface BrandLibraryPickerProps {
  carouselId: string;
  slideId?: string;
  aspectRatio: AspectRatio;
  onApplied?: () => void;
}

export function BrandLibraryPicker({
  carouselId,
  slideId,
  aspectRatio,
  onApplied,
}: BrandLibraryPickerProps) {
  const [layouts, setLayouts] = useState<BrandLayout[]>([]);
  const [layoutId, setLayoutId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/layout-library")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.layouts || []) as BrandLayout[];
        setLayouts(list);
        const match =
          list.find((l) => l.aspectRatio === aspectRatio) || list[0];
        if (match) setLayoutId(match.id);
      })
      .catch(() => {});
  }, [aspectRatio]);

  const options = useMemo(
    () =>
      layouts.filter(
        (l) => l.aspectRatio === aspectRatio || l.aspectRatio === "4:5"
      ),
    [layouts, aspectRatio]
  );

  const apply = async (mode: "replace" | "add") => {
    if (!layoutId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/layout-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layoutId,
          carouselId,
          slideId: mode === "replace" ? slideId : undefined,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo aplicar");
      onApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  if (layouts.length === 0) {
    return (
      <section className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
          <Library className="h-3 w-3" />
          Biblioteca XookTech
        </p>
        <p className="text-[10px] text-muted-foreground">Cargando layouts…</p>
      </section>
    );
  }

  return (
    <section className="space-y-1.5">
      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
        <Library className="h-3 w-3" />
        Biblioteca XookTech
      </p>
      <select
        value={layoutId}
        onChange={(e) => setLayoutId(e.target.value)}
        className="w-full h-8 rounded-md border border-border bg-muted px-2"
      >
        {options.map((l) => (
          <option key={l.id} value={l.id}>
            {LAYOUT_LABELS[l.layout]} · {l.aspectRatio}
          </option>
        ))}
      </select>
      {error && <p className="text-destructive text-[10px]">{error}</p>}
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7"
          disabled={busy || !slideId}
          onClick={() => void apply("replace")}
        >
          Aplicar
        </Button>
        <Button
          size="sm"
          className="flex-1 h-7"
          disabled={busy}
          onClick={() => void apply("add")}
        >
          + Slide
        </Button>
      </div>
    </section>
  );
}
