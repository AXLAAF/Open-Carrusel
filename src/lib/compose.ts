import { createCarousel, addSlide, updateCarousel, getCarousel, deleteCarousel } from "@/lib/carousels";
import { getBrand } from "@/lib/brand";
import {
  defaultFields,
  isLayoutId,
  renderLayout,
  slidesFromBrief,
} from "@/lib/slide-layouts";
import type { CarouselBrief, LayoutId, SlideFields } from "@/types/layout";
import type { AspectRatio, Carousel, Slide } from "@/types/carousel";
import type { BrandConfig } from "@/types/brand";

const RATIOS: AspectRatio[] = ["1:1", "4:5", "9:16"];

export function parseRatio(value: unknown): AspectRatio {
  return RATIOS.includes(value as AspectRatio) ? (value as AspectRatio) : "4:5";
}

export function renderSlideHtml(
  layout: LayoutId,
  fields: SlideFields | undefined,
  brand: BrandConfig,
  ratio: AspectRatio
): string {
  return renderLayout(layout, { ...defaultFields(layout, brand), ...fields }, brand, ratio);
}

export async function composeCarousel(brief: CarouselBrief): Promise<Carousel> {
  if (!brief.name?.trim()) {
    throw new Error("name is required");
  }
  const baseBrand = await getBrand();
  const brand: BrandConfig = brief.colors
    ? {
        ...baseBrand,
        colors: { ...baseBrand.colors, ...brief.colors },
      }
    : baseBrand;
  const ratio = parseRatio(brief.ratio);
  const carousel = await createCarousel(brief.name.trim(), ratio);
  try {
    const specs = slidesFromBrief(brief);

    for (const spec of specs) {
      if (!isLayoutId(spec.layout)) continue;
      const html = renderSlideHtml(spec.layout, spec, brand, ratio);
      await addSlide(carousel.id, html, spec.notes || spec.layout);
    }

    const captionUpdates: {
      caption?: string;
      hashtags?: string[];
      palette?: typeof brief.colors | null;
    } = {};
    if (brief.caption) captionUpdates.caption = brief.caption;
    if (brief.hashtags?.length) captionUpdates.hashtags = brief.hashtags;
    if (brief.colors && Object.keys(brief.colors).length) {
      captionUpdates.palette = brief.colors;
    }
    if (Object.keys(captionUpdates).length) {
      await updateCarousel(carousel.id, captionUpdates);
    }

    return (await getCarousel(carousel.id)) as Carousel;
  } catch (err) {
    await deleteCarousel(carousel.id);
    throw err;
  }
}

export async function addLayoutSlide(
  carouselId: string,
  layout: LayoutId,
  fields: SlideFields | undefined,
  notes: string | undefined,
  ratio: AspectRatio,
  brand: BrandConfig
): Promise<Slide | null> {
  const html = renderSlideHtml(layout, fields, brand, ratio);
  return addSlide(carouselId, html, notes || layout);
}
