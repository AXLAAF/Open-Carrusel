import { readDataSafe, writeData } from "./data";
import { generateId, now } from "./utils";
import type { Carousel, CarouselsData, Slide, AspectRatio, ReferenceImage } from "@/types/carousel";
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

function stripVersions(carousel: Carousel): Carousel {
  return {
    ...carousel,
    slides: carousel.slides.map((s) => ({
      ...s,
      previousVersions: s.previousVersions.length > 0 ? [""] : [],
    })),
  };
}

const FILE = "carousels.json";

async function load(): Promise<CarouselsData> {
  return readDataSafe<CarouselsData>(FILE, { carousels: [] });
}

async function save(data: CarouselsData): Promise<void> {
  await writeData(FILE, data);
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
  const data = await load();
  const carousel: Carousel = {
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
  await save(data);
  return carousel;
}

export async function updateCarousel(
  id: string,
  updates: Partial<Pick<Carousel, "name" | "aspectRatio" | "tags" | "chatSessionId" | "caption" | "hashtags">>
): Promise<Carousel | null> {
  const data = await load();
  const idx = data.carousels.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  Object.assign(data.carousels[idx], updates, { updatedAt: now() });
  await save(data);
  return data.carousels[idx];
}

export async function duplicateCarousel(id: string): Promise<Carousel | null> {
  const data = await load();
  const found = data.carousels.find((c) => c.id === id);
  if (!found) return null;
  const source = await hydrateCarouselSlides(found);

  const duplicate: Carousel = {
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

  data.carousels.push(duplicate);
  await save(data);
  await Promise.all(
    duplicate.slides.map((s) => writeSlideHtml(duplicate.id, s.id, s.html))
  );
  return duplicate;
}

export async function deleteCarousel(id: string): Promise<boolean> {
  const data = await load();
  const idx = data.carousels.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  data.carousels.splice(idx, 1);
  await save(data);
  await deleteCarouselSlideFiles(id);
  return true;
}

// --- Slide operations ---

export async function addSlide(
  carouselId: string,
  html: string,
  notes = ""
): Promise<Slide | null> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return null;
  if (carousel.slides.length >= MAX_SLIDES) return null;

  const slide: Slide = {
    id: generateId(),
    html,
    previousVersions: [],
    order: carousel.slides.length,
    notes,
  };
  carousel.slides.push(slide);
  carousel.updatedAt = now();
  await save(data);
  await writeSlideHtml(carouselId, slide.id, html);
  return slide;
}

export async function updateSlide(
  carouselId: string,
  slideId: string,
  updates: Partial<Pick<Slide, "html" | "notes">>
): Promise<Slide | null> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return null;
  const slide = carousel.slides.find((s) => s.id === slideId);
  if (!slide) return null;

  const currentHtml = (await readSlideHtml(carouselId, slideId)) ?? slide.html;

  if (updates.html && updates.html !== currentHtml) {
    slide.previousVersions.push(currentHtml);
    if (slide.previousVersions.length > MAX_VERSIONS) {
      slide.previousVersions.shift();
    }
  }

  Object.assign(slide, updates);
  carousel.updatedAt = now();
  await save(data);
  if (updates.html) {
    await writeSlideHtml(carouselId, slideId, slide.html);
  }
  return slide;
}

export async function duplicateSlide(
  carouselId: string,
  slideId: string
): Promise<Slide | null> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return null;
  if (carousel.slides.length >= MAX_SLIDES) return null;
  const found = carousel.slides.find((s) => s.id === slideId);
  if (!found) return null;
  const source = await hydrateSlideHtml(carouselId, found);

  const slide: Slide = {
    id: generateId(),
    html: source.html,
    previousVersions: [],
    order: carousel.slides.length,
    notes: source.notes,
  };
  carousel.slides.push(slide);
  carousel.updatedAt = now();
  await save(data);
  await writeSlideHtml(carouselId, slide.id, slide.html);
  return slide;
}

export async function deleteSlide(
  carouselId: string,
  slideId: string
): Promise<boolean> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return false;
  const idx = carousel.slides.findIndex((s) => s.id === slideId);
  if (idx === -1) return false;

  carousel.slides.splice(idx, 1);
  carousel.slides.forEach((s, i) => {
    s.order = i;
  });
  carousel.updatedAt = now();
  await save(data);
  await deleteSlideHtml(carouselId, slideId);
  return true;
}

export async function reorderSlides(
  carouselId: string,
  slideIds: string[]
): Promise<boolean> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return false;

  const slideMap = new Map(carousel.slides.map((s) => [s.id, s]));
  const reordered: Slide[] = [];
  for (const id of slideIds) {
    const slide = slideMap.get(id);
    if (!slide) return false;
    slide.order = reordered.length;
    reordered.push(slide);
  }
  carousel.slides = reordered;
  carousel.updatedAt = now();
  await save(data);
  return true;
}

export async function undoSlide(
  carouselId: string,
  slideId: string
): Promise<Slide | null> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return null;
  const slide = carousel.slides.find((s) => s.id === slideId);
  if (!slide || slide.previousVersions.length === 0) return null;

  const previousHtml = slide.previousVersions.pop()!;
  slide.html = previousHtml;
  carousel.updatedAt = now();
  await save(data);
  await writeSlideHtml(carouselId, slideId, previousHtml);
  return slide;
}

// --- Reference images ---

export async function addReferenceImage(
  carouselId: string,
  image: ReferenceImage
): Promise<ReferenceImage | null> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel) return null;

  if (!carousel.referenceImages) carousel.referenceImages = [];
  carousel.referenceImages.push(image);
  carousel.updatedAt = now();
  await save(data);
  return image;
}

export async function removeReferenceImage(
  carouselId: string,
  imageId: string
): Promise<boolean> {
  const data = await load();
  const carousel = data.carousels.find((c) => c.id === carouselId);
  if (!carousel || !carousel.referenceImages) return false;

  const idx = carousel.referenceImages.findIndex((img) => img.id === imageId);
  if (idx === -1) return false;

  carousel.referenceImages.splice(idx, 1);
  carousel.updatedAt = now();
  await save(data);
  return true;
}
