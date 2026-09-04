import type { BrandColors } from "./brand";

export type AspectRatio = "1:1" | "4:5" | "9:16";

/** Per-carousel color overrides (do not mutate global brand.json). */
export type CarouselPalette = Partial<
  Pick<
    BrandColors,
    "primary" | "secondary" | "accent" | "background" | "surface" | "text"
  >
>;

export type HookVariantStyle = "question" | "stat" | "bold";

export interface HookVariant {
  id: string;
  style: HookVariantStyle;
  title: string;
  body?: string;
}

export interface Slide {
  id: string;
  html: string;
  previousVersions: string[];
  order: number;
  notes: string;
}

export interface ReferenceImage {
  id: string;
  url: string; // e.g. "/uploads/abc.png"
  absPath: string; // absolute path for Claude to Read
  name: string; // original filename or description
  addedAt: string;
}

export type PublishStatus = "draft" | "ready" | "scheduled" | "published";

export interface Carousel {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  slides: Slide[];
  referenceImages: ReferenceImage[];
  caption?: string;
  hashtags?: string[];
  /** Overrides brand colors for this carousel only. */
  palette?: CarouselPalette | null;
  /** A/B hook options (persisted; pick/switch anytime). */
  hookVariants?: HookVariant[] | null;
  /** Which of `hookVariants` is currently applied to the hook slide. */
  activeHookVariantId?: string | null;
  /** Publication queue status. */
  publishStatus?: PublishStatus;
  /** ISO datetime when this carousel should go live. */
  scheduledAt?: string | null;
  /** Last successful export timestamp (marks export-ready). */
  lastExportAt?: string | null;
  chatSessionId: string | null;
  isTemplate: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CarouselsData {
  carousels: Carousel[];
}

export const DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
};

export const MAX_SLIDES = 20;
export const MAX_VERSIONS = 5;
