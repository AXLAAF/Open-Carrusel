/**
 * Automatic design review (CLI twin of src/lib/slide-review.ts).
 * Contrast, padding ≥80, hook ≤8 words, CTA last.
 */

import {
  contrastRatio,
  MAX_HOOK_WORDS,
  MIN_CONTRAST,
  MIN_PADDING_PX,
} from "./color-contrast.mjs";

function decode(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseStyle(style) {
  const out = {};
  for (const part of String(style || "").split(";")) {
    const i = part.indexOf(":");
    if (i === -1) continue;
    const k = part.slice(0, i).trim().toLowerCase();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

function attr(openTag, name) {
  const m = openTag.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return m ? m[1] : null;
}

function getRootStyle(html) {
  const m = String(html).match(/<div\b([^>]*)>/i);
  return m ? parseStyle(attr(m[0], "style") || "") : {};
}

function readLayout(html) {
  const m = String(html).match(/data-oc-layout="([^"]+)"/);
  return m ? m[1] : null;
}

function extractFields(html) {
  const names = [...String(html).matchAll(/data-oc-field="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  const fields = [];
  for (const name of names) {
    if (seen.has(name)) continue;
    seen.add(name);
    const re = new RegExp(
      `<([a-z0-9]+)([^>]*data-oc-field="${name}"[^>]*)>([\\s\\S]*?)<\\/\\1>`,
      "i"
    );
    const m = String(html).match(re);
    if (!m) continue;
    const open = `<${m[1]}${m[2]}>`;
    const style = parseStyle(attr(open, "style") || "");
    fields.push({
      name,
      text: decode(m[3]),
      style,
      hidden: attr(open, "data-oc-hidden") === "true" || style.display === "none",
    });
  }
  return fields;
}

function wordCount(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function parsePaddingPx(style) {
  const raw = style.padding || style["padding-top"];
  if (!raw) return null;
  const m = String(raw).match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

export function reviewCarousel(carousel) {
  const issues = [];
  const slides = carousel.slides || [];

  const first = slides[0];
  if (!first) {
    issues.push({ id: "hook", severity: "error", ok: false, label: "Sin slides — falta hook" });
  } else {
    const layout = readLayout(first.html);
    const title = extractFields(first.html).find((f) => f.name === "title")?.text || "";
    const words = wordCount(title);
    const isHook = layout === "hook" || /hook/i.test(first.notes || "");
    if (!isHook) {
      issues.push({
        id: "hook-layout",
        severity: "error",
        ok: false,
        label: "La primera slide no es un hook",
        slideId: first.id,
      });
    } else {
      const ok = words > 0 && words <= MAX_HOOK_WORDS;
      issues.push({
        id: "hook-words",
        severity: ok ? "pass" : "error",
        ok,
        label: ok
          ? `Hook: ${words} palabras (≤${MAX_HOOK_WORDS})`
          : `Hook: ${words || 0} palabras (máx. ${MAX_HOOK_WORDS})`,
        slideId: first.id,
        detail: title || "Sin título",
      });
    }
  }

  const last = slides[slides.length - 1];
  if (!last) {
    issues.push({ id: "cta", severity: "error", ok: false, label: "Sin slides — falta CTA" });
  } else {
    const layout = readLayout(last.html);
    const ok = layout === "cta" || /cta/i.test(last.notes || "");
    issues.push({
      id: "cta-last",
      severity: ok ? "pass" : "error",
      ok,
      label: ok ? "La última slide es un CTA" : "La última slide no es un CTA",
      slideId: last.id,
    });
  }

  slides.forEach((slide, index) => {
    const root = getRootStyle(slide.html);
    const pad = parsePaddingPx(root);
    if (pad == null) {
      issues.push({
        id: `padding-${slide.id}`,
        severity: "warn",
        ok: false,
        label: `Slide ${index + 1}: padding no detectado`,
        slideId: slide.id,
      });
    } else {
      const ok = pad >= MIN_PADDING_PX;
      issues.push({
        id: `padding-${slide.id}`,
        severity: ok ? "pass" : "error",
        ok,
        label: ok
          ? `Slide ${index + 1}: padding ${pad}px`
          : `Slide ${index + 1}: padding ${pad}px (< ${MIN_PADDING_PX})`,
        slideId: slide.id,
      });
    }

    const bg =
      root.background || root["background-color"] || root["background-image"] || "";
    const fields = extractFields(slide.html).filter(
      (f) => !f.hidden && f.text.trim() && f.name !== "image"
    );
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
        detail: ok ? undefined : `Mínimo ${MIN_CONTRAST}:1`,
      });
    }
  });

  const checkable = issues.filter(
    (i) => i.severity === "error" || i.severity === "pass" || (i.severity === "warn" && !i.ok)
  );
  const passed = checkable.filter((i) => i.ok).length;
  const total = checkable.length || 1;
  const errors = issues.filter((i) => i.severity === "error" && !i.ok);

  return {
    ok: errors.length === 0,
    score: Math.round((passed / total) * 100),
    passed,
    total,
    issues,
  };
}

export function formatReviewReport(result) {
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
