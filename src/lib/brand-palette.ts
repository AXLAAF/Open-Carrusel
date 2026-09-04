import type { BrandColors, BrandConfig } from "@/types/brand";
import type { CarouselPalette } from "@/types/carousel";

/** Merge global brand with an optional per-carousel palette (carousel wins). */
export function mergeBrandWithPalette(
  brand: BrandConfig,
  palette?: CarouselPalette | null
): BrandConfig {
  if (!palette || Object.keys(palette).length === 0) return brand;
  const colors: BrandColors = { ...brand.colors };
  for (const key of Object.keys(palette) as (keyof BrandColors)[]) {
    const val = palette[key];
    if (typeof val === "string" && val.trim()) {
      if (key === "text") colors.text = val.trim();
      else (colors as unknown as Record<string, string>)[key] = val.trim();
    }
  }
  return { ...brand, colors };
}

export function sanitizePalette(input: unknown): CarouselPalette | null {
  if (input === null) return null;
  if (!input || typeof input !== "object") return null;
  const src = input as Record<string, unknown>;
  const out: CarouselPalette = {};
  for (const key of [
    "primary",
    "secondary",
    "accent",
    "background",
    "surface",
    "text",
  ] as const) {
    const val = src[key];
    if (typeof val === "string" && val.trim()) out[key] = val.trim();
  }
  return Object.keys(out).length ? out : null;
}
