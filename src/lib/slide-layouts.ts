import type { AspectRatio } from "@/types/carousel";
import { DIMENSIONS } from "@/types/carousel";
import type { BrandConfig } from "@/types/brand";
import type { CarouselBrief, LayoutId, SlideFields, SlideSpec } from "@/types/layout";
import { isLayoutId } from "@/types/layout";

export { LAYOUT_IDS, LAYOUT_LABELS, isLayoutId } from "@/types/layout";
export type { LayoutId, SlideFields, SlideSpec, CarouselBrief } from "@/types/layout";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function usesXook(brand: BrandConfig): boolean {
  const heading = brand.fonts.heading.toLowerCase();
  const name = brand.name.toLowerCase();
  return (
    heading.includes("borscha") ||
    heading.includes("rostex") ||
    name.includes("xook")
  );
}

function tokens(brand: BrandConfig) {
  const xook = usesXook(brand);
  const defaultBg = !brand.colors.background || brand.colors.background === "#ffffff";
  const bg =
    xook && defaultBg
      ? "linear-gradient(135deg, #1B2B6B 0%, #2D4BD4 50%, #00D4FF 100%)"
      : brand.colors.background || "#0a0a0a";
  const fg = xook && defaultBg ? "#ffffff" : brand.colors.primary || "#1a1a2e";
  const heading = xook
    ? "'BorschaBold', 'Borscha', sans-serif"
    : `'${brand.fonts.heading || "Inter"}', sans-serif`;
  const body = xook
    ? "'BorschaRegular', 'Borscha', sans-serif"
    : `'${brand.fonts.body || "Inter"}', sans-serif`;
  const footerFont = xook
    ? "'RostexRegular', 'Rostex', sans-serif"
    : body;
  return {
    bg,
    fg,
    accent: brand.colors.accent || "#e94560",
    heading,
    body,
    footerFont,
    label: brand.name?.trim() || "Open Carrusel",
  };
}

function field(tag: string, name: string, style: string, text: string): string {
  return `<${tag} data-oc-field="${name}" data-oc-layer="${name}" style="${style}">${escapeHtml(text)}</${tag}>`;
}

function root(layout: LayoutId, extra: string, inner: string, w: number, h: number): string {
  return `<div class="oc-slide" data-oc-layout="${layout}" style="width:${w}px;height:${h}px;box-sizing:border-box;${extra}">${inner}</div>`;
}

export function renderLayout(
  layout: LayoutId,
  fields: SlideFields,
  brand: BrandConfig,
  ratio: AspectRatio
): string {
  const { width: w, height: h } = DIMENSIONS[ratio];
  const t = tokens(brand);
  const footer = fields.footer?.trim() || t.label;
  const kicker = fields.kicker ?? "";
  const title = fields.title ?? "Titular";
  const body = fields.body ?? "";
  const pad = "padding:80px;position:relative;overflow:hidden;background:" + t.bg + ";color:" + t.fg + ";";

  const kickerEl = field(
    "p",
    "kicker",
    `font-family:${t.heading};font-size:22px;letter-spacing:6px;text-transform:uppercase;color:${t.accent};margin:0 0 28px;font-weight:700;`,
    kicker || "NUEVO"
  );
  const titleEl = (size: number, align = "left") =>
    field(
      "h1",
      "title",
      `font-family:${t.heading};font-size:${size}px;font-weight:800;line-height:1.08;margin:0 0 24px;text-align:${align};letter-spacing:-1px;`,
      title
    );
  const bodyEl = (size = 28, align = "left") =>
    field(
      "p",
      "body",
      `font-family:${t.body};font-size:${size}px;line-height:1.4;opacity:0.9;margin:0;max-width:860px;text-align:${align};white-space:pre-wrap;`,
      body
    );
  const footerEl = field(
    "p",
    "footer",
    `font-family:${t.footerFont};position:absolute;bottom:56px;left:80px;right:80px;font-size:20px;letter-spacing:2px;text-transform:uppercase;opacity:0.7;margin:0;`,
    footer
  );

  switch (layout) {
    case "hook":
      return root(
        layout,
        `${pad}display:flex;flex-direction:column;justify-content:center;text-align:center;align-items:center;`,
        `${kickerEl}${titleEl(88, "center")}${bodyEl(30, "center")}${footerEl}`,
        w,
        h
      );
    case "setup":
      return root(
        layout,
        `${pad}display:flex;flex-direction:column;justify-content:flex-end;`,
        `${kickerEl}${titleEl(64)}${bodyEl(30)}${footerEl}`,
        w,
        h
      );
    case "value":
      return root(
        layout,
        `${pad}display:flex;flex-direction:column;justify-content:center;`,
        `${kickerEl}${titleEl(60)}${bodyEl(28)}${footerEl}`,
        w,
        h
      );
    case "list": {
      const items = (fields.items || ["Punto uno", "Punto dos", "Punto tres"]).slice(0, 6);
      const lis = items
        .map((item, i) =>
          field(
            "li",
            `item-${i + 1}`,
            `font-family:${t.body};font-size:32px;line-height:1.35;margin:0 0 18px;padding:0;`,
            item
          )
        )
        .join("");
      return root(
        layout,
        `${pad}display:flex;flex-direction:column;justify-content:center;`,
        `${kickerEl}${titleEl(52)}<ol data-oc-layer="list" style="margin:12px 0 0;padding-left:42px;list-style:decimal;">${lis}</ol>${footerEl}`,
        w,
        h
      );
    }
    case "quote":
      return root(
        layout,
        `${pad}display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;`,
        `${field("p", "quote", `font-family:${t.heading};font-size:48px;font-weight:700;line-height:1.2;margin:0 0 32px;text-align:center;max-width:860px;`, fields.quote || "Una frase que se queda.")}${field("p", "author", `font-family:${t.body};font-size:24px;opacity:0.7;margin:0;letter-spacing:1px;`, fields.author || "— Autor")}${footerEl}`,
        w,
        h
      );
    case "stat":
      return root(
        layout,
        `${pad}display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;`,
        `${field("p", "stat", `font-family:${t.heading};font-size:140px;font-weight:800;line-height:0.9;margin:0 0 16px;letter-spacing:-4px;color:${t.accent};`, fields.stat || "80%")}${field("p", "label", `font-family:${t.heading};font-size:32px;font-weight:700;margin:0 0 20px;text-transform:uppercase;letter-spacing:2px;`, fields.label || "El dato")}${bodyEl(26, "center")}${footerEl}`,
        w,
        h
      );
    case "summary":
      return root(
        layout,
        `${pad}display:flex;flex-direction:column;justify-content:center;`,
        `${kickerEl}${titleEl(56)}${bodyEl(28)}${footerEl}`,
        w,
        h
      );
    case "cta":
      return root(
        layout,
        `${pad}display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;`,
        `${kickerEl}${titleEl(72, "center")}${bodyEl(28, "center")}${footerEl}`,
        w,
        h
      );
  }
}

