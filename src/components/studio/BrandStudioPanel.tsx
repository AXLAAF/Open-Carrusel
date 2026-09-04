"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/brand/ColorPicker";
import { CarouselPaletteEditor } from "./CarouselPaletteEditor";
import type { BrandConfig } from "@/types/brand";
import type { StylePreset } from "@/types/style-preset";
import type { Carousel } from "@/types/carousel";

interface BrandStudioPanelProps {
  carousel?: Carousel | null;
  onBrandSaved?: (brand: BrandConfig) => void;
  onRestyle?: () => void;
  onCarouselSaved?: () => void;
}

export function BrandStudioPanel({
  carousel,
  onBrandSaved,
  onRestyle,
  onCarouselSaved,
}: BrandStudioPanelProps) {
  const [brand, setBrand] = useState<BrandConfig | null>(null);
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/brand").then((r) => r.json()),
      fetch("/api/style-presets").then((r) => r.json()),
    ]).then(([b, p]) => {
      setBrand(b);
      setPresets(p.presets || []);
    });
  }, []);

  if (!brand) {
    return <p className="p-4 text-xs text-muted-foreground">Cargando marca…</p>;
  }

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
      });
      if (res.ok) {
        const next = await res.json();
        setBrand(next);
        onBrandSaved?.(next);
      }
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = async (id: string) => {
    const res = await fetch(`/api/style-presets/${id}/apply`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (data.brand) {
        setBrand(data.brand);
        onBrandSaved?.(data.brand);
      }
    }
  };

  const carouselId = carousel?.id;

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
      <p className="text-[10px] font-medium text-muted-foreground">Marca global</p>
      <label className="block">
        <span className="text-[10px] text-muted-foreground">Nombre</span>
        <Input
          value={brand.name}
          onChange={(e) => setBrand({ ...brand, name: e.target.value })}
          className="h-8 mt-1"
        />
      </label>
      <ColorPicker
        label="Primario"
        value={brand.colors.primary}
        onChange={(primary) => setBrand({ ...brand, colors: { ...brand.colors, primary } })}
      />
      <ColorPicker
        label="Acento"
        value={brand.colors.accent}
        onChange={(accent) => setBrand({ ...brand, colors: { ...brand.colors, accent } })}
      />
      <ColorPicker
        label="Fondo"
        value={brand.colors.background}
        onChange={(background) => setBrand({ ...brand, colors: { ...brand.colors, background } })}
      />
      <ColorPicker
        label="Texto"
        value={brand.colors.text || "#ffffff"}
        onChange={(text) => setBrand({ ...brand, colors: { ...brand.colors, text } })}
      />
      <p className="text-[10px] text-muted-foreground leading-relaxed -mt-1">
        Default para todos los carruseles. Si un carrusel tiene paleta propia, esa gana.
      </p>
      <label className="block">
        <span className="text-[10px] text-muted-foreground">Fuente titular</span>
        <Input
          value={brand.fonts.heading}
          onChange={(e) => setBrand({ ...brand, fonts: { ...brand.fonts, heading: e.target.value } })}
          className="h-8 mt-1"
        />
      </label>
      <label className="block">
        <span className="text-[10px] text-muted-foreground">Fuente cuerpo</span>
        <Input
          value={brand.fonts.body}
          onChange={(e) => setBrand({ ...brand, fonts: { ...brand.fonts, body: e.target.value } })}
          className="h-8 mt-1"
        />
      </label>
      <Button size="sm" className="w-full" disabled={saving} onClick={save}>
        {saving ? "Guardando…" : "Guardar marca global"}
      </Button>
      <Button size="sm" variant="outline" className="w-full" onClick={onRestyle}>
        Aplicar marca a esta diapositiva
      </Button>
      {carouselId && (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={async () => {
            await fetch(`/api/carousels/${carouselId}/restyle`, { method: "POST" });
            onRestyle?.();
            onCarouselSaved?.();
          }}
        >
          Aplicar a todo el carrusel
        </Button>
      )}

      {carousel && (
        <CarouselPaletteEditor
          key={`${carousel.id}-${carousel.updatedAt}-${JSON.stringify(carousel.palette || {})}`}
          carousel={carousel}
          brand={brand}
          onSaved={() => {
            onRestyle?.();
            onCarouselSaved?.();
          }}
        />
      )}

      {presets.length > 0 && (
        <section className="space-y-1.5 pt-2 border-t border-border">
          <p className="text-[10px] font-medium text-muted-foreground">Presets</p>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className="w-full text-left rounded-md border border-border px-2 py-1.5 hover:bg-muted"
            >
              <span className="font-medium">{preset.name}</span>
              {preset.description && (
                <span className="block text-[10px] text-muted-foreground truncate">
                  {preset.description}
                </span>
              )}
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
