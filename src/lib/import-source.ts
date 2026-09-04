import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { extractPdfText } from "@/lib/pdf-text";
import {
  extractTitleFromHtml,
  htmlToText,
  isNotionUrl,
} from "@/lib/html-to-text";
import { briefFromText, briefToMarkdown } from "@/lib/brief-from-text";
import type { AspectRatio } from "@/types/carousel";
import type { CarouselBrief } from "@/types/layout";
import { generateId } from "@/lib/utils";

export type ImportKind = "url" | "pdf" | "notion" | "text";

export interface ImportResult {
  kind: ImportKind;
  source: string;
  text: string;
  brief: CarouselBrief;
  markdown: string;
  briefPath?: string;
}

const FETCH_TIMEOUT_MS = 25000;
const MAX_BYTES = 8 * 1024 * 1024;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "brief";
}

async function fetchUrl(url: string): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "SwipeForge/0.1 (+local; import brief; compatible)",
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} al obtener ${url}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      throw new Error("Respuesta demasiado grande (>8MB)");
    }
    return { html: buf.toString("utf8"), finalUrl: res.url || url };
  } finally {
    clearTimeout(timer);
  }
}

export async function importFromUrl(
  url: string,
  opts: { name?: string; ratio?: AspectRatio; saveBrief?: boolean } = {}
): Promise<ImportResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL inválida");
  }
  if (!/^https?:$/i.test(parsed.protocol)) {
    throw new Error("Solo http(s)");
  }

  const kind: ImportKind = isNotionUrl(url) ? "notion" : "url";
  const { html, finalUrl } = await fetchUrl(url);
  const title = extractTitleFromHtml(html) || opts.name;
  const text = htmlToText(html);
  if (text.length < 40) {
    throw new Error(
      kind === "notion"
        ? "Notion no devolvió texto usable (¿página privada?). Exporta a MD/PDF o pega el texto."
        : "La URL no devolvió texto suficiente"
    );
  }

  const brief = briefFromText(text, {
    name: title || undefined,
    ratio: opts.ratio,
    sourceLabel: kind === "notion" ? "Notion" : "Web",
  });
  const markdown = briefToMarkdown(brief);
  const result: ImportResult = {
    kind,
    source: finalUrl,
    text: text.slice(0, 12000),
    brief,
    markdown,
  };

  if (opts.saveBrief !== false) {
    result.briefPath = await saveBriefMarkdown(brief.name, markdown);
  }
  return result;
}

export async function importFromPdf(
  buffer: Buffer,
  opts: {
    name?: string;
    ratio?: AspectRatio;
    filename?: string;
    saveBrief?: boolean;
  } = {}
): Promise<ImportResult> {
  const text = extractPdfText(buffer);
  if (!text || text.length < 20) {
    throw new Error(
      "No se pudo extraer texto del PDF (¿escaneado o cifrado?). Usa un PDF con texto o pega el contenido."
    );
  }
  const brief = briefFromText(text, {
    name: opts.name || opts.filename?.replace(/\.pdf$/i, ""),
    ratio: opts.ratio,
    sourceLabel: "PDF",
  });
  const markdown = briefToMarkdown(brief);
  const result: ImportResult = {
    kind: "pdf",
    source: opts.filename || "upload.pdf",
    text: text.slice(0, 12000),
    brief,
    markdown,
  };
  if (opts.saveBrief !== false) {
    result.briefPath = await saveBriefMarkdown(brief.name, markdown);
  }
  return result;
}

export async function importFromText(
  text: string,
  opts: { name?: string; ratio?: AspectRatio; saveBrief?: boolean } = {}
): Promise<ImportResult> {
  if (!text?.trim() || text.trim().length < 20) {
    throw new Error("Texto demasiado corto");
  }
  const brief = briefFromText(text, {
    name: opts.name,
    ratio: opts.ratio,
    sourceLabel: "Texto",
  });
  const markdown = briefToMarkdown(brief);
  const result: ImportResult = {
    kind: "text",
    source: "paste",
    text: text.slice(0, 12000),
    brief,
    markdown,
  };
  if (opts.saveBrief !== false) {
    result.briefPath = await saveBriefMarkdown(brief.name, markdown);
  }
  return result;
}

export async function saveBriefMarkdown(
  name: string,
  markdown: string
): Promise<string> {
  const dir = path.join(process.cwd(), "data", "briefs");
  await mkdir(dir, { recursive: true });
  const file = `${slugify(name)}-${generateId().slice(0, 8)}.md`;
  const abs = path.join(dir, file);
  await writeFile(abs, markdown, "utf8");
  return path.join("data", "briefs", file);
}