export function defaultFields(layout: LayoutId, brand: BrandConfig): SlideFields {
  const footer = brand.name?.trim() || "Open Carrusel";
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
  }
}

function shorten(text: string, words: number): string {
  return text.split(/\s+/).filter(Boolean).slice(0, words).join(" ");
}

export function slidesFromBrief(brief: CarouselBrief): SlideSpec[] {
  if (Array.isArray(brief.slides) && brief.slides.length > 0) {
    return brief.slides.filter((s) => isLayoutId(s.layout)).slice(0, 20);
  }

  const topic = (brief.topic || brief.name || "Tu idea").trim();
  const points = (brief.points || []).map((p) => String(p).trim()).filter(Boolean);
  const cta = brief.cta?.trim() || "Guarda esto";
  const kicker = brief.kicker?.trim() || "CARRUSEL";
  const slides: SlideSpec[] = [
    {
      layout: "hook",
      notes: "hook",
      kicker,
      title: shorten(topic, 8),
      body: "Desliza para ver cómo.",
    },
  ];

  if (points.length >= 3) {
    slides.push({
      layout: "setup",
      notes: "setup",
      kicker: "CONTEXTO",
      title: "Por qué importa",
      body: `${topic}. Estos son los puntos que no puedes ignorar.`,
    });
    slides.push({
      layout: "list",
      notes: "list",
      kicker: "LISTA",
      title: "Los puntos",
      items: points.slice(0, 6),
    });
    for (const point of points.slice(0, 3)) {
      if (slides.length >= 6) break;
      slides.push({
        layout: "value",
        notes: "value",
        kicker: "CLAVE",
        title: shorten(point, 8),
        body: point,
      });
    }
    slides.push({
      layout: "summary",
      notes: "summary",
      kicker: "RESUMEN",
      title: "Qué te llevas",
      body: points
        .slice(0, 4)
        .map((p, i) => `${i + 1}. ${p}`)
        .join("\n"),
    });
  } else if (points.length > 0) {
    for (const point of points) {
      slides.push({
        layout: "value",
        notes: "value",
        kicker: "CLAVE",
        title: shorten(point, 8),
        body: point,
      });
    }
    slides.push({
      layout: "summary",
      notes: "summary",
      kicker: "RESUMEN",
      title: "En corto",
      body: points.map((p, i) => `${i + 1}. ${p}`).join("\n"),
    });
  } else {
    slides.push({
      layout: "setup",
      notes: "setup",
      kicker: "CONTEXTO",
      title: "El contexto",
      body: "Explica el problema en una frase.",
    });
    slides.push({
      layout: "value",
      notes: "value",
      kicker: "CLAVE",
      title: "La idea",
      body: "Una idea clara por diapositiva.",
    });
    slides.push({
      layout: "summary",
      notes: "summary",
      kicker: "RESUMEN",
      title: "En corto",
      body: "Repite lo esencial. Cierra con una acción.",
    });
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
