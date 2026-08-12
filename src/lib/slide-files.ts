import { readFile, writeFile, rename, mkdir, rm } from "fs/promises";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");

export function slideHtmlRelPath(carouselId: string, slideId: string): string {
  return path.join("slides", carouselId, `${slideId}.html`);
}

export function slideHtmlAbsPath(carouselId: string, slideId: string): string {
  return path.join(DATA_DIR, "slides", carouselId, `${slideId}.html`);
}

export async function writeSlideHtml(
  carouselId: string,
  slideId: string,
  html: string
): Promise<void> {
  const filePath = slideHtmlAbsPath(carouselId, slideId);
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = filePath + ".tmp";
  await writeFile(tmpPath, html, "utf-8");
  await rename(tmpPath, filePath);
}

export async function readSlideHtml(
  carouselId: string,
  slideId: string
): Promise<string | null> {
  try {
    return await readFile(slideHtmlAbsPath(carouselId, slideId), "utf-8");
  } catch {
    return null;
  }
}

export async function deleteSlideHtml(
  carouselId: string,
  slideId: string
): Promise<void> {
  await rm(slideHtmlAbsPath(carouselId, slideId), { force: true });
}

export async function deleteCarouselSlideFiles(
  carouselId: string
): Promise<void> {
  await rm(path.join(DATA_DIR, "slides", carouselId), {
    recursive: true,
    force: true,
  });
}

export async function hydrateSlideHtml<
  T extends { id: string; html: string },
>(carouselId: string, slide: T): Promise<T> {
  const html = await readSlideHtml(carouselId, slide.id);
  if (html != null) return { ...slide, html };
  if (slide.html) {
    await writeSlideHtml(carouselId, slide.id, slide.html);
  }
  return slide;
}

export async function hydrateCarouselSlides<
  T extends { id: string; slides: { id: string; html: string }[] },
>(carousel: T): Promise<T> {
  const slides = await Promise.all(
    carousel.slides.map((s) => hydrateSlideHtml(carousel.id, s))
  );
  return { ...carousel, slides };
}
