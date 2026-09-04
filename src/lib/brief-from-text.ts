import type { AspectRatio } from "@/types/carousel";
import type { CarouselBrief } from "@/types/layout";

const RATIOS: AspectRatio[] = ["1:1", "4:5", "9:16"];

export interface BriefFromTextOptions {
  name?: string;
  ratio?: AspectRatio;
  sourceLabel?: string;
}

function cleanLine(line: string): string {
  return line
    .replace(/^#+\s*/, "")
    .replace(/^[-*•]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

function looksLikeCta(line: string): boolean {
  return (
    /^(guarda|síguenos|sígueme|comenta|comparte|envíanos|escríbenos|prueba|descarga|únete|haz clic|swipe|desliza|link|agenda|reserva)/i.test(
      line
    ) ||
    (/\b(ahora|gratis|hoy)\b/i.test(line) && line.split(/\s+/).length <= 8)
  );
}

/** Heuristic: plain text / article → CarouselBrief for compose. */
export function briefFromText(
  raw: string,
  opts: BriefFromTextOptions = {}
): CarouselBrief {
  const lines = String(raw || "")
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const bulletLines = String(raw || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^[-*•]\s+/.test(l) || /^\d+[.)]\s+/.test(l))
    .map(cleanLine)
    .filter(Boolean);

  const bodyLines = lines.filter((l) => !bulletLines.includes(l));
  const title = (
    opts.name?.trim() ||
    bodyLines[0] ||
    "Carrusel importado"
  ).slice(0, 60);

  const topic =
    bodyLines
      .find((l) => l !== title && l.split(/\s+/).length <= 12)
      ?.slice(0, 100) || title;

  let points = bulletLines.slice(0, 6);
  if (points.length < 2) {
    const sentences = splitSentences(bodyLines.slice(1).join(" "));
    points = sentences
      .slice(0, 5)
      .map((s) => s.split(/\s+/).slice(0, 10).join(" "));
  }
  if (points.length === 0) {
    points = ["Punto clave 1", "Punto clave 2", "Punto clave 3"];
  }

  const ctaCandidate =
    [...bodyLines].reverse().find(looksLikeCta) ||
    points[points.length - 1];
  const cta =
    ctaCandidate && looksLikeCta(ctaCandidate)
      ? ctaCandidate.split(/\s+/).slice(0, 6).join(" ")
      : "Guarda esto";

  const ratio =
    opts.ratio && RATIOS.includes(opts.ratio) ? opts.ratio : ("4:5" as const);

  return {
    name: title,
    topic,
    points,
    cta,
    ratio,
    caption: [topic, points.slice(0, 2).join(". "), cta]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 400),
    hashtags: ["carrusel", "instagram", "contenido"],
    kicker: opts.sourceLabel ? "IMPORT" : undefined,
  };
}

export function briefToMarkdown(brief: CarouselBrief): string {
  const lines = [`# ${brief.name}`, "", `Ratio: ${brief.ratio || "4:5"}`];
  if (brief.kicker) lines.push(`Kicker: ${brief.kicker}`);
  if (brief.cta) lines.push(`CTA: ${brief.cta}`);
  lines.push("", "## Topic", brief.topic || brief.name, "", "## Points");
  for (const p of brief.points || []) lines.push(`- ${p}`);
  if (brief.caption) lines.push("", "## Caption", brief.caption);
  if (brief.hashtags?.length) {
    lines.push("", "## Hashtags", brief.hashtags.join(", "));
  }
  lines.push("");
  return lines.join("\n");
}
