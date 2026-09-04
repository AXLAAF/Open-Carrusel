import type { BrandConfig } from "@/types/brand";
import type { Carousel } from "@/types/carousel";
import { getBrand } from "@/lib/brand";
import { mergeBrandWithPalette } from "@/lib/brand-palette";

export { mergeBrandWithPalette, sanitizePalette } from "@/lib/brand-palette";

/** Server-only: load global brand and merge carousel palette. */
export async function brandForCarousel(
  carousel: Pick<Carousel, "palette"> | null | undefined
): Promise<BrandConfig> {
  const brand = await getBrand();
  return mergeBrandWithPalette(brand, carousel?.palette);
}
