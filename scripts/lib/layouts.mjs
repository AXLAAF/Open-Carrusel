/** Shared carousel layouts for the oc CLI (keep in sync with src/lib/slide-layouts.ts). */

import { resolveForeground } from "./color-contrast.mjs";

export const LAYOUT_IDS = [
  "hook",
  "setup",
  "value",
  "list",
  "quote",
  "stat",
  "summary",
  "cta",
];

export const DIMENSIONS = {
  "1:1": [1080, 1080],
  "4:5": [1080, 1350],
  "9:16": [1080, 1920],
};

export function isLayoutId(value) {
  return LAYOUT_IDS.includes(value);
}

export function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function usesXook(brand = {}) {
  const heading = String(brand.fonts?.heading || "").toLowerCase();
  const name = String(brand.name || "").toLowerCase();
  return heading.includes("borscha") || heading.includes("rostex") || name.includes("xook");
}

function tokens(brand = {}) {
  const colors = brand.colors || {};
  const fonts = brand.fonts || {};
  const xook = usesXook(brand);
  const defaultBg = !colors.background || colors.background === "#ffffff";
  const bg =
    xook && defaultBg
      ? "linear-gradient(135deg, #1B2B6B 0%, #2D4BD4 50%, #00D4FF 100%)"
      : colors.background || "#0a0a0a";
  const fg = resolveForeground(bg, {
    text: colors.text,
    primary: colors.primary,
  });
  const heading = xook
    ? "'BorschaBold', 'Borscha', sans-serif"
    : `'${fonts.heading || "Inter"}', sans-serif`;
  const body = xook
    ? "'BorschaRegular', 'Borscha', sans-serif"
    : `'${fonts.body || "Inter"}', sans-serif`;
  const footerFont = xook ? "'RostexRegular', 'Rostex', sans-serif" : body;
  return {
    bg,
    fg,
    accent: colors.accent || "#e94560",
    heading,
    body,
    footerFont,
    label: String(brand.name || "").trim() || "Open Carrusel",
  };
}

/** Rewrite baked width/height without restyling colors (ratio change). */
export function resizeSlideHtml(html, ratio = "4:5") {
  const [w, h] = DIMENSIONS[ratio] || DIMENSIONS["4:5"];
  const src = String(html || "");
  if (/width:\s*\d+px/i.test(src) || /height:\s*\d+px/i.test(src)) {
    return src
      .replace(/width:\s*\d+px/gi, `width:${w}px`)
      .replace(/height:\s*\d+px/gi, `height:${h}px`);
  }
  return src.replace(
    /style="/i,
    `style="width:${w}px;height:${h}px;`
  );
}

function field(tag, name, style, text) {
  return `<${tag} data-oc-field="${name}" data-oc-layer="${name}" style="${style}">${escapeHtml(text)}</${tag}>`;
}

function root(layout, extra, inner, w, h) {
  return `<div class="oc-slide" data-oc-layout="${layout}" style="width:${w}px;height:${h}px;box-sizing:border-box;${extra}">${inner}</div>`;
}

export function defaultFields(layout, brand = {}) {
  const footer = String(brand.name || "").trim() || "Open Carrusel";
  switch (layout) {
    case "hook":
      return { kicker: "NUEVO", title: "Titular", body: "Una idea. Una diapositiva.", footer };
    case "setup":
      return { kicker: "CONTEXTO", title: "El problema", body: "Explica el contexto en una frase.", footer };
    case "value":
      return { kicker: "CLAVE", title: "Idea principal", body: "Edita este texto a mano o con el CLI.", footer };
    case "list":
      return { kicker: "LISTA", title: "Recuerda esto", items: ["Punto uno", "Punto dos", "Punto tres"], footer };
    case "quote":
      return { quote: "Una frase que se queda.", author: "— Autor", footer };
    case "stat":
      return { stat: "80%", label: "El dato", body: "Qué significa este número.", footer };
    case "summary":
      return { kicker: "RESUMEN", title: "En corto", body: "1. Idea\n2. Idea\n3. Acción", footer };
    case "cta":
      return { kicker: "AHORA", title: "Guarda este carrusel", body: "Síguenos para más.", footer };
    default:
      return { title: "Titular", body: "", footer };
  }
}

