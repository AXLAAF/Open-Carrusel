import { readDataSafe, updateData } from "./data";
import { generateId, now } from "./utils";
import type { Carousel, CarouselsData, Slide, AspectRatio, ReferenceImage, CarouselPalette, HookVariant, PublishStatus } from "@/types/carousel";
import { MAX_SLIDES, MAX_VERSIONS } from "@/types/carousel";
import {
  writeSlideHtml,
  readSlideHtml,
  deleteSlideHtml,
  deleteCarouselSlideFiles,
  hydrateCarouselSlides,
  hydrateSlideHtml,
  slideHtmlMtime,
} from "./slide-files";
import { resizeSlideHtml } from "./slide-fields";
import { sanitizePalette } from "./brand-palette";

const FILE = "carousels.json";
const EMPTY: CarouselsData = { carousels: [] };

type CarouselUpdatableKey =
  | "name"
  | "aspectRatio"
  | "tags"
  | "chatSessionId"
  | "caption"
  | "hashtags"
  | "palette"
  | "hookVariants"
  | "activeHookVariantId"
  | "publishStatus"
  | "scheduledAt"
  | "lastExportAt";

type CarouselPatch = Partial<Pick<Carousel, CarouselUpdatableKey>>;

const RATIOS: AspectRatio[] = ["1:1", "4:5", "9:16"];
const STATUSES: PublishStatus[] = ["draft", "ready", "scheduled", "published"];

function stripVersions(carousel: Carousel): Carousel {
  return {
    ...carousel,
    slides: carousel.slides.map((s) => ({
      ...s,
      previousVersions: s.previousVersions.length > 0 ? [""] : [],
    })),
  };
}

function sanitizeHookVariants(input: unknown): HookVariant[] | null {
  if (input === null) return null;
  if (!Array.isArray(input)) return null;
  const out: HookVariant[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const v = item as Record<string, unknown>;
    const style = v.style;
    if (style !== "question" && style !== "stat" && style !== "bold") continue;
    if (typeof v.title !== "string" || !v.title.trim()) continue;
    out.push({
      id: typeof v.id === "string" && v.id ? v.id : crypto.randomUUID(),
      style,
      title: v.title.trim(),
      body: typeof v.body === "string" ? v.body : undefined,
    });
  }
  return out.length ? out : null;
}

function pickCarouselPatch(updates: Record<string, unknown>): CarouselPatch {
  const patch: CarouselPatch = {};
  if (typeof updates.name === "string") patch.name = updates.name;
  if (RATIOS.includes(updates.aspectRatio as AspectRatio)) {
    patch.aspectRatio = updates.aspectRatio as AspectRatio;
  }
  if (Array.isArray(updates.tags) && updates.tags.every((t) => typeof t === "string")) {
    patch.tags = updates.tags;
  }
  if (updates.chatSessionId === null || typeof updates.chatSessionId === "string") {
    patch.chatSessionId = updates.chatSessionId as string | null;
  }
  if (typeof updates.caption === "string") patch.caption = updates.caption;
  if (
    Array.isArray(updates.hashtags) &&
    updates.hashtags.every((h) => typeof h === "string")
  ) {
    patch.hashtags = updates.hashtags;
  }
  if ("palette" in updates) {
    patch.palette = sanitizePalette(updates.palette) as CarouselPalette | null;
  }
  if ("hookVariants" in updates) {
    patch.hookVariants = sanitizeHookVariants(updates.hookVariants);
  }
  if (
    updates.activeHookVariantId === null ||
    typeof updates.activeHookVariantId === "string"
  ) {
    patch.activeHookVariantId = updates.activeHookVariantId as string | null;
  }
  if (
    typeof updates.publishStatus === "string" &&
    STATUSES.includes(updates.publishStatus as PublishStatus)
  ) {
    patch.publishStatus = updates.publishStatus as PublishStatus;
  }
  if (updates.scheduledAt === null || typeof updates.scheduledAt === "string") {
    patch.scheduledAt = updates.scheduledAt as string | null;
  }
  if (updates.lastExportAt === null || typeof updates.lastExportAt === "string") {
    patch.lastExportAt = updates.lastExportAt as string | null;
  }
  return patch;
}

async function load(): Promise<CarouselsData> {
  return readDataSafe<CarouselsData>(FILE, EMPTY);
}

export async function listCarousels(): Promise<Carousel[]> {
  const data = await load();
  const list = data.carousels.filter((c) => !c.isTemplate);
  return Promise.all(
    list.map(async (c) => {
      if (c.slides.length === 0) return c;
      const first = await hydrateSlideHtml(c.id, c.slides[0]);
      return {
        ...c,
        slides: [
          { ...first, previousVersions: [] },
          ...c.slides.slice(1).map((s) => ({
            ...s,
            html: "",
            previousVersions: [],
          })),
        ],
      };
    })
  );
}

export async function getCarousel(id: string): Promise<Carousel | null> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === id) ?? null;
  if (!carousel) return null;
  const hydrated = await hydrateCarouselSlides(carousel);
  return stripVersions({ ...carousel, slides: hydrated.slides });
}

