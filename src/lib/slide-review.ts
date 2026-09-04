import type { Carousel, Slide } from "@/types/carousel";
import {
  extractFields,
  getRootStyle,
  readLayout,
} from "@/lib/slide-fields";
import {
  contrastRatio,
  MAX_HOOK_WORDS,
  MIN_CONTRAST,
  MIN_PADDING_PX,
} from "@/lib/color-contrast";

export type ReviewSeverity = "error" | "warn" | "pass";

export interface ReviewIssue {
  id: string;
  severity: ReviewSeverity;
  ok: boolean;
  label: string;
  slideId?: string;
  slideIndex?: number;
  detail?: string;
}

export interface ReviewResult {
  ok: boolean;
  score: number;
  passed: number;
  total: number;
  issues: ReviewIssue[];
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function parsePaddingPx(style: Record<string, string>): number | null {
  const raw = style.padding || style["padding-top"];
  if (!raw) return null;
  const m = String(raw).match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function fieldContrastIssues(slide: Slide, index: number): ReviewIssue[] {
  const root = getRootStyle(slide.html);
  const bg =
    root.background ||
    root["background-color"] ||
    root["background-image"] ||
    "";
  const fields = extractFields(slide.html).filter(
    (f) => !f.hidden && f.text.trim() && f.name !== "image"
  );
  const issues: ReviewIssue[] = [];

  if (!fields.length) {
    issues.push({
      id: `contrast-${slide.id}-empty`,
      severity: "warn",
      ok: true,
      label: `Slide ${index + 1}: sin texto editable`,
      slideId: slide.id,
      slideIndex: index,
    });
    return issues;
  }

  for (const field of fields) {
    const color = field.style.color || root.color;
    const ratio = contrastRatio(color, bg);
    if (ratio == null) {
      issues.push({
        id: `contrast-${slide.id}-${field.name}-unknown`,
        severity: "warn",
        ok: false,
        label: `Slide ${index + 1} · ${field.name}: contraste no medible`,
        slideId: slide.id,
        slideIndex: index,
        detail: "Fondo degradado o color sin hex. Usa hex en fondo y texto.",
      });
      continue;
    }
    const ok = ratio >= MIN_CONTRAST;
    issues.push({
      id: `contrast-${slide.id}-${field.name}`,
      severity: ok ? "pass" : "error",
      ok,
      label: ok
        ? `Slide ${index + 1} · ${field.name}: contraste ${ratio.toFixed(1)}:1`
        : `Slide ${index + 1} · ${field.name}: contraste bajo (${ratio.toFixed(1)}:1)`,
      slideId: slide.id,
      slideIndex: index,
      detail: ok ? undefined : `Mínimo ${MIN_CONTRAST}:1 (WCAG AA)`,
    });
  }
  return issues;
}

function paddingIssue(slide: Slide, index: number): ReviewIssue {
  const pad = parsePaddingPx(getRootStyle(slide.html));
  if (pad == null) {
    return {
      id: `padding-${slide.id}`,
      severity: "warn",
      ok: false,
      label: `Slide ${index + 1}: padding no detectado`,
      slideId: slide.id,
      slideIndex: index,
      detail: `Usa padding ≥ ${MIN_PADDING_PX}px`,
    };
  }
  const ok = pad >= MIN_PADDING_PX;
  return {
    id: `padding-${slide.id}`,
    severity: ok ? "pass" : "error",
    ok,
    label: ok
      ? `Slide ${index + 1}: padding ${pad}px`
      : `Slide ${index + 1}: padding ${pad}px (< ${MIN_PADDING_PX})`,
    slideId: slide.id,
    slideIndex: index,
  };
}

function hookIssue(carousel: Carousel): ReviewIssue {
  const first = carousel.slides[0];
  if (!first) {
    return {
      id: "hook",
      severity: "error",
      ok: false,
      label: "Sin slides — falta hook",
    };
  }
  const layout = readLayout(first.html);
  const title =
    extractFields(first.html).find((f) => f.name === "title")?.text || "";
  const words = wordCount(title);
  const isHook = layout === "hook" || /hook/i.test(first.notes || "");
  if (!isHook) {
    return {
      id: "hook-layout",
      severity: "error",
      ok: false,
      label: "La primera slide no es un hook",
      slideId: first.id,
      slideIndex: 0,
    };
  }
  const ok = words > 0 && words <= MAX_HOOK_WORDS;
  return {
    id: "hook-words",
    severity: ok ? "pass" : "error",
    ok,
    label: ok
      ? `Hook: ${words} palabras (≤${MAX_HOOK_WORDS})`
      : `Hook: ${words || 0} palabras (máx. ${MAX_HOOK_WORDS})`,
    slideId: first.id,
    slideIndex: 0,
    detail: title ? `"${title.trim()}"` : "Sin título",
  };
}

function ctaIssue(carousel: Carousel): ReviewIssue {
  const last = carousel.slides[carousel.slides.length - 1];
  if (!last) {
    return {
      id: "cta",
      severity: "error",
      ok: false,
      label: "Sin slides — falta CTA",
    };
  }
  const layout = readLayout(last.html);
  const ok = layout === "cta" || /cta/i.test(last.notes || "");
  return {
    id: "cta-last",
    severity: ok ? "pass" : "error",
    ok,
    label: ok
      ? "La última slide es un CTA"
      : "La última slide no es un CTA",
    slideId: last.id,
    slideIndex: carousel.slides.length - 1,
  };
}

/** Automatic design review: contrast, padding, hook ≤8 words, CTA last. */
export function reviewCarousel(carousel: Carousel): ReviewResult {
  const issues: ReviewIssue[] = [];
  issues.push(hookIssue(carousel));
  issues.push(ctaIssue(carousel));

  for (let i = 0; i < carousel.slides.length; i++) {
    const slide = carousel.slides[i];
    issues.push(paddingIssue(slide, i));
    issues.push(...fieldContrastIssues(slide, i));
  }

  const checkable = issues.filter(
    (i) => i.severity === "error" || i.severity === "pass" || (i.severity === "warn" && !i.ok)
  );
  const passed = checkable.filter((i) => i.ok).length;
  const total = checkable.length || 1;
  const errors = issues.filter((i) => i.severity === "error" && !i.ok);
  const ok = errors.length === 0;

  return {
    ok,
    score: Math.round((passed / total) * 100),
    passed,
    total,
    issues,
  };
}

export function formatReviewReport(result: ReviewResult): string {
  const lines = [
    `Revisión ${result.ok ? "OK" : "FALLÓ"} · ${result.score}% (${result.passed}/${result.total})`,
    "",
  ];
  for (const issue of result.issues) {
    const mark = issue.ok ? "✓" : issue.severity === "warn" ? "!" : "✗";
    lines.push(`${mark} ${issue.label}`);
    if (issue.detail && !issue.ok) lines.push(`  → ${issue.detail}`);
  }
  return lines.join("\n");
}
