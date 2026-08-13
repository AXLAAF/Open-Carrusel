import puppeteer, { type Browser } from "puppeteer";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { wrapSlideHtml, extractFontFamilies } from "./slide-html";
import { getInlinedFontCSS } from "./fonts";
import { getInlinedLocalFontCSS } from "./local-fonts";
import type { Slide, AspectRatio } from "@/types/carousel";
import { DIMENSIONS } from "@/types/carousel";

export type ExportFormat = "png" | "jpg";
export type ExportNaming = "index" | "id" | "name";

export interface ExportOptions {
  format?: ExportFormat;
  quality?: number;
  naming?: ExportNaming;
  carouselName?: string;
}

// Singleton browser with lifecycle management
let browser: Browser | null = null;
let exportCount = 0;
const MAX_EXPORTS_BEFORE_RESTART = 50;

async function getBrowser(): Promise<Browser> {
  if (browser && exportCount >= MAX_EXPORTS_BEFORE_RESTART) {
    await browser.close().catch(() => {});
    browser = null;
    exportCount = 0;
  }
  if (!browser || !browser.isConnected()) {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });
    exportCount = 0;
  }
  return browser;
}

/**
 * Inline all image references in slide HTML.
 * Replaces /uploads/xxx.png paths with data: URIs.
 */
async function inlineImages(html: string): Promise<string> {
  const uploadDir = path.resolve(process.cwd(), "public");
  const imgRegex = /(?:src=["']|url\(["']?)(\/uploads\/[^"'\s)]+)/g;
  const matches = [...html.matchAll(imgRegex)];

  let result = html;
  for (const match of matches) {
    const imgPath = match[1];
    try {
      const fullPath = path.join(uploadDir, imgPath);
      const buffer = await readFile(fullPath);
      const ext = path.extname(imgPath).toLowerCase();
      const mime =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : "image/webp";
      const base64 = buffer.toString("base64");
      result = result.replace(imgPath, `data:${mime};base64,${base64}`);
    } catch {
      // Keep original path — Puppeteer can fetch from localhost
    }
  }

  return result;
}

/**
 * Export a single slide to PNG buffer.
 */
export async function exportSlide(
  slide: Slide,
  aspectRatio: AspectRatio
): Promise<Buffer> {
  const { width, height } = DIMENSIONS[aspectRatio];

  // Get inlined font CSS
  const fontFamilies = extractFontFamilies(slide.html);
  const [googleCss, localCss] = await Promise.all([
    getInlinedFontCSS(fontFamilies),
    getInlinedLocalFontCSS(),
  ]);
  const inlinedFontCss = [googleCss, localCss].filter(Boolean).join("\n");

  // Inline images
  const inlinedHtml = await inlineImages(slide.html);

  // Build self-contained HTML
  const fullHtml = wrapSlideHtml(inlinedHtml, aspectRatio, {
    inlineFontCss: inlinedFontCss,
  });

  const br = await getBrowser();
  const page = await br.newPage();

  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(fullHtml, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Wait for fonts to be ready
    await page
      .waitForFunction(
        () =>
          document.fonts.ready.then(() =>
            [...document.fonts].every((f) => f.status === "loaded")
          ),
        { timeout: 10000 }
      )
      .catch(() => {
        // Font loading timeout — proceed with whatever loaded
      });

    const screenshotBuffer = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width, height },
    });

    exportCount++;

    return encodeExport(screenshotBuffer, { format: "png", quality: 100 });
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Export all slides of a carousel to PNG buffers.
 * Processes up to 3 slides concurrently.
 */
export async function encodeExport(
  pngBuffer: Buffer | Uint8Array,
  options: Pick<ExportOptions, "format" | "quality"> = {}
): Promise<Buffer> {
  const format = options.format === "jpg" ? "jpg" : "png";
  const quality = clampQuality(options.quality);
  const image = sharp(pngBuffer).toColorspace("srgb");
  if (format === "jpg") {
    return image.jpeg({ quality, mozjpeg: true }).toBuffer();
  }
  const compressionLevel = Math.round((100 - quality) / 11);
  return image.png({ compressionLevel }).toBuffer();
}

function clampQuality(quality?: number): number {
  if (typeof quality !== "number" || Number.isNaN(quality)) return 90;
  return Math.min(100, Math.max(40, Math.round(quality)));
}

export function exportFileName(
  index: number,
  slideId: string,
  options: ExportOptions = {}
): string {
  const ext = options.format === "jpg" ? "jpg" : "png";
  const n = String(index + 1).padStart(2, "0");
  if (options.naming === "id") return `${slideId}.${ext}`;
  if (options.naming === "name") {
    const base = (options.carouselName || "carousel")
      .replace(/[^a-zA-Z0-9-_]+/g, "_")
      .slice(0, 40) || "carousel";
    return `${base}-${n}.${ext}`;
  }
  return `slide-${index + 1}.${ext}`;
}

export async function exportAllSlides(
  slides: Slide[],
  aspectRatio: AspectRatio,
  onProgress?: (current: number, total: number) => void,
  options: ExportOptions = {}
): Promise<{ name: string; buffer: Buffer }[]> {
  const results: { name: string; buffer: Buffer }[] = [];
  const CONCURRENCY = 3;
  const format = options.format === "jpg" ? "jpg" : "png";
  const quality = clampQuality(options.quality);

  for (let i = 0; i < slides.length; i += CONCURRENCY) {
    const batch = slides.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (slide, batchIdx) => {
        const idx = i + batchIdx;
        const png = await exportSlide(slide, aspectRatio);
        const buffer =
          format === "png" && quality >= 95
            ? png
            : await encodeExport(png, { format, quality });
        onProgress?.(idx + 1, slides.length);
        return {
          name: exportFileName(idx, slide.id, { ...options, format }),
          buffer,
        };
      })
    );
    results.push(...batchResults);
  }

  return results;
}