export async function getCarouselEtag(id: string): Promise<string | null> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === id) ?? null;
  if (!carousel) return null;
  const mtimes = await Promise.all(
    carousel.slides.map((s) => slideHtmlMtime(carousel.id, s.id))
  );
  const fingerprint = carousel.slides
    .map((s, i) => `${s.id}:${mtimes[i]}`)
    .join(",");
  return `"${carousel.updatedAt}-${carousel.slides.length}-${fingerprint}"`;
}

export async function createCarousel(
  name: string,
  aspectRatio: AspectRatio
): Promise<Carousel> {
  let carousel!: Carousel;
  await updateData<CarouselsData>(FILE, EMPTY, (data) => {
    carousel = {
      id: generateId(),
      name,
      aspectRatio,
      slides: [],
      referenceImages: [],
      chatSessionId: null,
      isTemplate: false,
      tags: [],
      createdAt: now(),
      updatedAt: now(),
    };
    data.carousels.push(carousel);
  });
  return carousel;
}

export async function updateCarousel(
  id: string,
  updates: CarouselPatch | Record<string, unknown>
): Promise<Carousel | null> {
  const patch = pickCarouselPatch(updates as Record<string, unknown>);
  let result: Carousel | null = null;
  let ratioChanged: AspectRatio | null = null;

  await updateData<CarouselsData>(FILE, EMPTY, (data) => {
    const idx = data.carousels.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const prev = data.carousels[idx];
    if (patch.aspectRatio && patch.aspectRatio !== prev.aspectRatio) {
      ratioChanged = patch.aspectRatio;
    }
    Object.assign(data.carousels[idx], patch, { updatedAt: now() });
    result = data.carousels[idx];
  });

  if (ratioChanged && result) {
    await resizeCarouselSlides(id, ratioChanged);
    return getCarousel(id);
  }
  return result ? getCarousel(id) : null;
}

async function resizeCarouselSlides(
  carouselId: string,
  ratio: AspectRatio
): Promise<number> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return 0;
  const hydrated = await hydrateCarouselSlides(carousel);
  let count = 0;
  for (const slide of hydrated.slides) {
    const next = resizeSlideHtml(slide.html, ratio);
    if (next !== slide.html) {
      await writeSlideHtml(carouselId, slide.id, next);
      count += 1;
    }
  }
  if (count > 0) {
    await updateData<CarouselsData>(FILE, EMPTY, (store) => {
      const c = store.carousels.find((x) => x.id === carouselId);
      if (c) c.updatedAt = now();
    });
  }
  return count;
}

export async function duplicateCarousel(id: string): Promise<Carousel | null> {
  let duplicate: Carousel | null = null;
  await updateData<CarouselsData>(FILE, EMPTY, async (data) => {
    const found = data.carousels.find((c) => c.id === id);
    if (!found) return;
    const source = await hydrateCarouselSlides(found);

    duplicate = {
      ...source,
      id: generateId(),
      name: `${source.name} (copy)`,
      slides: source.slides.map((s) => ({
        ...s,
        id: generateId(),
        previousVersions: [],
      })),
      referenceImages: [...(source.referenceImages || [])],
      chatSessionId: null,
      isTemplate: false,
      createdAt: now(),
      updatedAt: now(),
    };

    await Promise.all(
      duplicate.slides.map((s) => writeSlideHtml(duplicate!.id, s.id, s.html))
    );
    data.carousels.push(duplicate);
  });
  return duplicate;
}

export async function deleteCarousel(id: string): Promise<boolean> {
  let deleted = false;
  await updateData<CarouselsData>(FILE, EMPTY, (data) => {
    const idx = data.carousels.findIndex((c) => c.id === id);
    if (idx === -1) return;
    data.carousels.splice(idx, 1);
    deleted = true;
  });
  if (deleted) {
    await deleteCarouselSlideFiles(id);
  }
  return deleted;
}

export async function addSlide(
  carouselId: string,
  html: string,
  notes = ""
): Promise<Slide | null> {
  let slide: Slide | null = null;
  await updateData<CarouselsData>(FILE, EMPTY, async (data) => {
    const carousel = data.carousels.find((c) => c.id === carouselId);
    if (!carousel) return;
    if (carousel.slides.length >= MAX_SLIDES) return;

    slide = {
      id: generateId(),
      html,
      previousVersions: [],
      order: carousel.slides.length,
      notes,
    };
    await writeSlideHtml(carouselId, slide.id, html);
    carousel.slides.push(slide);
    carousel.updatedAt = now();
  });
  return slide;
}

