import type { BrandConfig } from "@/types/brand";
import type { AspectRatio } from "@/types/carousel";
import { defaultFields, renderLayout } from "@/lib/slide-layouts";

export function blankSlideHtml(
  aspectRatio: AspectRatio,
  brand: BrandConfig
): string {
  return renderLayout("value", defaultFields("value", brand), brand, aspectRatio);
}
