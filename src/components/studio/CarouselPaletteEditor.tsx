"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/brand/ColorPicker";
import type { Carousel, CarouselPalette } from "@/types/carousel";
import type { BrandConfig } from "@/types/brand";

interface CarouselPaletteEditorProps {
  carousel: Carousel;
  brand: BrandConfig;
  onSaved: () => void;
}

const EMPTY: CarouselPalette = {
  primary: "#1a1a2e",
  accent: "#e94560",
  background: "#0a0a0a",
  text: "#ffffff",
};

export function CarouselPaletteEditor({
  carousel,
  brand,
  onSaved,
}: CarouselPaletteEditorProps) {
  const base = carousel.palette || {
    primary: brand.colors.primary,
    accent: brand.colors.accent,
    background: brand.colors.background,
    text: brand.colors.text || "#ffffff",
  };
  const [draft, setDraft] = useState<CarouselPalette>({ ...EMPTY, ...base });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasOverride = Boolean(carousel.palette && Object.keys(carousel.palette).length);

  const save = async (palette: CarouselPalette | null) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/carousels/${carousel.id}/palette`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ palette, apply: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "No se pudo guardar");
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-2 pt-3 border-t border-border">
      <p className="text-[10px] font-medium text-muted-foreground">
        Paleta de este carrusel
      </p>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Sobrescribe la marca global solo aquí. No toca brand.json.
        {hasOverride ? " · Activa" : " · Usando marca global"}
      </p>
      <ColorPicker
        label="Primario"
        value={draft.primary || brand.colors.primary}
        onChange={(primary) => setDraft((d) => ({ ...d, primary }))}
      />
      <ColorPicker
        label="Acento"
        value={draft.accent || brand.colors.accent}
        onChange={(accent) => setDraft((d) => ({ ...d, accent }))}
      />
      <ColorPicker
        label="Fondo"
        value={
          /^#/.test(draft.background || "")
            ? (draft.background as string)
            : "#0a0a0a"
        }
        onChange={(background) => setDraft((d) => ({ ...d, background }))}
      />
      <ColorPicker
        label="Texto"
        value={draft.text || "#ffffff"}
        onChange={(text) => setDraft((d) => ({ ...d, text }))}
      />
      {error && <p className="text-[11px] text-destructive">{error}</p>}
      <Button
        size="sm"
        className="w-full"
        disabled={saving}
        onClick={() => void save(draft)}
      >
        {saving ? "Aplicando…" : "Guardar y aplicar a slides"}
      </Button>
      {hasOverride && (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={saving}
          onClick={() => void save(null)}
        >
          Quitar paleta (usar marca global)
        </Button>
      )}
    </section>
  );
}