export async function updateSlide(
  carouselId: string,
  slideId: string,
  updates: Partial<Pick<Slide, "html" | "notes">> | Record<string, unknown>
): Promise<Slide | null> {
  const html = typeof updates.html === "string" ? updates.html : undefined;
  const notes = typeof updates.notes === "string" ? updates.notes : undefined;
  if (html === undefined && notes === undefined) {
    const data = await load();
    const carousel = data.carousels.find((c) => c.id === carouselId);
    return carousel?.slides.find((s) => s.id === slideId) ?? null;
  }

  let result: Slide | null = null;
  await updateData<CarouselsData>(FILE, EMPTY, async (data) => {
    const carousel = data.carousels.find((c) => c.id === carouselId);
    if (!carousel) return;
    const slide = carousel.slides.find((s) => s.id === slideId);
    if (!slide) return;

    const currentHtml = (await readSlideHtml(carouselId, slideId)) ?? slide.html;

    if (html !== undefined && html !== currentHtml) {
      slide.previousVersions.push(currentHtml);
      if (slide.previousVersions.length > MAX_VERSIONS) {
        slide.previousVersions.shift();
      }
      slide.html = html;
      await writeSlideHtml(carouselId, slideId, html);
    }
    if (notes !== undefined) slide.notes = notes;
    carousel.updatedAt = now();
    result = slide;
  });
  return result;
}

export async function duplicateSlide(
  carouselId: string,
  slideId: string
): Promise<Slide | null> {
  let slide: Slide | null = null;
  await updateData<CarouselsData>(FILE, EMPTY, async (data) => {
    const carousel = data.carousels.find((c) => c.id === carouselId);
    if (!carousel) return;
    if (carousel.slides.length >= MAX_SLIDES) return;
    const found = carousel.slides.find((s) => s.id === slideId);
    if (!found) return;
    const source = await hydrateSlideHtml(carouselId, found);

    slide = {
      id: generateId(),
      html: source.html,
      previousVersions: [],
      order: carousel.slides.length,
      notes: source.notes,
    };
    await writeSlideHtml(carouselId, slide.id, slide.html);
    carousel.slides.push(slide);
    carousel.updatedAt = now();
  });
  return slide;
}

export async function deleteSlide(
  carouselId: string,
  slideId: string
): Promise<boolean> {
  let deleted = false;
  await updateData<CarouselsData>(FILE, EMPTY, (data) => {
    const carousel = data.carousels.find((c) => c.id === carouselId);
    if (!carousel) return;
    const idx = carousel.slides.findIndex((s) => s.id === slideId);
    if (idx === -1) return;

    carousel.slides.splice(idx, 1);
    carousel.slides.forEach((s, i) => {
      s.order = i;
    });
    carousel.updatedAt = now();
    deleted = true;
  });
  if (deleted) {
    await deleteSlideHtml(carouselId, slideId);
  }
  return deleted;
}

export async function reorderSlides(
  carouselId: string,
  slideIds: string[]
): Promise<boolean> {
  let ok = false;
  await updateData<CarouselsData>(FILE, EMPTY, (data) => {
    const carousel = data.carousels.find((c) => c.id === carouselId);
    if (!carousel) return;

    const existing = carousel.slides.map((s) => s.id);
    if (slideIds.length !== existing.length) return;
    const seen = new Set<string>();
    for (const id of slideIds) {
      if (seen.has(id) || !existing.includes(id)) return;
      seen.add(id);
    }

    const slideMap = new Map(carousel.slides.map((s) => [s.id, s]));
    carousel.slides = slideIds.map((id, i) => {
      const slide = slideMap.get(id)!;
      slide.order = i;
      return slide;
    });
    carousel.updatedAt = now();
    ok = true;
  });
  return ok;
}

export async function undoSlide(
  carouselId: string,
  slideId: string
): Promise<Slide | null> {
  let result: Slide | null = null;
  await updateData<CarouselsData>(FILE, EMPTY, async (data) => {
    const carousel = data.carousels.find((c) => c.id === carouselId);
    if (!carousel) return;
    const slide = carousel.slides.find((s) => s.id === slideId);
    if (!slide || slide.previousVersions.length === 0) return;

    const previousHtml = slide.previousVersions.pop()!;
    slide.html = previousHtml;
    carousel.updatedAt = now();
    await writeSlideHtml(carouselId, slideId, previousHtml);
    result = slide;
  });
  return result;
}

export async function addReferenceImage(
  carouselId: string,
  image: ReferenceImage
): Promise<ReferenceImage | null> {
  let result: ReferenceImage | null = null;
  await updateData<CarouselsData>(FILE, EMPTY, (data) => {
    const carousel = data.carousels.find((c) => c.id === carouselId);
    if (!carousel) return;
    if (!carousel.referenceImages) carousel.referenceImages = [];
    carousel.referenceImages.push(image);
    carousel.updatedAt = now();
    result = image;
  });
  return result;
}

export async function removeReferenceImage(
  carouselId: string,
  imageId: string
): Promise<boolean> {
  let deleted = false;
  await updateData<CarouselsData>(FILE, EMPTY, (data) => {
    const carousel = data.carousels.find((c) => c.id === carouselId);
    if (!carousel || !carousel.referenceImages) return;
    const idx = carousel.referenceImages.findIndex((img) => img.id === imageId);
    if (idx === -1) return;
    carousel.referenceImages.splice(idx, 1);
    carousel.updatedAt = now();
    deleted = true;
  });
  return deleted;
}