export function renderLayout(layout, fields = {}, brand = {}, ratio = "4:5") {
  const [w, h] = DIMENSIONS[ratio] || DIMENSIONS["4:5"];
  const t = tokens(brand);
  const merged = { ...defaultFields(layout, brand), ...fields };
  const footer = merged.footer?.trim() || t.label;
  const kicker = merged.kicker || "NUEVO";
  const title = merged.title || "Titular";
  const body = merged.body || "";
  const pad = `padding:80px;position:relative;overflow:hidden;background:${t.bg};color:${t.fg};`;
  const kickerEl = field(
    "p",
    "kicker",
    `font-family:${t.heading};font-size:22px;letter-spacing:6px;text-transform:uppercase;color:${t.accent};margin:0 0 28px;font-weight:700;`,
    kicker
  );
  const titleEl = (size, align = "left") =>
    field(
      "h1",
      "title",
      `font-family:${t.heading};font-size:${size}px;font-weight:800;line-height:1.08;margin:0 0 24px;text-align:${align};letter-spacing:-1px;color:inherit;`,
      title
    );
  const bodyEl = (size = 28, align = "left") =>
    field(
      "p",
      "body",
      `font-family:${t.body};font-size:${size}px;line-height:1.4;opacity:0.9;margin:0;max-width:860px;text-align:${align};white-space:pre-wrap;color:inherit;`,
      body
    );
  const footerEl = field(
    "p",
    "footer",
    `font-family:${t.footerFont};position:absolute;bottom:56px;left:80px;right:80px;font-size:20px;letter-spacing:2px;text-transform:uppercase;opacity:0.7;margin:0;color:inherit;`,
    footer
  );

  switch (layout) {
    case "hook":
      return root(layout, `${pad}display:flex;flex-direction:column;justify-content:center;text-align:center;align-items:center;`, `${kickerEl}${titleEl(88, "center")}${bodyEl(30, "center")}${footerEl}`, w, h);
    case "setup":
      return root(layout, `${pad}display:flex;flex-direction:column;justify-content:flex-end;`, `${kickerEl}${titleEl(64)}${bodyEl(30)}${footerEl}`, w, h);
    case "value":
      return root(layout, `${pad}display:flex;flex-direction:column;justify-content:center;`, `${kickerEl}${titleEl(60)}${bodyEl(28)}${footerEl}`, w, h);
    case "list": {
      const items = (merged.items || ["Punto uno", "Punto dos", "Punto tres"]).slice(0, 6);
      const lis = items
        .map((item, i) =>
          field("li", `item-${i + 1}`, `font-family:${t.body};font-size:32px;line-height:1.35;margin:0 0 18px;padding:0;`, item)
        )
        .join("");
      return root(layout, `${pad}display:flex;flex-direction:column;justify-content:center;`, `${kickerEl}${titleEl(52)}<ol data-oc-layer="list" style="margin:12px 0 0;padding-left:42px;list-style:decimal;">${lis}</ol>${footerEl}`, w, h);
    }
    case "quote":
      return root(
        layout,
        `${pad}display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;`,
        `${field("p", "quote", `font-family:${t.heading};font-size:48px;font-weight:700;line-height:1.2;margin:0 0 32px;text-align:center;max-width:860px;`, merged.quote || "Una frase que se queda.")}${field("p", "author", `font-family:${t.body};font-size:24px;opacity:0.7;margin:0;letter-spacing:1px;`, merged.author || "— Autor")}${footerEl}`,
        w,
        h
      );
    case "stat":
      return root(
        layout,
        `${pad}display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;`,
        `${field("p", "stat", `font-family:${t.heading};font-size:140px;font-weight:800;line-height:0.9;margin:0 0 16px;letter-spacing:-4px;color:${t.accent};`, merged.stat || "80%")}${field("p", "label", `font-family:${t.heading};font-size:32px;font-weight:700;margin:0 0 20px;text-transform:uppercase;letter-spacing:2px;`, merged.label || "El dato")}${bodyEl(26, "center")}${footerEl}`,
        w,
        h
      );
    case "summary":
      return root(layout, `${pad}display:flex;flex-direction:column;justify-content:center;`, `${kickerEl}${titleEl(56)}${bodyEl(28)}${footerEl}`, w, h);
    case "cta":
      return root(layout, `${pad}display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;`, `${kickerEl}${titleEl(72, "center")}${bodyEl(28, "center")}${footerEl}`, w, h);
    default:
      return renderLayout("value", merged, brand, ratio);
  }
}

function shorten(text, words) {
  return String(text).split(/\s+/).filter(Boolean).slice(0, words).join(" ");
}

export function slidesFromBrief(brief = {}) {
  if (Array.isArray(brief.slides) && brief.slides.length > 0) {
    return brief.slides.filter((s) => isLayoutId(s.layout)).slice(0, 20);
  }
  const topic = String(brief.topic || brief.name || "Tu idea").trim();
  const points = (brief.points || []).map((p) => String(p).trim()).filter(Boolean);
  const cta = String(brief.cta || "Guarda esto").trim();
  const kicker = String(brief.kicker || "CARRUSEL").trim();
  const slides = [{ layout: "hook", notes: "hook", kicker, title: shorten(topic, 8), body: "Desliza para ver cómo." }];

  if (points.length >= 3) {
    slides.push({
      layout: "setup",
      notes: "setup",
      kicker: "CONTEXTO",
      title: "Por qué importa",
      body: `${topic}. Estos son los puntos que no puedes ignorar.`,
    });
    slides.push({ layout: "list", notes: "list", kicker: "LISTA", title: "Los puntos", items: points.slice(0, 6) });
    for (const point of points.slice(0, 3)) {
      if (slides.length >= 6) break;
      slides.push({ layout: "value", notes: "value", kicker: "CLAVE", title: shorten(point, 8), body: point });
    }
    slides.push({
      layout: "summary",
      notes: "summary",
      kicker: "RESUMEN",
      title: "Qué te llevas",
      body: points.slice(0, 4).map((p, i) => `${i + 1}. ${p}`).join("\n"),
    });
  } else if (points.length > 0) {
    for (const point of points) {
      slides.push({ layout: "value", notes: "value", kicker: "CLAVE", title: shorten(point, 8), body: point });
    }
    slides.push({
      layout: "summary",
      notes: "summary",
      kicker: "RESUMEN",
      title: "En corto",
      body: points.map((p, i) => `${i + 1}. ${p}`).join("\n"),
    });
  } else {
    slides.push({ layout: "setup", notes: "setup", kicker: "CONTEXTO", title: "El contexto", body: "Explica el problema en una frase." });
    slides.push({ layout: "value", notes: "value", kicker: "CLAVE", title: "La idea", body: "Una idea clara por diapositiva." });
    slides.push({ layout: "summary", notes: "summary", kicker: "RESUMEN", title: "En corto", body: "Repite lo esencial. Cierra con una acción." });
  }

  slides.push({
    layout: "cta",
    notes: "cta",
    kicker: "AHORA",
    title: cta,
    body: "Síguenos y guarda este carrusel.",
    footer: brief.footer,
  });
  return slides.slice(0, 20);
}
