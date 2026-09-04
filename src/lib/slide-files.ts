import { readFile, writeFile, rename, mkdir, rm, stat } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { Mutex } from "async-mutex";

const DATA_DIR = path.resolve(process.cwd(), "data");
const htmlMutexes = new Map<string, Mutex>();

export function slideHtmlRelPath(carouselId: string, slideId: string): string {
  return path.join("slides", carouselId, `${slideId}.html`);
}

function assertSafeId(id: string): void {
  if (!id || id.includes("..") || id.includes("/") || id.includes("\\")) {
    throw new Error("Invalid id");
  }
}

function getHtmlMutex(filePath: string): Mutex {
  let mutex = htmlMutexes.get(filePath);
  if (!mutex) {
    mutex = new Mutex();
    htmlMutexes.set(filePath, mutex);
  }
  return mutex;
}

export function slideHtmlAbsPath(carouselId: string, slideId: string): string {
  assertSafeId(carouselId);
  assertSafeId(slideId);
  return path.join(DATA_DIR, "slides", carouselId, `${slideId}.html`);
}

export async function writeSlideHtml(
  carouselId: string,
  slideId: string,
  html: string
): Promise<void> {
  const filePath = slideHtmlAbsPath(carouselId, slideId);
  await getHtmlMutex(filePath).runExclusive(async () => {
    await mkdir(path.dirname(filePath), { recursive: true });
    const tmpPath = `${filePath}.${process.pid}.${randomBytes(6).toString("hex")}.tmp`;
    try {
      await writeFile(tmpPath, html, "utf-8");
      await rename(tmpPath, filePath);
    } catch (err) {
      await rm(tmpPath, { force: true }).catch(() => {});
      throw err;
    }
  });
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
  assertSafeId(carouselId);
  await rm(path.join(DATA_DIR, "slides", carouselId), {
    recursive: true,
    force: true,
  });
}

export async function slideHtmlMtime(
  carouselId: string,
  slideId: string
): Promise<number> {
  try {
    const st = await stat(slideHtmlAbsPath(carouselId, slideId));
    return st.mtimeMs;
  } catch {
    return 0;
  }
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
